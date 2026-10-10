-- Tajweed practice attempts. Scores must come from a trusted server-side evaluator.
create table if not exists public.tajweed_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 surah_number smallint not null check (surah_number between 1 and 114),
 ayah_number smallint not null check (ayah_number > 0),
 recording_path text,
 reference_reciter text,
 evaluation_status text not null default 'pending' check (evaluation_status in ('pending','evaluated','failed')),
 match_score numeric(5,2) check (match_score between 0 and 100),
 tajweed_score numeric(5,2) check (tajweed_score between 0 and 100),
 result text check (result in ('close','needs_practice')),
 feedback jsonb,
 created_at timestamptz not null default now(),
 evaluated_at timestamptz,
 constraint evaluated_has_result check (evaluation_status <> 'evaluated' or (match_score is not null and tajweed_score is not null and result is not null))
);
create index if not exists tajweed_attempts_member_verse on public.tajweed_attempts(user_id,surah_number,ayah_number,created_at desc);
create index if not exists tajweed_attempts_verse on public.tajweed_attempts(surah_number,ayah_number);
alter table public.tajweed_attempts enable row level security;
revoke all on public.tajweed_attempts from anon,authenticated;
grant select on public.tajweed_attempts to authenticated;
create policy "Read own tajweed attempts" on public.tajweed_attempts for select to authenticated using (auth.uid()=user_id);
create or replace view public.tajweed_verse_totals with (security_invoker=true) as
select surah_number,ayah_number,count(*)::bigint as total_attempts,count(distinct user_id)::bigint as total_practitioners,
count(*) filter (where result='close')::bigint as close_attempts
from public.tajweed_attempts group by surah_number,ayah_number;
-- Aggregate access should be exposed through a controlled RPC after privacy review.
