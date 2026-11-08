create or replace function public.qibla_editorial_team_directory()
returns table(user_id uuid,display_name text,email text,role text,assigned_at timestamptz,last_article text,last_article_at timestamptz,article_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Editorial admin permission required'; end if;
 return query
 with members as (
  select s.user_id,s.role,s.assigned_at from public.qibla_staff s
  union all
  select u.id,'superadmin'::text,null::timestamptz from auth.users u
  where lower(u.email)='hudhudbyelmi@gmail.com' and u.email_confirmed_at is not null
  and not exists(select 1 from public.qibla_staff s where s.user_id=u.id)
 )
 select m.user_id,coalesce(nullif(u.raw_user_meta_data->>'display_name',''),nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1))::text,
 coalesce(u.email,'')::text,m.role,m.assigned_at,
 (select q.title from public.qibla_submissions q where q.author_id=m.user_id order by q.updated_at desc limit 1),
 (select q.updated_at from public.qibla_submissions q where q.author_id=m.user_id order by q.updated_at desc limit 1),
 (select count(*) from public.qibla_submissions q where q.author_id=m.user_id)
 from members m join auth.users u on u.id=m.user_id order by case when m.role='superadmin' then 0 else 1 end,m.assigned_at desc nulls first;
end $$;
revoke all on function public.qibla_editorial_team_directory() from public;
grant execute on function public.qibla_editorial_team_directory() to authenticated;