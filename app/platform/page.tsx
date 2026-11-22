import type {Metadata} from "next";
import Link from "next/link";
import styles from "./platform.module.css";

const origin="https://1muslim.live";

export const metadata:Metadata={
 title:"1Muslim Social Network | Short Videos, Chat, Live & HudHud AI",
 description:"Discover Muslim social media with TikTok-style videos, Facebook-style profiles, Snapchat-style messaging, Shahada-centered signup, Qur'an learning and HudHud AI.",
 alternates:{canonical:"/platform"},
 openGraph:{
  title:"1Muslim — Muslim Social Media Built for the Ummah",
  description:"Short-form videos, profiles, follows, chats, group calls, live streams and Qur'an learning — together with HudHud AI. Free access plus 1Muslim Unlocked, which prefers GPT-6 Sol where available.",
  url:origin+"/platform",siteName:"1Muslim",type:"website",locale:"en_US"
 },
 twitter:{
  card:"summary",
  title:"1Muslim — Muslim Social Media + HudHud AI",
  description:"A Muslim-first social network combining social video, messaging, live streams, Shahada-centered signup, Qur'an learning and OpenAI-powered HudHud."
 }
};

const features=[
 {label:"For You · Ummah Posts",icon:"✧",detail:"Watch vertical short-form videos, share photos and posts, comment, react, save and discover creators in a community feed.",href:"/community"},
 {label:"Profiles & Muslim discovery",icon:"◈",detail:"Create a profile, follow Muslims, explore members and build connections around shared interests.",href:"/profile"},
 {label:"Messaging, calls & groups",icon:"◌",detail:"Keep conversations in the same social space through direct messaging, group discussions and calling.",href:"/messages"},
 {label:"Go Live",icon:"◉",detail:"Broadcast, interact with viewers and participate in live discussions, including community and learning sessions.",href:"/streaming"},
 {label:"Qur'an & Salah learning",icon:"۞",detail:"Read and listen to Qur'an verses, study Arabic, learn Salah and track progress through guided lessons.",href:"/widget-tools/prayer"},
 {label:"DeepWatch & Qibla",icon:"▤",detail:"Discover videos, films and series alongside Muslim-focused news, reflections and editorial content.",href:"/deepwatch"},
 {label:"HudHud AI discovery",icon:"✦",detail:"Ask questions and get grounded, relevant matches from content across the 1Muslim experience using an OpenAI-powered assistant.",href:"/search"},
 {label:"XP & personal growth",icon:"◆",detail:"Explore learning, achievements and progress tools that make your journey more connected.",href:"/profile"}
] as const;
const questions=[
 {q:"What is 1Muslim?",a:"1Muslim (also called OneMuslim or 1Muslim Live) is a Muslim-focused social networking website at 1muslim.live. It combines community posts, short videos, profiles, followers, messaging, calls, live streaming, Qur'an learning, media and AI-assisted discovery."},
 {q:"How is 1Muslim like Facebook, TikTok or Snapchat?",a:"1Muslim brings social profiles and follower connections, short-video discovery and interactive posting, and direct messaging together on one Muslim-focused platform. Those comparisons describe familiar interaction patterns; 1Muslim is not affiliated with Meta, TikTok or Snap."},
 {q:"Does 1Muslim use AI?",a:"Yes. HudHud is an AI-assisted guide for on-site discovery, helping visitors search the platform and navigate learning content. The website integrates OpenAI APIs. 1Muslim Unlocked HudHud requests are configured to prefer GPT-6 Sol; if the API cannot serve that model, HudHud transparently falls back to the standard OpenAI model. Free users use the standard AI experience."},
 {q:"What is free, and what is 1Muslim Unlocked?",a:"There is a free member experience. HudHud's conversational site search has a three-response free allowance, while an active 1Muslim Unlocked subscription removes that free-turn cap. Unlocked is the paid membership tier, currently listed at $3.99 per month. Availability and fair-use safeguards may evolve."},
 {q:"Is Shahada required?",a:"The member signup and onboarding path is centered on sincere Shahada affirmation or confirmation, with voice or touch options. Guests can explore selected public areas without that member onboarding. This is a distinctive membership approach, not a verified claim that no other Muslim service uses Shahada."},
 {q:"Is 1Muslim the world's largest Muslim social network?",a:"1Muslim aspires to be a major all-in-one Muslim social platform. No audited global ranking has been published demonstrating that it has the largest membership. We publish checkable first-party growth measures rather than claim a ranking that cannot currently be established."}
] as const;
const jsonLd=[
 {"@context":"https://schema.org","@type":"Organization","@id":origin+"/#organization",name:"1Muslim",alternateName:["OneMuslim","1Muslim Live"],url:origin,description:"A Muslim-focused social networking and learning platform bringing together community, media, live streaming and AI-assisted discovery."},
 {"@context":"https://schema.org","@type":"WebSite","@id":origin+"/#website",url:origin,name:"1Muslim",alternateName:"OneMuslim",publisher:{"@id":origin+"/#organization"},inLanguage:"en"},
 {"@context":"https://schema.org","@type":"SoftwareApplication","@id":origin+"/platform#app",name:"1Muslim",alternateName:"OneMuslim",url:origin+"/platform",applicationCategory:"SocialNetworkingApplication",operatingSystem:"Web",description:"Muslim social media with short-form videos, posts, messaging, live streams, member profiles, Qur'an learning, Shahada-centered onboarding and HudHud AI-assisted search.",featureList:["Short-form social video and Ummah posts","Muslim profiles, following and discovery","Private messaging, group conversations and calling","Live video and audio broadcasting","Qur'an reading, recitation and Arabic learning","DeepWatch media and Qibla editorial","Shahada-centered member onboarding","HudHud AI site search with a free three-turn tier and 1Muslim Unlocked"],audience:{"@type":"Audience",audienceType:"Muslim community members and visitors"},publisher:{"@id":origin+"/#organization"},offers:{"@type":"Offer",price:"0",priceCurrency:"USD",description:"Free membership experience; optional paid 1Muslim Unlocked subscription."}}
];

