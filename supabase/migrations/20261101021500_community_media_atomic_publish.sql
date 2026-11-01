-- Bot B Round Four. DRAFT ONLY: run on isolated staging AFTER Bot A's migrations.
-- Atomic, retry-safe publish of ONE canonical posts row + ONE post_media row.
-- Uses existing tables and caller RLS; does NOT create/link legacy Ummah rows.
-- No historical backfill or community_post_links writes.
CREATE OR REPLACE FUNCTION public.publish_community_media_post(
  p_post_id uuid,
  p_body text,
  p_storage_path text,
  p_file_name text,
  p_mime_type text
)
RETURNS TABLE(post_id uuid, created_at timestamptz, reused boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_post public.posts%ROWTYPE;
  v_media public.post_media%ROWTYPE;
  v_new boolean;
  v_filename text := left(trim(coalesce(p_file_name,'')),255);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in to publish media' USING ERRCODE = '28000';
  END IF;
  IF p_post_id IS NULL OR p_body IS NULL OR length(p_body) < 1 OR length(p_body) > 1000 THEN
    RAISE EXCEPTION 'Invalid canonical post ID or body (max 1000 characters)' USING ERRCODE = '22023';
  END IF;
  IF p_storage_path IS NULL OR length(p_storage_path) > 1024
     OR left(p_storage_path,length(v_user::text)+1) <> v_user::text || '/'
     OR p_storage_path LIKE '%/../%' OR p_storage_path LIKE '%/./%' THEN
    RAISE EXCEPTION 'Invalid owner-scoped media path' USING ERRCODE = '22023';
  END IF;
  IF v_filename = '' OR p_mime_type IS NULL
     OR p_mime_type !~ '^(image|video)/[a-zA-Z0-9.+-]+$' THEN
    RAISE EXCEPTION 'Invalid media filename or type' USING ERRCODE = '22023';
  END IF;

  -- A client-generated UUID is the retry key, not a cross-namespace mapping.
  -- Unique PKs serialize concurrent retries; conflicting payloads are rejected.
  INSERT INTO public.posts(id,user_id,body)
  VALUES(p_post_id,v_user,p_body)
  ON CONFLICT (id) DO NOTHING;
  v_new := FOUND;
  SELECT * INTO v_post FROM public.posts AS p WHERE p.id=p_post_id;
  IF v_post.id IS NULL OR v_post.user_id<>v_user OR v_post.body<>p_body THEN
    RAISE EXCEPTION 'Post ID already used with different content or owner' USING ERRCODE = '23505';
  END IF;

  -- Reuse the same UUID for this single attachment; this is NOT a second post.
  INSERT INTO public.post_media(id,post_id,user_id,storage_path,file_name,mime_type)
  VALUES(p_post_id,p_post_id,v_user,p_storage_path,v_filename,p_mime_type)
  ON CONFLICT (id) DO NOTHING;
  SELECT * INTO v_media FROM public.post_media AS m WHERE m.id=p_post_id;
  IF v_media.id IS NULL OR v_media.post_id<>p_post_id OR v_media.user_id<>v_user
     OR v_media.storage_path<>p_storage_path OR v_media.file_name<>v_filename
     OR v_media.mime_type<>p_mime_type THEN
    RAISE EXCEPTION 'Media ID already used with different content or owner' USING ERRCODE = '23505';
  END IF;

  -- Any error aborts both inserts in the same Postgres transaction.
  post_id := v_post.id;
  created_at := v_post.created_at;
  reused := NOT v_new;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.publish_community_media_post(uuid,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_community_media_post(uuid,text,text,text,text) TO authenticated;
