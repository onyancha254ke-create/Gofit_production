-- Run this AFTER phase2_migration.sql and phase2b_migration.sql

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  exercise_id uuid not null references public.exercises(id),
  client_workout_id uuid references public.client_workouts(id),
  log_date date not null default current_date,
  weight_kg numeric(6,2),
  reps int,
  sets int,
  created_at timestamptz not null default now()
);

alter table public.exercise_logs enable row level security;

create policy "client manages own exercise logs" on public.exercise_logs for all
  using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());

create policy "trainer views client exercise logs" on public.exercise_logs for select
  using (public.is_trainer_of(client_id));
