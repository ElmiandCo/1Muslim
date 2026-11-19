-- New profiles default to Obsidian Black. Existing member selections are preserved.
alter table public.profiles alter column profile_accent set default 'black';
alter table public.profiles alter column profile_background set default 'obsidian-black';
