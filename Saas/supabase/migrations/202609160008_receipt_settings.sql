-- Receipt and local tax settings for store-specific Nigerian-style receipts.
alter table public.tenants add column if not exists legal_name text;
alter table public.tenants add column if not exists address_lines text;
alter table public.tenants add column if not exists phone text;
alter table public.tenants add column if not exists tin text;
alter table public.tenants add column if not exists rc_number text;
alter table public.tenants add column if not exists receipt_footer text default 'Thank you for shopping with us!';
alter table public.tenants add column if not exists vat_rate numeric(6,3) not null default 7.5;
alter table public.tenants alter column currency set default 'NGN';

alter table public.payments add column if not exists provider_name text;
alter table public.payments add column if not exists provider_reference text;
alter table public.payments add column if not exists card_last_four char(4);
alter table public.payments add column if not exists authorization_code text;

alter table public.tenants drop constraint if exists tenants_vat_rate_check;
alter table public.tenants add constraint tenants_vat_rate_check check (vat_rate >= 0 and vat_rate <= 100);
