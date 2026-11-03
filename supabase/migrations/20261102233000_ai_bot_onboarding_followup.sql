-- Send a second onboarding DM no earlier than five minutes after the welcome.
create table if not exists public.ai_bot_onboarding_followups (
 user_id uuid primary key references auth.users(id) on delete cascade,
 due_at timestamptz not null default (now()+interval '5 minutes'),
 delivered_at timestamptz
);
alter table public.ai_bot_onboarding_followups enable row level security;

create or replace function public.queue_ai_bot_onboarding_followup()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ai_bot_onboarding_followups(user_id,due_at)
 values(new.user_id,new.delivered_at+interval '5 minutes') on conflict do nothing;
 return new;
end $$;
revoke all on function public.queue_ai_bot_onboarding_followup() from public,anon,authenticated;
drop trigger if exists trg_queue_ai_bot_onboarding_followup on public.ai_bot_welcome_deliveries;
create trigger trg_queue_ai_bot_onboarding_followup after insert on public.ai_bot_welcome_deliveries
for each row execute function public.queue_ai_bot_onboarding_followup();

create or replace function public.deliver_ai_bot_onboarding_followups()
returns integer language plpgsql security definer set search_path='' as $$
declare r record; v_bot uuid; v_cid uuid; v_count integer:=0;
begin
 select p.id into v_bot from public.profiles p
 where lower(coalesce(p.username,'')) in ('1muslimaibot','1muslimai_bot') limit 1;
 if v_bot is null then return 0; end if;
 for r in select user_id from public.ai_bot_onboarding_followups
   where delivered_at is null and due_at<=clock_timestamp()
   order by due_at limit 100 for update skip locked loop
  if r.user_id=v_bot then continue; end if;
  select p.conversation_id into v_cid from public.dm_participants p
   join public.dm_participants q on q.conversation_id=p.conversation_id and q.user_id=r.user_id
   where p.user_id=v_bot and (select count(*) from public.dm_participants z where z.conversation_id=p.conversation_id)=2 limit 1;
  if v_cid is null then
   insert into public.dm_conversations(requested_by,request_status) values(v_bot,'accepted') returning id into v_cid;
   insert into public.dm_participants(conversation_id,user_id) values(v_cid,v_bot),(v_cid,r.user_id);
  end if;
  insert into public.dm_messages(conversation_id,sender_id,body) values(v_cid,v_bot,
  '🌟 Here are a few ways to get started on 1Muslim! 📖 Explore Qur’an Studio and read or listen to verses. 🔤 Practice Arabic in Lessons. 🎬 Discover posts and videos made by Muslims, for Muslims. 💬 Connect with the Ummah through Community and Messages. ✨ Earn XP as you learn, post, and spend active time here. Start with a Qur’an verse today, then try an Arabic lesson! Need anything? Reply here to reach 1Muslim Admin. Alhamdulillah! 💚');
  update public.ai_bot_onboarding_followups set delivered_at=clock_timestamp() where user_id=r.user_id;
  v_count:=v_count+1;
 end loop;
 return v_count;
end $$;
revoke all on function public.deliver_ai_bot_onboarding_followups() from public,anon,authenticated;
-- If pg_cron is available, schedule the worker every minute. Otherwise a scheduler must invoke the function.
do $$
begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  if not exists(select 1 from cron.job where jobname='1muslim-ai-onboarding-followup') then
   perform cron.schedule('1muslim-ai-onboarding-followup','* * * * *','select public.deliver_ai_bot_onboarding_followups()');
  end if;
 end if;
end $$;
