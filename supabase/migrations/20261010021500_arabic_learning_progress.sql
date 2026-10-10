-- Self-declared language ability is not a verified badge.
create table if not exists public.arabic_learning_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 speaks_arabic boolean not null default false,
 letters_completed text[] not null default '{}',
 updated_at timestamptz not null default now()
);
alter table public.arabic_learning_progress enable row level security;
grant select,insert,update on public.arabic_learning_progress to authenticated;
create policy "Read own Arabic progress" on public.arabic_learning_progress for select to authenticated using(auth.uid()=user_id);
create policy "Create own Arabic progress" on public.arabic_learning_progress for insert to authenticated with check(auth.uid()=user_id);
create policy "Update own Arabic progress" on public.arabic_learning_progress for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
-- Arabic Letters Badge requires completion of all 28 lessons.
-- Arabic Language Badge remains pending until an independently validated assessment exists.
