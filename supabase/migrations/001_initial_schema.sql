-- Enable extensions
create extension if not exists "pgcrypto";

-- ── profiles ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  points integer not null default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ── rooms ─────────────────────────────────────────────────────────────────────
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard', 'insane')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── tasks ─────────────────────────────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  description text not null,
  hints jsonb not null default '[]'::jsonb,
  flag_hash text not null,
  task_index integer not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, task_index)
);

-- ── challenges ────────────────────────────────────────────────────────────────
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard', 'insane')),
  points integer not null default 0,
  description text not null,
  flag_hash text not null,
  attachment_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ── submissions ───────────────────────────────────────────────────────────────
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('task', 'challenge')),
  target_id uuid not null,
  status text not null check (status in ('success', 'failure')),
  created_at timestamptz not null default now()
);

-- Prevent duplicate solves
create unique index submissions_unique_solve
  on public.submissions(user_id, target_type, target_id)
  where status = 'success';

create index submissions_user_idx on public.submissions(user_id, created_at desc);

-- ── user_progress ─────────────────────────────────────────────────────────────
create table public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  status text not null default 'unlocked' check (status in ('unlocked', 'solved')),
  unlocked_at timestamptz not null default now(),
  solved_at timestamptz,
  primary key (user_id, task_id)
);

create index user_progress_room_idx on public.user_progress(user_id, room_id);

-- ── rate_limits ───────────────────────────────────────────────────────────────
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address text,
  action text not null default 'flag_submit',
  created_at timestamptz not null default now()
);

create index rate_limits_user_idx on public.rate_limits(user_id, created_at desc);
create index rate_limits_ip_idx on public.rate_limits(ip_address, created_at desc);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Helper: is current user admin ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- ── Helper: increment points ──────────────────────────────────────────────────
create or replace function public.increment_points(p_user_id uuid, p_points integer)
returns void as $$
begin
  if p_points < 0 then
    raise exception 'p_points must be non-negative';
  end if;
  update public.profiles
  set points = points + p_points
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.tasks enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.user_progress enable row level security;
alter table public.rate_limits enable row level security;

-- Profiles
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles
  for all to authenticated using (public.is_admin());

-- Rooms
create policy "rooms_select_authenticated" on public.rooms
  for select to authenticated using (true);
create policy "rooms_admin_all" on public.rooms
  for all to authenticated using (public.is_admin());

-- Tasks (flag_hash column restricted via column privileges)
create policy "tasks_select_authenticated" on public.tasks
  for select to authenticated using (true);
create policy "tasks_admin_all" on public.tasks
  for all to authenticated using (public.is_admin());

-- Revoke flag_hash from regular authenticated users
revoke select (flag_hash) on public.tasks from authenticated;
revoke select (flag_hash) on public.challenges from authenticated;

-- Challenges
create policy "challenges_select_authenticated" on public.challenges
  for select to authenticated using (true);
create policy "challenges_admin_all" on public.challenges
  for all to authenticated using (public.is_admin());

-- Submissions
create policy "submissions_select_own" on public.submissions
  for select to authenticated using (auth.uid() = user_id);
create policy "submissions_admin_all" on public.submissions
  for all to authenticated using (public.is_admin());

-- User progress
create policy "user_progress_select_own" on public.user_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "user_progress_insert_own" on public.user_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "user_progress_update_own" on public.user_progress
  for update to authenticated using (auth.uid() = user_id);
create policy "user_progress_admin_all" on public.user_progress
  for all to authenticated using (public.is_admin());

-- Rate limits (service role manages inserts; users can read their own)
create policy "rate_limits_select_own" on public.rate_limits
  for select to authenticated using (auth.uid() = user_id);
