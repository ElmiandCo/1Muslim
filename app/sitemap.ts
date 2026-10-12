import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 const base="https://1muslim.live";
 return ["/","/learn","/streaming","/quran"].map(path=>({url:base+path,lastModified:new Date(),changeFrequency:"weekly" as const,priority:path==="/"?1:0.7}));
}
