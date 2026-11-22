import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata:Metadata={
 title:"Explore 1Muslim | HudHud AI Search, Videos, People & Qur'an",
 description:"Search the Muslim social network for videos, posts, profiles, DeepWatch, Qur'an verses, comments, prayer lessons and Qibla articles. Ask HudHud AI to help.",
 alternates:{canonical:"/search"},
 openGraph:{
  title:"Discover 1Muslim — Search Everything with HudHud AI",
  description:"One search across Muslim creators, social videos, posts, Qur'an, lessons and media. Try HudHud AI search with three free conversational replies.",
  url:"https://1muslim.live/search",type:"website",siteName:"1Muslim"
 },
 twitter:{card:"summary",title:"Discover 1Muslim with HudHud AI",description:"Search Muslim posts, videos, profiles, Qur'an, lessons and media across the social network."}
};

export default function SearchLayout({children}:{children:ReactNode}){return children;}
