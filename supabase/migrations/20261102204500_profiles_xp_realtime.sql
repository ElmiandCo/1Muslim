-- Enable profile XP broadcasts across signed-in devices.
-- Requires existing profiles RLS to restrict visibility appropriately.
do $$
begin
 if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
  create publication supabase_realtime;
 end if;
 if not exists (
  select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='profiles'
 ) then
  alter publication supabase_realtime add table public.profiles;
 end if;
end $$;
