-- HudHud conversational memory is opt-in, per-account and RLS protected.
-- No guest raw audio, microphone transcript recordings, or shared conversations.
create table if not exists public.hudhud_memory_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.hudhud_memory_preferences enable row level security;
revoke all on public.hudhud_memory_preferences from public, anon;
grant select,insert,update,delete on public.hudhud_memory_preferences to authenticated;
create policy "HudHud memory preference is owned by account" on public.hudhud_memory_preferences
 for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.hudhud_conversations (
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null check (id ~ '^[a-zA-Z0-9-]{1,64}$'),
 title text not null default 'New chat' check (char_length(title) between 1 and 100),
 lines jsonb not null default '[]'::jsonb
  check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) <= 40 and pg_column_size(lines) <= 48000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key (user_id,id)
);
create index if not exists hudhud_conversations_recent_idx on public.hudhud_conversations(user_id,updated_at desc);
alter table public.hudhud_conversations enable row level security;
revoke all on public.hudhud_conversations from public, anon;
grant select,insert,update,delete on public.hudhud_conversations to authenticated;
create policy "HudHud conversations are visible only to account owner" on public.hudhud_conversations
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "HudHud conversations are inserted only by account owner" on public.hudhud_conversations
 for insert to authenticated with check ((select auth.uid()) = user_id
   and exists(select 1 from public.hudhud_memory_preferences p where p.user_id = hudhud_conversations.user_id and p.enabled));
create policy "HudHud conversations are updated only by account owner" on public.hudhud_conversations
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id
   and exists(select 1 from public.hudhud_memory_preferences p where p.user_id = hudhud_conversations.user_id and p.enabled));
create policy "HudHud conversations are deleted only by account owner" on public.hudhud_conversations
 for delete to authenticated using ((select auth.uid()) = user_id);
comment on table public.hudhud_conversations is 'Bounded opt-in HudHud chat memory; user-specific. Owner may clear at any time.';