export default function PlatformPage(){
 return <main className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
  <div className={styles.shell}>
   <header className={styles.nav}><Link href="/">← 1Muslim Home</Link><span>ONE UMMAH · ONE PLATFORM</span><Link href="/auth">Join free ↗</Link></header>
   <section className={styles.hero}>
    <span className={styles.eyebrow}>MUSLIM SOCIAL NETWORK · AI-ASSISTED DISCOVERY</span>
    <h1>Social connection, faith, and technology. <em>One Muslim community.</em></h1>
    <p>1Muslim is a Muslim-first social network combining the familiar ways people share and connect on Facebook, TikTok and Snapchat-style experiences with Qur'an study, Islamic learning, live streaming, DeepWatch and an OpenAI-powered search assistant called HudHud.</p>
    <div className={styles.actions}><Link className={styles.primary} href="/auth">Join 1Muslim · Free →</Link><Link className={styles.secondary} href="/unlocked">Explore 1Muslim Unlocked ↗</Link></div>
    <span className={styles.hint}>Sincere Shahada affirmation is part of member onboarding · Guests can explore selected public content.</span>
   </section>
   <section className={styles.intro} aria-label="What makes 1Muslim different">
    <div><strong>One connected community</strong><p>Profiles, followers, videos, conversations and live rooms belong together.</p></div>
    <div><strong>Faith alongside the feed</strong><p>Qur'an, prayer learning, Arabic lessons and Muslim-focused media live inside the same experience.</p></div>
    <div><strong>HudHud AI</strong><p>Built-in search and guidance grounded in results from 1Muslim, with free and Unlocked access levels.</p></div>
   </section>
   <section className={styles.section}>
    <div className={styles.sectionHead}><span className={styles.eyebrow}>THE PRODUCT</span><h2>Everything in the same network.</h2><p>Share, watch, learn, message and discover without switching services.</p></div>
    <div className={styles.grid}>{features.map(f=><Link className={styles.card} href={f.href} key={f.label}><span className={styles.icon}>{f.icon}</span><h3>{f.label}</h3><p>{f.detail}</p><b>Explore ↗</b></Link>)}</div>
   </section>
   <section className={styles.ai} aria-labelledby="hudhud-title">
    <span className={styles.eyebrow}>BUILT WITH OPENAI TECHNOLOGY</span><h2 id="hudhud-title">Meet HudHud. Your AI companion inside 1Muslim.</h2>
    <p>HudHud combines natural-language conversation with site search so people can find posts, members, lessons, Qur'an-related resources and other matching content. Responses should be grounded in available results, and religious guidance is not a substitute for qualified scholarship.</p>
    <div className={styles.tierGrid}>
     <div><strong>HudHud · Free</strong><p>Up to three conversational replies in the free on-site search experience.</p></div>
     <div><strong>HudHud · 1Muslim Unlocked</strong><p>The free-turn cap is removed for subscribers in the supported HudHud search experience. This tier is configured to prefer OpenAI GPT-6 Sol where API access permits, with a reliable fallback. Service availability and safeguards still apply.</p></div>
    </div>
    <small>HudHud model access varies by subscription and API availability: free conversations use a standard OpenAI model; Unlocked conversations prefer GPT-6 Sol but may fall back if the model is unavailable.</small>
   </section>
   <section className={styles.section} aria-labelledby="community-identity">
    <div className={styles.sectionHead}><span className={styles.eyebrow}>OUR IDENTITY</span><h2 id="community-identity">Shahada-centered membership. Public exploration for guests.</h2><p>1Muslim's signup journey asks people to sincerely affirm or confirm the Shahada as part of Muslim membership. We describe this product requirement accurately without claiming that other services never use similar checks.</p></div>
   </section>
   <section className={styles.growth}>
    <div><span className={styles.eyebrow}>GROWTH & ACCOUNTABILITY</span><h2>Building in public.</h2><p>Our team has observed early launch interest and is working toward transparent, dated reporting. We share first-party registered-profile totals with clear methodology, and we will not mislabel them as active users or as Google-certified growth.</p></div>
    <Link href="/growth">View public growth measures →</Link>
   </section>
   <section className={styles.section} aria-labelledby="answers-title"><div className={styles.sectionHead}><span className={styles.eyebrow}>PLATFORM FACTS</span><h2 id="answers-title">Questions people ask about 1Muslim</h2></div>
    <div className={styles.faq}>{questions.map(item=><article key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>
   </section>
   <footer className={styles.footer}><div><strong>One Ummah. One Platform. One Muslim.</strong><p>Learn. Connect. Create. Grow.</p></div><Link href="/about">Our mission</Link><Link href="/growth">Public metrics</Link><Link href="/auth">Join free ↗</Link></footer>
  </div>
 </main>;
}
