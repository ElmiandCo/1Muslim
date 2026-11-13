-- Community privacy and room association. Existing community tables remain intact.
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','members','hidden'));
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS profile_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'members' CHECK (profile_visibility IN ('public','members'));
CREATE TABLE IF NOT EXISTS public.community_group_rooms (
 community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
 group_id uuid NOT NULL UNIQUE REFERENCES public.dm_groups(id) ON DELETE CASCADE,
 added_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(community_id,group_id)
);
ALTER TABLE public.community_group_rooms ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.can_view_community(cid uuid, viewer uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.communities c WHERE c.id=cid AND (c.creator_id=viewer OR (viewer IS NOT NULL AND EXISTS(SELECT 1 FROM public.community_members m WHERE m.community_id=cid AND m.user_id=viewer AND m.status='approved')) OR c.visibility='public'));
$$;
REVOKE ALL ON FUNCTION public.can_view_community(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_community(uuid,uuid) TO authenticated;
DROP POLICY IF EXISTS "authenticated users can discover communities" ON public.communities;
CREATE POLICY "community discovery respects visibility" ON public.communities FOR SELECT TO authenticated USING (public.can_view_community(id,auth.uid()));
DROP POLICY IF EXISTS "approved members can read community posts" ON public.community_posts;
CREATE POLICY "community posts respect profile privacy" ON public.community_posts FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.communities c WHERE c.id=community_id AND c.profile_enabled AND
 (c.creator_id=auth.uid() OR public.is_approved_community_member(c.id,auth.uid()) OR (c.visibility='public' AND c.profile_visibility='public')))
);
DROP POLICY IF EXISTS "community members view rooms" ON public.community_group_rooms;
CREATE POLICY "community members view rooms" ON public.community_group_rooms FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.communities c WHERE c.id=community_id AND (c.creator_id=auth.uid() OR public.is_approved_community_member(c.id,auth.uid())))
);
DROP POLICY IF EXISTS "community owner adds owned rooms" ON public.community_group_rooms;
CREATE POLICY "community owner adds owned rooms" ON public.community_group_rooms FOR INSERT TO authenticated WITH CHECK (
 added_by=auth.uid() AND EXISTS(SELECT 1 FROM public.communities c WHERE c.id=community_id AND c.creator_id=auth.uid()) AND
 EXISTS(SELECT 1 FROM public.dm_groups g WHERE g.id=group_id AND g.created_by=auth.uid())
);
DROP POLICY IF EXISTS "community owner removes rooms" ON public.community_group_rooms;
CREATE POLICY "community owner removes rooms" ON public.community_group_rooms FOR DELETE TO authenticated USING (
 EXISTS(SELECT 1 FROM public.communities c WHERE c.id=community_id AND c.creator_id=auth.uid())
);
CREATE OR REPLACE FUNCTION public.create_messenger_community(p_name text,p_description text,p_visibility text,p_profile_enabled boolean,p_profile_visibility text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; slug_value text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Community name must be 2–80 characters'; END IF;
 IF p_visibility NOT IN ('public','members','hidden') OR p_profile_visibility NOT IN ('public','members') THEN RAISE EXCEPTION 'Invalid privacy option'; END IF;
 slug_value:=regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g')||'-'||substr(gen_random_uuid()::text,1,8);
 INSERT INTO public.communities(name,slug,description,creator_id,visibility,profile_enabled,profile_visibility)
 VALUES(trim(p_name),slug_value,left(coalesce(p_description,''),1000),auth.uid(),p_visibility,p_profile_enabled,p_profile_visibility) RETURNING id INTO cid;
 INSERT INTO public.community_members(community_id,user_id,role,status) VALUES(cid,auth.uid(),'owner','approved') ON CONFLICT DO NOTHING;
 RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.create_messenger_community(text,text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_messenger_community(text,text,text,boolean,text) TO authenticated;