"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
import styles from "./qibla-cinematic.module.css";

type Story={id:string;title:string;description:string;cover:string|null;date:string;source:"editorial"|"legacy";kind:"article"|"newsletter"};
type View="split"|"magazine"|"newsletter";

export default function QiblaNewsroom(){
 const [view,setView]=useState<View>("split");
 const [zooming,setZooming]=useState<"magazine"|"newsletter"|null>(null);
 const [reversing,setReversing]=useState<"magazine"|"newsletter"|null>(null);
 const zoomTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const enterPublication=(target:"magazine"|"newsletter")=>{if(zooming)return;setZooming(target);try{const Ctx=window.AudioContext;const ctx=new Ctx();const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type="sine";osc.frequency.setValueAtTime(240,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(760,ctx.currentTime+.24);filter.type="lowpass";filter.frequency.value=1200;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.04);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.32);osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.33);osc.onended=()=>void ctx.close()}catch{}zoomTimer.current=setTimeout(()=>{setView(target);setZooming(null)},390)};
 const reverseToSplit=()=>{if(zooming||reversing||view==="split")return;const from=view;setReversing(from);try{const Ctx=window.AudioContext;const ctx=new Ctx();const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type="sine";osc.frequency.setValueAtTime(620,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(165,ctx.currentTime+.78);filter.type="lowpass";filter.frequency.setValueAtTime(1450,ctx.currentTime);filter.frequency.exponentialRampToValueAtTime(420,ctx.currentTime+.78);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.038,ctx.currentTime+.11);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.82);osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.83);osc.onended=()=>void ctx.close()}catch{}zoomTimer.current=setTimeout(()=>{setView("split");setReversing(null)},860)};
 useEffect(()=>()=>{if(zoomTimer.current)clearTimeout(zoomTimer.current)},[]);
 const [stories,setStories]=useState<Story[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 const [contributor,setContributor]=useState(false);
 const [newsletterExpanded,setNewsletterExpanded]=useState(false);
 useEffect(()=>{const back=()=>reverseToSplit();window.addEventListener("1muslim:qibla-back",back);return()=>window.removeEventListener("1muslim:qibla-back",back)});
 useEffect(()=>{let alive=true;const db=createClient();(async()=>{const {data:{user}}=await db.auth.getUser();if(!user)return;const [staff,superAdmin,legacyAdmin]=await Promise.all([db.from("qibla_staff").select("role").eq("user_id",user.id).maybeSingle(),db.rpc("qibla_is_superadmin"),db.rpc("qibla_is_admin")]);if(alive)setContributor(Boolean(staff.data?.role||superAdmin.data===true||legacyAdmin.data===true))})();return()=>{alive=false}},[]);
 useEffect(()=>{let active=true;const db=createClient();(async()=>{
  const [legacy,editorial]=await Promise.all([
   db.from("qibla_pages").select("id,title,template_type,hero_media_path,section_one,created_at").eq("published",true).order("created_at",{ascending:false}).limit(60),
   db.from("qibla_submissions").select("id,title,kind,subtitle,body,cover_url,published_page_id,updated_at").eq("status","published").order("updated_at",{ascending:false}).limit(60)
  ]);
  if(!active)return;
  if(legacy.error&&editorial.error)setError("Unable to load published stories.");
  else setStories([
   ...(legacy.data??[]).filter(p=>!(editorial.data??[]).some(s=>s.published_page_id===p.id)).map(p=>({id:p.id,title:p.title,description:p.section_one?.text??"",cover:p.hero_media_path||null,date:p.created_at??"",source:"legacy" as const,kind:"article" as const})),
   ...(editorial.data??[]).map(p=>({id:p.published_page_id||p.id,title:p.title,description:p.subtitle||p.body||"",cover:p.cover_url||null,date:p.updated_at??"",source:"editorial" as const,kind:(p.kind==="newsletter"?"newsletter":"article") as "newsletter"|"article"}))
  ].sort((a,b)=>b.date.localeCompare(a.date)));
  setLoading(false);
 })();return()=>{active=false}},[]);
 const visible=useMemo(()=>stories.filter(s=>s.kind==="article"&&(s.title+" "+s.description).toLowerCase().includes(query.toLowerCase())),[stories,query]);
 const newsletters=useMemo(()=>stories.filter(s=>s.kind==="newsletter"),[stories]);
 const [hero,...rest]=visible;
 return <main className={styles.root}>
  <header className={styles.topbar} aria-label="1Qibla navigation">
   <span className={styles.hudhudSpace} aria-hidden="true"/>
   <button className={styles.masthead} onClick={reverseToSplit} aria-label="Return to both publications" aria-pressed={view==="split"}>1MUSLIM <em>QIBLA</em></button>
   <nav className={styles.topnav} aria-label="Publications">
    <button aria-pressed={view==="magazine"} onClick={()=>setView("magazine")}>Magazine</button>
    <button aria-pressed={view==="newsletter"} onClick={()=>setView("newsletter")}>Newsletter</button>
    <button className={styles.splitIcon} aria-label="Show both publications" onClick={reverseToSplit}>◫</button>
   </nav>
  </header>
  <div className={styles.contributeBar}><span>YOUR VOICE. OUR PUBLICATION.</span><Link className={styles.contributeButton} href={contributor?"/qibla/studio":"/qibla/newsroom/apply"}>{contributor?"✎ CREATE A POST":"✦ APPLY TO CONTRIBUTE"}</Link></div>
  <div className={styles.stage} data-view={view} data-zoom={zooming||"none"} data-reverse={reversing||"none"}>
   <div className={styles.entrance} aria-hidden={view!=="split"}>
    <button className={styles.magPanel} onClick={()=>enterPublication("magazine")} tabIndex={view==="split"?0:-1}>
     <span className={styles.panelOverline}>FAITH. IDEAS. THE NEXT GENERATION.</span><span className={styles.panelTitle}>The<br/>Magazine</span>
     <span className={styles.panelDesc}>Youth · Faith · Identity · Debate · Culture</span>
     <span className={styles.splitPreviews}>{visible.length?visible.slice(0,4).map((story,i)=><span className={styles.splitPreview} key={story.id}><span className={styles.splitPreviewArt} style={story.cover?{backgroundImage:`url("${encodeURI(story.cover)}")`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>{!story.cover&&<span>{String(i+1).padStart(2,"0")}</span>}</span><span className={styles.splitPreviewCopy}><strong>{story.title}</strong><small>{story.description.slice(0,140)}</small><span className={styles.previewRead}>READ FULL ARTICLE →</span></span></span>):<span className={styles.splitPreviewCopy}>New magazine editions coming soon.</span>}
     <span className={styles.panelArrow}>Explore the magazine</span>
    </button>
    <div className={styles.newsPanel} role="button" onClick={()=>enterPublication("newsletter")} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();enterPublication("newsletter")}}} tabIndex={view==="split"?0:-1}>
     <span className={styles.panelOverline}>INDEPENDENT REPORTING. GLOBAL PERSPECTIVE.</span><span className={styles.panelTitle}>The<br/>Newsletter</span>
     <span className={styles.panelDesc}>World news · Community · Current affairs</span>
     <span className={styles.splitPreviews}>{newsletters.length?newsletters.slice(0,3).map(story=><span className={styles.splitPreview} key={story.id}><span className={styles.splitPreviewArt} style={story.cover?{backgroundImage:`url("${encodeURI(story.cover)}")`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}/><span className={styles.splitPreviewCopy}><strong>{story.title}</strong><small>{story.description.slice(0,170)}</small><span className={styles.previewRead}>READ THE NEWSLETTER →</span></span></span>):<span className={styles.splitPreviewCopy}>The next newsletter is being prepared. Published reporting will appear here.</span>}
     
     <span className={styles.panelArrow}>Read the latest</span>
    </div>
    <div className={styles.centerLine} aria-hidden="true"/>
   </div>
   <section className={styles.magazine} aria-hidden={view!=="magazine"}>
    <div className={styles.magHeader}><p>1QIBLA · THE MAGAZINE</p><h1>THE QIBLA</h1><div className={styles.magRule}/><span>FAITH, IDENTITY & IDEAS FOR A NEW GENERATION</span></div>
    <div className={styles.magIntro}><span>THE LATEST EDITION</span><span>THE NEXT GENERATION OF MUSLIM VOICES</span></div>
    <label className={styles.search}><span className={styles.srOnly}>Search articles</span><input placeholder="Search the magazine…" value={query} onChange={e=>setQuery(e.target.value)} type="search"/></label>
    {loading?<p className={styles.notice}>Preparing the magazine…</p>:error?<p className={styles.notice} role="alert">{error}</p>:!hero?<div className={styles.demoSection}><p className={styles.demoLabel}>MAGAZINE · COMING SOON</p><h2>New stories are on the way.</h2><p>Published magazine articles and their cover images will appear here.</p></div>:<>
     <article className={styles.feature}>
      <Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`} className={styles.featureVisual} style={hero.cover?{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.5),transparent),url("${encodeURI(hero.cover)}")`}:undefined} aria-label={`Read ${hero.title}`}>{!hero.cover&&<span>Q</span>}</Link>
      <div className={styles.featureText}><span className={styles.kicker}>THE COVER STORY</span><h2>{hero.title}</h2><p>{hero.description.slice(0,290)}</p><Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`}>READ THE STORY</Link></div>
     </article>
     <div className={styles.sectionTitle}><h2>THE EDIT</h2><span>RECENT STORIES · {rest.length}</span></div>
     <div className={styles.storyGrid}>{rest.map((s,i)=><article className={styles.story} key={s.id}>
      <Link className={styles.storyVisual} href={`/qibla/newsroom/${encodeURIComponent(s.id)}`} style={s.cover?{backgroundImage:`url("${encodeURI(s.cover)}")`}:undefined}><span>{String(i+1).padStart(2,"0")}</span></Link>
      <span className={styles.kicker}>THE QIBLA · YOUTH & IDEAS</span><h3><Link href={`/qibla/newsroom/${encodeURIComponent(s.id)}`}>{s.title}</Link></h3><p>{s.description.slice(0,130)}</p>
     </article>)}</div>
    </>}
   </section>
   <section className={styles.newsletter} aria-hidden={view!=="newsletter"}>
    <div className={styles.paperMasthead}><div className={styles.paperTopline}><span>1MUSLIM · INDEPENDENT UMMAH REPORTING</span><span>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</span></div><h1 className={styles.paperLogo}>The Qibla</h1><div className={styles.paperEdition}><span>THE QIBLA REPORT</span><span>WORLD · COMMUNITY · PERSPECTIVES</span><span>EST. 2026</span></div></div>
    <nav className={styles.paperNav} aria-label="Newsletter sections"><a href="#qibla-latest">LATEST</a><a href="#qibla-world">WORLD</a><a href="#qibla-community">COMMUNITY</a><Link href="/qibla/newsletters">ARCHIVE</Link></nav>
    <div id="qibla-latest" className={styles.paperContent}><div className={styles.paperSectionLabel}>THE LATEST</div>{newsletters.length?newsletters.map(story=><article className={styles.paperLead} key={story.id}><div className={styles.paperLeadCopy}><span className={styles.paperKicker}>PUBLISHED NEWSLETTER</span><h2>{story.title}</h2><p>{story.description.slice(0,300)}</p><Link href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}>READ FULL REPORT →</Link></div>{story.cover&&<div className={styles.paperLeadVisual} style={{backgroundImage:`url("${encodeURI(story.cover)}")`,backgroundSize:"cover",backgroundPosition:"center"}} aria-label={story.title}/>}</article>):<div className={styles.paperLead}><div className={styles.paperLeadCopy}><h2>Reporting in preparation</h2><p>Our next published newsletter will appear here with its official cover image.</p></div></div>}</div>
    <div className={styles.newsColumns}><div><span className={styles.kicker}>THE DAILY BRIEF</span><h2>Stay informed.<br/>Stay connected.</h2><p>Explore published newsletters, current affairs, community updates and thoughtful reporting in our growing archive.</p><Link className={styles.newsCTA} href="/qibla/newsletters">OPEN THE NEWSLETTER ARCHIVE</Link></div><aside><span>FROM THE EDITOR</span><p>One community. Many stories. One direction.</p><Link href="/qibla/newsroom/about">ABOUT 1QIBLA</Link></aside></div>
   </section>
  </div>
  <footer className={styles.footer}><nav className={styles.footerGrid} aria-label="Qibla footer"><Link href="/qibla/studio">EDITORIAL STUDIO</Link><Link href="/qibla/command">COMMAND CENTER</Link><Link href="/qibla/newsroom/apply">CONTRIBUTE</Link><Link href="/">1MUSLIM HOME</Link><Link href="/terms">TERMS & CONDITIONS</Link><Link href="/privacy">PRIVACY POLICY</Link><Link href="/data-policy">DATA POLICY</Link></nav><div className={styles.footerCopyright}>© 2026 1Muslim. All rights reserved.</div></footer>
 </main>
}
