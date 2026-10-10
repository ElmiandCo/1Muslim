create table if not exists public.public_badge_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  visible_badges text[] not null default array['shahada','tiktok']::text[],
  updated_at timestamptz not null default now(),
  constraint permitted_badges check (visible_badges <@ array['shahada','tiktok']::text[])
);
alter table public.public_badge_preferences enable row level security;
grant select, insert, update on public.public_badge_preferences to authenticated;
create policy "Everyone can view badge choices" on public.public_badge_preferences for select to authenticated using (true);
create policy "Members can create their badge choices" on public.public_badge_preferences for insert to authenticated with check (auth.uid() = user_id);
create policy "Members can update their badge choices" on public.public_badge_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
