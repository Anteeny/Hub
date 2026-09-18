-- Migration: Optional Cash Drawer & Till Shift Tracking
-- Allows stores to toggle cash drawer floats, petty cash tracking, and shift reconciliation on or off.

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS enable_cash_drawer_shifts boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tenants.enable_cash_drawer_shifts IS 'When true, POS requires cashiers to open till shifts with float, log expenses, and close shifts with Z-reports. When false, till shift cycle is bypassed for direct fast selling.';
