-- Connection badge is derived from the existence of a row, not a permanent award.
create table if not exists public.tiktok_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  open_id text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now()
);
alter table public.tiktok_connections enable row level security;
revoke all on public.tiktok_connections from anon, authenticated;
grant select (user_id, connected_at) on public.tiktok_connections to authenticated;
create policy "Members can view own TikTok status" on public.tiktok_connections
  for select to authenticated using (auth.uid() = user_id);
-- OAuth callback writes require a service-role server client. No client-side writes to tokens.
