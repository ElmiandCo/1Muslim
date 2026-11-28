/** First-party product paths only: public and signed-in HudHud share these
 * deterministic suggestions. Future concepts are explicitly marked not live. */
export type HudHudProductCard={
 id:string;kind:"1Muslim App"|"Coming soon";title:string;href:string;description:string;image?:string
};
export type HudHudProductAnswer={reply:string;matches:HudHudProductCard[]};
const available:HudHudProductCard[]=[
 {id:"deepwatch",kind:"1Muslim App",title:"DeepWatch",href:"/deepwatch",description:"Browse films, series and documentaries.",image:"/assets/deepwatch-icon.PNG"},
 {id:"posts",kind:"1Muslim App",title:"Ummah Posts",href:"/posts",description:"Read and share posts with the community.",image:"/assets/hudhud-messages.PNG"},
 {id:"live",kind:"1Muslim App",title:"1Muslim LIVE",href:"/streaming",description:"Join and host live conversations.",image:"/assets/hudhud-live.PNG"},
 {id:"muslims",kind:"1Muslim App",title:"Muslims",href:"/profile?section=muslimeen",description:"Find members of the Ummah.",image:"/assets/avatars/cosmic-avatar-male.PNG"},
 {id:"quran",kind:"1Muslim App",title:"Qur’an Reader",href:"/quran-library",description:"Explore the Qur’an Reader.",image:"/assets/HudHud-Quran.PNG"},
 {id:"qibla",kind:"1Muslim App",title:"Qibla Compass",href:"/profile?compass=1",description:"Open the compass; a member session may be required.",image:"/assets/qibla-home.PNG"},
 {id:"notifications",kind:"1Muslim App",title:"Notifications",href:"/notifications",description:"See your notifications.",image:"/assets/hudhud-salam-welcome.PNG"},
 {id:"settings",kind:"1Muslim App",title:"Settings",href:"/settings",description:"Personalize your experience."}
];
const soon:HudHudProductCard[]=[
 {id:"shop",kind:"Coming soon",title:"One Muslim Shop — planned",href:"/features",description:"A future shopping experience. Not available yet."},
 {id:"business",kind:"Coming soon",title:"One Muslim Business — planned",href:"/features",description:"A future professional and business experience. Not available yet."}
];
const appKeywords:Record<string,RegExp>={
 deepwatch:/\bdeep\s?watch|movies?|films?|series|documentar(?:y|ies)\b/i,
 posts:/\bposts?|feed|ummah posts\b/i,
 live:/\b(?:go )?live|stream(?:ing)?|broadcast\b/i,
 muslims:/\bmuslims?|members?|muslimeen|muslimin|find people\b/i,
 quran:/\bqur['’]?an|quran|qurān|reader\b/i,
 qibla:/\bqibla|compass|direction to mecca\b/i,
 notifications:/\bnotifications?|alerts?\b/i,
 settings:/\bsettings?|preferences?\b/i
};
const wantsApps=/\b(?:app|apps|feature|features|tool|tools|page|pages|service|services|navigate|open|take me|show me|where|find|available|can (?:i|you)|what (?:can|does)|how (?:do|can)|recommend|suggest|explore|visit)\b/i;
const future=/\b(?:coming soon|upcoming|future|planned|what(?:'s| is) next|working on|shop|business|halal market)\b/i;
function unique<T extends {id:string}>(items:T[]):T[]{
 return items.filter((item,index)=>items.findIndex(other=>other.id===item.id)===index);
}
export function selectHudHudProductAnswer(message:string,history:Array<{content:string}>=[],signedIn=false):HudHudProductAnswer|null{
 const query=message.toLowerCase().trim();
 if(query.length>250)return null;
 if(/\b(?:who (?:owns|created|developed|built|made) (?:you|hudhud|1muslim)|your creator|your owner)\b/i.test(query)){
  return {reply:"I’m HudHud, 1Muslim’s AI companion. I can explain the platform and its tools, but I don’t have verified individual ownership details to provide here.",matches:[]};
 }
 if(/\b(?:am i signed in|am i logged in|do i have an account|is my account active)\b/i.test(query)){
  return {reply:signedIn?"You’re signed in. What would you like to explore?":"You’re browsing as a guest. You can explore 1Muslim, or sign in when you’re ready.",matches:signedIn?[]:[{id:"join",kind:"1Muslim App",title:"Sign in or join",href:"/auth",description:"Join 1Muslim when you're ready."}]};
 }
 if(future.test(query)){
  // Share planned products only if asked, and disclose the combined idea only
  // after sustained relevant questions within this visible conversation.
  const asks=((history||[]).filter(x=>/shop|business|halal market/i.test(x.content)).length+1);
  const reveal=/\bhalal market\b/i.test(query)||asks>=3;
  const requested=/\bshop\b/i.test(query)?soon.slice(0,1):/\bbusiness\b/i.test(query)?soon.slice(1):soon;
  return {
   reply:reveal
    ?"A little preview: One Muslim Shop and One Muslim Business are planned separately, with a longer-term idea to bring them together as Halal Market. Nothing is launched yet, but the vision is exciting, insha’Allah."
    :"There are two ideas we're developing: One Muslim Shop and One Muslim Business. They’re coming-soon concepts, not live features yet. I’m excited to share more when there’s an announcement, insha’Allah.",
   matches:requested
  };
 }
 // Never divert Qur'an teaching, an Islamic question, or general chat to an app
 // unless the user is asking about available tools, navigation, or recommendations.
 if(!wantsApps.test(query))return null;
 const selected=unique(available.filter(x=>appKeywords[x.id]?.test(query)));
 if(!selected.length&&!/\b(?:1muslim|one muslim|your apps?|your features?|what can you do|explore)\b/i.test(query))return null;
 const apps=selected.length?selected.slice(0,3):available.slice(0,3);
 return {reply:apps.length===1
  ?"Here’s "+apps[0].title+". Tap the card to open it."
  :"Here are a few places to explore on 1Muslim. Tap any card to open it.",matches:apps};
}
