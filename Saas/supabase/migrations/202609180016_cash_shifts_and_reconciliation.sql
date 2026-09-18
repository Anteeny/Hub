-- Migration: 202609180016_cash_shifts_and_reconciliation.sql
-- Description: Cash Drawer Shifts, Petty Cash Movements, and End-of-Day Z-Report Reconciliation

-- 1. Ensure employee_shifts has all fields for cash reconciliation
alter table public.employee_shifts
  add column if not exists expected_cash numeric(12,2),
  add column if not exists cash_variance numeric(12,2) default 0,
  add column if not exists cash_sales_total numeric(12,2) default 0,
  add column if not exists card_sales_total numeric(12,2) default 0,
  add column if not exists cash_in_total numeric(12,2) default 0,
  add column if not exists cash_out_total numeric(12,2) default 0,
  add column if not exists total_sales_count integer default 0,
  add column if not exists status text default 'open',
  add column if not exists cashier_name text,
  add column if not exists register_name text;

-- 2. Create shift_cash_movements table for petty cash and drawer cash adjustments
create table if not exists public.shift_cash_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  shift_id uuid not null references public.employee_shifts(id) on delete cascade,
  movement_type text not null check (movement_type in ('cash_in', 'cash_out')),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null,
  created_by text,
  created_at timestamptz not null default now()
);

-- Enable RLS on shift_cash_movements
alter table public.shift_cash_movements enable row level security;

create policy "Tenant members can view shift cash movements"
  on public.shift_cash_movements for select
  using (public.is_tenant_member(tenant_id));

create policy "Tenant members can insert shift cash movements"
  on public.shift_cash_movements for insert
  with check (public.is_tenant_member(tenant_id));

-- 3. RPC: Open a new cashier shift
create or replace function public.open_cashier_shift(
  target_tenant_id uuid,
  target_register_id uuid,
  target_employee_id uuid,
  opening_float numeric(12,2) default 0,
  shift_notes text default null,
  c_name text default null,
  r_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_shift_id uuid;
  active_loc_id uuid;
begin
  if not public.is_tenant_member(target_tenant_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  -- Get default or first location for tenant
  select id into active_loc_id from public.locations where tenant_id = target_tenant_id limit 1;

  insert into public.employee_shifts (
    tenant_id,
    location_id,
    employee_id,
    register_id,
    started_at,
    opening_cash,
    expected_cash,
    notes,
    status,
    cashier_name,
    register_name
  ) values (
    target_tenant_id,
    active_loc_id,
    target_employee_id,
    coalesce(opening_float, 0),
    coalesce(opening_float, 0),
    shift_notes,
    'open',
    c_name,
    r_name
  )
  returning id into new_shift_id;

  return jsonb_build_object('success', true, 'shift_id', new_shift_id);
end;
$$;

grant execute on function public.open_cashier_shift(uuid, uuid, uuid, numeric, text, text, text) to authenticated, anon;

-- 4. RPC: Record petty cash movement (cash in / cash out)
create or replace function public.record_shift_cash_movement(
  target_tenant_id uuid,
  target_shift_id uuid,
  m_type text,
  m_amount numeric(12,2),
  m_reason text,
  staff_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  mov_id uuid;
begin
  if not public.is_tenant_member(target_tenant_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if m_amount is null or m_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Amount must be greater than zero');
  end if;

  insert into public.shift_cash_movements (
    tenant_id,
    shift_id,
    movement_type,
    amount,
    reason,
    created_by
  ) values (
    target_tenant_id,
    target_shift_id,
    m_type,
    m_amount,
    m_reason,
    staff_name
  )
  returning id into mov_id;

  -- Update running totals on the shift
  if m_type = 'cash_in' then
    update public.employee_shifts
    set cash_in_total = coalesce(cash_in_total, 0) + m_amount,
        expected_cash = coalesce(expected_cash, opening_cash) + m_amount
    where id = target_shift_id and tenant_id = target_tenant_id;
  elsif m_type = 'cash_out' then
    update public.employee_shifts
    set cash_out_total = coalesce(cash_out_total, 0) + m_amount,
        expected_cash = coalesce(expected_cash, opening_cash) - m_amount
    where id = target_shift_id and tenant_id = target_tenant_id;
  end if;

  return jsonb_build_object('success', true, 'movement_id', mov_id);
end;
$$;

grant execute on function public.record_shift_cash_movement(uuid, uuid, text, numeric, text, text) to authenticated, anon;

-- 5. RPC: Close cashier shift & finalize Z-Report
create or replace function public.close_cashier_shift(
  target_tenant_id uuid,
  target_shift_id uuid,
  actual_closing_cash numeric(12,2),
  closing_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s_rec record;
  calc_expected numeric(12,2);
  calc_variance numeric(12,2);
begin
  if not public.is_tenant_member(target_tenant_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into s_rec from public.employee_shifts
  where id = target_shift_id and tenant_id = target_tenant_id;

  if s_rec.id is null then
    return jsonb_build_object('success', false, 'error', 'Shift not found');
  end if;

  -- Expected cash = Opening Float + Cash Sales + Cash In - Cash Out
  calc_expected := coalesce(s_rec.opening_cash, 0)
                 + coalesce(s_rec.cash_sales_total, 0)
                 + coalesce(s_rec.cash_in_total, 0)
                 - coalesce(s_rec.cash_out_total, 0);

  calc_variance := coalesce(actual_closing_cash, 0) - calc_expected;

  update public.employee_shifts
  set ended_at = now(),
      closing_cash = actual_closing_cash,
      expected_cash = calc_expected,
      cash_variance = calc_variance,
      notes = case when closing_notes is not null and closing_notes <> ''
                   then coalesce(notes || ' | Closing: ' || closing_notes, closing_notes)
                   else notes end,
      status = 'closed'
  where id = target_shift_id and tenant_id = target_tenant_id;

  return jsonb_build_object(
    'success', true,
    'expected_cash', calc_expected,
    'closing_cash', actual_closing_cash,
    'variance', calc_variance
  );
end;
$$;

grant execute on function public.close_cashier_shift(uuid, uuid, numeric, text) to authenticated, anon;

notify pgrst, 'reload schema';
