-- Run this AFTER phase7_booking_programs.sql

alter table public.programs add column if not exists image_url text;

-- Trainers now upload program images into the same 'product-images' bucket
-- (under a programs/ prefix) — the bucket's existing policies only allowed
-- admin, so this adds trainer access too.
create policy "trainer uploads to product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_trainer());
create policy "trainer updates product images" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_trainer());

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  quote text not null,
  approved boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "public read approved testimonials" on public.testimonials for select
  using (approved or public.is_admin() or public.is_trainer());
create policy "trainer or admin creates testimonials" on public.testimonials for insert
  with check (public.is_admin() or public.is_trainer());
create policy "trainer or admin updates testimonials" on public.testimonials for update
  using (public.is_admin() or public.is_trainer());
create policy "trainer or admin deletes testimonials" on public.testimonials for delete
  using (public.is_admin() or public.is_trainer());
