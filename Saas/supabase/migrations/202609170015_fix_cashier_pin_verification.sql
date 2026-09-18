-- Migration: 202609170015_fix_cashier_pin_verification.sql
-- Fixes: "function digest(text, unknown) does not exist"
-- Uses PostgreSQL native core sha256() function and adds search_path = public, extensions

-- 1. Ensure pgcrypto extension is installed in extensions schema
create extension if not exists pgcrypto with schema extensions;

-- 2. Robust RPC function to verify cashier 4-digit PIN
create or replace function public.verify_cashier_pin(
  target_tenant_id uuid,
  target_member_id uuid,
  candidate_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  member_rec record;
  is_valid boolean := false;
  raw_hex text;
  client_sha text;
begin
  select id, tenant_id, display_name, email, role, pin_hash, active
  into member_rec
  from public.tenant_members
  where id = target_member_id
    and tenant_id = target_tenant_id
    and active = true;

  if member_rec.id is null or member_rec.pin_hash is null or member_rec.pin_hash = '' then
    return jsonb_build_object('success', false, 'error', 'No PIN configured for this team member.');
  end if;

  -- 1. Check client-side SHA-256 hash using PostgreSQL built-in sha256() function
  -- (Built into standard PostgreSQL pg_catalog, requires NO extensions and never errors)
  begin
    raw_hex := encode(sha256(convert_to('storeflow_pin_salt_' || candidate_pin, 'UTF8')), 'hex');
    client_sha := 'sha256_' || raw_hex;
    if member_rec.pin_hash = client_sha or member_rec.pin_hash = raw_hex then
      is_valid := true;
    end if;
  exception when others then
    null;
  end;

  -- 2. Check pgcrypto crypt (bcrypt) if not matched yet
  if not is_valid then
    begin
      if member_rec.pin_hash = crypt(candidate_pin, member_rec.pin_hash) then
        is_valid := true;
      end if;
    exception when others then
      null;
    end;
  end if;

  -- 3. Check explicit extensions.crypt if not matched yet
  if not is_valid then
    begin
      if member_rec.pin_hash = extensions.crypt(candidate_pin, member_rec.pin_hash) then
        is_valid := true;
      end if;
    exception when others then
      null;
    end;
  end if;

  -- 4. Check explicit extensions.digest if available
  if not is_valid then
    begin
      raw_hex := encode(extensions.digest(convert_to('storeflow_pin_salt_' || candidate_pin, 'UTF8'), 'sha256'), 'hex');
      if member_rec.pin_hash = ('sha256_' || raw_hex) or member_rec.pin_hash = raw_hex then
        is_valid := true;
      end if;
    exception when others then
      null;
    end;
  end if;

  -- 5. Fallback plaintext comparison (for testing/unhashed PINs)
  if not is_valid and member_rec.pin_hash = candidate_pin then
    is_valid := true;
  end if;

  if is_valid then
    return jsonb_build_object(
      'success', true,
      'member_id', member_rec.id,
      'display_name', coalesce(member_rec.display_name, split_part(member_rec.email, '@', 1), 'Staff'),
      'role', member_rec.role
    );
  else
    return jsonb_build_object('success', false, 'error', 'Incorrect PIN.');
  end if;
end;
$$;

grant execute on function public.verify_cashier_pin(uuid, uuid, text) to authenticated, anon;

-- 3. RPC function to allow setting/updating a cashier 4-digit PIN
create or replace function public.set_cashier_pin(
  target_tenant_id uuid,
  target_member_id uuid,
  new_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hashed text;
begin
  if not public.is_tenant_member(target_tenant_id) then
    return jsonb_build_object('success', false, 'error', 'Permission denied: not a store member.');
  end if;

  if new_pin is null or length(trim(new_pin)) <> 4 then
    return jsonb_build_object('success', false, 'error', 'PIN must be exactly 4 digits.');
  end if;

  hashed := 'sha256_' || encode(sha256(convert_to('storeflow_pin_salt_' || trim(new_pin), 'UTF8')), 'hex');

  update public.tenant_members
  set pin_hash = hashed
  where id = target_member_id
    and tenant_id = target_tenant_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.set_cashier_pin(uuid, uuid, text) to authenticated, anon;

notify pgrst, 'reload schema';
