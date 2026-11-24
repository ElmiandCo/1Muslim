/**
 * Accept only the user returned by the server-side Supabase getUser call.
 * No role or name claim grants voice access until an owner-approved account
 * binding and a separate server-side permission policy exist.
 */
export function canStartAdminVoice(
  user: { email?: string | null } | null,
  authError: unknown,
): boolean {
  return !authError && user?.email?.toLowerCase() === "hudhudbyelmi@gmail.com";
}
