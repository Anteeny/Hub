-- Migration: 202609160011_tenant_members_invites_and_pins.sql

-- 1. Allow tenant_members to hold invited members and PIN-only cashiers
alter table public.tenant_members
  alter column user_id drop not null;

alter table public.tenant_members
  add column if not exists display_name text,
  add column if not exists email text;

-- 2. RLS update: allow invited members to read their own pending invitation by email or user_id
drop policy if exists "tenant members can select" on public.tenant_members;
drop policy if exists "members and invitees can select" on public.tenant_members;

create policy "members and invitees can select" on public.tenant_members
  for select using (
    user_id = auth.uid()
    or (email is not null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    or public.is_tenant_member(tenant_id)
  );

-- 3. RPC function for owners and managers to invite or add team members with secure PIN hashing
create or replace function public.upsert_team_member(
  target_tenant_id uuid,
  member_id uuid default null,
  member_name text default null,
  member_email text default null,
  member_role public.user_role default 'cashier',
  member_pin text default null,
  is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_user_id uuid := null;
  result_id uuid;
  clean_email text := null;
begin
  -- Only owners and managers can manage team members
  if not public.has_tenant_role(target_tenant_id, array['owner', 'manager']::public.user_role[]) then
    raise exception 'Permission denied: only store owners and managers can manage team members.';
  end if;

  if member_email is not null and trim(member_email) <> '' then
    clean_email := lower(trim(member_email));
    select id into resolved_user_id from public.profiles where lower(email) = clean_email limit 1;
    if resolved_user_id is null then
      select id into resolved_user_id from auth.users where lower(email) = clean_email limit 1;
    end if;
  end if;

  -- Auto-detect if member already exists by email or resolved_user_id to prevent duplicate key constraint errors
  if member_id is null and clean_email is not null then
    select id into member_id from public.tenant_members
      where tenant_id = target_tenant_id and lower(email) = clean_email limit 1;
  end if;

  if member_id is null and resolved_user_id is not null then
    select id into member_id from public.tenant_members
      where tenant_id = target_tenant_id and user_id = resolved_user_id limit 1;
  end if;

  if member_id is not null then
    -- Updating existing member
    update public.tenant_members
    set
      display_name = coalesce(member_name, display_name),
      email = coalesce(clean_email, email),
      role = coalesce(member_role, role),
      active = coalesce(is_active, active),
      user_id = coalesce(resolved_user_id, user_id),
      pin_hash = case
        when member_pin is not null and member_pin <> '' then crypt(member_pin, gen_salt('bf'))
        else pin_hash
      end
    where id = member_id and tenant_id = target_tenant_id
    returning id into result_id;
  else
    -- Inserting new member / invite
    insert into public.tenant_members (
      tenant_id,
      user_id,
      display_name,
      email,
      role,
      pin_hash,
      active
    ) values (
      target_tenant_id,
      resolved_user_id,
      member_name,
      clean_email,
      member_role,
      case when member_pin is not null and member_pin <> '' then crypt(member_pin, gen_salt('bf')) else null end,
      coalesce(is_active, true)
    ) returning id into result_id;
  end if;

  return result_id;
end;
$$;

grant execute on function public.upsert_team_member(uuid, uuid, text, text, public.user_role, text, boolean) to authenticated;

-- 4. RPC function for deleting a team member (non-owner)
create or replace function public.delete_team_member(
  target_tenant_id uuid,
  target_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_tenant_role(target_tenant_id, array['owner', 'manager']::public.user_role[]) then
    raise exception 'Permission denied: only store owners and managers can delete team members.';
  end if;

  -- Prevent deleting store owner
  if exists (select 1 from public.tenant_members where id = target_member_id and role = 'owner') then
    raise exception 'Cannot remove store owner.';
  end if;

  delete from public.tenant_members
  where id = target_member_id and tenant_id = target_tenant_id;

  return true;
end;
$$;

grant execute on function public.delete_team_member(uuid, uuid) to authenticated;

-- 5. RPC function for invited users to claim their workspace on login (bypasses RLS and links account)
create or replace function public.claim_my_invitation()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  found_member record;
begin
  if auth.uid() is null then
    return null;
  end if;

  select email into user_email from auth.users where id = auth.uid();

  -- Ensure profile exists for auth user
  if user_email is not null then
    insert into public.profiles (id, email)
      values (auth.uid(), user_email)
      on conflict (id) do update set email = excluded.email;
  end if;

  -- Find membership by user_id OR email
  select tm.id, tm.tenant_id, tm.role, t.name into found_member
  from public.tenant_members tm
  join public.tenants t on t.id = tm.tenant_id
  where (tm.user_id = auth.uid() or (user_email is not null and lower(tm.email) = lower(user_email)))
    and tm.active = true
  order by (tm.user_id = auth.uid()) desc, tm.created_at asc
  limit 1;

  if found_member.id is not null then
    -- Ensure user_id is linked to tenant_members
    update public.tenant_members
    set user_id = auth.uid()
    where id = found_member.id and user_id is null;

    return jsonb_build_object(
      'tenant_id', found_member.tenant_id,
      'name', found_member.name,
      'role', found_member.role
    );
  end if;

  return null;
end;
$$;

grant execute on function public.claim_my_invitation() to authenticated;

-- 6. Trigger on auth.users so whenever ANY user registers, their profile is created and pending invites auto-link
create or replace function public.on_auth_user_created_link_invites()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Create profile
  insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;

  -- 2. Link pending tenant_members
  if new.email is not null then
    update public.tenant_members
    set user_id = new.id
    where lower(email) = lower(new.email) and user_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.on_auth_user_created_link_invites();

notify pgrst, 'reload schema';
