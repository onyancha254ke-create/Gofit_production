-- Run this AFTER phase5_commerce.sql

-- Products get a separate KES price (M-Pesa charges in KES natively;
-- USD via Stripe stays as the existing "price" column).
alter table public.products add column if not exists price_kes numeric(10,2);

-- Orders need to know which currency/method was used, and to carry
-- M-Pesa's own transaction identifiers for reconciliation.
alter table public.orders add column if not exists currency text not null default 'usd' check (currency in ('usd','kes'));
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists mpesa_checkout_request_id text unique;
alter table public.orders add column if not exists mpesa_receipt text;
