import type {Metadata} from "next";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import styles from "./growth.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"1Muslim Growth & Public Analytics | Muslim Social Network",
 description:"Follow 1Muslim, a growing Muslim social network with Messenger, Live, Qur'an tracking and HudHud AI. See dated new-member counts and the launch-traffic story.",
 alternates:{canonical:"/growth"},
 openGraph:{
  title:"1Muslim — Public Growth & Membership Statistics",
  description:"Follow 1Muslim's growth with dated, first-party membership counts and clear reporting methodology. Registered profiles are not unique visitors or active users.",
  url:"https://1muslim.live/growth",siteName:"1Muslim",type:"website"
 },
 twitter:{card:"summary",title:"1Muslim Growth — Public Membership Statistics",description:"See dated first-party 1Muslim profile counts and transparent analytics methodology."}
};

type ProfileMetrics={total:number|null;last7:number|null;last30:number|null;updated:string};
async function memberCounts():Promise<ProfileMetrics>{
 const updated=new Date().toISOString();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {total:null,last7:null,last30:null,updated};
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const week=new Date(Date.now()-7*86400_000).toISOString();
  const month=new Date(Date.now()-30*86400_000).toISOString();
  const [total,last7,last30]=await Promise.all([
   db.from("profiles").select("id",{count:"exact",head:true}),
   db.from("profiles").select("id",{count:"exact",head:true}).gte("created_at",week),
   db.from("profiles").select("id",{count:"exact",head:true}).gte("created_at",month)
  ]);
  return {total:total.error?null:total.count,last7:last7.error?null:last7.count,last30:last30.error?null:last30.count,updated};
 }catch{return {total:null,last7:null,last30:null,updated};}
}

export default async function GrowthPage(){
 const metrics=await memberCounts();
 const values=[
  {title:"Registered profiles",value:metrics.total,unit:"All-time records"},
  {title:"New profiles · last 7 days",value:metrics.last7,unit:"Rolling seven days"},
  {title:"New profiles · last 30 days",value:metrics.last30,unit:"Rolling thirty days"}
 ];
 return <main className={styles.page}><div className={styles.shell}>
  <nav className={styles.nav}><Link href="/platform">← Platform overview</Link><span>1MUSLIM · PUBLIC METRICS</span><Link href="/auth">Join free ↗</Link></nav>
  <header className={styles.hero}><span className={styles.eyebrow}>MEASURE WHAT MATTERS</span><h1>Growing openly. <em>Reporting responsibly.</em></h1>
   <p>1Muslim is a growing Muslim-focused social network. These figures are directly counted from current first-party profile records, not inferred from screenshots, promotional reach or third-party estimates.</p></header>
  <section className={styles.grid} aria-label="Current public platform measures">
   {values.map(v=><article className={styles.metric} key={v.title}><span>{v.title}</span><strong>{v.value===null?"—":v.value.toLocaleString("en-US")}</strong><small>{v.value===null?"Data temporarily unavailable":v.unit}</small></article>)}
  </section>
  <p className={styles.stamp}>Checked: <time dateTime={metrics.updated}>{new Date(metrics.updated).toLocaleString("en-US",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC</time> · Counts may include administrative, bot or test profiles.</p>
  <section className={styles.panel}><span className={styles.eyebrow}>READING THE NUMBERS</span><h2>What these numbers show — and what they don't.</h2>
   <p><strong>Registered profiles</strong> count records in the 1Muslim profiles table; weekly and monthly values filter by record creation date. They do not measure unique visitors, daily active users, legitimate human accounts, livestream viewers, app installs or paying subscribers.</p>
   <p>Counts are aggregated server-side. No usernames, user IDs, private conversations or verification records are exposed here.</p>
  </section>
  <section className={styles.panel}><span className={styles.eyebrow}>GOOGLE ANALYTICS · LAUNCH MOMENTUM</span><h2>Our launch-period traffic spike.</h2>
   <p>The 1Muslim team reports an unusually sharp increase in site visits around launch in the Google Analytics dashboard. We are building a public record of that momentum while this page already displays current, dated first-party membership counts.</p>
   <p>Google Analytics visits, new registrations and active users are different measurements. A traffic anomaly is a useful launch signal, but it does not by itself establish a global fastest-growing ranking or certify numbers against other platforms. Once a dated GA4 report is published, it can show the exact spike and its timeframe.</p>
  </section>
  <section className={styles.banner}><h2>Not just a community. A growing Muslim social network.</h2><p>1Muslim connects original posts, short videos, Messenger, Live, notifications, individual profiles, Qur'an tracking, XP and HudHud AI. Our public growth records support the story with real measurements as the network develops.</p><Link href="/features">Explore the social network and its technology →</Link></section>
  <footer className={styles.footer}><Link href="/">1Muslim Home</Link><Link href="/about">Mission</Link><Link href="/unlocked">Unlocked membership</Link></footer>
 </div></main>;
}
