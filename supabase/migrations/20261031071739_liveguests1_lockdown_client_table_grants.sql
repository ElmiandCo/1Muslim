-- LiveGuests1.0: client roles must not retain Supabase default TRUNCATE/TRIGGER grants.
-- PostgreSQL TRUNCATE bypasses row-level security; only trusted server roles
-- may use administrative operations. This migration is additive/idempotent.
-- Applied to SecureApp on 2026-10-31 as Supabase migration
-- liveguests1_lockdown_client_table_grants (generated DB version differs from filename).
revoke all privileges on table public.live_guest_requests from anon;
revoke all privileges on table public.live_guest_requests from authenticated;
grant select, insert on table public.live_guest_requests to authenticated;
alter table public.live_guest_requests enable row level security;
