create table if not exists public.elm_curriculum_questions (
 id uuid primary key default gen_random_uuid(),
 topic text not null, level integer not null check(level between 1 and 10),
 prompt text not null, options jsonb not null, correct_index integer not null check(correct_index between 0 and 3),
 explanation text not null, source_label text not null, source_url text not null,
 created_at timestamptz default now()
);
create table if not exists public.elm_curriculum_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.elm_curriculum_questions(id) on delete cascade,
 attempts integer not null default 0, correct_count integer not null default 0,
 last_answered_at timestamptz default now(),
 primary key(user_id,question_id)
);
create table if not exists public.elm_learning_notes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid references public.elm_curriculum_questions(id) on delete set null,
 body text not null, source_url text, created_at timestamptz default now()
);
alter table public.elm_curriculum_questions enable row level security;
alter table public.elm_curriculum_progress enable row level security;
alter table public.elm_learning_notes enable row level security;
create policy "Published curriculum readable" on public.elm_curriculum_questions for select to anon,authenticated using(true);
create policy "Own learning progress" on public.elm_curriculum_progress for select to authenticated using(user_id=auth.uid());
create policy "Own learning progress insert" on public.elm_curriculum_progress for insert to authenticated with check(user_id=auth.uid());
create policy "Own learning progress update" on public.elm_curriculum_progress for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "Own notes read" on public.elm_learning_notes for select to authenticated using(user_id=auth.uid());
create policy "Own notes insert" on public.elm_learning_notes for insert to authenticated with check(user_id=auth.uid());
create policy "Own notes delete" on public.elm_learning_notes for delete to authenticated using(user_id=auth.uid());
insert into public.elm_curriculum_questions(topic,level,prompt,options,correct_index,explanation,source_label,source_url) values
('Tawhid',1,'Which surah begins with “Say: He is Allah, One”?','["Al-Ikhlas","Al-Falaq","An-Nas","Al-Kawthar"]',0,'Surah Al-Ikhlas begins by affirming the oneness of Allah.','Qur’an 112:1','/elm-tent/quran?surah=112&ayah=1'),
('Prayer',1,'Which surah do Muslims recite in each rak’ah of salah?','["Al-Masad","Al-Fatihah","Al-Fil","Al-Asr"]',1,'Al-Fatihah is recited in every rak’ah of salah.','Qur’an 1:1–7','/elm-tent/quran?surah=1&ayah=1'),
('Revelation',2,'Which surah begins with the command “Read” (Iqra)?','["Al-Alaq","Al-Qadr","Al-Baqarah","Al-Mulk"]',0,'Al-Alaq 96:1 begins with the command to read in the name of your Lord.','Qur’an 96:1','/elm-tent/quran?surah=96&ayah=1'),
('Prophets',3,'Which prophet is described as speaking to Allah in Qur’an 4:164?','["Ibrahim","Musa","Isa","Yusuf"]',1,'The verse specifically states that Allah spoke to Musa.','Qur’an 4:164','/elm-tent/quran?surah=4&ayah=164'),
('Tawhid',4,'Which verse says “There is nothing like unto Him”?','["42:11","19:30","2:183","93:3"]',0,'Qur’an 42:11 affirms Allah’s incomparability.','Qur’an 42:11','/elm-tent/quran?surah=42&ayah=11')
on conflict do nothing;
