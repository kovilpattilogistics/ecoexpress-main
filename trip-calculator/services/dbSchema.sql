-- Create tables for Eco Express Logistics

-- 1. PROFILES (Extends Auth users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone text,
  role text check (role in ('ADMIN', 'DRIVER', 'CUSTOMER')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TRIPS
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_phone text,
  pickup_location text not null,
  pickup_lat float8,
  pickup_lng float8,
  drop_location text not null,
  drop_lat float8,
  drop_lng float8,
  fare numeric default 199.00,
  status text check (status in ('SCHEDULED', 'STARTED', 'PICKUP_REACHED', 'PICKUP_COMPLETED', 'IN_TRANSIT', 'DROP_REACHED', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL')),
  driver_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id), -- Who booked it? (Admin/Driver proxy or Customer)
  booking_channel text check (booking_channel in ('WEB_DIRECT', 'ADMIN_PROXY', 'DRIVER_QUICK_LOG', 'WHATSAPP_BOT')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. VEHICLE LOGS (For tracking)
create table public.vehicle_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id text, -- Hardcoded for single vehicle for now, or link to a vehicles table
  driver_id uuid references public.profiles(id),
  lat float8 not null,
  lng float8 not null,
  speed float8,
  battery_level int, -- For EV transition
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Simple start)
alter table public.profiles enable row level security;
alter table public.trips enable row level security;

-- Allow read/write for now (secure later)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Trips are viewable by authenticated users" on public.trips for select using (auth.role() = 'authenticated');
create policy "Admins and Drivers can update trips" on public.trips for update using (auth.role() = 'authenticated'); -- Refine to role check later
create policy "Anyone can insert trips (including anon customers)" on public.trips for insert with check (true);
