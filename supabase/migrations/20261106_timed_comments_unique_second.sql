-- One timestamped comment per video second, allocated atomically.
create unique index if not exists featured_video_timed_one_per_second
  on public.featured_video_timed_comments(video_key, at_seconds);

create or replace function public.add_featured_video_timed_comment(
  p_video_key text, p_body text, p_started_at_seconds integer
) returns public.featured_video_timed_comments
language plpgsql security invoker set search_path = public
as $$
declare
  v_second integer;
  v_result public.featured_video_timed_comments;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(trim(p_body)) not between 1 and 180 then raise exception 'Comment must be 1–180 characters'; end if;
  if length(p_video_key) not between 3 and 120 then raise exception 'Invalid video key'; end if;
  v_second := greatest(0, least(86400, p_started_at_seconds));
  loop
    if v_second > 86400 then raise exception 'No available timestamp'; end if;
    insert into public.featured_video_timed_comments(video_key,user_id,body,at_seconds)
    values (p_video_key,auth.uid(),trim(p_body),v_second)
    on conflict (video_key,at_seconds) do nothing returning * into v_result;
    if found then return v_result; end if;
    v_second := v_second+1;
  end loop;
end;
$$;
revoke all on function public.add_featured_video_timed_comment(text,text,integer) from public;
grant execute on function public.add_featured_video_timed_comment(text,text,integer) to authenticated;
