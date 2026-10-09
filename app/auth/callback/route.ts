import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) next = "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Google basic profile data comes through Supabase Auth user metadata.
        // Fill missing fields only; never overwrite the member's own edits.
        const meta = user.user_metadata ?? {};
        const identity = user.identities?.find(i => i.provider === "google")?.identity_data ?? {};
        const str = (v: unknown) => typeof v === "string" ? v.trim() : "";
        const fullName = str(identity.full_name) || str(meta.full_name) || str(identity.name) || str(meta.name);
        const given = str(identity.given_name) || str(meta.given_name) || (fullName ? fullName.split(/\s+/)[0] : "");
        const family = str(identity.family_name) || str(meta.family_name) || (fullName.includes(" ") ? fullName.split(/\s+/).slice(1).join(" ") : "");
        const { data: profile } = await supabase.from("profiles").select("gender,display_name,first_name,last_name").eq("id", user.id).maybeSingle();
        const updates: Record<string,string> = {};
        if (!str(profile?.display_name) && fullName) updates.display_name = fullName.slice(0,100);
        if (!str(profile?.first_name) && given) updates.first_name = given.slice(0,100);
        if (!str(profile?.last_name) && family) updates.last_name = family.slice(0,100);
        if (Object.keys(updates).length) {
          const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", user.id);
          if (profileError) console.warn("Google profile autofill skipped:", profileError.message);
        }
        if (!profile?.gender) return NextResponse.redirect(`${origin}/onboarding`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth_callback_failed`);
}
