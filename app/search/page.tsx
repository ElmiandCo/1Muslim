"use client";
import "./search.css";
import "./search-results.css";
import "./search-magnetic.css";
import Link from "next/link";
import WebSearchPanel,{type GlobalSearchMode} from "../components/WebSearchPanel";
import { useSearchMagneticMotion } from "./useSearchMagneticMotion";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { DiscoverKind, DiscoverItem, DiscoverResponse } from "../lib/discover-search";

type Tab = GlobalSearchMode | DiscoverKind;
type ChatLine = { role: "user" | "assistant"; content: string; matches?: DiscoverItem[] };
type SuggestedCreator = { id:string; handle:string; displayName:string; avatarUrl:string|null; postCount:number; href:string };
const CATEGORIES: DiscoverKind[] = ["Videos","Posts","People","Movies & Series","Qur’an","Comments","Lessons","Prayer","Live","Qibla"];
const TABS: Tab[] = ["All","AI Overview","Web","Images","Videos","News", ...CATEGORIES.filter(c=>c!=="Videos")];
const ICON: Record<DiscoverKind,string> = {
  "Videos":"▶","Posts":"▤","People":"◉","Movies & Series":"▣","Qur’an":"۞",
  "Comments":"◌","Lessons":"✦","Prayer":"☾","Live":"●","Qibla":"✧"
};
const historyKey = "1muslim:discover:recent-searches";
const explore: Array<{label:string;href:string;icon:string;details:string}> = [
  {label:"Ummah Posts",href:"/posts",icon:"▤",details:"What your Ummah is sharing"},
  {label:"DeepWatch",href:"/deepwatch",icon:"▶",details:"Films, shows and series"},
  {label:"LIVE",href:"/streaming",icon:"●",details:"Join the conversation"},
  {label:"Qur’an",href:"/quran-library",icon:"۞",details:"Explore all 114 chapters"},
  {label:"Prayer Journey",href:"/widget-tools/prayer",icon:"☾",details:"Prayer times and learning"},
  {label:"Qibla",href:"/qibla/newsroom",icon:"✧",details:"Stories and editorials"}
];
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
  const [creators,setCreators]=useState<SuggestedCreator[]>([]);
  const [creatorsLoading,setCreatorsLoading]=useState(true);
  const [result,setResult]=useState<DiscoverResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [hudOpen,setHudOpen]=useState(false);
  const [chat,setChat]=useState<ChatLine[]>([]);
  const [chatInput,setChatInput]=useState("");
  const [chatBusy,setChatBusy]=useState(false);
  const [chatError,setChatError]=useState("");
  const [remaining,setRemaining]=useState<number|null>(3);
  const [unlocked,setUnlocked]=useState(false);
  const [limitReached,setLimitReached]=useState(false);
  const chatEnd=useRef<HTMLDivElement>(null);
  const searchField=useRef<HTMLInputElement>(null);
  const requestCount=useRef(0);
  const [compactHeader,setCompactHeader]=useState(false);
  const [hudhudDocked,setHudhudDocked]=useState(false);
  const [signoutConfirm,setSignoutConfirm]=useState(false);
  const [signoutBusy,setSignoutBusy]=useState(false);
  const [resultsNight,setResultsNight]=useState(true);
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
    const controller=new AbortController();
    void fetch("/api/discover/creators",{signal:controller.signal,cache:"no-store"})
      .then(async response=>{if(!response.ok)throw Error("Unable to load creators");return response.json();})
      .then(data=>{if(!controller.signal.aborted)setCreators(Array.isArray(data.recommended)?data.recommended.slice(0,7):[]);})
      .catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setCreatorsLoading(false);});
    return()=>controller.abort();
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
  useEffect(()=>{if(hudOpen)chatEnd.current?.scrollIntoView({behavior:"smooth",block:"end"});},[chat,hudOpen,chatBusy]);

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

  const openHudHud=async()=>{
    setHudOpen(true);setChatError("");
    try {
      const response=await fetch("/api/discover/ask",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not check HudHud availability.");
      setRemaining(typeof data.remaining==="number"?data.remaining:null);
      setUnlocked(Boolean(data.unlocked));setLimitReached(data.remaining===0);
    } catch(e){setChatError(e instanceof Error?e.message:"HudHud is unavailable");}
  };
  const ask=async(e:FormEvent)=>{
    e.preventDefault();
    const message=chatInput.trim();if(!message||chatBusy||limitReached)return;
    const history=chat.map(x=>({role:x.role,content:x.content})).slice(-6);
    setChat(previous=>[...previous,{role:"user",content:message}]);
    setChatInput("");setChatBusy(true);setChatError("");
    try{
      const response=await fetch("/api/discover/ask",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:submitted||query,message,history})
      });
      const data=await response.json();
      if(data.limitReached&&(!response.ok||data.remaining===0)){setLimitReached(true);setRemaining(0);}
      if(!response.ok)throw new Error(data.error||"HudHud could not reply.");
      setChat(previous=>[...previous,{role:"assistant",content:data.reply,matches:data.matches||[]}]);
      if(typeof data.remaining==="number")setRemaining(data.remaining);
      if(data.unlocked)setUnlocked(true);
    }catch(e){
      // Failed requests do not count as completed turns; keep the draft for retry.
      setChat(previous=>previous.slice(0,-1));setChatInput(message);
      setChatError(e instanceof Error?e.message:"Could not ask HudHud");
    }finally{setChatBusy(false);}
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
  return <main ref={magneticRoot} className={"dsPage "+(homeMode?"dsHomeMode":"dsResultsMode "+(resultsNight?"dsResultsNight":"dsResultsDay"))}>
    <nav className="dsHomeUtilities" aria-label="Account shortcuts">
      {!homeMode&&<Link href="/search" className="dsResultsBrand" aria-label="One Muslim Live — return to search home"><span>One Muslim</span><span className="dsHomeBrandLive" aria-hidden="true">.live</span></Link>}
      {!homeMode&&<button type="button" className="dsUtilityButton dsResultsThemeToggle" onClick={toggleResultsTheme} aria-label={resultsNight?"Switch search results to light mode":"Switch search results to dark mode"} title={resultsNight?"Light appearance":"Dark appearance"} aria-pressed={resultsNight}><span aria-hidden="true">{resultsNight?"☼":"◐"}</span></button>}
      <Link href="/settings" aria-label="Settings" title="Settings" className="dsUtilityButton">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.4 1.6.9 2.4-.7 2 3.5-1.8 1.7v1.9l1.8 1.7-2 3.5-2.4-.7-1.6.9L14 20h-4l-.6-2.4-1.6-.9-2.4.7-2-3.5 1.8-1.7v-1.9L3.4 8.6l2-3.5 2.4.7 1.6-.9L10 2Z"/></svg>
      </Link>
      <Link href="/profile" aria-label="Profile" title="Profile" className="dsUtilityButton">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.4 20c.4-4 2.7-6 6.6-6s6.2 2 6.6 6"/></svg>
      </Link>
      <button type="button" aria-label="Sign out" title="Sign out" className="dsUtilityButton" onClick={()=>setSignoutConfirm(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg>
      </button>
    </nav>
    <header className={"dsHeader"+(compactHeader?" dsHeaderCompact":"")}>
      <h1 className="dsHomeBrand" aria-hidden={!homeMode}><span>One Muslim</span><span className="dsHomeBrandLive" aria-hidden="true">.live</span></h1>
      <div className="dsHeaderRow">
        <Link href="/search" className="dsBack" aria-label="Back to search home">‹</Link>
        <form className="dsSearchForm" role="search" onSubmit={e=>{e.preventDefault();commit(query);}}>
          <span aria-hidden="true">⌕</span>
          <input ref={searchField} type="search" autoComplete="off" aria-label="Search all of 1Muslim" placeholder="Search the world, Qur’an, creators, videos…" value={query}
            onChange={e=>setQuery(e.target.value)} />
          {query&&<button className="dsClear" type="button" aria-label="Clear search" onClick={clear}>×</button>}
          <button type="button" className={"dsHudDock"+(hudhudDocked?" isDocked":"")} aria-label={hudhudDocked?"Ask HudHud AI search assistant":"HudHud is getting ready"} title="Ask HudHud" aria-hidden={!homeMode} tabIndex={homeMode?0:-1} disabled={!homeMode||!hudhudDocked} onClick={()=>void openHudHud()}>
            <img src="/assets/hudhud-logo.PNG" alt="" aria-hidden="true"/>
          </button>
        </form>
        <button className="dsSearchSubmit" type="button" onClick={()=>commit(query)}>Search</button>
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

    {showSuggestions&&<section className="dsSuggestions" aria-label="Search suggestions">
      <span className="dsSectionKicker">SUGGESTED MATCHES</span>
      {suggestions.map(text=><button key={text} type="button" onClick={()=>commit(text)}><span className="dsSuggestIcon">⌕</span><span>{text}</span><b aria-hidden="true">↗</b></button>)}
      <button className="dsSuggestSearchAll" type="button" onClick={()=>commit(query)}>Search the web and 1Muslim for “{query}” <span aria-hidden="true">→</span></button>
    </section>}



    <div className="dsContent">
      {!homeMode&&submitted.trim().length>=2&&showGlobal&&<WebSearchPanel query={submitted} mode={tab as GlobalSearchMode}/>}
      {homeMode&&<div className="dsHomeIntro">
        {recent.length>0&&<section className="dsRecent" aria-labelledby="dsRecentTitle">
          <div className="dsSectionHead"><div><h2 id="dsRecentTitle">Recent searches</h2></div>
            {recent.length>0&&<button type="button" className="dsQuietButton" onClick={()=>{setRecent([]);try{localStorage.removeItem(historyKey)}catch{}}}>Clear all</button>}</div>
          {recent.length?<div className="dsRecentList">{recent.map(s=><div className="dsRecentItem" key={s}><button type="button" onClick={()=>commit(s)}><span>◷</span>{s}</button><button type="button" aria-label={"Remove "+s} onClick={()=>remove(s)}>×</button></div>)}</div>
            :<p className="dsEmptyRecent">Your searches will appear here, only on this device.</p>}
        </section>}
        <section className="dsRecommended" aria-label="Recommended creators">
          <div className="dsSectionHead"><h2>Discover your Ummah</h2><span className="dsRecommendedLabel">People to explore</span></div>
          {creatorsLoading
            ? <div className="dsCreatorLoading" role="status">Finding creators across 1Muslim…</div>
            : creators.length>0
              ? <div className="dsCreatorList">{creators.slice(0,4).map((creator,index)=><Link className="dsCreatorRow" href={creator.href} key={creator.id} aria-label={"View "+creator.handle+" profile"}>
                <span className="dsCreatorRank">{String(index+1).padStart(2,"0")}</span>
                <span className="dsCreatorAvatar">{creator.avatarUrl?<img src={creator.avatarUrl} alt="" loading="lazy"/>:<span>{creator.displayName.slice(0,1).toUpperCase()}</span>}</span>
                <span className="dsCreatorName"><strong>{creator.handle}</strong><small>{creator.displayName}</small></span>
                <span className="dsCreatorPostCount">{creator.postCount} {creator.postCount===1?"post":"posts"}</span><span className="dsCreatorChevron" aria-hidden="true">↗</span>
              </Link>)}</div>
              : <p className="dsCreatorEmpty">Creator recommendations will appear here as the Ummah posts.</p>}
        </section>
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
      {homeMode&&<section className="dsExplore"><div className="dsSectionHead"><div><span className="dsSectionKicker">QUICK DESTINATIONS</span><h2>Explore 1Muslim</h2><p>Jump into the parts of your community you love most.</p></div></div>
        <div className="dsExploreGrid">{explore.map(x=><Link key={x.href} href={x.href}><span>{x.icon}</span><strong>{x.label}</strong><small>{x.details}</small><b aria-hidden="true">↗</b></Link>)}</div></section>}
    </div>


    {signoutConfirm&&<div className="dsSignoutBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSignoutConfirm(false)}}>
      <div className="dsSignoutDialog" role="dialog" aria-modal="true" aria-labelledby="dsSignoutTitle">
        <h2 id="dsSignoutTitle">Sign out of One Muslim?</h2>
        <div className="dsSignoutActions">
          <button type="button" onClick={()=>setSignoutConfirm(false)} disabled={signoutBusy}>Cancel</button>
          <button type="button" onClick={()=>void signOut()} disabled={signoutBusy}>{signoutBusy?"Signing out…":"Sign out"}</button>
        </div>
      </div>
    </div>}

    {hudOpen&&<div className="dsChatOverlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setHudOpen(false)}}>
      <aside className="dsChat" role="dialog" aria-modal="true" aria-labelledby="dsChatHeading">
        <div className="dsChatTop"><div className="dsChatAvatar">✦</div><div><span className="dsSectionKicker">1MUSLIM SEARCH COMPANION</span><h2 id="dsChatHeading">Ask HudHud <span>◉</span></h2></div>
          <button className="dsChatClose" aria-label="Close HudHud" type="button" onClick={()=>setHudOpen(false)}>×</button></div>
        <div className="dsChatScroll">
          <div className="dsChatWelcome"><strong>Assalamu alaikum. I'm HudHud.</strong><p>I'll sweep 1Muslim for relevant matches, then help you narrow down what you're looking for. What should we find?</p></div>
          {(result?.best.length||0)>0&&chat.length===0&&<div className="dsChatFound"><span>FOUND ON 1MUSLIM</span>
            {result?.best.slice(0,4).map(item=><Link key={item.kind+item.id} href={item.href} onClick={()=>setHudOpen(false)}><b>{ICON[item.kind]}</b><span>{short(item.title,58)}<small>{item.kind}</small></span><i>↗</i></Link>)}
          </div>}
          {chat.map((line,index)=><div className={"dsChatLine "+(line.role==="user"?"dsChatMine":"dsChatTheirs")} key={index}>
            <div className="dsChatBubble">{line.content}</div>
            {line.matches&&line.matches.length>0&&<div className="dsChatMatchLinks">{line.matches.slice(0,4).map(item=><Link key={item.kind+item.id} href={item.href} onClick={()=>setHudOpen(false)}>
              <span>{ICON[item.kind]}</span>{short(item.title,43)} <b>↗</b></Link>)}</div>}
          </div>)}
          {chatBusy&&<div className="dsChatThinking" role="status">✦ HudHud is reviewing relevant matches<span>···</span></div>}
          {chatError&&<p className="dsChatError" role="alert">{chatError}</p>}
          {(remaining===0||limitReached)&&!unlocked&&<div className="dsChatLimit">
            <span>✦ FREE HUDHUD PREVIEW COMPLETE</span><h3>Your three free replies are used.</h3>
            <p>Make HudHud yours throughout 1Muslim with Unlocked. Explore, learn, and find your way around the Ummah with more help.</p>
            <Link href="/unlocked">Discover 1Muslim Unlocked <span>↗</span></Link>
          </div>}
          <div ref={chatEnd}/>
        </div>
        <div className="dsChatBottom">
          <p className="dsChatRemaining">{unlocked?"✦ 1Muslim Unlocked · HudHud included":remaining===null?"Checking your free HudHud replies…":remaining+" of 3 free HudHud replies remaining"}</p>
          <form onSubmit={e=>void ask(e)}><input aria-label="Ask HudHud a question" placeholder={limitReached&&!unlocked?"Continue with 1Muslim Unlocked":"Ask about content, verses, movies…"}
            value={chatInput} onChange={e=>setChatInput(e.target.value)} maxLength={900} disabled={chatBusy||(limitReached&&!unlocked)}/>
            <button type="submit" aria-label="Send message" disabled={!chatInput.trim()||chatBusy||(limitReached&&!unlocked)}>↑</button></form>
          <small>Answers may be imperfect. Verify important information and Qur’an interpretations.</small>
        </div>
      </aside>
    </div>}
  </main>;
}
