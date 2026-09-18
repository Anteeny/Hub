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
  insert into public.locations (tenant_id, name) values (new_tenant_id, 'Main store');
  return new_tenant_id;
end;
$$;