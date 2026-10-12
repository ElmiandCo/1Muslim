import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
 return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/messages/","/settings/"]},sitemap:"https://1muslim.live/sitemap.xml"};
}
