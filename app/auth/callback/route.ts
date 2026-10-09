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
        const { data: profile } = await supabase.from("profiles").select("gender,display_name,first_name,last_name,username").eq("id", user.id).maybeSingle();
        const updates: Record<string,string> = {};
        if (!str(profile?.display_name) && fullName) updates.display_name = fullName.slice(0,100);
        if (!str(profile?.first_name) && given) updates.first_name = given.slice(0,100);
        if (!str(profile?.last_name) && family) updates.last_name = family.slice(0,100);
        // Public @handle: readable name plus a short, stable UUID-derived suffix.
        // The suffix avoids exposing the full user ID and keeps names distinguishable.
        if (!str(profile?.username)) {
          const clean = (value: string) => value.normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0,14);
          const first = clean(str(profile?.first_name) || given) || "member";
          const last = clean(str(profile?.last_name) || family);
          const suffix = user.id.replace(/-/g, "").slice(0,8).toLowerCase();
          const handle = [first,last,suffix].filter(Boolean).join("_");
          const { data: taken } = await supabase.from("profiles").select("id").eq("username",handle).neq("id",user.id).maybeSingle();
          if (!taken) updates.username = handle;
        }
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
