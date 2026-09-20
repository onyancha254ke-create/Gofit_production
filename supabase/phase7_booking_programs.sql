-- Run this AFTER phase6_admin.sql

-- ---------- BOOKINGS: client requests any date/time, trainer/admin confirms ----------
alter table public.bookings add column if not exists preferred_date date;
alter table public.bookings add column if not exists preferred_time text;
alter table public.bookings add column if not exists confirmed_date date;
alter table public.bookings add column if not exists confirmed_time text;

-- Original booking flow only ever inserted via the create_booking() RPC
-- (security definer), so there was never a direct insert policy for
-- customers. The new flow inserts straight from the client, so this is needed.
create policy "customer creates own booking" on public.bookings for insert
  with check (customer_id = auth.uid());

-- ---------- PROGRAMS: managed by trainer/admin instead of hardcoded in code ----------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(10,2) not null,
  unit text,
  description text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.programs enable row level security;

create policy "public read active programs" on public.programs for select
  using (active or public.is_admin() or public.is_trainer());
create policy "trainer or admin creates programs" on public.programs for insert
  with check (public.is_admin() or public.is_trainer());
create policy "trainer or admin updates programs" on public.programs for update
  using (public.is_admin() or public.is_trainer());
create policy "trainer or admin deletes programs" on public.programs for delete
  using (public.is_admin() or public.is_trainer());

-- Seed the 3 programs that were previously hardcoded, so the site isn't
-- suddenly empty after this migration.
insert into public.programs (title, price, unit, description) values
 ('1:1 Personal Training', 80, '/ session', 'Individual coaching, custom programming and accountability.'),
 ('4-Week Strength System', 39, '', 'Progressive training structure for building strength and confidence.'),
 ('Online Coaching', 120, '/ month', 'Remote programming, check-ins and ongoing progression.');
