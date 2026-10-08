-- Unified notification preferences and instant direct-message notifications.
-- Review against the selected Supabase project before applying.
create table if not exists public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 in_app_enabled boolean not null default true,
 email_messages boolean not null default true,
 email_replies boolean not null default true,
 email_comments boolean not null default true,
 email_xp boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "Members read own notification preferences" on public.notification_preferences;
create policy "Members read own notification preferences" on public.notification_preferences for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Members insert own notification preferences" on public.notification_preferences;
create policy "Members insert own notification preferences" on public.notification_preferences for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Members update own notification preferences" on public.notification_preferences;
create policy "Members update own notification preferences" on public.notification_preferences for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

create or replace function public.notify_new_dm_message()
returns trigger language plpgsql security definer set search_path=public as $$
declare peer uuid;
begin
 for peer in select user_id from public.dm_participants where conversation_id=new.conversation_id and user_id<>new.sender_id loop
  if not exists(select 1 from public.notification_preferences where user_id=peer and in_app_enabled=false) then
   insert into public.notifications(recipient_id,type,title,body,entity_type,entity_id)
   values(peer,case when new.reply_to_id is null then 'dm_message' else 'dm_reply' end,
     case when new.reply_to_id is null then 'New private message' else 'Someone replied to your message' end,
     left(new.body,160),'dm_message',new.id::text);
  end if;
 end loop;
 return new;
end;
$$;
-- Replaces the narrower DM reply trigger to avoid double alerts.
drop trigger if exists notify_dm_reply_insert on public.dm_messages;
drop trigger if exists notify_new_dm_message_insert on public.dm_messages;
create trigger notify_new_dm_message_insert after insert on public.dm_messages for each row execute function public.notify_new_dm_message();

-- Trusted server-side XP award logic can call this once a new tier is confirmed.
create or replace function public.notify_xp_tier_awarded(p_user uuid,p_tier text,p_xp integer)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 if not exists(select 1 from public.notification_preferences where user_id=p_user and in_app_enabled=false) then
  insert into public.notifications(recipient_id,type,title,body,entity_type,entity_id)
  values(p_user,'xp_tier','New XP tier unlocked!','You reached '||p_tier||' at '||p_xp||' XP.','xp_tier',p_tier);
 end if;
end;
$$;
revoke all on function public.notify_xp_tier_awarded(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.notify_xp_tier_awarded(uuid,text,integer) to service_role;
