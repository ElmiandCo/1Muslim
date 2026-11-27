"use client";
import "./search.css";
import "./search-results.css";
import "./search-magnetic.css";
import "./search-feature-rails.css";
import SearchFeatureRails from "./SearchFeatureRails";
import SearchAuthFlow,{type SearchAuthMode} from "../components/SearchAuthFlow";
import dynamic from "next/dynamic";
const HudHudShahadaV2=dynamic(()=>import("../components/HudHudShahadaV2"),{ssr:false,loading:()=>null});
import Link from "next/link";
import WebSearchPanel,{type GlobalSearchMode} from "../components/WebSearchPanel";
import { useSearchMagneticMotion } from "./useSearchMagneticMotion";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DiscoverKind, DiscoverItem, DiscoverResponse } from "../lib/discover-search";

type Tab = GlobalSearchMode | DiscoverKind;
const CATEGORIES: DiscoverKind[] = ["Videos","Posts","People","Movies & Series","Qur’an","Comments","Lessons","Prayer","Live","Qibla"];
const TABS: Tab[] = ["All","AI Overview","Web","Images","Videos","News", ...CATEGORIES.filter(c=>c!=="Videos")];
const ICON: Record<DiscoverKind,string> = {
  "Videos":"▶","Posts":"▤","People":"◉","Movies & Series":"▣","Qur’an":"۞",
  "Comments":"◌","Lessons":"✦","Prayer":"☾","Live":"●","Qibla":"✧"
};
const historyKey = "1muslim:discover:recent-searches";
function short(s:string,n=130){return s.length>n?s.slice(0,n).trimEnd()+"…":s}
function ResultCard({item,small=false}:{item:DiscoverItem;small?:boolean}) {
  const isPeople=item.kind==="People";
  const isText=["Qur’an","Comments","Lessons","Prayer","Qibla"].includes(item.kind)&&!item.image;
  return <Link className={"dsCard dsCard"+(isPeople?"Person":isText?"Text":"Media")+(small?" dsCardSmall":"")} href={item.href}
    aria-label={"Open "+item.kind+": "+item.title}>
    {isPeople ? <div className="dsPersonAvatar">{item.image?<img src={item.image} alt="" loading="lazy" />:<span>{item.title.slice(0,1).toUpperCase()}</span>}</div>
    : <div className={"dsCardVisual "+(item.image?"dsCardHasImage":"")} aria-hidden="true">
      {item.image?<img src={item.image} alt="" loading="lazy" />:<><span className="dsCardGlyph">{ICON[item.kind]}</span><span className="dsCardWatermark">{item.kind}</span></>}
      {item.media==="video"&&<span className="dsPlayIcon">▶</span>}
    </div>}
    <div className="dsCardBody">
      <div className="dsCardTags"><span>{item.badge||item.kind}</span>{item.score>=85&&<em>Best match</em>}</div>
      <strong>{short(item.title,104)}</strong>
      <p>{short(item.description,145)}</p>
      <div className="dsCardEnd"><span>{short(item.byline||item.kind,28)}</span><span aria-hidden="true">↗</span></div>
    </div>
  </Link>;
}

function ResultRail({title,subtitle,items,category}:{title:string;subtitle:string;items:DiscoverItem[];category?:DiscoverKind}) {
  const scrollRef=useRef<HTMLDivElement>(null);
  if(!items.length)return null;
  return <section className="dsRailSection" aria-label={title}>
    <div className="dsSectionHead"><div><span className="dsSectionKicker">{category?ICON[category]+" "+category.toUpperCase():"RELEVANT TO YOUR SEARCH"}</span><h2>{title}</h2><p>{subtitle}</p></div>
      <div className="dsRailArrows"><button type="button" aria-label={"Scroll "+title+" left"} onClick={()=>scrollRef.current?.scrollBy({left:-440,behavior:"smooth"})}>‹</button><button type="button" aria-label={"Scroll "+title+" right"} onClick={()=>scrollRef.current?.scrollBy({left:440,behavior:"smooth"})}>›</button></div>
    </div>
    <div ref={scrollRef} className="dsRail" role="list">{items.map(item=><div role="listitem" key={item.kind+":"+item.id}><ResultCard item={item}/></div>)}</div>
  </section>;
}

