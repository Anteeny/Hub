drop function if exists public.complete_sale(jsonb, public.payment_method, numeric);
drop function if exists public.complete_sale(uuid, jsonb, public.payment_method, numeric);

create or replace function public.complete_sale(
  target_tenant_id uuid,
  sale_items jsonb,
  payment_method public.payment_method,
  tendered_amount numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_tenant_id uuid;
  current_location_id uuid;
  new_sale_id uuid;
  sale_subtotal numeric(12,2) := 0;
  sale_tax numeric(12,2) := 0;
  item jsonb;
  product_row record;
  item_quantity numeric(12,3);
  item_price numeric(12,2);
  item_tax numeric(12,2);
  item_total numeric(12,2);
  sale_total numeric(12,2);
begin
  select tm.tenant_id into current_tenant_id
  from public.tenant_members tm
  where tm.user_id = auth.uid() and tm.active = true and tm.tenant_id = target_tenant_id;

  if current_tenant_id is null then raise exception 'No active store membership found'; end if;
  select id into current_location_id from public.locations where tenant_id = current_tenant_id and active = true order by created_at limit 1;
  if current_location_id is null then raise exception 'No active store location found'; end if;
  if jsonb_typeof(sale_items) <> 'array' or jsonb_array_length(sale_items) = 0 then raise exception 'A sale needs at least one item'; end if;

  insert into public.sales (tenant_id, location_id, cashier_id, status)
  values (current_tenant_id, current_location_id, auth.uid(), 'open')
  returning id into new_sale_id;

  for item in select value from jsonb_array_elements(sale_items) loop
    select p.id, p.name, p.sku, p.cost_price, p.tax_rate, p.track_inventory
      into product_row
      from public.products p
      where p.id = (item->>'product_id')::uuid
        and p.tenant_id = current_tenant_id
        and p.active = true;
    if product_row.id is null then raise exception 'Product is not available'; end if;
    item_quantity := (item->>'quantity')::numeric;
    if item_quantity <= 0 then raise exception 'Product quantity must be positive'; end if;
    item_price := coalesce((select pp.price from public.product_prices pp where pp.product_id = product_row.id and pp.tenant_id = current_tenant_id and (pp.effective_to is null or pp.effective_to > now()) order by pp.effective_from desc limit 1), 0);
    item_tax := round(item_price * item_quantity * product_row.tax_rate / 100, 2);
    item_total := round(item_price * item_quantity, 2) + item_tax;
    sale_subtotal := sale_subtotal + round(item_price * item_quantity, 2);
    sale_tax := sale_tax + item_tax;
    insert into public.sale_items (tenant_id, sale_id, product_id, product_name, sku, quantity, unit_price, unit_cost, tax_rate, tax_amount, line_total)
    values (current_tenant_id, new_sale_id, product_row.id, product_row.name, product_row.sku, item_quantity, item_price, product_row.cost_price, product_row.tax_rate, item_tax, item_total);
    if product_row.track_inventory then
      update public.inventory_balances
      set quantity = quantity - item_quantity, updated_at = now()
      where tenant_id = current_tenant_id and location_id = current_location_id and product_id = product_row.id and quantity >= item_quantity;
      if not found then raise exception 'Not enough stock for %', product_row.name; end if;
      insert into public.inventory_movements (tenant_id, location_id, product_id, movement_type, quantity, reference_id, created_by)
      values (current_tenant_id, current_location_id, product_row.id, 'sale', -item_quantity, new_sale_id, auth.uid());
    end if;
  end loop;

  sale_total := sale_subtotal + sale_tax;
  if tendered_amount < sale_total then raise exception 'Payment is less than the sale total'; end if;
  update public.sales set subtotal = sale_subtotal, tax_total = sale_tax, total = sale_total, status = 'completed', completed_at = now() where id = new_sale_id;
  insert into public.payments (tenant_id, sale_id, method, amount, tendered_amount, change_amount)
  values (current_tenant_id, new_sale_id, payment_method, sale_total, tendered_amount, tendered_amount - sale_total);
  return new_sale_id;
end;
$$;

grant execute on function public.complete_sale(uuid, jsonb, public.payment_method, numeric) to authenticated;

notify pgrst, 'reload schema';
