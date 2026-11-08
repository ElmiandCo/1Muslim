drop function if exists public.qibla_search_registered_members(text);
create or replace function public.qibla_search_registered_members(p_query text)
returns table(user_id uuid,display_name text,email text,role text,avatar_url text)
language plpgsql stable security definer set search_path=public as $$
begin
 if not public.qibla_has_role(array['admin']) then raise exception 'Editorial admin permission required'; end if;
 if length(trim(coalesce(p_query,'')))<3 then return; end if;
 return query select u.id,
 coalesce(nullif(p.display_name,''),nullif(u.raw_user_meta_data->>'display_name',''),nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1))::text,
 u.email::text,coalesce(s.role,'')::text,
 coalesce(nullif(p.avatar_url,''),nullif(u.raw_user_meta_data->>'avatar_url',''))::text
 from auth.users u left join public.qibla_staff s on s.user_id=u.id
 left join public.profiles p on p.id=u.id
 where u.email_confirmed_at is not null and u.email is not null
 and (u.email ilike '%'||trim(p_query)||'%' or
 coalesce(p.display_name,u.raw_user_meta_data->>'display_name','') ilike '%'||trim(p_query)||'%')
 order by case when lower(u.email)=lower(trim(p_query)) then 0 else 1 end,u.email limit 12;
end $$;
revoke all on function public.qibla_search_registered_members(text) from public;
grant execute on function public.qibla_search_registered_members(text) to authenticated;