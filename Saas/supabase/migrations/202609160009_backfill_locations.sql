-- Add a default location for stores created before the onboarding location migration.
insert into public.locations (tenant_id, name)
select t.id, 'Main store'
from public.tenants t
where not exists (
  select 1
  from public.locations l
  where l.tenant_id = t.id
    and l.active = true
);
