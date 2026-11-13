-- Group message enhancements. Apply before deploying the updated Messenger UI.
ALTER TABLE public.dm_group_messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.dm_group_messages(id) ON DELETE SET NULL;
ALTER TABLE public.dm_group_messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.dm_group_messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.dm_group_messages ADD COLUMN IF NOT EXISTS attachment_type text;
CREATE TABLE IF NOT EXISTS public.dm_group_message_reactions (
 group_id uuid NOT NULL REFERENCES public.dm_groups(id) ON DELETE CASCADE,
 message_id uuid NOT NULL REFERENCES public.dm_group_messages(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 emoji text NOT NULL CHECK (emoji IN ('❤️','👍','😂','🤲')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (message_id,user_id,emoji)
);
ALTER TABLE public.dm_group_message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read group reactions" ON public.dm_group_message_reactions;
CREATE POLICY "members read group reactions" ON public.dm_group_message_reactions FOR SELECT TO authenticated USING (public.dm_is_group_member(group_id));
DROP POLICY IF EXISTS "members add own reactions" ON public.dm_group_message_reactions;
CREATE POLICY "members add own reactions" ON public.dm_group_message_reactions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND public.dm_is_group_member(group_id) AND EXISTS (SELECT 1 FROM public.dm_group_messages m WHERE m.id=message_id AND m.group_id=group_id));
DROP POLICY IF EXISTS "members remove own reactions" ON public.dm_group_message_reactions;
CREATE POLICY "members remove own reactions" ON public.dm_group_message_reactions FOR DELETE TO authenticated USING (user_id=auth.uid() AND public.dm_is_group_member(group_id));
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('dm-group-attachments','dm-group-attachments',false,15728640,ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/mp4','audio/webm','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "group members upload attachments" ON storage.objects;
CREATE POLICY "group members upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='dm-group-attachments' AND (storage.foldername(name))[2]=auth.uid()::text AND public.dm_is_group_member(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "group members view attachments" ON storage.objects;
CREATE POLICY "group members view attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='dm-group-attachments' AND public.dm_is_group_member(((storage.foldername(name))[1])::uuid));
