-- Private owner-controlled HudHud context, distinct from publicly visible
-- profiles, separate from optional full AI conversation transcripts.
create table if not exists public.hudhud_personal_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  about_me text not null default '' check(char_length(about_me)<=6000),
  answer_preferences text not null default '' check(char_length(answer_preferences)<=2000),
  notes jsonb not null default '[]'::jsonb
   check (jsonb_typeof(notes)='array' and jsonb_array_length(notes)<=50 and pg_column_size(notes)<=27000),
  allow_remember_requests boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.hudhud_personal_context enable row level security;
revoke all on public.hudhud_personal_context from public,anon;
grant select,insert,update,delete on public.hudhud_personal_context to authenticated;
do $policies$
begin
 if not exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='hudhud_personal_context'
   and policyname='HudHud personal context only belongs to signed-in owner'
 ) then
  create policy "HudHud personal context only belongs to signed-in owner"
   on public.hudhud_personal_context for all to authenticated
   using ((select auth.uid())=user_id)
   with check ((select auth.uid())=user_id);
 end if;
end $policies$;
comment on table public.hudhud_personal_context is
 'Optional HudHud owner-authored private context and explicit remember requests. Never store credentials, Shahada recordings, or private contacts.';
