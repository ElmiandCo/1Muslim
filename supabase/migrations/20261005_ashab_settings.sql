-- OneMuslim: Ashab, Arabic term preference, and self-service account deletion
alter table public.profiles
  add column if not exists arabic_terms_enabled boolean not null default false;

create table if not exists public.ashab_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index if not exists ashab_friendships_pair_idx
  on public.ashab_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists ashab_friendships_requester_idx on public.ashab_friendships(requester_id, status);
create index if not exists ashab_friendships_addressee_idx on public.ashab_friendships(addressee_id, status);

alter table public.ashab_friendships enable row level security;

drop policy if exists "Ashab participants can read their friendships" on public.ashab_friendships;
create policy "Ashab participants can read their friendships" on public.ashab_friendships
  for select to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

drop policy if exists "Users can send Ashab requests" on public.ashab_friendships;
create policy "Users can send Ashab requests" on public.ashab_friendships
  for insert to authenticated
  with check ((select auth.uid()) = requester_id and requester_id <> addressee_id and status = 'pending');

drop policy if exists "Addressees can respond to Ashab requests" on public.ashab_friendships;
create policy "Addressees can respond to Ashab requests" on public.ashab_friendships
  for update to authenticated
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status in ('accepted','declined'));

drop policy if exists "Requesters can cancel Ashab requests" on public.ashab_friendships;
create policy "Requesters can cancel Ashab requests" on public.ashab_friendships
  for delete to authenticated
  using ((select auth.uid()) = requester_id);

create or replace function public.enforce_ashab_limit()
returns trigger
language plpgsql
as $$
declare
  accepted_count integer;
begin
  if new.status <> 'accepted' then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(least(new.requester_id::text, new.addressee_id::text), 0));

  select count(*) into accepted_count from public.ashab_friendships
  where status = 'accepted' and (requester_id = new.requester_id or addressee_id = new.requester_id);
  if accepted_count >= 5 then raise exception 'Ashab limit reached: each member can have up to 5 Ashab friends.'; end if;

  select count(*) into accepted_count from public.ashab_friendships
  where status = 'accepted' and (requester_id = new.addressee_id or addressee_id = new.addressee_id);
  if accepted_count >= 5 then raise exception 'Ashab limit reached: each member can have up to 5 Ashab friends.'; end if;

  return new;
end;
$$;

drop trigger if exists enforce_ashab_limit_trigger on public.ashab_friendships;
create trigger enforce_ashab_limit_trigger
before insert or update of status on public.ashab_friendships
for each row execute function public.enforce_ashab_limit();

revoke all on function public.enforce_ashab_limit() from public, anon, authenticated;

alter table public.communities alter column creator_id drop not null;
alter table public.communities drop constraint if exists communities_creator_id_fkey;
alter table public.communities add constraint communities_creator_id_fkey
  foreign key (creator_id) references public.profiles(id) on delete set null;

alter table public.lesson_videos alter column uploaded_by drop not null;
alter table public.lesson_videos drop constraint if exists lesson_videos_uploaded_by_fkey;
alter table public.lesson_videos add constraint lesson_videos_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users(id) on delete set null;

alter table public.admin_videos alter column created_by drop not null;
alter table public.admin_videos drop constraint if exists admin_videos_created_by_fkey;
alter table public.admin_videos add constraint admin_videos_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

drop function if exists public.delete_my_account();
create function public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  update public.communities set creator_id = null where creator_id = uid;
  update public.lesson_videos set uploaded_by = null where uploaded_by = uid;
  update public.admin_videos set created_by = null where created_by = uid;
  delete from auth.users where id = uid;
  return true;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
