create table if not exists public.guest_pass_requests (
 id uuid primary key default gen_random_uuid(),
 email text not null check (length(email) between 5 and 254),
 answers jsonb not null default '[]'::jsonb,
 consent_follow_up boolean not null default false,
 requested_at timestamptz not null default now(),
 follow_up_at timestamptz not null default (now() + interval '30 days'),
 status text not null default 'pending' check(status in ('pending','approved','declined','closed'))
);
alter table public.guest_pass_requests enable row level security;
drop policy if exists "Guests may submit pass requests" on public.guest_pass_requests;
create policy "Guests may submit pass requests" on public.guest_pass_requests for insert to anon,authenticated with check (consent_follow_up = true and status='pending' and follow_up_at >= now() + interval '29 days');
grant insert on public.guest_pass_requests to anon,authenticated;
-- No public select/update/delete policy: guest request details are private.
create index if not exists guest_pass_requests_follow_up_idx on public.guest_pass_requests(follow_up_at) where status='pending';
