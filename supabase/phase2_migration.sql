-- GoFit Phase 2: Elite App Structure
-- Run this AFTER schema.sql, in Supabase SQL Editor, on top of your existing database.

-- ---------- ROLES: expand customer/admin to client/trainer/admin ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role set default 'client';
update public.profiles set role = 'client' where role = 'customer';
alter table public.profiles add constraint profiles_role_check check (role in ('client','trainer','admin'));

-- ---------- TRAINER <-> CLIENT ASSIGNMENT ----------
create table public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id),
  client_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(trainer_id, client_id)
);

-- ---------- EXERCISE LIBRARY ----------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  equipment text,
  video_url text,
  instructions text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- WORKOUTS (templates trainers build) ----------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id),
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sets int not null default 3,
  reps text not null default '10',
  rest_seconds int default 60,
  order_index int not null default 0
);

-- ---------- ASSIGNED / SCHEDULED WORKOUTS (client's calendar) ----------
create table public.client_workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  workout_id uuid not null references public.workouts(id),
  scheduled_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- MEAL PLANS ----------
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id),
  title text not null,
  daily_calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  notes text,
  created_at timestamptz not null default now()
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  meal_label text not null, -- e.g. 'Breakfast', 'Lunch'
  description text not null,
  calories int,
  order_index int not null default 0
);

create table public.client_meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  meal_plan_id uuid not null references public.meal_plans(id),
  assigned_date date not null default current_date,
  active boolean not null default true
);

-- ---------- PROGRESS TRACKING ----------
create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  log_date date not null default current_date,
  weight_kg numeric(5,2),
  waist_cm numeric(5,2),
  chest_cm numeric(5,2),
  hips_cm numeric(5,2),
  arm_cm numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  unique(client_id, log_date)
);

create table public.transformation_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  photo_url text not null,
  taken_date date not null default current_date,
  label text, -- e.g. 'front', 'side', 'back'
  created_at timestamptz not null default now()
);

-- ---------- MESSAGING (trainer <-> client) ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- SUBSCRIPTIONS (coaching tiers, not one-off store orders) ----------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  plan_name text not null,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.trainer_clients enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.client_workouts enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.client_meal_plans enable row level security;
alter table public.progress_logs enable row level security;
alter table public.transformation_photos enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

create function public.is_trainer_of(p_client_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.trainer_clients
    where client_id = p_client_id and trainer_id = auth.uid()
  );
$$ language sql security definer stable;

-- trainer_clients: trainer sees their own assignments, admin sees all, client sees their own row
create policy "trainer sees own clients" on public.trainer_clients for select
  using (trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin());
create policy "trainer assigns clients" on public.trainer_clients for insert
  with check (trainer_id = auth.uid() or public.is_admin());
create policy "trainer removes clients" on public.trainer_clients for delete
  using (trainer_id = auth.uid() or public.is_admin());

-- exercises: readable by anyone signed in; trainers/admin can write
create policy "read exercises" on public.exercises for select using (true);
create policy "trainer writes exercises" on public.exercises for insert
  with check (auth.uid() is not null);
create policy "trainer updates exercises" on public.exercises for update
  using (created_by = auth.uid() or public.is_admin());
create policy "trainer deletes exercises" on public.exercises for delete
  using (created_by = auth.uid() or public.is_admin());

-- workouts: trainer manages own; client can read workouts assigned to them (via client_workouts join)
create policy "trainer manages own workouts" on public.workouts for all
  using (trainer_id = auth.uid() or public.is_admin())
  with check (trainer_id = auth.uid() or public.is_admin());
create policy "client reads assigned workouts" on public.workouts for select
  using (exists(select 1 from public.client_workouts cw where cw.workout_id = id and cw.client_id = auth.uid()));

create policy "trainer manages workout_exercises" on public.workout_exercises for all
  using (exists(select 1 from public.workouts w where w.id = workout_id and (w.trainer_id = auth.uid() or public.is_admin())))
  with check (exists(select 1 from public.workouts w where w.id = workout_id and (w.trainer_id = auth.uid() or public.is_admin())));
create policy "client reads workout_exercises" on public.workout_exercises for select
  using (exists(select 1 from public.client_workouts cw where cw.workout_id = workout_id and cw.client_id = auth.uid()));

-- client_workouts: client sees/updates(complete) own; trainer of that client can manage
create policy "client sees own schedule" on public.client_workouts for select
  using (client_id = auth.uid() or public.is_trainer_of(client_id) or public.is_admin());
create policy "client marks own complete" on public.client_workouts for update
  using (client_id = auth.uid() or public.is_trainer_of(client_id) or public.is_admin());
create policy "trainer schedules workouts" on public.client_workouts for insert
  with check (public.is_trainer_of(client_id) or public.is_admin());
create policy "trainer removes schedule" on public.client_workouts for delete
  using (public.is_trainer_of(client_id) or public.is_admin());

-- meal_plans / items: same pattern as workouts
create policy "trainer manages own meal_plans" on public.meal_plans for all
  using (trainer_id = auth.uid() or public.is_admin())
  with check (trainer_id = auth.uid() or public.is_admin());
create policy "client reads assigned meal_plans" on public.meal_plans for select
  using (exists(select 1 from public.client_meal_plans cmp where cmp.meal_plan_id = id and cmp.client_id = auth.uid()));

create policy "trainer manages meal_plan_items" on public.meal_plan_items for all
  using (exists(select 1 from public.meal_plans mp where mp.id = meal_plan_id and (mp.trainer_id = auth.uid() or public.is_admin())))
  with check (exists(select 1 from public.meal_plans mp where mp.id = meal_plan_id and (mp.trainer_id = auth.uid() or public.is_admin())));
create policy "client reads meal_plan_items" on public.meal_plan_items for select
  using (exists(select 1 from public.client_meal_plans cmp where cmp.meal_plan_id = meal_plan_id and cmp.client_id = auth.uid()));

create policy "client sees own meal assignment" on public.client_meal_plans for select
  using (client_id = auth.uid() or public.is_trainer_of(client_id) or public.is_admin());
create policy "trainer assigns meal plans" on public.client_meal_plans for insert
  with check (public.is_trainer_of(client_id) or public.is_admin());
create policy "trainer updates meal assignment" on public.client_meal_plans for update
  using (public.is_trainer_of(client_id) or public.is_admin());

-- progress_logs: client owns their own; their trainer can view (not edit)
create policy "client manages own progress" on public.progress_logs for all
  using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "trainer views client progress" on public.progress_logs for select
  using (public.is_trainer_of(client_id));

-- transformation_photos: same pattern
create policy "client manages own photos" on public.transformation_photos for all
  using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "trainer views client photos" on public.transformation_photos for select
  using (public.is_trainer_of(client_id));

-- messages: only sender or recipient can read; either can send
create policy "read own messages" on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "send messages" on public.messages for insert
  with check (sender_id = auth.uid());
create policy "mark messages read" on public.messages for update
  using (recipient_id = auth.uid());

-- subscriptions: client sees own; admin sees/manages all
create policy "client sees own subscription" on public.subscriptions for select
  using (client_id = auth.uid() or public.is_admin());
create policy "admin manages subscriptions" on public.subscriptions for update
  using (public.is_admin());
