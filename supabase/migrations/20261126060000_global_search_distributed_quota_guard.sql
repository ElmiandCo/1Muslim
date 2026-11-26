-- One Muslim worldwide search shared quota guard.
-- Applied to the 1Muslim Supabase project. Keep this migration in git for reproducibility.
CREATE TABLE IF NOT EXISTS public.search_api_rate_limits (
  request_key text PRIMARY KEY,
  hit_count integer NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS search_api_rate_limits_expiry_idx ON public.search_api_rate_limits(expires_at);
ALTER TABLE public.search_api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.search_api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.search_api_rate_limits TO service_role;
CREATE OR REPLACE FUNCTION public.claim_search_api_quota(
  p_key text, p_max integer, p_window_seconds integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE did_claim boolean;
BEGIN
  IF p_key IS NULL OR length(p_key) < 5 OR length(p_key)>128 OR p_max<1 OR p_max>50000
    OR p_window_seconds<60 OR p_window_seconds>86400 THEN RETURN false; END IF;
  INSERT INTO public.search_api_rate_limits(request_key,hit_count,expires_at)
  VALUES (p_key,1,clock_timestamp()+make_interval(secs=>p_window_seconds))
  ON CONFLICT(request_key) DO UPDATE
    SET hit_count = CASE WHEN public.search_api_rate_limits.expires_at<=clock_timestamp()
      THEN 1 ELSE public.search_api_rate_limits.hit_count+1 END,
      expires_at = CASE WHEN public.search_api_rate_limits.expires_at<=clock_timestamp()
      THEN clock_timestamp()+make_interval(secs=>p_window_seconds)
      ELSE public.search_api_rate_limits.expires_at END
    WHERE public.search_api_rate_limits.expires_at<=clock_timestamp()
      OR public.search_api_rate_limits.hit_count<p_max
  RETURNING true INTO did_claim;
  RETURN COALESCE(did_claim,false);
END;$$;
REVOKE ALL ON FUNCTION public.claim_search_api_quota(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_search_api_quota(text,integer,integer) TO service_role;
