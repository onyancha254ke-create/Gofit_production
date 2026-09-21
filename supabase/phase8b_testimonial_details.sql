-- Run this AFTER phase8_home_redesign.sql

alter table public.testimonials add column if not exists photo_url text;
alter table public.testimonials add column if not exists rating int not null default 5 check (rating between 1 and 5);
alter table public.testimonials add column if not exists client_label text; -- e.g. "Fat Loss Goal", "Strength & Muscle Gain"
