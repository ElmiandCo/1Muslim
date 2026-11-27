import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  "name": "1Muslim",
  "short_name": "1Muslim",
  "description": "Learn · Connect · Reflect · Return",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {"src":"/app-install-icon","sizes":"512x512","type":"image/png","purpose":"any"},
    {"src":"/apple-icon","sizes":"180x180","type":"image/png","purpose":"any"}
  ]
};
}
