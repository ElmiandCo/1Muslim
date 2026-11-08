-- Production error 42P01: deliver_xp_level_up() references a missing notification_preferences table.
-- Provide the minimal preferences table expected by the existing XP-level notification trigger.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 in_app_enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "members can view own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id=auth.uid());
DROP POLICY IF EXISTS "members can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "members can update own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
DROP POLICY IF EXISTS "members can create own notification preferences" ON public.notification_preferences;
CREATE POLICY "members can create own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
