-- Group rooms and scheduled private calls. Apply manually after review.
create table if not exists public.dm_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 2 and 80),
 description text not null default '',
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.dm_group_members (
 group_id uuid not null references public.dm_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('owner','admin','moderator','member')),
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table if not exists public.dm_group_messages (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.dm_groups(id) on delete cascade,
 sender_id uuid not null references auth.users(id),
 body text not null check(char_length(body) between 1 and 4000),
 created_at timestamptz not null default now()
);
create table if not exists public.dm_group_calls (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.dm_groups(id) on delete cascade,
 creator_id uuid not null references auth.users(id),
 title text not null check(char_length(title) between 2 and 120),
 mode text not null default 'video' check(mode in ('audio','video')),
 starts_at timestamptz not null,
 duration_minutes int not null default 30 check(duration_minutes between 5 and 240),
 created_at timestamptz not null default now()
);
create index if not exists dm_group_messages_order on public.dm_group_messages(group_id,created_at desc);
create index if not exists dm_group_calls_schedule on public.dm_group_calls(group_id,starts_at);
alter table public.dm_groups enable row level security;
alter table public.dm_group_members enable row level security;
alter table public.dm_group_messages enable row level security;
alter table public.dm_group_calls enable row level security;
-- Security-definer helpers avoid recursive member RLS.
create or replace function public.dm_group_role(g uuid, u uuid default auth.uid())
returns text language sql stable security definer set search_path=public as $$
 select role from public.dm_group_members where group_id=g and user_id=u limit 1
$$;
revoke all on function public.dm_group_role(uuid,uuid) from public;
grant execute on function public.dm_group_role(uuid,uuid) to authenticated;
create policy "members read groups" on public.dm_groups for select to authenticated using (public.dm_group_role(id) is not null);
create policy "members read roster" on public.dm_group_members for select to authenticated using (public.dm_group_role(group_id) is not null);
create policy "members read messages" on public.dm_group_messages for select to authenticated using (public.dm_group_role(group_id) is not null);
create policy "members send messages" on public.dm_group_messages for insert to authenticated with check (sender_id=auth.uid() and public.dm_group_role(group_id) is not null);
create policy "members read scheduled calls" on public.dm_group_calls for select to authenticated using (public.dm_group_role(group_id) is not null);
create policy "organizers schedule calls" on public.dm_group_calls for insert to authenticated with check (creator_id=auth.uid() and public.dm_group_role(group_id) in ('owner','admin','moderator') and starts_at>now());
create policy "organizers change scheduled calls" on public.dm_group_calls for update to authenticated using (public.dm_group_role(group_id) in ('owner','admin','moderator')) with check (public.dm_group_role(group_id) in ('owner','admin','moderator'));
create policy "organizers cancel scheduled calls" on public.dm_group_calls for delete to authenticated using (public.dm_group_role(group_id) in ('owner','admin','moderator'));
create or replace function public.dm_create_group(group_name text, selected_users uuid[], group_description text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare gid uuid; unique_users uuid[]; n int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(trim(group_name)) not between 2 and 80 then raise exception 'Group name must be 2–80 characters'; end if;
 select coalesce(array_agg(distinct x),array[]::uuid[]) into unique_users from unnest(selected_users) x where x<>auth.uid();
 n:=coalesce(array_length(unique_users,1),0);
 if n<1 or n>49 then raise exception 'Choose 1–49 other members'; end if;
 if (select count(*) from public.profiles where id=any(unique_users))<>n then raise exception 'One or more users are unavailable'; end if;
 insert into public.dm_groups(name,description,owner_id) values(trim(group_name),left(coalesce(group_description,''),500),auth.uid()) returning id into gid;
 insert into public.dm_group_members(group_id,user_id,role) values(gid,auth.uid(),'owner');
 insert into public.dm_group_members(group_id,user_id,role) select gid,x,'member' from unnest(unique_users) x;
 return gid;
end $$;
revoke all on function public.dm_create_group(text,uuid[],text) from public;
grant execute on function public.dm_create_group(text,uuid[],text) to authenticated;
create or replace function public.dm_set_group_role(g uuid, target uuid, new_role text)
returns void language plpgsql security definer set search_path=public as $$
declare acting text; current_role text;
begin
 acting:=public.dm_group_role(g,auth.uid());
 select role into current_role from public.dm_group_members where group_id=g and user_id=target;
 if current_role is null then raise exception 'Not a group member'; end if;
 if target=auth.uid() or current_role='owner' or new_role not in ('admin','moderator','member') then raise exception 'Role change not allowed'; end if;
 if acting<>'owner' and not (acting='admin' and current_role in ('moderator','member') and new_role in ('moderator','member')) then raise exception 'Insufficient permission'; end if;
 update public.dm_group_members set role=new_role where group_id=g and user_id=target;
end $$;
revoke all on function public.dm_set_group_role(uuid,uuid,text) from public;
grant execute on function public.dm_set_group_role(uuid,uuid,text) to authenticated;
create or replace function public.dm_remove_group_member(g uuid,target uuid)
returns void language plpgsql security definer set search_path=public as $$
declare acting text; target_role text;
begin
 acting:=public.dm_group_role(g,auth.uid());target_role:=public.dm_group_role(g,target);
 if target_role is null then raise exception 'Not a group member'; end if;
 if target_role='owner' then raise exception 'Owner cannot be removed'; end if;
 if target<>auth.uid() and not (acting='owner' or (acting='admin' and target_role in ('member','moderator')) or (acting='moderator' and target_role='member')) then raise exception 'Insufficient permission'; end if;
 delete from public.dm_group_members where group_id=g and user_id=target;
end $$;
revoke all on function public.dm_remove_group_member(uuid,uuid) from public;
grant execute on function public.dm_remove_group_member(uuid,uuid) to authenticated;
