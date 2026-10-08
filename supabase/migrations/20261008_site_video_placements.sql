-- Admin-managed YouTube placements. Apply in Supabase before enabling the manager.
create table if not exists public.site_video_placements (
 id uuid primary key default gen_random_uuid(),
 placement text not null check (placement in ('home_video_of_day','elm_prayer','elm_quran','elm_history','rewards_training','streaming_featured','learning_beginner')),
 title text not null check (length(trim(title)) between 1 and 180),
 description text not null default '',
 youtube_url text not null check (youtube_url ~* '^https?://(www\\.)?(youtube\\.com|youtu\\.be)/'),
 position integer not null default 1 check (position > 0),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists site_video_placements_placement_idx on public.site_video_placements(placement,position);
alter table public.site_video_placements enable row level security;
drop policy if exists "Everyone reads active video placements" on public.site_video_placements;
create policy "Everyone reads active video placements" on public.site_video_placements for select to anon, authenticated using (
 is_active or (auth.jwt()->>'email') = 'hudhudbyelmi@gmail.com'
);
drop policy if exists "Admin manages video placements" on public.site_video_placements;
create policy "Admin manages video placements" on public.site_video_placements for all to authenticated
 using ((auth.jwt()->>'email') = 'hudhudbyelmi@gmail.com')
 with check ((auth.jwt()->>'email') = 'hudhudbyelmi@gmail.com');
