import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  "name": "1Muslim",
  "short_name": "1Muslim",
  "description": "Learn · Connect · Reflect · Return",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#08150e",
  "theme_color": "#123b29",
  "icons": [
    {
      "src": "/assets/1muslim-live-logo.PNG",
      "sizes": "any",
      "type": "image/png",
      "purpose": "any"
    }
  ]
};
}
