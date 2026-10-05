-- OneMuslim Live Studio: lock broadcast format and preserve live thumbnails
alter table public.live_streams
  add column if not exists thumbnail_path text,
  add column if not exists aspect_ratio text not null default '9:16',
  add column if not exists video_width integer,
  add column if not exists video_height integer;

alter table public.go_live_settings
  add column if not exists aspect_ratio text not null default '9:16',
  add column if not exists video_width integer,
  add column if not exists video_height integer;


-- OneMuslim Live Chat: persistent comments plus host mute controls
create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists live_chat_messages_stream_created_idx on public.live_chat_messages(stream_id, created_at);

create table if not exists public.live_chat_mutes (
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  muted_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (stream_id, user_id)
);

alter table public.live_chat_messages enable row level security;
alter table public.live_chat_mutes enable row level security;

drop policy if exists "live chat messages readable by authenticated users" on public.live_chat_messages;
create policy "live chat messages readable by authenticated users" on public.live_chat_messages for select to authenticated using (true);

drop policy if exists "live chat messages sent by self unless muted" on public.live_chat_messages;
create policy "live chat messages sent by self unless muted" on public.live_chat_messages for insert to authenticated
with check ((select auth.uid()) = sender_id and not exists (
  select 1 from public.live_chat_mutes m where m.stream_id = live_chat_messages.stream_id and m.user_id = (select auth.uid())
));

drop policy if exists "live chat mutes visible to host" on public.live_chat_mutes;
create policy "live chat mutes visible to host" on public.live_chat_mutes for select to authenticated using (
  exists (select 1 from public.live_streams s where s.id = live_chat_mutes.stream_id and s.host_id = (select auth.uid()))
);

drop policy if exists "host can mute viewers" on public.live_chat_mutes;
create policy "host can mute viewers" on public.live_chat_mutes for insert to authenticated with check (
  muted_by = (select auth.uid()) and user_id <> (select auth.uid()) and
  exists (select 1 from public.live_streams s where s.id = live_chat_mutes.stream_id and s.host_id = (select auth.uid()))
);

drop policy if exists "host can unmute viewers" on public.live_chat_mutes;
create policy "host can unmute viewers" on public.live_chat_mutes for delete to authenticated using (
  exists (select 1 from public.live_streams s where s.id = live_chat_mutes.stream_id and s.host_id = (select auth.uid()))
);

do $$
begin
  alter publication supabase_realtime add table public.live_chat_messages;
exception when duplicate_object then null;
end $$;
