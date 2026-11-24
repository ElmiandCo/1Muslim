// Read-only contract: challenge completion and entitlement at the time of that
// completion are not established by the currently available reader events.
// Do not turn these results into awards without an authoritative, atomic flow.
export type EarnedBadge = { badge_key: string; badge_name: string };
type Dependencies = {
  getUser: () => Promise<{ id: string } | null>;
  getBadges: (userId: string) => Promise<EarnedBadge[]>;
  getSubscriptionStatus: (userId: string) => Promise<string | null>;
};

export async function getUnlockedChallengeBadges(deps: Dependencies) {
  const user = await deps.getUser();
  if (!user) return { status: 401 as const, body: { error: "Sign in required" } };

  try {
    const [earnedBadges, status] = await Promise.all([
      deps.getBadges(user.id),
      deps.getSubscriptionStatus(user.id),
    ]);
    const reason = status === "active" || status === "trialing"
      ? "verified_completion_required" as const
      : "active_subscription_required" as const;
    return {
      status: 200 as const,
      body: {
        // Existing earned badges are returned independently of subscription status.
        earnedBadges,
        challenges: {
          quranReaderInitiation: { eligible: false as const, reason },
          alFatiha: { eligible: false as const, reason },
          ayatAlKursi: { eligible: false as const, reason },
        },
      },
    };
  } catch {
    return { status: 503 as const, body: { error: "Badge status unavailable" } };
  }
}
