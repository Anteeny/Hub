-- Migration: 202609170014_store_settings_and_registers.sql

-- 1. Extend tenants table with standard store/pharmacy settings fields
alter table public.tenants
  add column if not exists regulatory_license text,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_name text,
  add column if not exists receipt_paper_width text default '80mm',
  add column if not exists return_policy text default 'NO REFUND OF MONEY AFTER PAYMENT. EXCHANGE WITHIN 48 HRS WITH THIS TICKET. VALID ONLY IN GOOD CONDITION.',
  add column if not exists show_cashier_on_receipt boolean default true,
  add column if not exists show_register_on_receipt boolean default true;

-- 2. Ensure RLS policies for registers allow tenant members to select, insert, update, delete
alter table public.registers enable row level security;

drop policy if exists "tenant members can manage registers" on public.registers;
drop policy if exists "tenant members can select registers" on public.registers;

create policy "tenant members can select registers" on public.registers
  for select using (public.is_tenant_member(tenant_id));

create policy "tenant owners and managers can insert registers" on public.registers
  for insert with check (public.has_tenant_role(tenant_id, array['owner', 'manager']::public.user_role[]));

create policy "tenant owners and managers can update registers" on public.registers
  for update using (public.has_tenant_role(tenant_id, array['owner', 'manager']::public.user_role[]));

create policy "tenant owners and managers can delete registers" on public.registers
  for delete using (public.has_tenant_role(tenant_id, array['owner', 'manager']::public.user_role[]));

-- 3. RPC to get all registers for a tenant (auto-initializing default registers if none exist)
create or replace function public.get_or_create_tenant_registers(target_tenant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  loc_id uuid;
  reg_count int;
  result jsonb;
begin
  if not public.is_tenant_member(target_tenant_id) then
    raise exception 'Permission denied: Not a member of this store.';
  end if;

  select id into loc_id from public.locations
  where tenant_id = target_tenant_id and active = true
  order by created_at limit 1;

  if loc_id is null then
    insert into public.locations (tenant_id, name)
    values (target_tenant_id, 'Main store')
    returning id into loc_id;
  end if;

  select count(*) into reg_count from public.registers where tenant_id = target_tenant_id;
  if reg_count = 0 then
    insert into public.registers (tenant_id, location_id, name, active)
    values
      (target_tenant_id, loc_id, 'Register 1 (Main)', true),
      (target_tenant_id, loc_id, 'Register 2 (Express)', true),
      (target_tenant_id, loc_id, 'Register 3 (Counter)', true)
    on conflict (location_id, name) do nothing;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'active', active,
      'created_at', created_at
    ) order by created_at asc
  ) into result
  from public.registers
  where tenant_id = target_tenant_id;

  return coalesce(result, '[]'::jsonb);
end;
$$;

grant execute on function public.get_or_create_tenant_registers(uuid) to authenticated;

notify pgrst, 'reload schema';
