-- Milestone delivery happens on the database XP balance update, regardless of award source.
create table if not exists public.xp_level_deliveries (
 user_id uuid not null references auth.users(id) on delete cascade,
 level integer not null check(level between 2 and 10),
 created_at timestamptz not null default now(),
 primary key(user_id,level)
);
alter table public.xp_level_deliveries enable row level security;

create or replace function public.deliver_xp_level_up()
returns trigger language plpgsql security definer set search_path='' as $$
declare
 v_old_level integer;
 v_new_level integer;
 v_level integer;
 v_sender uuid;
 v_conversation uuid;
 v_message text;
begin
 if new.xp_total is null or new.xp_total<=coalesce(old.xp_total,0) then return new; end if;
 select case when coalesce(old.xp_total,0)<=1500 then 1 when old.xp_total<=5000 then 2 when old.xp_total<=10000 then 3 when old.xp_total<=20000 then 4 when old.xp_total<=50000 then 5 when old.xp_total<=100000 then 6 when old.xp_total<=200000 then 7 when old.xp_total<=500000 then 8 when old.xp_total<=750000 then 9 else 10 end into v_old_level;
 select case when new.xp_total<=1500 then 1 when new.xp_total<=5000 then 2 when new.xp_total<=10000 then 3 when new.xp_total<=20000 then 4 when new.xp_total<=50000 then 5 when new.xp_total<=100000 then 6 when new.xp_total<=200000 then 7 when new.xp_total<=500000 then 8 when new.xp_total<=750000 then 9 else 10 end into v_new_level;
 if v_new_level<=v_old_level then return new; end if;
 -- The verified HudHud by Elmi account is the sender, never an arbitrary member.
 select id into v_sender from auth.users where lower(email)='hudhudbyelmi@gmail.com' limit 1;
 for v_level in v_old_level+1..v_new_level loop
  insert into public.xp_level_deliveries(user_id,level) values(new.id,v_level) on conflict do nothing;
  if not found then continue; end if;
  v_message:='🌟 Congratulations on reaching Level '||v_level||'! Your journey in 1Muslim continues to grow. Keep learning, connecting with the Ummah, and earning XP. May Allah bless your efforts! — HudHud by Elmi';
  if not exists(select 1 from public.notification_preferences where user_id=new.id and in_app_enabled=false) then
   insert into public.notifications(recipient_id,actor_id,type,title,body,entity_type,entity_id)
   values(new.id,v_sender,'xp_level_up','🏆 Level '||v_level||' unlocked!','Congratulations! You reached Level '||v_level||'.','xp_level',v_level::text);
  end if;
  if v_sender is not null and v_sender<>new.id then
   select p.conversation_id into v_conversation from public.dm_participants p
   join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id=new.id
   where p.user_id=v_sender and (select count(*) from public.dm_participants z where z.conversation_id=p.conversation_id)=2 limit 1;
   if v_conversation is null then
    insert into public.dm_conversations(requested_by,request_status) values(v_sender,'accepted') returning id into v_conversation;
    insert into public.dm_participants(conversation_id,user_id) values(v_conversation,v_sender),(v_conversation,new.id);
   end if;
   insert into public.dm_messages(conversation_id,sender_id,body) values(v_conversation,v_sender,v_message);
  end if;
 end loop;
 return new;
end $$;
revoke all on function public.deliver_xp_level_up() from public,anon,authenticated;
drop trigger if exists trg_xp_level_up_delivery on public.profiles;
create trigger trg_xp_level_up_delivery after update of xp_total on public.profiles
for each row execute function public.deliver_xp_level_up();
