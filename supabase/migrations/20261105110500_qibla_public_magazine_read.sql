-- Public magazine access: only published 1Qibla articles are visible to guests.
-- This migration does not alter ordinary Posts/comments or any editorial write RPC.
-- Authenticated users retain their existing author/editor/approver read policy.
drop policy if exists qibla_articles_published_anon on public.qibla_articles;
create policy qibla_articles_published_anon
on public.qibla_articles
for select to anon
using (status = 'published' and published_at is not null);

-- Restrict anonymous access to the published article table alone.
-- Row-level security continues to filter drafts, submitted, review, and rejected content.
grant select on table public.qibla_articles to anon;

-- No guest SELECT grants for editorial revisions, events, XP awards, staff,
-- applications, or private resume storage. Their existing RLS stays enabled.
