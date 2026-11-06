-- Preserve one comment per video second; keep historical comments by moving collisions.
-- Allocation order: +1,+2,+3,-1,-2,-3,+4,+5,+6,-4,-5,-6,...
-- A unique index and ON CONFLICT make concurrent submissions safe.
do $$
declare
  item record;
  candidate integer;
  radius integer;
  offset_in_group integer;
  direction integer;
  allocated boolean;
begin
  for item in
    select id, video_key, at_seconds from (
      select id, video_key, at_seconds,
        row_number() over(partition by video_key,at_seconds order by created_at,id) as ordinal
      from public.featured_video_timed_comments
    ) ranked where ordinal > 1 order by video_key,at_seconds,id
  loop
    allocated := false;
    for radius in 0..28800 loop
      for direction in 0..1 loop
        for offset_in_group in 1..3 loop
          candidate := item.at_seconds + (case when direction=0 then 1 else -1 end)*(radius*3+offset_in_group);
          if candidate between 0 and 86400 and not exists (
            select 1 from public.featured_video_timed_comments
            where video_key=item.video_key and at_seconds=candidate
          ) then
            update public.featured_video_timed_comments set at_seconds=candidate where id=item.id;
            allocated := true;
            exit;
          end if;
        end loop;
        exit when allocated;
      end loop;
      exit when allocated;
    end loop;
    if not allocated then raise exception 'No available timestamp for video %',item.video_key; end if;
  end loop;
end $$;

create unique index if not exists featured_video_timed_one_per_second
  on public.featured_video_timed_comments(video_key,at_seconds);

create or replace function public.add_featured_video_timed_comment(
  p_video_key text, p_body text, p_started_at_seconds integer
) returns public.featured_video_timed_comments
language plpgsql security invoker set search_path = public
as $$
declare
  v_second integer;
  v_radius integer;
  v_direction integer;
  v_offset integer;
  v_result public.featured_video_timed_comments;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(trim(p_body)) not between 1 and 180 then raise exception 'Comment must be 1–180 characters'; end if;
  if p_video_key is null or length(p_video_key) not between 3 and 120 then raise exception 'Invalid video key'; end if;
  if p_started_at_seconds is null then raise exception 'Timestamp required'; end if;
  v_second:=greatest(0,least(86400,p_started_at_seconds));
  insert into public.featured_video_timed_comments(video_key,user_id,body,at_seconds)
  values(p_video_key,auth.uid(),trim(p_body),v_second)
  on conflict(video_key,at_seconds) do nothing returning * into v_result;
  if found then return v_result; end if;
  for v_radius in 0..28800 loop
    for v_direction in 0..1 loop
      for v_offset in 1..3 loop
        v_second:=greatest(0,least(86400,p_started_at_seconds))
          +(case when v_direction=0 then 1 else -1 end)*(v_radius*3+v_offset);
        if v_second not between 0 and 86400 then continue; end if;
        insert into public.featured_video_timed_comments(video_key,user_id,body,at_seconds)
        values(p_video_key,auth.uid(),trim(p_body),v_second)
        on conflict(video_key,at_seconds) do nothing returning * into v_result;
        if found then return v_result; end if;
      end loop;
    end loop;
  end loop;
  raise exception 'No available timestamp for this video';
end;
$$;
revoke all on function public.add_featured_video_timed_comment(text,text,integer) from public;
grant execute on function public.add_featured_video_timed_comment(text,text,integer) to authenticated;
