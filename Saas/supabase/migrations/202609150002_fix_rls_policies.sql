-- Use this repair migration only when the tables already exist.
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
alter table public.profiles enable row level security;

drop policy if exists "tenant members can read" on public.tenants;
drop policy if exists "tenant members can update" on public.tenants;
create policy "tenant members can read" on public.tenants
  for select using (public.is_tenant_member(id));
create policy "tenant members can update" on public.tenants
  for update using (public.is_tenant_member(id))
  with check (public.is_tenant_member(id));

do $$ declare table_name text; begin
  foreach table_name in array array['tenant_members','locations','registers','categories','products','product_prices','inventory_balances','inventory_movements','sales','sale_items','payments','employee_shifts'] loop
    execute format('drop policy if exists "tenant members can read" on public.%I', table_name);
    execute format('drop policy if exists "tenant members can insert" on public.%I', table_name);
    execute format('drop policy if exists "tenant members can update" on public.%I', table_name);
    execute format('create policy "tenant members can read" on public.%I for select using (public.is_tenant_member(tenant_id))', table_name);
    execute format('create policy "tenant members can insert" on public.%I for insert with check (public.is_tenant_member(tenant_id))', table_name);
    execute format('create policy "tenant members can update" on public.%I for update using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id))', table_name);
  end loop;
end $$;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile" on public.profiles
  for select using (id = auth.uid());
