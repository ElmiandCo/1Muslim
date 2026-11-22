import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 const base="https://1muslim.live";
 const pages=[
  {path:"/",priority:1,frequency:"weekly"},
  {path:"/platform",priority:.95,frequency:"monthly"},
  {path:"/growth",priority:.85,frequency:"weekly"},
  {path:"/about",priority:.8,frequency:"monthly"},
  {path:"/community",priority:.85,frequency:"daily"},
  {path:"/streaming",priority:.8,frequency:"weekly"},
  {path:"/search",priority:.8,frequency:"weekly"},
  {path:"/deepwatch",priority:.75,frequency:"weekly"},
  {path:"/widget-tools/prayer",priority:.8,frequency:"monthly"},
  {path:"/unlocked",priority:.72,frequency:"monthly"},
  {path:"/learn",priority:.7,frequency:"monthly"},
  {path:"/elm-tent/quran",priority:.76,frequency:"weekly"},
  {path:"/auth",priority:.5,frequency:"monthly"}
 ] as const;
 return pages.map(({path,priority,frequency})=>({
  url:base+path,
  changeFrequency:frequency,
  priority
 }));
}
