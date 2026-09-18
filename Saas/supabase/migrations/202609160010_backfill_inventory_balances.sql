-- Create inventory rows for existing tracked products that predate inventory balances.
insert into public.inventory_balances (tenant_id, location_id, product_id, quantity, reorder_level)
select
  p.tenant_id,
  l.id,
  p.id,
  0,
  5
from public.products p
join public.locations l
  on l.tenant_id = p.tenant_id
 and l.active = true
where p.active = true
  and p.track_inventory = true
  and not exists (
    select 1
    from public.inventory_balances ib
    where ib.tenant_id = p.tenant_id
      and ib.location_id = l.id
      and ib.product_id = p.id
  );
