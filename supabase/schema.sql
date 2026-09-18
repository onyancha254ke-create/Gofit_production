-- GoFit production schema for Supabase (Postgres)
-- Run this in Supabase SQL Editor once, on a fresh project.

create extension if not exists "pgcrypto";

-- ---------- PROFILES (extends Supabase auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Coffee','Training','Meal Plans')),
  price numeric(10,2) not null check (price > 0),
  description text,
  image_url text,
  tag text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- TRAINER AVAILABILITY (real calendar) ----------
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time text not null,
  is_booked boolean not null default false,
  unique (slot_date, slot_time)
);

-- ---------- BOOKINGS ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  program_id text not null,
  availability_id uuid references public.availability(id),
  note text,
  status text not null default 'Pending' check (status in ('Pending','Approved','Declined','Completed')),
  created_at timestamptz not null default now()
);

-- Atomically claim a slot + create a booking (prevents double-booking races)
create function public.create_booking(p_program_id text, p_availability_id uuid, p_note text)
returns public.bookings as $$
declare
  v_booking public.bookings;
begin
  update public.availability
  set is_booked = true
  where id = p_availability_id and is_booked = false;

  if not found then
    raise exception 'That slot is no longer available.';
  end if;

  insert into public.bookings (customer_id, program_id, availability_id, note)
  values (auth.uid(), p_program_id, p_availability_id, p_note)
  returning * into v_booking;

  return v_booking;
end;
$$ language plpgsql security definer;

-- ---------- ORDERS / ORDER ITEMS ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id),
  status text not null default 'Pending' check (status in ('Pending','Paid','Fulfilled','Cancelled')),
  total numeric(10,2) not null default 0,
  stripe_session_id text unique,
  shipping_note text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create function public.is_admin()
returns boolean as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- profiles: user sees/edits own row; admin sees all
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid());

-- products: public read of active items; admin full control
create policy "public read active products" on public.products for select using (active or public.is_admin());
create policy "admin write products" on public.products for insert with check (public.is_admin());
create policy "admin update products" on public.products for update using (public.is_admin());
create policy "admin delete products" on public.products for delete using (public.is_admin());

-- availability: public can read open slots; admin manages
create policy "public read availability" on public.availability for select using (true);
create policy "admin write availability" on public.availability for insert with check (public.is_admin());
create policy "admin update availability" on public.availability for update using (public.is_admin());
-- Note: create_booking() above is `security definer`, so it can still flip
-- is_booked to true for a normal customer's own request even though this
-- policy restricts direct table updates to admins only.
create policy "admin delete availability" on public.availability for delete using (public.is_admin());

-- bookings: customer sees own; admin sees/updates all
create policy "own bookings" on public.bookings for select using (customer_id = auth.uid() or public.is_admin());
create policy "admin update bookings" on public.bookings for update using (public.is_admin());

-- orders/order_items: customer sees own; admin sees/updates all; inserts only via service role (webhook)
create policy "own orders" on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy "admin update orders" on public.orders for update using (public.is_admin());
create policy "own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin()))
);

-- ---------- SEED DATA (optional, safe to remove) ----------
insert into public.products (name, category, price, description, tag) values
 ('GoFit Dark Roast','Coffee',18,'Bold, rich and intense. 250g premium roast.','BESTSELLER'),
 ('GoFit Medium Roast','Coffee',18,'Smooth and balanced. 250g premium roast.','NEW'),
 ('Strength Starter','Training',39,'A 4-week progressive strength program.','PROGRAM'),
 ('Lean & Strong Meal Plan','Meal Plans',29,'Balanced nutrition built around fat loss and performance.','POPULAR');

-- After your own account signs up once, promote yourself to admin manually:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
