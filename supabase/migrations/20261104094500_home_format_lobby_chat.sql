create table if not exists public.home_format_chat_messages (
 id uuid primary key default gen_random_uuid(),
 format text not null check(format in ('desktop','phone','audio')),
 sender_id uuid not null references auth.users(id) on delete cascade,
 stream_id uuid references public.live_streams(id) on delete set null,
 body text not null check(char_length(trim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists home_format_chat_messages_recent on public.home_format_chat_messages(format,created_at desc);
alter table public.home_format_chat_messages enable row level security;
drop policy if exists "Read public format lobby" on public.home_format_chat_messages;
create policy "Read public format lobby" on public.home_format_chat_messages for select to anon,authenticated using(created_at>now()-interval '6 hours');
drop policy if exists "Post to format lobby" on public.home_format_chat_messages;
create policy "Post to format lobby" on public.home_format_chat_messages for insert to authenticated with check(sender_id=(select auth.uid()) and created_at>now()-interval '6 hours');
do $$ begin alter publication supabase_realtime add table public.home_format_chat_messages; exception when duplicate_object then null; end $$;
-- The six-hour cutoff is enforced by SELECT RLS even if scheduled cleanup is unavailable.
-- Optional physical cleanup when pg_cron is installed.
do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  perform cron.schedule('expire-home-format-chat','*/15 * * * *',$job$delete from public.home_format_chat_messages where created_at<now()-interval '6 hours'$job$);
 end if;
exception when others then null; end $$;