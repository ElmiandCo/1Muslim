import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata:Metadata={
 title:"1Muslim Unlocked | HudHud Muslim-Inspired AI Companion & Premium Social Features",
 description:"Upgrade to 1Muslim Unlocked for premium social and learning features and HudHud, your Muslim-Inspired AI Companion without the three-reply free cap. GPT-6 Sol is preferred where available.",
 alternates:{canonical:"/unlocked"},
 openGraph:{
  title:"1Muslim Unlocked — Premium AI, Media & Community",
  description:"Discover 1Muslim Unlocked: expanded DeepWatch and member benefits plus HudHud conversational search beyond the three free replies. AI model availability can vary.",
  url:"https://1muslim.live/unlocked",type:"website",siteName:"1Muslim"
 },
 twitter:{card:"summary",title:"1Muslim Unlocked — HudHud AI & Premium Access",description:"Unlock HudHud AI-assisted site search beyond the three free replies alongside premium Muslim community features."}
};

export default function UnlockedLayout({children}:{children:ReactNode}){return children;}
