create table if not exists public.dm_calls(
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
 caller_id uuid not null references auth.users(id),
 callee_id uuid not null references auth.users(id),
 mode text not null check(mode in ('audio','video')),
 status text not null default 'ringing' check(status in ('ringing','accepted','declined','ended')),
 created_at timestamptz not null default now(),
 accepted_at timestamptz,
 ended_at timestamptz
);
create index if not exists dm_calls_callee_idx on public.dm_calls(callee_id,status,created_at desc);
create index if not exists dm_calls_conversation_idx on public.dm_calls(conversation_id,created_at desc);
alter table public.dm_calls enable row level security;
drop policy if exists "Call participants may view calls" on public.dm_calls;
create policy "Call participants may view calls" on public.dm_calls for select to authenticated using(auth.uid() in (caller_id,callee_id));
-- Writes are server-side only after checking membership, acceptance and blocks.
