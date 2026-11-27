-- HudHud 2026: each real visitor/member receives up to 50 high-quality actions.
-- New entry point means current production behavior remains untouched until
-- new application code is deployed. Atomic INSERT..ON CONFLICT prevents races.
CREATE OR REPLACE FUNCTION public.reserve_hudhud_v2_turn(p_key text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_turns integer;
BEGIN
 IF p_key IS NULL OR length(p_key) NOT BETWEEN 4 AND 180 THEN
  RAISE EXCEPTION 'Invalid HudHud usage key';
 END IF;
 INSERT INTO public.discover_hudhud_usage(usage_key,turns_used)
 VALUES(p_key,1)
 ON CONFLICT(usage_key) DO UPDATE
   SET turns_used=public.discover_hudhud_usage.turns_used+1,updated_at=now()
   WHERE public.discover_hudhud_usage.turns_used < 50
 RETURNING turns_used INTO v_turns;
 RETURN v_turns;
END $$;
REVOKE ALL ON FUNCTION public.reserve_hudhud_v2_turn(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_hudhud_v2_turn(text) TO service_role;
