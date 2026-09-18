create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner', 'manager', 'cashier');
create type public.tenant_status as enum ('active', 'suspended', 'trial');
create type public.inventory_movement_type as enum ('sale', 'purchase', 'adjustment', 'return', 'transfer_in', 'transfer_out');
create type public.sale_status as enum ('open', 'completed', 'voided', 'refunded');
create type public.payment_method as enum ('cash', 'card', 'gift_card', 'other');

create table public.tenants (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  status public.tenant_status not null default 'trial', currency char(3) not null default 'USD',
  timezone text not null default 'UTC', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, display_name text, email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, role public.user_role not null,
  pin_hash text, active boolean not null default true, created_at timestamptz not null default now(), unique (tenant_id, user_id)
);
create table public.locations (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, address jsonb, active boolean not null default true, created_at timestamptz not null default now(), unique (tenant_id, name)
);
create table public.registers (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade, name text not null, active boolean not null default true,
  created_at timestamptz not null default now(), unique (location_id, name)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null, color text, sort_order integer not null default 0, active boolean not null default true, unique (tenant_id, name)
);
create table public.products (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null, sku text, barcode text, name text not null, description text,
  image_url text, unit text not null default 'each', tax_rate numeric(6,3) not null default 0, cost_price numeric(12,2) not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, sku), unique (tenant_id, barcode), check (cost_price >= 0), check (tax_rate >= 0)
);
create table public.product_prices (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade, location_id uuid references public.locations(id) on delete cascade,
  price numeric(12,2) not null, effective_from timestamptz not null default now(), effective_to timestamptz,
  check (price >= 0), check (effective_to is null or effective_to > effective_from)
);
create table public.inventory_balances (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(12,3) not null default 0, reorder_level numeric(12,3) not null default 0, updated_at timestamptz not null default now(), unique (location_id, product_id)
);
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id), product_id uuid not null references public.products(id), movement_type public.inventory_movement_type not null,
  quantity numeric(12,3) not null, reference_id uuid, notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), check (quantity <> 0)
);
create table public.sales (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id), register_id uuid references public.registers(id), cashier_id uuid references public.profiles(id),
  status public.sale_status not null default 'open', subtotal numeric(12,2) not null default 0, tax_total numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0, total numeric(12,2) not null default 0, completed_at timestamptz, created_at timestamptz not null default now()
);
create table public.sale_items (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade, product_id uuid references public.products(id) on delete set null,
  product_name text not null, sku text, quantity numeric(12,3) not null, unit_price numeric(12,2) not null, unit_cost numeric(12,2) not null default 0,
  tax_rate numeric(6,3) not null default 0, tax_amount numeric(12,2) not null default 0, line_total numeric(12,2) not null, check (quantity > 0)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade, method public.payment_method not null, amount numeric(12,2) not null,
  tendered_amount numeric(12,2), change_amount numeric(12,2) not null default 0, provider_reference text, created_at timestamptz not null default now(), check (amount > 0)
);
create table public.employee_shifts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid not null references public.locations(id), employee_id uuid not null references public.tenant_members(id), register_id uuid references public.registers(id),
  started_at timestamptz not null default now(), ended_at timestamptz, opening_cash numeric(12,2) not null default 0, closing_cash numeric(12,2), notes text
);

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tenant_members where tenant_id = target_tenant_id and user_id = auth.uid() and active = true);
$$;

create or replace function public.create_tenant_with_owner(tenant_name text, tenant_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_tenant_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.profiles (id, email)
    values (auth.uid(), (select email from auth.users where id = auth.uid()))
    on conflict (id) do nothing;
  insert into public.tenants (name, slug) values (tenant_name, tenant_slug) returning id into new_tenant_id;
  insert into public.tenant_members (tenant_id, user_id, role) values (new_tenant_id, auth.uid(), 'owner');
  return new_tenant_id;
end;
$$;

create index tenant_members_user_idx on public.tenant_members(user_id, tenant_id);
create index products_tenant_active_idx on public.products(tenant_id, active);
create index inventory_movements_tenant_created_idx on public.inventory_movements(tenant_id, created_at desc);
create index sales_tenant_created_idx on public.sales(tenant_id, created_at desc);
create index sale_items_sale_idx on public.sale_items(sale_id);

revoke all on function public.create_tenant_with_owner(text, text) from public;
grant execute on function public.create_tenant_with_owner(text, text) to authenticated;

-- RLS is enabled on every table that stores business data.
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.locations enable row level security;
alter table public.registers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.employee_shifts enable row level security;

create policy "tenant members can read" on public.tenants
  for select using (public.is_tenant_member(id));
create policy "tenant members can update" on public.tenants
  for update using (public.is_tenant_member(id))
  with check (public.is_tenant_member(id));

do $$ declare table_name text; begin
  foreach table_name in array array['tenant_members','locations','registers','categories','products','product_prices','inventory_balances','inventory_movements','sales','sale_items','payments','employee_shifts'] loop
    execute format('create policy "tenant members can read" on public.%I for select using (public.is_tenant_member(tenant_id))', table_name);
    execute format('create policy "tenant members can insert" on public.%I for insert with check (public.is_tenant_member(tenant_id))', table_name);
    execute format('create policy "tenant members can update" on public.%I for update using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id))', table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "users can read own profile" on public.profiles for select using (id = auth.uid());