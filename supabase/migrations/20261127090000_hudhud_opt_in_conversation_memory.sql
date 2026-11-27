-- Opt-in HudHud AI memory. Do NOT use the separate existing HudHud CRM table
-- (public.hudhud_conversations), whose UUID ids and message schema are different.
create table if not exists public.hudhud_memory_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.hudhud_memory_preferences enable row level security;
revoke all on public.hudhud_memory_preferences from public,anon;
grant select,insert,update,delete on public.hudhud_memory_preferences to authenticated;

create table if not exists public.hudhud_ai_chat_sessions (
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null check (id ~ '^[a-zA-Z0-9-]{1,64}$'),
 title text not null default 'New chat' check (char_length(title) between 1 and 100),
 lines jsonb not null default '[]'::jsonb
  check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) <= 40 and pg_column_size(lines) <= 48000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,id)
);
create index if not exists hudhud_ai_chat_sessions_recent_idx on public.hudhud_ai_chat_sessions(user_id,updated_at desc);
alter table public.hudhud_ai_chat_sessions enable row level security;
revoke all on public.hudhud_ai_chat_sessions from public,anon;
grant select,insert,update,delete on public.hudhud_ai_chat_sessions to authenticated;

do $policies$
begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='hudhud_memory_preferences' and policyname='HudHud memory preference is owned by account') then
  create policy "HudHud memory preference is owned by account" on public.hudhud_memory_preferences
   for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='hudhud_ai_chat_sessions' and policyname='Own HudHud AI chat sessions readable') then
  create policy "Own HudHud AI chat sessions readable" on public.hudhud_ai_chat_sessions
   for select to authenticated using((select auth.uid())=user_id);
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='hudhud_ai_chat_sessions' and policyname='Own HudHud AI chat sessions insert only when opted in') then
  create policy "Own HudHud AI chat sessions insert only when opted in" on public.hudhud_ai_chat_sessions
   for insert to authenticated with check ((select auth.uid())=user_id and exists
    (select 1 from public.hudhud_memory_preferences p where p.user_id=hudhud_ai_chat_sessions.user_id and p.enabled));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='hudhud_ai_chat_sessions' and policyname='Own HudHud AI chat sessions update only when opted in') then
  create policy "Own HudHud AI chat sessions update only when opted in" on public.hudhud_ai_chat_sessions
   for update to authenticated using((select auth.uid())=user_id)
   with check((select auth.uid())=user_id and exists
    (select 1 from public.hudhud_memory_preferences p where p.user_id=hudhud_ai_chat_sessions.user_id and p.enabled));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='hudhud_ai_chat_sessions' and policyname='Own HudHud AI chat sessions removable') then
  create policy "Own HudHud AI chat sessions removable" on public.hudhud_ai_chat_sessions
   for delete to authenticated using((select auth.uid())=user_id);
 end if;
end $policies$;
comment on table public.hudhud_ai_chat_sessions is 'Opt-in private AI chat; deliberately separate from legacy HudHud CRM conversations.';
