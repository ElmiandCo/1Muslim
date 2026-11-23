import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";
import { adminDb } from "../../../../lib/stripe-unlocked";

export const runtime = "nodejs";
type CreatorSuggestion = {
  id: string; handle: string; displayName: string; avatarUrl: string | null;
  postCount: number; href: string;
};

export async function GET() {
  try {
    const db = await createClient();
    const [{ data: { user } }, { data: posts, error: postError }] = await Promise.all([
      db.auth.getUser(),
      // Public Ummah posts define the only creators eligible for guest recommendations.
      db.from("ummah_feed_posts").select("author_id,created_at").order("created_at", { ascending: false }).limit(1800)
    ]);
    if (postError) throw postError;

    const counts = new Map<string, { count: number; latest: number }>();
    for (const post of posts || []) {
      if (!post.author_id) continue;
      const prior = counts.get(post.author_id) || { count: 0, latest: 0 };
      prior.count += 1;
      prior.latest = Math.max(prior.latest, Date.parse(post.created_at || "") || 0);
      counts.set(post.author_id, prior);
    }
    const authorIds = [...counts.keys()].slice(0, 100);
    // Profile SELECT is restricted to authenticated members by RLS. Guest Discover
    // still needs to show creators whose posts are publicly visible, as the old page did.
    // Service role fetches ONLY the safe public display fields of those public-post authors.
    // Never enumerate or expose non-posting/private profile records to anonymous visitors.
    const { data: activeProfiles, error: lookupError } = authorIds.length
      ? await adminDb().from("profiles").select("id,display_name,username,hide_1muslim_id,avatar_url,xp_total").in("id", authorIds)
      : { data: [], error: null };
    if (lookupError) throw lookupError;

    const unique = new Map<string, { id: string; display_name: string | null; username: string | null; hide_1muslim_id?:boolean|null; avatar_url: string | null; xp_total: number | null }>();
    for (const profile of activeProfiles || []) {
      if (profile.id && profile.id !== user?.id && !unique.has(profile.id)) unique.set(profile.id, profile);
    }
    const today = Date.now();
    const ranked = [...unique.values()]
      .filter(p => Boolean((p.display_name || (!p.hide_1muslim_id?p.username:null) || "").trim()))
      .map(profile => {
        const activity = counts.get(profile.id);
        const ageDays = activity?.latest ? Math.max(0, (today - activity.latest) / 86400000) : 365;
        const recentBonus = ageDays < 7 ? 4 : ageDays < 30 ? 2 : 0;
        const activityScore = (activity?.count || 0) * 5 + recentBonus;
        const score = activityScore + Math.log1p(Math.max(0, profile.xp_total || 0)) / 10;
        return { profile, postCount: activity?.count || 0, score };
      })
      .sort((a,b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id))
      .slice(0, 7);
    const recommended: CreatorSuggestion[] = ranked.map(({ profile, postCount }) => ({
      id: profile.id,
      handle: !profile.hide_1muslim_id&&profile.username ? "@"+String(profile.username).replace(/^@/,"") : "",
      displayName: (profile.display_name || (!profile.hide_1muslim_id?profile.username:null) || "1Muslim member").trim(),
      avatarUrl: profile.avatar_url,
      postCount,
      href: "/profile?member=" + encodeURIComponent(profile.id)
    }));
    return NextResponse.json({ recommended }, {
      headers: { "Cache-Control": "private, max-age=40", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ recommended: [], error: "Creator suggestions are temporarily unavailable." }, {
      status: 503, headers: { "Cache-Control": "no-store" }
    });
  }
}
