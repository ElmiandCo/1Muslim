create table if not exists public.live_feature_submissions(
 id uuid primary key default gen_random_uuid(),
 recording_id uuid not null references public.live_recordings(id) on delete cascade,
 host_id uuid not null references auth.users(id) on delete cascade,
 note text not null default '',
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 unique(recording_id)
);
create index if not exists live_feature_submissions_status_idx on public.live_feature_submissions(status,submitted_at);
alter table public.live_feature_submissions enable row level security;
drop policy if exists "Hosts view own feature submissions" on public.live_feature_submissions;
create policy "Hosts view own feature submissions" on public.live_feature_submissions for select to authenticated using(host_id=auth.uid());
-- Only the verified server endpoint may insert; admins must review before homepage publication.
