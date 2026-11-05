-- 1Qibla editorial staging contract checks. Run AFTER all qibla migrations
-- against an isolated database; never against production.
-- Read-only assertions: raises an exception on a missing security invariant.
DO $$
DECLARE t text; n integer;
BEGIN
 FOREACH t IN ARRAY ARRAY['qibla_staff','qibla_articles','qibla_article_revisions',
  'qibla_editorial_events','qibla_xp_awards','qibla_applications'] LOOP
  IF NOT EXISTS (
   SELECT 1 FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace
   WHERE s.nspname='public' AND c.relname=t AND c.relkind IN ('r','p')
     AND c.relrowsecurity
  ) THEN RAISE EXCEPTION 'Missing RLS: %',t; END IF;
 END LOOP;
 IF EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='public'
   AND tablename IN ('qibla_staff','qibla_article_revisions','qibla_editorial_events',
                    'qibla_xp_awards','qibla_applications')
   AND (roles @> ARRAY['anon']::name[] OR roles @> ARRAY['public']::name[])
 ) THEN RAISE EXCEPTION 'Unexpected public policy on private editorial table'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='qibla_articles' AND policyname='qibla_articles_published_anon'
   AND cmd='SELECT' AND roles @> ARRAY['anon']::name[]
   AND qual LIKE '%published_at%' AND qual LIKE '%published%'
 ) THEN RAISE EXCEPTION 'Published-only anon policy absent or changed'; END IF;
 IF EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='qibla_staff' AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
 ) THEN RAISE EXCEPTION 'Unexpected staff mutation policy'; END IF;
 IF EXISTS (
  SELECT 1 FROM (VALUES
   ('qibla_staff'),('qibla_articles'),('qibla_article_revisions'),
   ('qibla_editorial_events'),('qibla_xp_awards'),('qibla_applications')
  ) AS x(table_name)
  WHERE has_table_privilege('anon',format('public.%I',x.table_name),'INSERT,UPDATE,DELETE')
     OR has_table_privilege('authenticated',format('public.%I',x.table_name),'INSERT,UPDATE,DELETE')
 ) THEN RAISE EXCEPTION 'Direct client editorial table write grant exists'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id='qibla-resumes'
   AND public=false AND file_size_limit=10485760
 ) THEN RAISE EXCEPTION 'Private resume bucket or size limit missing'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='public' AND t.relname='qibla_xp_awards'
   AND c.contype='p'
 ) THEN RAISE EXCEPTION 'XP award primary key missing'; END IF;
 -- Resume cleanup is allowed only for the uploader's unclaimed object.
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND policyname='qibla_resume_delete_orphan_self' AND cmd='DELETE'
   AND roles @> ARRAY['authenticated']::name[]
   AND qual LIKE '%qibla-resumes%' AND qual LIKE '%auth.uid%'
   AND qual LIKE '%qibla_applications%' AND qual LIKE '%resume_path%'
 ) THEN RAISE EXCEPTION 'Orphan-only resume cleanup policy missing'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=ANY(i.indkey)
  WHERE n.nspname='public' AND t.relname='qibla_applications'
   AND i.indisunique AND i.indisvalid AND a.attname='resume_path'
   AND i.indnatts=1
 ) THEN RAISE EXCEPTION 'Unique application resume claim missing'; END IF;
 IF EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND cmd='DELETE' AND policyname LIKE 'qibla_resume%'
   AND policyname <> 'qibla_resume_delete_orphan_self'
 ) THEN RAISE EXCEPTION 'Unexpected additional Qibla resume deletion policy'; END IF;
 RAISE NOTICE 'Qibla static schema/RLS/grant contract checks passed (not role/concurrency tests)';
END $$;

-- Additional REQUIRED isolated integration tests (not covered by this script):
-- 1. anon published SELECT succeeds; draft/queued/rejected reads fail.
-- 2. writer cannot edit/approve; approver cannot perform first editor save.
-- 3. editor first valid save generates exactly one approver notification.
-- 4. repeat and concurrent publish award exactly 2000 XP once.
-- 5. applicant A cannot read applicant B resume; approver can.
-- 6. direct role/XP mutation attempts fail; normal Posts/comments unaffected.

-- Explicitly reject publicly readable resume objects even if bucket remains private.
-- A permissive object SELECT policy would bypass the intended applicant/staff boundary.
DO $$
BEGIN
 IF EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
    AND cmd IN ('SELECT','ALL')
    AND (roles @> ARRAY['anon']::name[] OR roles @> ARRAY['public']::name[])
    AND (qual IS NULL OR qual ILIKE '%qibla-resumes%')
 ) THEN
  RAISE EXCEPTION 'Potential anonymous resume object SELECT policy: review Storage RLS';
 END IF;
 IF has_table_privilege('anon','public.qibla_applications','SELECT') THEN
  RAISE EXCEPTION 'Anonymous applications table SELECT grant must be revoked';
 END IF;
 RAISE NOTICE 'Resume privacy negative grants/policies checked';
END $$;

-- Private editorial metadata must not be readable with anonymous table grants,
-- even if RLS policies currently appear restrictive. Keep public magazine reads
-- scoped to qibla_articles' published-only policy.
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY[
  'qibla_staff','qibla_article_revisions','qibla_editorial_events','qibla_xp_awards'
 ] LOOP
  IF has_table_privilege('anon',format('public.%I',t),'SELECT') THEN
   RAISE EXCEPTION 'Anonymous SELECT grant on private editorial table: %',t;
  END IF;
 END LOOP;
 IF NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='storage' AND c.relname='objects' AND c.relrowsecurity
 ) THEN RAISE EXCEPTION 'Storage objects RLS must remain enabled'; END IF;
 RAISE NOTICE 'Private editorial metadata grants and Storage RLS checked';
END $$;
