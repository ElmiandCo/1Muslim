import type {Metadata} from "next";
import Link from "next/link";
import {featurePages} from "./feature-content";
import styles from "./features.module.css";

export const metadata:Metadata={
 title:"1Muslim Features | Social Network, Messenger, HudHud AI & Qur'an XP",
 description:"Explore the technology behind 1Muslim: posts and videos, Muslim profiles and Messenger, live video, notifications, HudHud AI, Shahada membership and Qur'an tracking with XP.",
 alternates:{canonical:"/features"},
 openGraph:{
  title:"1Muslim — Real Muslim Social Media, Built with Purpose",
  description:"An interconnected social network with original posts, short videos, private messaging, live broadcasts, Shahada-centered onboarding, Qur'an tracking, XP and HudHud AI.",
  url:"https://1muslim.live/features",type:"website",siteName:"1Muslim"
 }
};

export default function FeaturesPage(){
 return <main className={styles.page}><div className={styles.shell}>
  <nav className={styles.nav}><Link href="/platform">← About 1Muslim</Link><span>OUR NETWORK · OUR TECHNOLOGY</span><Link href="/auth">Join free ↗</Link></nav>
  <section className={styles.hero}>
   <p className={styles.eyebrow}>1MUSLIM IS SOCIAL MEDIA</p>
   <h1>A complete social experience.<br/><em>Built for the Ummah.</em></h1>
   <p>1Muslim is designed around individual people and their relationships: profiles, followers, original posts, short videos, private Messenger, live broadcasts and notifications. Qur'an tracking, XP and a Muslim-themed AI companion work inside that same network.</p>
   <div className={styles.ctaRow}><Link className={styles.primary} href="/auth">Create a free profile ↗</Link><Link className={styles.secondary} href="/growth">Explore public growth figures</Link></div>
  </section>
  <section aria-label="1Muslim product features" className={styles.section}>
   <p className={styles.eyebrow}>DISCOVER THE TECHNOLOGY</p><h2>Five ways the network comes together.</h2>
   <div className={styles.grid}>{featurePages.map((feature,index)=><Link href={"/features/"+feature.slug} className={styles.card} key={feature.slug}>
    <span className={styles.number}>{String(index+1).padStart(2,"0")}</span>
    <span className={styles.cardLabel}>{feature.label}</span>
    <h3>{feature.headline}</h3>
    <p>{feature.summary}</p>
    <b>Explore this feature ↗</b>
   </Link>)}</div>
  </section>
  <section className={styles.note}><span className={styles.eyebrow}>A DIFFERENT KIND OF MUSLIM PLATFORM</span>
   <h2>Not just a forum. Not just an Islamic utility app.</h2>
   <p>The site blends modern social-network mechanics with faith-centered member experiences. That combination is our product story. We do not need to invent a worldwide ranking to explain why it matters.</p>
   <Link href="/platform">See the full 1Muslim overview ↗</Link>
  </section>
  <footer className={styles.footer}><Link href="/">1Muslim Home</Link><Link href="/growth">Public analytics</Link><Link href="/unlocked">1Muslim Unlocked</Link></footer>
 </div></main>;
}