-- Tighten tenant permissions after the base schema is installed.
create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and active = true
      and role = any(allowed_roles)
  );
$$;

-- Catalog and stock are owner/manager work, not cashier work.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['categories','products','product_prices','inventory_balances','inventory_movements'] loop
    execute format('drop policy if exists "tenant members can insert" on public.%I', table_name);
    execute format('drop policy if exists "tenant members can update" on public.%I', table_name);
    execute format('create policy "managers can insert" on public.%I for insert with check (public.has_tenant_role(tenant_id, array[''owner'',''manager'']::public.user_role[]))', table_name);
    execute format('create policy "managers can update" on public.%I for update using (public.has_tenant_role(tenant_id, array[''owner'',''manager'']::public.user_role[])) with check (public.has_tenant_role(tenant_id, array[''owner'',''manager'']::public.user_role[]))', table_name);
  end loop;
end $$;

-- Employee and store setup changes belong to owners and managers.
drop policy if exists "tenant members can insert" on public.locations;
drop policy if exists "tenant members can update" on public.locations;
create policy "managers can insert" on public.locations for insert
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]));
create policy "managers can update" on public.locations for update
  using (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]));

drop policy if exists "tenant members can insert" on public.registers;
drop policy if exists "tenant members can update" on public.registers;
create policy "managers can insert" on public.registers for insert
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]));
create policy "managers can update" on public.registers for update
  using (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','manager']::public.user_role[]));

-- Cashiers may create and update their own open sales; completed sales use the RPC.
drop policy if exists "tenant members can insert" on public.sales;
drop policy if exists "tenant members can update" on public.sales;
create policy "members can insert sales" on public.sales for insert
  with check (public.is_tenant_member(tenant_id) and cashier_id = auth.uid());
create policy "members can update open sales" on public.sales for update
  using (public.is_tenant_member(tenant_id) and cashier_id = auth.uid() and status = 'open')
  with check (public.is_tenant_member(tenant_id) and cashier_id = auth.uid());

-- Only the checkout flow should create payments and sale lines.
drop policy if exists "tenant members can insert" on public.sale_items;
create policy "members can insert sale items" on public.sale_items for insert
  with check (public.is_tenant_member(tenant_id));
drop policy if exists "tenant members can insert" on public.payments;
create policy "members can insert payments" on public.payments for insert
  with check (public.is_tenant_member(tenant_id));

grant execute on function public.has_tenant_role(uuid, public.user_role[]) to authenticated;

drop policy if exists "tenant members can insert" on public.tenant_members;
drop policy if exists "tenant members can update" on public.tenant_members;
create policy "owners can add members" on public.tenant_members for insert
  with check (public.has_tenant_role(tenant_id, array['owner']::public.user_role[]));
create policy "owners can update members" on public.tenant_members for update
  using (public.has_tenant_role(tenant_id, array['owner']::public.user_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner']::public.user_role[]));

notify pgrst, 'reload schema';
