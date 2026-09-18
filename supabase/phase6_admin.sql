-- Run this AFTER phase5b_mpesa.sql

create policy "admin updates any profile" on public.profiles for update
  using (public.is_admin());
