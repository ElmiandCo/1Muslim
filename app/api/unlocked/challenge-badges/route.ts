import { NextResponse } from "next/server";
import { getUnlockedChallengeBadges } from "../../../../lib/unlocked-challenge-badges";
import { createClient } from "../../../../utils/supabase/server";

export const dynamic = "force-dynamic";

// A read-only, owner-scoped snapshot. It never accepts progress or awards XP.
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const db = await createClient();
    const result = await getUnlockedChallengeBadges({
      getUser: async () => {
        const { data, error } = await db.auth.getUser();
        if (error) return null;
        return data.user;
      },
      getBadges: async (userId) => {
        const { data, error } = await db.from("profile_badges")
          .select("badge_key,badge_name").eq("user_id", userId);
        if (error) throw error;
        return data ?? [];
      },
      getSubscriptionStatus: async (userId) => {
        const { data, error } = await db.from("unlocked_subscriptions")
          .select("status").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        return data?.status ?? null;
      },
    });
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch {
    return NextResponse.json({ error: "Badge status unavailable" }, { status: 503, headers });
  }
}
