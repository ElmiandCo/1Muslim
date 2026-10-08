-- Elm Tent Verse Studio: proposed schema. Review and apply explicitly after identifying the correct 1Muslim project.
create table if not exists public.verse_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null check (verse_key ~ '^(?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$'),
 note_text text not null default '',
 drawing_path text,
 image_path text,
 connected_verses text[] not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,verse_key)
);
create table if not exists public.verse_comments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null check (verse_key ~ '^(?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$'),
 parent_id uuid references public.verse_comments(id) on delete cascade,
 body text not null check (length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists verse_comments_verse_created_idx on public.verse_comments(verse_key,created_at);
create index if not exists verse_comments_parent_idx on public.verse_comments(parent_id);
alter table public.verse_notes enable row level security;
alter table public.verse_comments enable row level security;
create policy "Read own verse notes" on public.verse_notes for select to authenticated using (auth.uid()=user_id);
create policy "Create own verse notes" on public.verse_notes for insert to authenticated with check (auth.uid()=user_id);
create policy "Edit own verse notes" on public.verse_notes for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Delete own verse notes" on public.verse_notes for delete to authenticated using (auth.uid()=user_id);
create policy "Read public verse comments" on public.verse_comments for select to authenticated using (true);
create policy "Write own verse comments" on public.verse_comments for insert to authenticated with check (auth.uid()=user_id);
create policy "Edit own verse comments" on public.verse_comments for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Delete own verse comments" on public.verse_comments for delete to authenticated using (auth.uid()=user_id);
-- Do not expose private notes or user-uploaded annotation assets through a public bucket.
