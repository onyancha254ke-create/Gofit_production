-- Run this AFTER phase4b_exercise_logs.sql

-- ---------- INVENTORY ----------
alter table public.products add column if not exists stock int not null default 100;
alter table public.products add column if not exists low_stock_threshold int not null default 10;

-- ---------- SUBSCRIPTIONS: admin needs to create/manage them ----------
create policy "admin creates subscriptions" on public.subscriptions for insert
  with check (public.is_admin());
create policy "admin deletes subscriptions" on public.subscriptions for delete
  using (public.is_admin());
