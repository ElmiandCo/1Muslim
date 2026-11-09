-- Curated, verified word-level timings for YouTube video overlays.
create table if not exists public.video_word_captions (
 video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
 word_index integer not null check (word_index >= 0),
 word text not null check (char_length(word) between 1 and 100),
 start_seconds double precision not null check (start_seconds >= 0),
 end_seconds double precision not null check (end_seconds > start_seconds),
 language text not null default 'en',
 updated_at timestamptz not null default now(),
 primary key(video_id,language,word_index)
);
create index if not exists video_word_captions_lookup on public.video_word_captions(video_id,language,start_seconds);
alter table public.video_word_captions enable row level security;
-- Publicly readable captions; only trusted server service-role can insert/update.
create policy "Read published word captions" on public.video_word_captions for select using (true);