function DirectoryResultList({items}:{items:DiscoverItem[]}){
 if(!items.length)return null;
 return <section className="dsOrganicDirectory" aria-label="Best 1Muslim matches">
   <div className="dsOrganicHeader"><span className="dsSectionKicker">FROM 1MUSLIM</span><h2>Results from your Ummah</h2></div>
   <div className="dsOrganicResults">{items.map(item=><article className="dsOrganicResult" key={item.kind+":"+item.id}>
     <Link href={item.href} className="dsOrganicLink">
       <span className="dsOrganicSourceIcon" aria-hidden="true">{item.kind==="People"?"◉":item.kind==="Qur’an"?"۞":"1M"}</span>
       <span className="dsOrganicIdentity"><strong>1Muslim · {item.kind}</strong><small>{item.byline||"1Muslim community"}</small></span>
     </Link>
     <div className="dsOrganicBody">
       <div className="dsOrganicCopy"><h3><Link href={item.href}>{item.title}</Link></h3>
         {item.description&&<p>{item.description}</p>}</div>
       {item.image&&<Link href={item.href} className="dsOrganicThumbnail" aria-label={"View "+item.title}><img src={item.image} alt="" loading="lazy"/></Link>}
     </div>
   </article>)}</div>
 </section>;
}
export default function SearchHub() {
  const router=useRouter();
  const magneticRoot=useRef<HTMLElement>(null);
  useSearchMagneticMotion(magneticRoot);
  const [query,setQuery]=useState("");
  const [submitted,setSubmitted]=useState("");
  const [tab,setTab]=useState<Tab>("All");
  const [recent,setRecent]=useState<string[]>([]);
  const [result,setResult]=useState<DiscoverResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const searchField=useRef<HTMLInputElement>(null);
  const requestCount=useRef(0);
  const [compactHeader,setCompactHeader]=useState(false);
  const [hudhudDocked,setHudhudDocked]=useState(false);
  const [signoutConfirm,setSignoutConfirm]=useState(false);
  const [signoutBusy,setSignoutBusy]=useState(false);
  const [authMode,setAuthMode]=useState<SearchAuthMode|null>(null);
  const [authLeaving,setAuthLeaving]=useState(false);
  const [authReturn,setAuthReturn]=useState("/search");
  const [authQuery,setAuthQuery]=useState("");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const mode=params.get("auth");
    if(["signin","signup","shahada","recover"].includes(mode||""))setAuthMode(mode as SearchAuthMode);
    const next=params.get("next")||"/search";
    if(next.startsWith("/")&&!next.startsWith("//")&&!next.startsWith("/\\")&&!next.includes("://"))setAuthReturn(next);
  },[]);
  const openAuth=(mode:SearchAuthMode)=>{
    if(!authMode)setAuthQuery(query);
    setQuery("");setSubmitted("");setTab("All");setAuthLeaving(false);setAuthMode(mode);
    try{window.history.replaceState({}, "", "/search?auth="+mode);}catch{}
  };
  const closeAuth=()=>{
    setAuthLeaving(true);
    window.setTimeout(()=>{
      setAuthMode(null);setAuthLeaving(false);
      try{window.history.replaceState({}, "", authQuery?"/search?q="+encodeURIComponent(authQuery):"/search");}catch{}
      if(authQuery){setQuery(authQuery);setSubmitted(authQuery)}
    },220);
  };
  const [resultsNight,setResultsNight]=useState(true);
  // First-visit reveal happens at the wordmark's FINAL layout position.
  // It never shows a second, floating copy of the brand or blocks repeat searches.
  const [introStage,setIntroStage]=useState<"pending"|"playing"|"done">("pending");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const hasQuery=Boolean(params.get("q")?.trim());
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const key="1muslim:search-intro:v1";
    let seen=false;
    try{seen=sessionStorage.getItem(key)==="seen"}catch{}
    if(hasQuery||reduced||seen){setIntroStage("done");return}
    try{sessionStorage.setItem(key,"seen")}catch{}
    // The server paints a completely quiet, white Search Home first.
    // The wordmark reveals in place, then search controls arrive in one second.
    setIntroStage("playing");
    const timer=window.setTimeout(()=>setIntroStage("done"),1000);
    return()=>window.clearTimeout(timer);
  },[]);
  // The same Search Home renders for visitors and members; only account actions differ.
  const [account,setAccount]=useState<"checking"|"guest"|"member">("checking");
  useEffect(()=>{
    let active=true;
    const db=createClient();
    void db.auth.getUser().then(({data:{user}})=>{
      if(active)setAccount(user?"member":"guest");
    }).catch(()=>{if(active)setAccount("guest")});
    const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
      if(!active)return;
      if(event==="SIGNED_OUT")setAccount("guest");
      if(event==="SIGNED_IN"&&session?.user)setAccount("member");
    });
    return()=>{active=false;subscription.unsubscribe()};
  },[]);
  useEffect(()=>{
    if(account!=="member"||authMode!=="signin")return;
    let active=true;
    // A returning verified member goes straight back to their work.
    // First-time and unfinished members stay here with HudHud for Shahada.
    void (async()=>{
      const db=createClient();
      const {data:{user}}=await db.auth.getUser();
      if(!active||!user)return;
      const {data:profile}=await db.from("profiles").select("shahada_verified_at").eq("id",user.id).maybeSingle();
      if(!active)return;
      if(!profile?.shahada_verified_at){setAuthMode("shahada");return}
      if(authReturn!=="/search"){router.replace(authReturn);return}
      closeAuth();
    })();
    return()=>{active=false};
  },[account,authMode,authReturn,router]);
  useEffect(()=>{try{const saved=localStorage.getItem("1muslim:search-results-theme");if(saved==="day"||saved==="night")setResultsNight(saved==="night");}catch{}},[]);
  const toggleResultsTheme=()=>setResultsNight(old=>{try{localStorage.setItem("1muslim:search-results-theme",old?"day":"night");}catch{}return !old;});

  useEffect(()=>{
    // HudHud is not interactive during its brief entry animation.
    const timer=window.setTimeout(()=>setHudhudDocked(true),1050);
    return()=>window.clearTimeout(timer);
  },[]);

  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem(historyKey)||"[]");
      if(Array.isArray(saved))setRecent(saved.filter((x):x is string=>typeof x==="string").slice(0,10));}
    catch{}
    const initial=new URLSearchParams(window.location.search).get("q")||"";
    if(initial){setQuery(initial.slice(0,90));setSubmitted(initial.slice(0,90));}
  },[]);
  useEffect(()=>{
    const onScroll=()=>setCompactHeader(window.scrollY>140);
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);
  useEffect(()=>{
    const current=++requestCount.current;
    if(query.trim().length===1){setLoading(false);return;}
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      setLoading(true);setError("");
      try{
        const r=await fetch("/api/discover/search?q="+encodeURIComponent(query.trim()),{signal:controller.signal,cache:"no-store"});
        if(!r.ok)throw new Error("Could not search 1Muslim right now.");
        const data=await r.json() as DiscoverResponse;
        if(!controller.signal.aborted&&current===requestCount.current)setResult(data);
      } catch(e) {
        if(!controller.signal.aborted&&current===requestCount.current)setError(e instanceof Error?e.message:"Search unavailable");
      } finally {
        if(!controller.signal.aborted&&current===requestCount.current)setLoading(false);
      }
    },query.trim()?320:25);
    return()=>{controller.abort();window.clearTimeout(timer);};
  },[query]);

  const commit=(value:string)=>{
    const clean=value.trim().slice(0,90);if(!clean)return;
    setQuery(clean);setSubmitted(clean);setTab("All");
    const next=[clean,...recent.filter(x=>x.toLowerCase()!==clean.toLowerCase())].slice(0,10);
    setRecent(next);try{localStorage.setItem(historyKey,JSON.stringify(next));window.history.replaceState({}, "", "/search?q="+encodeURIComponent(clean));}catch{}
    searchField.current?.blur();
  };
  const clear=()=>{setQuery("");setSubmitted("");setTab("All");try{window.history.replaceState({}, "", "/search");}catch{};searchField.current?.focus();};
  const remove=(term:string)=>{const next=recent.filter(s=>s!==term);setRecent(next);try{localStorage.setItem(historyKey,JSON.stringify(next))}catch{}};
  const showSuggestions=Boolean(query.trim().length>=2&&query.trim().toLowerCase()!==submitted.toLowerCase());
  const suggestions=useMemo(()=>[...new Set([
    ...result?.best?.filter(x=>x.title.toLowerCase().includes(query.toLowerCase())&&x.title.length<45).map(x=>x.title)||[],
    ...result?.suggestions?.filter(x=>x.toLowerCase().includes(query.toLowerCase()))||[]
  ])].slice(0,6),[result,query]);
  const topMatches=result?.best||[];
  const visibleCategories=tab==="All"?CATEGORIES:CATEGORIES.filter(c=>c===tab);
  const showDirectory=tab==="All"||CATEGORIES.includes(tab as DiscoverKind);
  const showGlobal=tab==="All"||tab==="Web"||tab==="Images"||tab==="Videos"||tab==="News"||tab==="AI Overview";
  const totalFor=(name:DiscoverKind)=>(result?.groups?.[name]||[]).length;

  const openHudHud=()=>{
    const context=(submitted||query).trim().slice(0,90);
    router.push("/hudhud"+(context?"?q="+encodeURIComponent(context):""));
  };
  const completeShahada=()=>{
    setAccount("member");setAuthLeaving(true);
    try{sessionStorage.removeItem("1muslim:shahada-pending")}catch{}
    const next=authReturn;
    if(next!=="/search"&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("://")){
      window.setTimeout(()=>router.replace(next),240);
      return;
    }
    closeAuth();
  };
  const signOut=async()=>{
    if(signoutBusy)return;
    setSignoutBusy(true);
    try{
      const {error}=await createClient().auth.signOut();
      if(error)throw error;
      setSignoutConfirm(false);
      router.replace("/");
      router.refresh();
    }catch(e){
      window.alert(e instanceof Error?e.message:"Could not sign out right now.");
    }finally{setSignoutBusy(false);}
  };
  const homeMode=!query.trim();
  const showAuth=authMode!==null;
  return <main ref={magneticRoot} className={"dsPage "+(homeMode?"dsHomeMode dsIntro"+(introStage==="pending"?"Pending":introStage==="playing"?"Playing":"Done"):"dsResultsMode "+(resultsNight?"dsResultsNight":"dsResultsDay"))+(showAuth?" dsInlineAuthOpen":"")+(authLeaving?" dsInlineAuthLeaving":"")}>
    <nav className="dsHomeUtilities" aria-label="Account shortcuts">
      {!homeMode&&<Link href="/search" className="dsResultsBrand" aria-label="One Muslim Live — return to search home" onClick={e=>{e.preventDefault();clear()}}><span>One Muslim</span><span className="dsHomeBrandLive" aria-hidden="true">.live</span></Link>}
      {!homeMode&&<button type="button" className="dsUtilityButton dsResultsThemeToggle" onClick={toggleResultsTheme} aria-label={resultsNight?"Switch search results to light mode":"Switch search results to dark mode"} title={resultsNight?"Light appearance":"Dark appearance"} aria-pressed={resultsNight}><span aria-hidden="true">{resultsNight?"☼":"◐"}</span></button>}
      {account==="guest"?<div className="dsGuestAccount" aria-label="Account access">
        <Link href="/auth?next=%2Fsearch&login=1" onClick={e=>{e.preventDefault();openAuth("signin")}} className="dsGuestSignIn" aria-label="Sign in" title="Sign in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.4 20c.4-4 2.7-6 6.6-6s6.2 2 6.6 6"/></svg></Link>
        <Link href="/auth?next=%2Fsearch&mode=signup" onClick={e=>{e.preventDefault();openAuth("signup")}} className="dsGuestJoin"><span className="dsGuestJoinFull">Join 1Muslim</span><span className="dsGuestJoinCompact">Join</span></Link>
      </div>:account==="member"?<>
      <Link href="/settings" aria-label="Settings" title="Settings" className="dsUtilityButton">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.4 1.6.9 2.4-.7 2 3.5-1.8 1.7v1.9l1.8 1.7-2 3.5-2.4-.7-1.6.9L14 20h-4l-.6-2.4-1.6-.9-2.4.7-2-3.5 1.8-1.7v-1.9L3.4 8.6l2-3.5 2.4.7 1.6-.9L10 2Z"/></svg>
      </Link>
      <Link href="/profile" aria-label="Profile" title="Profile" className="dsUtilityButton">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.4 20c.4-4 2.7-6 6.6-6s6.2 2 6.6 6"/></svg>
      </Link>
      <button type="button" aria-label="Sign out" title="Sign out" className="dsUtilityButton" onClick={()=>setSignoutConfirm(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg>
      </button>
      </>:null}
    </nav>
    <header className={"dsHeader"+(compactHeader?" dsHeaderCompact":"")}>
      <h1 className="dsHomeBrand" aria-hidden={!homeMode}><span>One Muslim</span><span className="dsHomeBrandLive" aria-hidden="true">.live</span></h1>
      <div className="dsHeaderRow">
        <Link href="/search" className="dsBack" aria-label="Back to search home" onClick={e=>{e.preventDefault();showAuth?closeAuth():clear()}}>‹</Link>
        <form className="dsSearchForm" role="search" aria-hidden={showAuth} onSubmit={e=>{e.preventDefault();if(!showAuth)commit(query);}}>
          <span aria-hidden="true">⌕</span>
          <input ref={searchField} type="search" autoComplete="off" aria-label="Search all of 1Muslim" placeholder="Search 1Muslim with HudHud" value={query}
            onChange={e=>setQuery(e.target.value)} />
          {query&&<button className="dsClear" type="button" aria-label="Clear search" onClick={clear}>×</button>}
          <button type="button" className={"dsHudDock"+(hudhudDocked?" isDocked":"")} aria-label={hudhudDocked?"Ask HudHud AI search assistant":"HudHud is getting ready"} title="Ask HudHud" aria-hidden={!homeMode} tabIndex={homeMode?0:-1} disabled={!homeMode||!hudhudDocked} onClick={()=>void openHudHud()}>
            <img src="/assets/hudhud-logo.PNG" alt="" aria-hidden="true"/>
          </button>
        </form>
        <button className="dsSearchSubmit" type="button" onClick={()=>commit(query)}>Search</button>
        {showAuth&&authMode!=="shahada"&&<SearchAuthFlow mode={authMode!} setMode={next=>{setAuthMode(next);try{window.history.replaceState({}, "", "/search?auth="+next)}catch{}}} onClose={closeAuth} onSignedIn={()=>setAccount("member")} returnTo={authReturn}/>}
        {showAuth&&authMode==="shahada"&&<div className="dsShahadaInlineHeading"><span>HudHud</span></div>}
      </div>
      <div className="dsCategoryBar">
        <nav className="dsTabs" aria-label="Discover categories">
          {TABS.map(name=><button key={name} type="button" className={tab===name?"active":""} aria-pressed={tab===name} onClick={()=>{setTab(name);setSubmitted(query.trim());}}>
            {name}
          </button>)}
        </nav>
        <button className="dsHudTab" type="button" title="Ask HudHud" aria-label="Ask HudHud AI search assistant" onClick={()=>void openHudHud()}>
          <img src="/assets/hudhud-logo.PNG" alt="" aria-hidden="true"/><span>HudHud</span>
        </button>
      </div>
    </header>

    {showAuth&&authMode==="shahada"&&<section className="dsAuthShahada" aria-label="Shahada verification">
      {account==="member"?<HudHudShahadaV2 embedded returnTo={authReturn} onComplete={completeShahada} onExit={closeAuth}/>:account==="checking"?<p role="status">Preparing your secure Shahada session…</p>:<div className="dsAuthShahadaWait"><strong>Confirm your email to begin</strong><p>Once your account is verified, sign in here and HudHud will guide your Shahada.</p><button type="button" onClick={()=>openAuth("signin")}>Sign in</button></div>}
    </section>}
    {!showAuth&&showSuggestions&&<section className="dsSuggestions" aria-label="Search suggestions">
      <span className="dsSectionKicker">SUGGESTED MATCHES</span>
      {suggestions.map(text=><button key={text} type="button" onClick={()=>commit(text)}><span className="dsSuggestIcon">⌕</span><span>{text}</span><b aria-hidden="true">↗</b></button>)}
      <button className="dsSuggestSearchAll" type="button" onClick={()=>commit(query)}>Search the web and 1Muslim for “{query}” <span aria-hidden="true">→</span></button>
    </section>}



    {!showAuth&&<div className="dsContent">
      {!homeMode&&submitted.trim().length>=2&&showGlobal&&<WebSearchPanel query={submitted} mode={tab as GlobalSearchMode}/>}
      {homeMode&&<div className="dsHomeIntro">
        {recent.length>0&&<section className="dsRecent" aria-labelledby="dsRecentTitle">
          <div className="dsSectionHead"><div><h2 id="dsRecentTitle">Recent searches</h2></div>
            {recent.length>0&&<button type="button" className="dsQuietButton" onClick={()=>{setRecent([]);try{localStorage.removeItem(historyKey)}catch{}}}>Clear all</button>}</div>
          {recent.length?<div className="dsRecentList">{recent.map(s=><div className="dsRecentItem" key={s}><button type="button" onClick={()=>commit(s)}><span>◷</span>{s}</button><button type="button" aria-label={"Remove "+s} onClick={()=>remove(s)}>×</button></div>)}</div>
            :<p className="dsEmptyRecent">Your searches will appear here, only on this device.</p>}
        </section>}
        <div className="dsHomeFeatureBreathingSpace" aria-hidden="true" />
      </div>}

      {!homeMode&&loading&&showDirectory&&<div className="dsLoading" role="status"><span className="dsLoadingLine"/><span>Searching the 1Muslim directory…</span><div className="dsSkeletonRow"><i/><i/><i/></div></div>}
      {!homeMode&&showDirectory&&error&&<div className="dsError" role="alert">{error}<button onClick={()=>setQuery(s=>s+" ")}>Try again</button></div>}
      {!homeMode&&!loading&&!error&&result&&showDirectory&&<>
        {(query.trim().length>=2||submitted)&&<section className="dsResultIntro">
          <span className="dsResultStats">{result.total} results on 1Muslim · {CATEGORIES.filter(c=>totalFor(c)>0).length} categories{result.partial?" · Some sources temporarily unavailable":""}</span>
          <button className="dsSearchWithHud" type="button" onClick={()=>void openHudHud()}>✦ Ask HudHud about these results <span>→</span></button>
        </section>}
        {tab==="All"&&topMatches.length>0&&query.trim()&&<DirectoryResultList items={topMatches.slice(0,7)} />}
        {visibleCategories.map(category=><ResultRail key={category} category={category} title={category==="Movies & Series"?"Movies, shows & series":category==="Qur’an"?"Qur’an verses & chapters":category}
          subtitle={category==="Comments"?"Conversations happening in Ummah posts.":category==="People"?"Members and creators you can connect with.":category==="Qur’an"?"Verified verse references and English translation search.":"Explore related "+category.toLowerCase()+" on 1Muslim."}
          items={result.groups[category]||[]} />)}
        {query.trim()&&result.total===0&&<section className="dsNoResults"><span>⌕</span><h2>Let’s narrow it down</h2>
          <p>Try a creator name, phrase, film title, surah, or subject. HudHud can help you search the right part of 1Muslim.</p>
          <button type="button" onClick={()=>void openHudHud()}>Ask HudHud →</button></section>}
      </>}
      {homeMode&&<SearchFeatureRails/>}
    </div>}


    {account==="member"&&signoutConfirm&&<div className="dsSignoutBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSignoutConfirm(false)}}>
      <div className="dsSignoutDialog" role="dialog" aria-modal="true" aria-labelledby="dsSignoutTitle">
        <h2 id="dsSignoutTitle">Sign out of One Muslim?</h2>
        <div className="dsSignoutActions">
          <button type="button" onClick={()=>setSignoutConfirm(false)} disabled={signoutBusy}>Cancel</button>
          <button type="button" onClick={()=>void signOut()} disabled={signoutBusy}>{signoutBusy?"Signing out…":"Sign out"}</button>
        </div>
      </div>
    </div>}


  </main>;
}
