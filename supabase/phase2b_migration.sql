-- Run this AFTER phase2_migration.sql

create function public.is_trainer()
returns boolean as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'trainer');
$$ language sql security definer stable;

-- Lets a trainer browse client profiles (to assign themselves as coach),
-- on top of the existing "own profile" policy which still governs everyone else.
create policy "trainer browses clients" on public.profiles for select
  using (role = 'client' and public.is_trainer());
