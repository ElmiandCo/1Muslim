-- Unique verses visited each calendar day; each user can access only their own activity.
create table if not exists public.quran_reading_events (
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null check (verse_key ~ '^(?:[1-9]|[1-9][0-9]|1(?:0[0-9]|1[0-4])):[1-9][0-9]*$'),
 read_on date not null,
 created_at timestamptz not null default now(),
 primary key (user_id, verse_key, read_on)
);
create index if not exists quran_reading_events_user_date_idx on public.quran_reading_events(user_id, read_on desc);
alter table public.quran_reading_events enable row level security;
create policy "Read own Quran activity" on public.quran_reading_events for select to authenticated using (auth.uid()=user_id);
create policy "Log own Quran activity" on public.quran_reading_events for insert to authenticated with check (auth.uid()=user_id);
create policy "Clear own Quran activity" on public.quran_reading_events for delete to authenticated using (auth.uid()=user_id);
