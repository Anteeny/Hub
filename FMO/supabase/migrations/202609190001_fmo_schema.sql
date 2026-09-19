-- ==========================================================================
-- FMO (For Men Only) Relational Variant & Tailoring Schema
-- Target: Supabase / PostgreSQL
-- ==========================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Categories Table (7 Overarching Groupings)
CREATE TABLE IF NOT EXISTS public.fmo_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.fmo_categories (id, name, tagline, display_order, icon) VALUES
('double-breasted', 'Double-Breasted Suits', 'Structured Power Silhouettes & Broad Peak Lapels', 1, 'ti-shirt'),
('three-piece', '3-Piece Suits', 'Timeless Heritage Craftsmanship with Waistcoats', 2, 'ti-layers-intersect'),
('jodhpuri', 'Jodhpuri / Bandhgala', 'Regal Mandarin Collar Ensembles for Distinctive Occasions', 3, 'ti-crown'),
('two-piece', '2-Piece Suits', 'Refined Contemporary Tailoring for Corporate & Everyday Class', 4, 'ti-briefcase'),
('wrap', 'Wrap Suits', 'Modern Architectural Crossover Front Closures', 5, 'ti-sparkles'),
('wedding-tuxedo', 'Wedding Tuxedos', 'Black-Tie Ceremonial Splendor with Contrast Silk Lapels', 6, 'ti-tie'),
('accessories', 'Gentleman Essentials', 'Complete Look Bundles, Egyptian Cotton Shirts, Ties & Footwear', 7, 'ti-award')
ON CONFLICT (id) DO NOTHING;

-- 2. Base Products (Garment Styles)
CREATE TABLE IF NOT EXISTS public.fmo_products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.fmo_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  visual_details TEXT,
  fabric TEXT,
  silhouette TEXT,
  base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rental_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  color_family TEXT NOT NULL DEFAULT 'all',
  primary_color_hex TEXT NOT NULL DEFAULT '#0b0f19',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Product Variants (Specific Color Swatches, Sizes & Stock)
CREATE TABLE IF NOT EXISTS public.fmo_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.fmo_products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  color_family TEXT NOT NULL DEFAULT 'all',
  size TEXT NOT NULL, -- e.g. '38R', '40R', '42R', '44R', '46R', '48R', 'Custom Bespoke'
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 5,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rental_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customers & Measurement Profiles
CREATE TABLE IF NOT EXISTS public.fmo_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vip_status TEXT NOT NULL DEFAULT 'standard',
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- JSONB Structure: { "chest": "42R", "waist": "34", "inseam": "32", "sleeve": "25.5", "shoulder": "18.5", "neck": "16", "trouser_length": "41" }
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Sales & Invoices
CREATE TABLE IF NOT EXISTS public.fmo_sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.fmo_customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Nigerian VAT (7.5%)
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL, -- 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'bank_check', 'other'
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'deposit_held', 'fitting_ready', 'picked_up', 'rental_active', 'rental_returned'
  cashier_name TEXT NOT NULL,
  register_name TEXT NOT NULL,
  requires_alterations BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Sale Items (Garments in Order)
CREATE TABLE IF NOT EXISTS public.fmo_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id TEXT NOT NULL REFERENCES public.fmo_sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.fmo_products(id),
  variant_id TEXT NOT NULL REFERENCES public.fmo_variants(id),
  item_type TEXT NOT NULL DEFAULT 'sale', -- 'sale' | 'rental'
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  requires_alteration BOOLEAN NOT NULL DEFAULT FALSE,
  alteration_notes TEXT,
  measurements JSONB DEFAULT '{}'::jsonb
);

-- 7. Tailor Alteration Work Slips Queue
CREATE TABLE IF NOT EXISTS public.fmo_alteration_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id TEXT NOT NULL REFERENCES public.fmo_sales(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  garment_summary TEXT NOT NULL,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  instructions TEXT NOT NULL,
  fitting_deadline DATE,
  assigned_tailor TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'ready_for_fitting', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Daily Drawer Shifts (Z-Reports)
CREATE TABLE IF NOT EXISTS public.fmo_shifts (
  id TEXT PRIMARY KEY,
  register_id TEXT NOT NULL,
  register_name TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by TEXT NOT NULL,
  closed_by TEXT,
  opening_float NUMERIC(12, 2) NOT NULL DEFAULT 0,
  closing_cash_actual NUMERIC(12, 2),
  expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_gross_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  card_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transfer_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  other_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' -- 'open', 'closed'
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_fmo_products_cat ON public.fmo_products(category_id);
CREATE INDEX IF NOT EXISTS idx_fmo_variants_prod ON public.fmo_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_fmo_variants_sku ON public.fmo_variants(sku);
CREATE INDEX IF NOT EXISTS idx_fmo_sales_created ON public.fmo_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fmo_sales_status ON public.fmo_sales(status);
CREATE INDEX IF NOT EXISTS idx_fmo_alterations_status ON public.fmo_alteration_tickets(status);
