-- Private Qur'an recitation vault. Apply this migration before enabling cloud saves.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('quran-recitation-vault','quran-recitation-vault',false,20971520,array['audio/webm','audio/mp4','audio/ogg','audio/mpeg'])
on conflict (id) do nothing;

create table if not exists public.quran_recitations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 verse_key text not null check (verse_key ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
 storage_path text not null,
 mime_type text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,verse_key)
);
alter table public.quran_recitations enable row level security;
create policy "Owner reads recitations" on public.quran_recitations for select to authenticated using (auth.uid()=user_id);
create policy "Owner inserts recitations" on public.quran_recitations for insert to authenticated with check (auth.uid()=user_id);
create policy "Owner updates recitations" on public.quran_recitations for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Owner deletes recitations" on public.quran_recitations for delete to authenticated using (auth.uid()=user_id);
create policy "Owner uploads private recitations" on storage.objects for insert to authenticated with check (bucket_id='quran-recitation-vault' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Owner reads private recitation files" on storage.objects for select to authenticated using (bucket_id='quran-recitation-vault' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Owner deletes private recitation files" on storage.objects for delete to authenticated using (bucket_id='quran-recitation-vault' and (storage.foldername(name))[1]=auth.uid()::text);
