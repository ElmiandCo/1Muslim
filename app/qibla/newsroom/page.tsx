"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
import styles from "./qibla-cinematic.module.css";

type Story={id:string;title:string;description:string;cover:string|null;date:string;source:"editorial"|"legacy"};
type View="split"|"magazine"|"newsletter";

export default function QiblaNewsroom(){
 const [view,setView]=useState<View>("split");
 const [stories,setStories]=useState<Story[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 const [contributor,setContributor]=useState(false);
 useEffect(()=>{let alive=true;const db=createClient();(async()=>{const {data:{user}}=await db.auth.getUser();if(!user)return;const [staff,superAdmin,legacyAdmin]=await Promise.all([db.from("qibla_staff").select("role").eq("user_id",user.id).maybeSingle(),db.rpc("qibla_is_superadmin"),db.rpc("qibla_is_admin")]);if(alive)setContributor(Boolean(staff.data?.role||superAdmin.data===true||legacyAdmin.data===true))})();return()=>{alive=false}},[]);
 useEffect(()=>{let active=true;const db=createClient();(async()=>{
  const [legacy,editorial]=await Promise.all([
   db.from("qibla_pages").select("id,title,template_type,hero_media_path,section_one,created_at").eq("published",true).order("created_at",{ascending:false}).limit(60),
   db.from("qibla_articles").select("id,title,subtitle,body,published_at").eq("status","published").order("published_at",{ascending:false}).limit(60)
  ]);
  if(!active)return;
  if(legacy.error&&editorial.error)setError("Unable to load published stories.");
  else setStories([
   ...(legacy.data??[]).map(p=>({id:p.id,title:p.title,description:p.section_one?.text??"",cover:p.template_type==="image"?p.hero_media_path:null,date:p.created_at??"",source:"legacy" as const})),
   ...(editorial.data??[]).map(p=>({id:p.id,title:p.title,description:p.subtitle||p.body||"",cover:null,date:p.published_at??"",source:"editorial" as const}))
  ].sort((a,b)=>b.date.localeCompare(a.date)));
  setLoading(false);
 })();return()=>{active=false}},[]);
 const visible=useMemo(()=>stories.filter(s=>(s.title+" "+s.description).toLowerCase().includes(query.toLowerCase())),[stories,query]);
 const [hero,...rest]=visible;
 const magazineSamples=[{title:"Faith in the Age of Algorithms",category:"IDENTITY & TECHNOLOGY",summary:"A new generation is navigating faith, creativity and belonging in an always-connected world.",body:"How can young Muslims build a thoughtful digital identity without losing their values? This sample feature explores intentional screen time, online community, and meaningful conversations about faith."},{title:"The Questions We Are Not Afraid to Ask",category:"FAITH & REASON",summary:"Curiosity, thoughtful debate and the courage to seek understanding.",body:"This sample magazine essay introduces the importance of respectful theological discussion, careful research and listening to different perspectives."}];
 const newsSamples=[{title:"Community Spotlight: A New Generation of Volunteers",category:"COMMUNITY · SAMPLE",summary:"An illustrative look at how local initiatives can bring neighbors together.",body:"DEMONSTRATION ARTICLE — This fictional example shows how a community report could present interviews, verified facts and local impact. No real event is being reported."},{title:"The Global Brief: Education, Culture and Community",category:"WORLD BRIEF · SAMPLE",summary:"A sample international news roundup format, designed for clarity and context.",body:"DEMONSTRATION ARTICLE — This is a layout preview, not a factual news report. Published editions will include sources, datelines and editorial verification."}];
 return <main className={styles.root}>
  <header className={styles.topbar} aria-label="1Qibla navigation">
   <span className={styles.hudhudSpace} aria-hidden="true"/>
   <button className={styles.masthead} onClick={()=>setView("split")} aria-label="Return to both publications">1MUSLIM <em>QIBLA</em></button>
   <nav className={styles.topnav} aria-label="Publications">
    <button aria-pressed={view==="magazine"} onClick={()=>setView("magazine")}>Magazine</button>
    <button aria-pressed={view==="newsletter"} onClick={()=>setView("newsletter")}>Newsletter</button>
    <button className={styles.splitIcon} aria-label="Show both publications" onClick={()=>setView("split")}>◫</button>
   </nav>
  </header>
  <div className={styles.contributeBar}><span>YOUR VOICE. OUR PUBLICATION.</span><Link className={styles.contributeButton} href={contributor?"/qibla/studio":"/qibla/newsroom/apply"}>{contributor?"✎ CREATE A POST ↗":"✦ APPLY TO CONTRIBUTE ↗"}</Link></div>
  <div className={styles.stage} data-view={view}>
   <div className={styles.entrance} aria-hidden={view!=="split"}>
    <button className={styles.magPanel} onClick={()=>setView("magazine")} tabIndex={view==="split"?0:-1}>
     <span className={styles.panelOverline}>FAITH. IDEAS. THE NEXT GENERATION.</span><span className={styles.panelTitle}>The<br/>Magazine</span>
     <span className={styles.panelDesc}>Youth · Faith · Identity · Debate · Culture</span><span className={styles.panelArrow}>Explore the magazine ↗</span>
    </button>
    <button className={styles.newsPanel} onClick={()=>setView("newsletter")} tabIndex={view==="split"?0:-1}>
     <span className={styles.panelOverline}>INDEPENDENT REPORTING. GLOBAL PERSPECTIVE.</span><span className={styles.panelTitle}>The<br/>Newsletter</span>
     <span className={styles.panelDesc}>World news · Community · Current affairs</span><span className={styles.panelArrow}>Read the latest ↗</span>
    </button>
    <div className={styles.centerLine} aria-hidden="true"/>
   </div>
   <section className={styles.magazine} aria-hidden={view!=="magazine"}>
    <div className={styles.magHeader}><p>1QIBLA · THE MAGAZINE</p><h1>THE QIBLA</h1><div className={styles.magRule}/><span>FAITH, IDENTITY & IDEAS FOR A NEW GENERATION</span></div>
    <div className={styles.magIntro}><span>THE LATEST EDITION</span><span>THE NEXT GENERATION OF MUSLIM VOICES</span></div>
    <label className={styles.search}><span className={styles.srOnly}>Search articles</span><input placeholder="Search the magazine…" value={query} onChange={e=>setQuery(e.target.value)} type="search"/></label>
    {loading?<p className={styles.notice}>Preparing the magazine…</p>:error?<p className={styles.notice} role="alert">{error}</p>:!hero?<div className={styles.demoSection}><p className={styles.demoLabel}>DESIGN PREVIEW · SAMPLE STORIES · NOT PUBLISHED</p><article className={styles.demoCover}><div className={styles.demoArtwork}><span>THE<br/>NEXT<br/>GEN.</span></div><div><span className={styles.kicker}>THE COVER STORY · SAMPLE</span><h2>{magazineSamples[0].title}</h2><p>{magazineSamples[0].summary}</p><details><summary>Preview the story ↗</summary><p>{magazineSamples[0].body}</p></details></div></article><div className={styles.sectionTitle}><h2>THE EDIT</h2><span>DEMONSTRATION EDITION</span></div><div className={styles.demoGrid}>{magazineSamples.map((s,i)=><article className={styles.demoMagCard} key={s.title}><div className={styles.demoCardVisual}><span>0{i+1}</span></div><span className={styles.kicker}>{s.category}</span><h3>{s.title}</h3><p>{s.summary}</p><details><summary>Read sample ↗</summary><p>{s.body}</p></details></article>)}</div></div>:<>
     <article className={styles.feature}>
      <Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`} className={styles.featureVisual} style={hero.cover?{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.5),transparent),url("${encodeURI(hero.cover)}")`}:undefined} aria-label={`Read ${hero.title}`}><span>Q</span></Link>
      <div className={styles.featureText}><span className={styles.kicker}>THE COVER STORY</span><h2>{hero.title}</h2><p>{hero.description.slice(0,290)}</p><Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`}>READ THE STORY <span>↗</span></Link></div>
     </article>
     <div className={styles.sectionTitle}><h2>THE EDIT</h2><span>RECENT STORIES · {rest.length}</span></div>
     <div className={styles.storyGrid}>{rest.map((s,i)=><article className={styles.story} key={s.id}>
      <Link className={styles.storyVisual} href={`/qibla/newsroom/${encodeURIComponent(s.id)}`} style={s.cover?{backgroundImage:`url("${encodeURI(s.cover)}")`}:undefined}><span>{String(i+1).padStart(2,"0")}</span></Link>
      <span className={styles.kicker}>THE QIBLA · YOUTH & IDEAS</span><h3><Link href={`/qibla/newsroom/${encodeURIComponent(s.id)}`}>{s.title}</Link></h3><p>{s.description.slice(0,130)}</p>
     </article>)}</div>
    </>}
   </section>
   <section className={styles.newsletter} aria-hidden={view!=="newsletter"}>
    <div className={styles.newsMast}><span>1QIBLA · THE NEWSLETTER</span><h1>THE QIBLA<br/><strong>REPORT</strong></h1><p>News, perspectives, and voices from across the Ummah.</p></div>
    <div className={styles.demoNewsSection}><div className={styles.newsSectionHeading}><strong>THE LATEST</strong><span>LAYOUT PREVIEW · FICTIONAL SAMPLE CONTENT</span></div><div className={styles.demoNewsGrid}>{newsSamples.map((s,i)=><article className={styles.demoNewsCard} key={s.title}><div className={styles.newsImage}><span>{i===0?"COMMUNITY":"WORLD"}</span></div><div className={styles.newsStoryText}><span className={styles.kicker}>{s.category}</span><h2>{s.title}</h2><p>{s.summary}</p><details><summary>Read sample report ↗</summary><p>{s.body}</p></details></div></article>)}</div></div>
    <div className={styles.newsColumns}><div><span className={styles.kicker}>THE DAILY BRIEF</span><h2>Stay informed.<br/>Stay connected.</h2><p>Explore published newsletters, current affairs, community updates and thoughtful reporting in our growing archive.</p><Link className={styles.newsCTA} href="/qibla/newsletters">OPEN THE NEWSLETTER ARCHIVE ↗</Link></div><aside><span>FROM THE EDITOR</span><p>One community. Many stories. One direction.</p><Link href="/qibla/newsroom/about">ABOUT 1QIBLA →</Link></aside></div>
   </section>
  </div>
  <footer className={styles.footer}><span>© 1MUSLIM QIBLA</span><Link href="/qibla/studio">EDITORIAL STUDIO</Link><Link href="/qibla/command">COMMAND CENTER</Link><Link href="/qibla/newsroom/apply">CONTRIBUTE</Link><Link href="/">1MUSLIM HOME ↗</Link></footer>
 </main>
}
