import type { MetadataRoute } from "next";

const ORIGIN = "https://1muslim.live";

// Every URL listed here is intentionally readable without authentication.
// Do not include member profiles, messages, feeds or other private app routes.
const publicPages = [
  { path: "/", priority: 1.0, frequency: "weekly" },
  { path: "/platform", priority: 0.98, frequency: "monthly" },
  { path: "/features", priority: 0.95, frequency: "monthly" },
  { path: "/features/muslim-social-network", priority: 0.92, frequency: "monthly" },
  { path: "/features/messenger-and-live", priority: 0.9, frequency: "monthly" },
  { path: "/features/hudhud-ai", priority: 0.9, frequency: "monthly" },
  { path: "/features/shahada-membership", priority: 0.86, frequency: "monthly" },
  { path: "/features/quran-progress-xp", priority: 0.9, frequency: "monthly" },
  { path: "/about", priority: 0.84, frequency: "monthly" },
  { path: "/growth", priority: 0.76, frequency: "weekly" },
  { path: "/privacy", priority: 0.35, frequency: "yearly" },
  { path: "/terms", priority: 0.35, frequency: "yearly" },
  { path: "/data-policy", priority: 0.35, frequency: "yearly" }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(({ path, priority, frequency }) => ({
    url: ORIGIN + path,
    changeFrequency: frequency,
    priority
  }));
}
