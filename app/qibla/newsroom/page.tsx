"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
import styles from "./qibla-cinematic.module.css";

type Story={id:string;title:string;description:string;cover:string|null;date:string;source:"editorial"|"legacy";kind:"magazine"|"newsletter"};
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
 const [magSlide,setMagSlide]=useState(0);
 const [magPaused,setMagPaused]=useState(false);
 const [contributor,setContributor]=useState(false);

 useEffect(()=>{const back=()=>reverseToSplit();window.addEventListener("1muslim:qibla-back",back);return()=>window.removeEventListener("1muslim:qibla-back",back)});
 useEffect(()=>{let alive=true;const db=createClient();(async()=>{const {data:{user}}=await db.auth.getUser();if(!user)return;const [staff,superAdmin,legacyAdmin]=await Promise.all([db.from("qibla_staff").select("role").eq("user_id",user.id).maybeSingle(),db.rpc("qibla_is_superadmin"),db.rpc("qibla_is_admin")]);if(alive)setContributor(Boolean(staff.data?.role||superAdmin.data===true||legacyAdmin.data===true))})();return()=>{alive=false}},[]);
 useEffect(()=>{let active=true;const db=createClient();(async()=>{
  const [legacy,editorial]=await Promise.all([
   db.from("qibla_pages").select("id,title,template_type,hero_media_path,section_one,section_two,created_at").eq("published",true).order("created_at",{ascending:false}).limit(60),
   db.from("qibla_articles").select("id,title,subtitle,body,cover_url,published_at").eq("status","published").order("published_at",{ascending:false}).limit(60)
  ]);
  const submissions=await db.from("qibla_submissions").select("published_page_id,kind").eq("status","published");
  if(!active)return;
  const publicationKinds=new Map((submissions.data??[]).map(p=>[p.published_page_id,p.kind]));
  if(legacy.error&&editorial.error)setError("Unable to load published stories.");
  else setStories([
   ...(legacy.data??[]).map(p=>({id:p.id,title:p.title,description:p.section_one?.text??"",cover:p.hero_media_path||null,date:p.created_at??"",source:"legacy" as const,kind:publicationKinds.get(p.id)==="newsletter"||(!publicationKinds.has(p.id)&&String(p.template_type??"").toLowerCase().includes("newsletter"))?"newsletter" as const:"magazine" as const})),
   ...(editorial.data??[]).map(p=>({id:p.id,title:p.title,description:p.subtitle||p.body||"",cover:p.cover_url||null,date:p.published_at??"",source:"editorial" as const,kind:publicationKinds.get(p.id)==="newsletter"?"newsletter" as const:"magazine" as const}))
  ].sort((a,b)=>b.date.localeCompare(a.date)));
  setLoading(false);
 })();return()=>{active=false}},[]);
 const visible=useMemo(()=>stories.filter(s=>(s.title+" "+s.description).toLowerCase().includes(query.toLowerCase())),[stories,query]);
 const magazineStories=visible.filter(s=>s.kind==="magazine");
 const newsletterStories=visible.filter(s=>s.kind==="newsletter");
 const [hero,...rest]=magazineStories;
 const magSlides=magazineStories.slice(0,Math.max(5,Math.min(8,magazineStories.length)));
 useEffect(()=>{setMagSlide(0)},[query]);
 useEffect(()=>{if(view!=="magazine"||magPaused||magSlides.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const timer=window.setInterval(()=>setMagSlide(i=>(i+1)%magSlides.length),4000);
  return()=>window.clearInterval(timer);
 },[view,magPaused,magSlides.length]);
 const moveMagSlide=(delta:number)=>setMagSlide(i=>(i+delta+magSlides.length)%magSlides.length);
 const magazineIcon=(size=19)=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 15 15 9M10 9h5v5"/></svg>;
 const editorialTitle=(title:string)=>{const words=title.trim().split(/\s+/);const pivot=Math.max(1,Math.ceil(words.length*.48));return <span className={styles.editorialTitle}><span>{words.slice(0,pivot).join(" ")}</span><em>{words.slice(pivot).join(" ")||" "}</em></span>};
 const magazineSamples=[{title:"Faith in the Age of Algorithms",category:"IDENTITY & TECHNOLOGY",summary:"A new generation is navigating faith, creativity and belonging in an always-connected world.",body:"How can young Muslims build a thoughtful digital identity without losing their values? This sample feature explores intentional screen time, online community, and meaningful conversations about faith."},{title:"The Questions We Are Not Afraid to Ask",category:"FAITH & REASON",summary:"Curiosity, thoughtful debate and the courage to seek understanding.",body:"This sample magazine essay introduces the importance of respectful theological discussion, careful research and listening to different perspectives."}];
 const newsSamples=[{title:"Community Spotlight: A New Generation of Volunteers",category:"COMMUNITY · SAMPLE",summary:"An illustrative look at how local initiatives can bring neighbors together.",body:"DEMONSTRATION ARTICLE — This fictional example shows how a community report could present interviews, verified facts and local impact. No real event is being reported."},{title:"The Global Brief: Education, Culture and Community",category:"WORLD BRIEF · SAMPLE",summary:"A sample international news roundup format, designed for clarity and context.",body:"DEMONSTRATION ARTICLE — This is a layout preview, not a factual news report. Published editions will include sources, datelines and editorial verification."}];
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
     <span className={styles.splitPreviews}>{magazineStories.length?magazineStories.slice(0,4).map(story=><span className={styles.splitPreview} key={story.id}><span className={styles.splitPreviewArt} style={story.cover?{backgroundImage:`url("${encodeURI(story.cover)}")`}:undefined}>{!story.cover&&<span>1MUSLIM</span>}</span><span className={styles.splitPreviewCopy}><strong>{editorialTitle(story.title)}</strong><small>{story.description.slice(0,140)}</small><span className={styles.previewRead}>READ FULL ARTICLE ↗</span></span></span>):<span className={styles.notice}>Magazine stories coming soon.</span>}</span>
     <span className={styles.panelArrow}>Explore the magazine</span>
    </button>
    <div className={styles.newsPanel} role="button" onClick={()=>enterPublication("newsletter")} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();enterPublication("newsletter")}}} tabIndex={view==="split"?0:-1}>
     <span className={styles.panelOverline}>INDEPENDENT REPORTING. GLOBAL PERSPECTIVE.</span><span className={styles.panelTitle}>The<br/>Newsletter</span>
     <span className={styles.panelDesc}>World news · Community · Current affairs</span>
     <span className={styles.splitPreviews}>{newsletterStories.length?newsletterStories.slice(0,2).map(story=><span className={styles.splitPreview} key={story.id}><span className={styles.splitPreviewArt} style={story.cover?{backgroundImage:`url("${encodeURI(story.cover)}")`}:undefined}>{!story.cover&&<span>QIBLA REPORT</span>}</span><span className={styles.splitPreviewCopy}><strong>{story.title}</strong><small>{story.description.slice(0,160)}</small><span className={styles.previewRead}>READ THE REPORT ↗</span></span></span>):<span className={styles.notice}>Newsletter reports coming soon.</span>}</span>
     <span className={styles.panelArrow}>Read the latest</span>
    </div>
    <div className={styles.centerLine} aria-hidden="true"/>
   </div>
   <section className={styles.magazine} aria-hidden={view!=="magazine"}>
    <div className={styles.magCarousel} aria-label="Magazine featured stories" onMouseEnter={()=>setMagPaused(true)} onMouseLeave={()=>setMagPaused(false)} onFocusCapture={()=>setMagPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setMagPaused(false)}}>
     {(magSlides.length?magSlides:[null]).map((story,i)=><div key={story?.id||"empty"} className={`${styles.magCinemaHero} ${i===magSlide?styles.magSlideActive:""}`} aria-hidden={i!==magSlide} style={story?.cover?{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 37%,rgba(255,255,255,.22) 100%),url("${encodeURI(story.cover)}")`}:undefined}>
      <div className={styles.magCinemaCopy}><span className={styles.magCinemaEyebrow}>1QIBLA · THE FEATURED EDITION</span><h2>{story?story.title:"Stories worth reading."}</h2><p>{story?story.description.slice(0,240):"A new perspective on faith, identity, culture and the next generation."}</p>{story?<Link tabIndex={i===magSlide?0:-1} className={styles.magCinemaRead} href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}>READ MORE {magazineIcon()}</Link>:<span className={styles.magCinemaComing}>THE NEXT EDITION IS COMING</span>}</div><span className={styles.magCinemaMark} aria-hidden="true">THE QIBLA / MAGAZINE</span>
     </div>)}
     {magSlides.length>1&&<><button type="button" className={`${styles.magSlideControl} ${styles.magSlidePrev}`} aria-label="Previous featured story" onClick={()=>moveMagSlide(-1)}>{magazineIcon(22)}</button><button type="button" className={`${styles.magSlideControl} ${styles.magSlideNext}`} aria-label="Next featured story" onClick={()=>moveMagSlide(1)}>{magazineIcon(22)}</button><div className={styles.magSlideDots}>{magSlides.map((story,i)=><button type="button" key={story.id} aria-label={`Show story ${i+1}: ${story.title}`} aria-current={i===magSlide?"true":undefined} onClick={()=>setMagSlide(i)}/>)}</div></>}
    </div>
    <div className={styles.magCinemaExplore}><Link href="/deepwatch" aria-label="Explore more on DeepWatch"><span>✦</span> EXPLORE MORE <span>✦</span></Link></div>
    {magazineStories.length>1&&<div className={styles.magCinemaShelf}><div className={styles.magCinemaShelfHead}><strong>FEATURED STORIES</strong><span>SWIPE TO EXPLORE {magazineIcon(15)}</span></div><div className={styles.magCinemaRail}>{magazineStories.slice(0,12).map((story,i)=><Link key={story.id} className={styles.magCinemaTile} href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}><div className={styles.magCinemaTileArt} style={story.cover?{backgroundImage:`url("${encodeURI(story.cover)}")`}:undefined}>{!story.cover&&<span>Q</span>}</div><small>THE QIBLA · {String(i+1).padStart(2,"0")}</small><strong>{story.title}</strong></Link>)}</div></div>}

    <div className={styles.magHeader}><p>1QIBLA · THE MAGAZINE</p><h1>THE QIBLA</h1><div className={styles.magRule}/><span>FAITH, IDENTITY & IDEAS FOR A NEW GENERATION</span></div>
    <div className={styles.magIntro}><span>THE LATEST EDITION</span><span>THE NEXT GENERATION OF MUSLIM VOICES</span></div>
    <label className={styles.search}><span className={styles.srOnly}>Search articles</span><input placeholder="Search the magazine…" value={query} onChange={e=>setQuery(e.target.value)} type="search"/></label>
    {loading?<p className={styles.notice}>Preparing the magazine…</p>:error?<p className={styles.notice} role="alert">{error}</p>:!hero?<div className={styles.demoSection}><p className={styles.demoLabel}>DESIGN PREVIEW · SAMPLE STORIES · NOT PUBLISHED</p><article className={styles.demoCover}><div className={styles.demoArtwork}><span>THE<br/>NEXT<br/>GEN.</span></div><div><span className={styles.kicker}>THE COVER STORY · SAMPLE</span><h2>{magazineSamples[0].title}</h2><p>{magazineSamples[0].summary}</p><details><summary>Preview the story</summary><p>{magazineSamples[0].body}</p></details></div></article><div className={styles.sectionTitle}><h2>THE EDIT</h2><span>DEMONSTRATION EDITION</span></div><div className={styles.demoGrid}>{magazineSamples.map((s,i)=><article className={styles.demoMagCard} key={s.title}><div className={styles.demoCardVisual}><span>0{i+1}</span></div><span className={styles.kicker}>{s.category}</span><h3>{s.title}</h3><p>{s.summary}</p><details><summary>Read sample</summary><p>{s.body}</p></details></article>)}</div></div>:<>
     <article className={styles.feature}>
      <Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`} className={styles.featureVisual} style={hero.cover?{backgroundImage:`url("${encodeURI(hero.cover)}")`}:undefined} aria-label={`Read ${hero.title}`}>{!hero.cover&&<span>Q</span>}</Link>
      <div className={styles.featureText}><span className={styles.kicker}>THE COVER STORY</span><h2>{editorialTitle(hero.title)}</h2><p className={styles.editorialDeck}>{hero.description.slice(0,290)}</p><Link href={`/qibla/newsroom/${encodeURIComponent(hero.id)}`}>READ THE STORY</Link></div>
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
    <div id="qibla-latest" className={styles.paperContent}>
     <div className={styles.paperSectionLabel}>THE LATEST <span>{newsletterStories.length?"PUBLISHED NEWSLETTER STORIES":"NO PUBLISHED NEWSLETTERS YET"}</span></div>
     {newsletterStories.length? <>
      <div className={styles.paperLead}>
       <div className={styles.paperLeadCopy}><span className={styles.paperKicker}>LATEST REPORT</span><h2><Link href={`/qibla/newsroom/${encodeURIComponent(newsletterStories[0].id)}`}>{newsletterStories[0].title}</Link></h2><p>{newsletterStories[0].description.slice(0,340)}</p><small>1MUSLIM QIBLA · PUBLISHED NEWSLETTER</small></div>
       <Link href={`/qibla/newsroom/${encodeURIComponent(newsletterStories[0].id)}`} className={styles.paperLeadVisual} style={newsletterStories[0].cover?{backgroundImage:`url("${encodeURI(newsletterStories[0].cover)}")`,backgroundSize:"cover",backgroundPosition:"center"}:undefined} aria-label={`Read ${newsletterStories[0].title}`}>{!newsletterStories[0].cover&&<span>THE QIBLA</span>}</Link>
      </div>
      <div className={styles.paperRows}>{newsletterStories.slice(1).map((story,i)=><article className={styles.paperRow} id={i===0?"qibla-world":i===1?"qibla-community":undefined} key={story.id}><span className={styles.paperKicker}>QIBLA REPORT</span><h3><Link href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}>{story.title}</Link></h3>{story.cover&&<Link href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}><img src={story.cover} alt={story.title} style={{width:"100%",maxHeight:360,objectFit:"cover",borderRadius:4}}/></Link>}<p>{story.description.slice(0,350)}</p><Link href={`/qibla/newsroom/${encodeURIComponent(story.id)}`}>READ FULL REPORT ↗</Link></article>)}</div>
     </>:<p className={styles.paperCaption}>Published newsletter articles will appear here automatically.</p>}
    </div>
    <div className={styles.newsColumns}><div><span className={styles.kicker}>THE DAILY BRIEF</span><h2>Stay informed.<br/>Stay connected.</h2><p>Explore published newsletters, current affairs, community updates and thoughtful reporting in our growing archive.</p><Link className={styles.newsCTA} href="/qibla/newsletters">OPEN THE NEWSLETTER ARCHIVE</Link></div><aside><span>FROM THE EDITOR</span><p>One community. Many stories. One direction.</p><Link href="/qibla/newsroom/about">ABOUT 1QIBLA</Link></aside></div>
   </section>
  </div>
  <footer className={styles.footer}><nav className={styles.footerGrid} aria-label="Qibla footer"><Link href="/qibla/studio">EDITORIAL STUDIO</Link><Link href="/qibla/command">COMMAND CENTER</Link><Link href="/qibla/newsroom/apply">CONTRIBUTE</Link><Link href="/">1MUSLIM HOME</Link><Link href="/terms">TERMS & CONDITIONS</Link><Link href="/privacy">PRIVACY POLICY</Link><Link href="/data-policy">DATA POLICY</Link></nav><div className={styles.footerCopyright}>© 2026 1Muslim. All rights reserved.</div></footer>
 </main>
}
