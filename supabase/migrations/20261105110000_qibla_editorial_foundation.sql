-- 1Qibla editorial foundation. Apply only after review; never expose service-role credentials.
create table if not exists public.qibla_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('writer','editor','approver')),
 granted_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.qibla_articles (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 editor_id uuid references auth.users(id),
 title text not null default '',
 subtitle text not null default '',
 body text not null default '',
 template text not null default 'classic' check(template in ('classic','feature')),
 status text not null default 'draft' check(status in ('draft','submitted','editing','awaiting_approval','published','rejected')),
 revision integer not null default 1,
 first_editor_save_at timestamptz,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.qibla_article_revisions (
 id bigint generated always as identity primary key,
 article_id uuid not null references public.qibla_articles(id) on delete cascade,
 editor_id uuid not null references auth.users(id),
 revision integer not null,
 title text not null, subtitle text not null, body text not null,
 saved_at timestamptz not null default now(),
 unique(article_id,revision)
);
create table if not exists public.qibla_editorial_events (
 article_id uuid not null references public.qibla_articles(id) on delete cascade,
 event_key text not null,
 created_at timestamptz not null default now(),
 primary key(article_id,event_key)
);
create table if not exists public.qibla_xp_awards (
 article_id uuid primary key references public.qibla_articles(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 amount integer not null default 2000 check(amount=2000),
 created_at timestamptz not null default now()
);
create table if not exists public.qibla_applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references auth.users(id),
 desired_role text not null check(desired_role in ('writer','editor','approver')),
 experience text not null default '',
 motivation text not null default '',
 portfolio_url text,
 resume_path text not null,
 status text not null default 'pending' check(status in ('pending','reviewing','accepted','declined')),
 created_at timestamptz not null default now()
);
create index if not exists qibla_articles_status_idx on public.qibla_articles(status,updated_at desc);
create index if not exists qibla_applications_user_idx on public.qibla_applications(applicant_id);
alter table public.qibla_staff enable row level security;
alter table public.qibla_articles enable row level security;
alter table public.qibla_article_revisions enable row level security;
alter table public.qibla_editorial_events enable row level security;
alter table public.qibla_xp_awards enable row level security;
alter table public.qibla_applications enable row level security;
-- Read-only policies. All mutations go through privileged, role-checked RPCs.
create policy qibla_staff_self on public.qibla_staff for select to authenticated using(user_id=auth.uid());
create policy qibla_articles_read on public.qibla_articles for select to authenticated
 using(status='published' or author_id=auth.uid() or exists(select 1 from public.qibla_staff s where s.user_id=auth.uid() and s.role in ('editor','approver')));
create policy qibla_revisions_read on public.qibla_article_revisions for select to authenticated
 using(exists(select 1 from public.qibla_articles a where a.id=article_id and (a.author_id=auth.uid() or exists(select 1 from public.qibla_staff s where s.user_id=auth.uid() and s.role in ('editor','approver')))));
create policy qibla_applications_self on public.qibla_applications for select to authenticated
 using(applicant_id=auth.uid() or exists(select 1 from public.qibla_staff s where s.user_id=auth.uid() and s.role='approver'));
-- No INSERT/UPDATE/DELETE policies: authenticated clients cannot self-assign roles, publish, or award XP.
create or replace function public.qibla_save_editor_revision(p_article_id uuid,p_title text,p_subtitle text,p_body text)
returns integer language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_revision integer; v_first boolean;
begin
 if v_actor is null or not exists(select 1 from public.qibla_staff where user_id=v_actor and role in ('editor','approver')) then raise exception 'Not authorized'; end if;
 perform 1 from public.qibla_articles where id=p_article_id and status in ('submitted','editing','awaiting_approval') for update;
 if not found then raise exception 'Article not editable'; end if;
 update public.qibla_articles
 set title=left(p_title,250),subtitle=left(p_subtitle,500),body=p_body,
 editor_id=v_actor,revision=revision+1,status='awaiting_approval',updated_at=now(),
 first_editor_save_at=coalesce(first_editor_save_at,now())
 where id=p_article_id returning revision,(first_editor_save_at is not null) into v_revision,v_first;
 insert into public.qibla_article_revisions(article_id,editor_id,revision,title,subtitle,body)
 values(p_article_id,v_actor,v_revision,left(p_title,250),left(p_subtitle,500),p_body);
 -- Exactly one event per article, regardless of repeated saves or concurrent requests.
 insert into public.qibla_editorial_events(article_id,event_key) values(p_article_id,'first_editor_save')
 on conflict do nothing;
 return v_revision;
end $$;
create or replace function public.qibla_publish_article(p_article_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_author uuid; v_inserted integer;
begin
 if v_actor is null or not exists(select 1 from public.qibla_staff where user_id=v_actor and role='approver') then raise exception 'Not authorized'; end if;
 select author_id into v_author from public.qibla_articles where id=p_article_id and status in ('awaiting_approval','published') for update;
 if not found then raise exception 'Article is not ready for approval'; end if;
 update public.qibla_articles set status='published',published_at=coalesce(published_at,now()),updated_at=now() where id=p_article_id;
 insert into public.qibla_xp_awards(article_id,user_id) values(p_article_id,v_author) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=1 then
  update public.profiles set xp_total=coalesce(xp_total,0)+2000 where id=v_author;
  if not found then raise exception 'Author profile not found'; end if;
 end if;
 return v_inserted=1;
end $$;
revoke all on function public.qibla_save_editor_revision(uuid,text,text,text) from public,anon;
revoke all on function public.qibla_publish_article(uuid) from public,anon;
grant execute on function public.qibla_save_editor_revision(uuid,text,text,text) to authenticated;
grant execute on function public.qibla_publish_article(uuid) to authenticated;
-- Follow-up: secure application upload RPC and private storage policies, event-to-notification fanout,
-- author submit RPC, editor/approver grants via admin-only backend. Do not expose a direct write policy.
