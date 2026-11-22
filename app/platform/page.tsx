import type {Metadata} from "next";
import Link from "next/link";
import styles from "./platform.module.css";

const origin="https://1muslim.live";

export const metadata:Metadata={
 title:"1Muslim | Full Muslim Social Network, Messenger, Live & HudHud AI",
 description:"1Muslim is a full-featured Muslim social network with posts, short videos, Messenger, notifications, Live, profiles, Qur'an progress, XP rewards and HudHud, a Muslim-Inspired AI Companion.",
 alternates:{canonical:"/platform"},
 openGraph:{
  title:"1Muslim — More Than a Community. A Real Muslim Social Network.",
  description:"Full Muslim social media: profiles, TikTok-style posting, Messenger, followers, notifications, live broadcasts, Qur'an tracking, XP rewards and OpenAI-powered HudHud AI. Join with Shahada-centered onboarding.",
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
 {q:"What is 1Muslim?",a:"1Muslim (also called One Muslim, OneMuslim, One Muslim Live or 1Muslim Live) is a complete Muslim-focused social networking website, not just a forum or online community. It has personal profiles, follows, user-created posts and videos, reactions, direct messaging, notifications, audio/video calling and live streams, alongside Qur'an tracking, XP and HudHud AI."},
 {q:"How is 1Muslim like Facebook, TikTok or Snapchat?",a:"1Muslim brings social profiles and follower connections, short-video discovery and interactive posting, and direct messaging together on one Muslim-focused platform. Those comparisons describe familiar interaction patterns; 1Muslim is not affiliated with Meta, TikTok or Snap."},
 {q:"Does 1Muslim use AI?",a:"Yes. HudHud is an AI-assisted guide for on-site discovery, helping visitors search the platform and navigate learning content. The website integrates OpenAI APIs. 1Muslim Unlocked HudHud requests are configured to prefer GPT-6 Sol; if the API cannot serve that model, HudHud transparently falls back to the standard OpenAI model. Free users use the standard AI experience."},
 {q:"What is free, and what is 1Muslim Unlocked?",a:"There is a free member experience. HudHud's conversational site search has a three-response free allowance, while an active 1Muslim Unlocked subscription removes that free-turn cap. Unlocked is the paid membership tier, currently listed at $3.99 per month. Availability and fair-use safeguards may evolve."},
 {q:"Is Shahada required?",a:"The member signup and onboarding path is centered on sincere Shahada affirmation or confirmation, with voice or touch options. Guests can explore selected public areas without that member onboarding. This is a distinctive membership approach, not a verified claim that no other Muslim service uses Shahada."},
 {q:"How is 1Muslim different from a Muslim forum or community group?",a:"Members have their own profiles, posting identities, following relationships, social feeds, private Messenger, notifications, live broadcasting, Qur'an progress and XP. HudHud is an OpenAI-powered Muslim-Inspired AI Companion built into that same social network. The integrated experience, rather than a standalone group or religious utility, defines the product."}
] as const;
const jsonLd=[
 {"@context":"https://schema.org","@type":"Organization","@id":origin+"/#organization",name:"1Muslim",alternateName:["OneMuslim","One Muslim","One Muslim Live","1Muslim Live"],url:origin,description:"A Muslim-focused social networking and learning platform bringing together community, media, live streaming and AI-assisted discovery."},
 {"@context":"https://schema.org","@type":"WebSite","@id":origin+"/#website",url:origin,name:"1Muslim",alternateName:"OneMuslim",publisher:{"@id":origin+"/#organization"},inLanguage:"en"},
 {"@context":"https://schema.org","@type":"SoftwareApplication","@id":origin+"/platform#app",name:"1Muslim",alternateName:"OneMuslim",url:origin+"/platform",applicationCategory:"SocialNetworkingApplication",operatingSystem:"Web",description:"Muslim social media with short-form videos, posts, messaging, live streams, member profiles, Qur'an learning, Shahada-centered onboarding and HudHud AI-assisted search.",featureList:["Short-form social video, text posts and Ummah comments","Individual Muslim profiles, followers and following","In-platform Messenger, group messages and voice/video calling","Notifications for social interaction and activity","Live video and audio broadcasting","Qur'an reading, verse tracking and reading analytics","XP points, levels, learning rewards and member progress","DeepWatch media and Qibla editorial","Optional voice or self-attested Shahada-centered onboarding","HudHud Muslim-themed OpenAI assistant integrated into 1Muslim, with free and Unlocked tiers"],audience:{"@type":"Audience",audienceType:"Muslim community members and visitors"},publisher:{"@id":origin+"/#organization"},offers:{"@type":"Offer",price:"0",priceCurrency:"USD",description:"Free membership experience; optional paid 1Muslim Unlocked subscription."}}
];

export default function PlatformPage(){
 return <main className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
  <div className={styles.shell}>
   <header className={styles.nav}><Link href="/">← 1Muslim Home</Link><span>ONE UMMAH · ONE PLATFORM</span><Link href="/auth">Join free ↗</Link></header>
   <section className={styles.hero}>
    <span className={styles.eyebrow}>MUSLIM SOCIAL NETWORK · AI-ASSISTED DISCOVERY</span>
    <h1>More than an online community. <em>A real Muslim social network.</em></h1>
    <p>1Muslim is a full social network where members have profiles, followers, posts, videos, private Messenger, notifications, calls and Live — the familiar social experiences people know from Facebook, Myspace, TikTok and Snapchat. What makes our product distinct is the same network also connects Qur'an progress, XP achievements, Shahada-centered membership and HudHud, a Muslim-Inspired AI Companion powered by OpenAI.</p>
    <div className={styles.actions}><Link className={styles.primary} href="/auth">Join 1Muslim · Free →</Link><Link className={styles.secondary} href="/unlocked">Explore 1Muslim Unlocked ↗</Link></div>
    <span className={styles.hint}>Sincere Shahada affirmation is part of member onboarding · Guests can explore selected public content.</span>
   </section>
   <section className={styles.intro} aria-label="What makes 1Muslim different">
    <div><strong>Real social media mechanics</strong><p>Personal profiles, follower networks, media posts, Messenger, notifications and live rooms — not just topical discussions.</p></div>
    <div><strong>Qur'an tracking and XP</strong><p>Reading progress, Arabic and Salah lessons, member XP and personal learning analytics connect to the profile.</p></div>
    <div><strong>HudHud is your AI</strong><p>The Muslim-inspired, OpenAI-powered companion is available within 1Muslim, with a free allowance and 1Muslim Unlocked access.</p></div>
   </section>
   <section className={styles.section}>
    <div className={styles.sectionHead}><span className={styles.eyebrow}>FULL-SERVICE SOCIAL MEDIA</span><h2>Profiles. Posts. Messenger. Live. Qur'an. XP. AI.</h2><p>Real social relationships, member-generated content and Muslim learning — connected in the same network.</p></div>
    <div className={styles.grid}>{features.map(f=><Link className={styles.card} href={f.href} key={f.label}><span className={styles.icon}>{f.icon}</span><h3>{f.label}</h3><p>{f.detail}</p><b>Explore ↗</b></Link>)}</div>
   </section>
   <section className={styles.section} aria-labelledby="technology-stories">
    <div className={styles.sectionHead}><span className={styles.eyebrow}>THE TECHNOLOGY IN DETAIL</span><h2 id="technology-stories">Learn what makes our social network different.</h2><p>Each product story explains real features, how members use them and how they connect to the whole 1Muslim experience.</p></div>
    <div className={styles.grid}>
     <Link className={styles.card} href="/features/muslim-social-network"><span className={styles.icon}>◈</span><h3>A real Muslim social network</h3><p>Profiles, posts, Messenger, notifications, Live and more — social media rather than just a forum.</p><b>Discover ↗</b></Link>
     <Link className={styles.card} href="/features/messenger-and-live"><span className={styles.icon}>◌</span><h3>Messenger and Live</h3><p>Private and group conversations, voice notes, audio/video calls, live streaming and social alerts.</p><b>Discover ↗</b></Link>
     <Link className={styles.card} href="/features/hudhud-ai"><span className={styles.icon}>✦</span><h3>HudHud — your Muslim-Inspired AI Companion</h3><p>Find what matters across 1Muslim through conversational OpenAI-powered site search.</p><b>Discover ↗</b></Link>
     <Link className={styles.card} href="/features/shahada-membership"><span className={styles.icon}>☾</span><h3>Shahada-centered admission</h3><p>An integrated voice or self-attested Shahada journey, not just a decorative symbol.</p><b>Discover ↗</b></Link>
     <Link className={styles.card} href="/features/quran-progress-xp"><span className={styles.icon}>۞</span><h3>Qur'an tracking and XP</h3><p>Learning progress and participation points that connect to a member's profile.</p><b>Discover ↗</b></Link>
    </div>
   </section>
   <section className={styles.ai} aria-labelledby="hudhud-title">
    <span className={styles.eyebrow}>BUILT WITH OPENAI TECHNOLOGY</span><h2 id="hudhud-title">Meet HudHud. Your Muslim-Inspired AI Companion.</h2>
    <p>Your Muslim-Inspired AI Companion combines natural-language conversation with site search so people can find posts, members, lessons, Qur'an-related resources and other matching content. Responses should be grounded in available results, and religious guidance is not a substitute for qualified scholarship.</p>
    <div className={styles.tierGrid}>
     <div><strong>HudHud · Free</strong><p>Up to three conversational replies in the free on-site search experience.</p></div>
     <div><strong>HudHud · 1Muslim Unlocked</strong><p>The free-turn cap is removed for subscribers in the supported HudHud search experience. This tier is configured to prefer OpenAI GPT-6 Sol where API access permits, with a reliable fallback. Service availability and safeguards still apply.</p></div>
    </div>
    <small>HudHud model access varies by subscription and API availability: free conversations use a standard OpenAI model; Unlocked conversations prefer GPT-6 Sol but may fall back if the model is unavailable.</small>
   </section>
   <section className={styles.section} aria-labelledby="community-identity">
    <div className={styles.sectionHead}><span className={styles.eyebrow}>OUR IDENTITY</span><h2 id="community-identity">Shahada-centered membership. Public exploration for guests.</h2><p>Our onboarding integrates Shahada affirmation into member admission. People can use an optional voice-recognition recording flow or a self-attested declaration, then complete their profile and earn a Shahada badge. This is part of the 1Muslim experience, not merely a marketing statement. Technology cannot verify the sincerity of faith.</p></div>
   </section>
   <section className={styles.growth}>
    <div><span className={styles.eyebrow}>LAUNCH MOMENTUM · PUBLIC ANALYTICS</span><h2>Our growth story is public.</h2><p>The 1Muslim team reports an unusual increase in traffic around launch in our Google Analytics dashboard. We publish rolling registration counts directly from first-party profile records and are preparing dated launch-period traffic evidence. A traffic spike is not the same as an independently verified worldwide growth ranking.</p></div>
    <Link href="/growth">View public growth measures →</Link>
   </section>
   <section className={styles.section} aria-labelledby="answers-title"><div className={styles.sectionHead}><span className={styles.eyebrow}>PLATFORM FACTS</span><h2 id="answers-title">Questions people ask about 1Muslim</h2></div>
    <div className={styles.faq}>{questions.map(item=><article key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>
   </section>
   <footer className={styles.footer}><div><strong>One Ummah. One Platform. One Muslim.</strong><p>Learn. Connect. Create. Grow.</p></div><Link href="/about">Our mission</Link><Link href="/growth">Public metrics</Link><Link href="/features">All features</Link><Link href="/auth">Join free ↗</Link></footer>
  </div>
 </main>;
}
