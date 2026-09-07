-- BOOKING PLATFORM DATABASE
-- Run this in Supabase SQL Editor.
-- Google refresh tokens belong in the private google_calendar_connections table.
-- Do not expose that table through client-side queries.

create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  instructor_name text,
  address text,
  timezone text not null default 'America/Phoenix',
  appointment_length_minutes integer not null default 60 check (appointment_length_minutes > 0),
  max_students_per_slot integer not null default 8 check (max_students_per_slot > 0),
  cancellation_hours integer not null default 24 check (cancellation_hours >= 0),
  reschedule_hours integer not null default 12 check (reschedule_hours >= 0),
  booking_horizon_days integer not null default 14 check (booking_horizon_days > 0),
  minimum_booking_notice_hours integer not null default 24 check (minimum_booking_notice_hours >= 0),
  primary_color text not null default '#FFFFFF',
  secondary_color text not null default '#000000',
  accent_color text not null default '#FF0000',
  logo_url text,
  footer_text text,
  payment_required boolean not null default false,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  enabled boolean not null default true,
  unique(location_id, day_of_week, start_time, end_time)
);

create table if not exists public.special_days (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  service_date date not null,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  note text,
  unique(location_id, service_date)
);

create table if not exists public.google_calendar_connections (
  location_id uuid primary key references public.locations(id) on delete cascade,
  google_calendar_id text not null,
  refresh_token text not null,
  connected_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  location_id uuid not null references public.locations(id),
  student_name text not null,
  student_phone text not null,
  student_email text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text not null,
  status text not null default 'confirmed'
    check (status in ('pending','confirmed','cancelled','rescheduled','completed')),
  google_event_id text,
  stripe_checkout_session_id text,
  stripe_payment_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  unique(location_id, booking_id, slot_start),
  check (slot_end > slot_start)
);

create index if not exists booking_slots_capacity_idx
  on public.booking_slots(location_id, slot_start);

create index if not exists bookings_manage_idx
  on public.bookings(booking_token);

-- Basic RLS:
alter table public.locations enable row level security;
alter table public.availability_rules enable row level security;
alter table public.special_days enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_slots enable row level security;
alter table public.google_calendar_connections enable row level security;

-- Public users need to read active location configuration.
drop policy if exists "public read active locations" on public.locations;
create policy "public read active locations"
on public.locations for select
to anon, authenticated
using (active = true);

-- Rules and special days are intentionally read-only to public users.
drop policy if exists "public read availability rules" on public.availability_rules;
create policy "public read availability rules"
on public.availability_rules for select
to anon, authenticated
using (exists (
  select 1 from public.locations l
  where l.id = availability_rules.location_id and l.active = true
));

drop policy if exists "public read special days" on public.special_days;
create policy "public read special days"
on public.special_days for select
to anon, authenticated
using (exists (
  select 1 from public.locations l
  where l.id = special_days.location_id and l.active = true
));

-- Clients do NOT get direct access to bookings, booking_slots, or Google secrets.
-- Edge Functions using the service role perform those operations.

-- Seed a default Safe Insight location.
insert into public.locations (
  slug, name, instructor_name, timezone, appointment_length_minutes,
  max_students_per_slot, cancellation_hours, reschedule_hours,
  booking_horizon_days, minimum_booking_notice_hours,
  primary_color, secondary_color, accent_color,
  logo_url, footer_text, payment_required
)
values (
  'safe-insight',
  'Safe Insight',
  null,
  'America/Phoenix',
  60,
  8,
  24,
  12,
  14,
  24,
  '#FFFFFF',
  '#000000',
  '#FF0000',
  'assets/safe-insight-logo.png',
  'Booking powered by Safe Insight',
  false
)
on conflict (slug) do nothing;

-- Example recurring hours. Adjust or delete these.
-- day_of_week: Sunday=0 ... Saturday=6
insert into public.availability_rules (location_id, day_of_week, start_time, end_time)
select id, 1, '09:00', '14:00' from public.locations where slug='safe-insight'
on conflict do nothing;
insert into public.availability_rules (location_id, day_of_week, start_time, end_time)
select id, 2, '09:00', '14:00' from public.locations where slug='safe-insight'
on conflict do nothing;
insert into public.availability_rules (location_id, day_of_week, start_time, end_time)
select id, 3, '09:00', '14:00' from public.locations where slug='safe-insight'
on conflict do nothing;
insert into public.availability_rules (location_id, day_of_week, start_time, end_time)
select id, 4, '09:00', '14:00' from public.locations where slug='safe-insight'
on conflict do nothing;
insert into public.availability_rules (location_id, day_of_week, start_time, end_time)
select id, 5, '09:00', '14:00' from public.locations where slug='safe-insight'
on conflict do nothing;
