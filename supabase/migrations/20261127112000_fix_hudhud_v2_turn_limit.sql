-- The HudHud v2 API has a 50-turn allowance, but the legacy table check
-- still capped turns_used at 3. On the fourth request the reserve RPC raised
-- PostgreSQL 23514 and the interface showed a generic 503. Match the v2 RPC.
alter table public.discover_hudhud_usage
 drop constraint if exists discover_hudhud_usage_turns_used_check;
alter table public.discover_hudhud_usage
 add constraint discover_hudhud_usage_turns_used_check
 check (turns_used >= 0 and turns_used <= 50);
