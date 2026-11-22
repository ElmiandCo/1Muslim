import type { MetadataRoute } from "next";

/**
 * Public marketing and policy pages are readable without an account.
 * Member areas remain authenticated, and should not be indexed.
 * The wildcard policy also applies to Googlebot, Bingbot, OAI-SearchBot,
 * ChatGPT-User and other legitimate search crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/platform", "/features", "/growth", "/privacy", "/terms", "/data-policy", "/llms.txt"],
      disallow: [
        "/api/", "/admin", "/auth", "/settings", "/messages", "/profile",
        "/notifications", "/onboarding", "/posts", "/ummah", "/community",
        "/create", "/find", "/search", "/streaming", "/deepwatch",
        "/recording-studio", "/tiktok", "/qibla", "/widget-tools",
        "/hudhud", "/unlocked", "/premium"
      ]
    },
    sitemap: "https://1muslim.live/sitemap.xml",
    host: "https://1muslim.live"
  };
}
