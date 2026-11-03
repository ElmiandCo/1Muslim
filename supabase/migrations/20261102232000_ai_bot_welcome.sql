-- Welcome new members from the official 1MuslimAi Bot account.
-- Resolve the bot by its unique profile username; do not guess its email.
create table if not exists public.ai_bot_welcome_deliveries (
 user_id uuid primary key references auth.users(id) on delete cascade,
 delivered_at timestamptz not null default now()
);
alter table public.ai_bot_welcome_deliveries enable row level security;

create or replace function public.send_new_member_welcome()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_bot uuid; v_cid uuid;
begin
 select p.id into v_bot from public.profiles p
 where lower(coalesce(p.username,'')) in ('1muslimaibot','1muslimai_bot') limit 1;
 if v_bot is null or v_bot=new.id then return new; end if;
 insert into public.ai_bot_welcome_deliveries(user_id) values(new.id) on conflict do nothing;
 if not found then return new; end if;
 insert into public.dm_conversations(requested_by,request_status) values(v_bot,'accepted') returning id into v_cid;
 insert into public.dm_participants(conversation_id,user_id) values(v_cid,v_bot),(v_cid,new.id);
 insert into public.dm_messages(conversation_id,sender_id,body)
 values(v_cid,v_bot,'Assalamu alaikum! 👋 Welcome to 1Muslim—a growing community built by Muslims, for Muslims. Our community is growing, and the worldwide Muslim Ummah is nearly 2 billion strong! 🌍 Read the Qur’an, learn Arabic, and enjoy content made by Muslims, for Muslims. Invite your friends and family to join us! Need help? Reply here to reach 1Muslim Admin for a quick response, inshaAllah. Alhamdulillah! 💚');
 return new;
end $$;
revoke all on function public.send_new_member_welcome() from public,anon,authenticated;
drop trigger if exists trg_1muslim_new_member_welcome on public.profiles;
create trigger trg_1muslim_new_member_welcome after insert on public.profiles
for each row execute function public.send_new_member_welcome();
