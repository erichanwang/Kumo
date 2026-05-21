-- Kumo Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.
-- This creates the profiles table with subscription_tier and related functions.

-- 1. Profiles table (links Supabase Auth users to their Kumo subscription data)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'past_due', 'canceled', 'inactive')),
  subscription_period_end timestamp with time zone,
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now()
);

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not subscription_tier — that's managed server-side)
create policy "Users can update own profile (non-tier fields)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can manage all profiles (used by Stripe webhook)
create policy "Service role can manage all profiles"
  on public.profiles for all
  using (true)
  with check (true);

-- 4. Function to check if user has active pro subscription
create or replace function public.is_pro_user(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  result boolean;
begin
  select subscription_tier = 'pro' and subscription_status = 'active'
  into result
  from public.profiles
  where id = user_id;
  return coalesce(result, false);
end;
$$;

-- 5. Create index for Stripe lookups
create index if not exists idx_profiles_stripe_customer on public.profiles(stripe_customer_id);

-- 6. Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
