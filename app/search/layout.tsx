import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata:Metadata={
 title:"1Muslim Search | Search the Web, Qur’an & Ummah",
 description:"Search the whole internet and discover Muslim-relevant sources, videos, news, Qur’an, creators, DeepWatch, posts and more with 1Muslim Search.",
 alternates:{canonical:"/search"},
 openGraph:{
  title:"Discover 1Muslim — Search Everything with HudHud AI",
  description:"One search across Muslim creators, social videos, posts, Qur'an, lessons and media. Explore with HudHud, your Muslim-Inspired AI Companion, with three free conversational replies.",
  url:"https://1muslim.live/search",type:"website",siteName:"1Muslim"
 },
 twitter:{card:"summary",title:"Discover 1Muslim with HudHud AI",description:"Search Muslim posts, videos, profiles, Qur'an, lessons and media across the social network."}
};

export default function SearchLayout({children}:{children:ReactNode}){return children;}
