import PlayIcon from "../components/icons/PlayIcon";
"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import HomeLiveConversation from "../components/HomeLiveConversation";
import {videoRegistry,isKidsVideo,type RegisteredVideo} from "../components/videoRegistry";
import "./deepwatch.css";

const officialSeries = [
 {title:"The Name I Need — Ramadan 2026",category:"Shows/Series",publisher:"Yaqeen Institute",url:"https://yaqeeninstitute.org/series/the-name-i-need-ramadan-2026"},
 {title:"Qur’an 30 for 30 — Season 7",category:"Educational Series",publisher:"Yaqeen Institute",url:"https://yaqeeninstitute.org/watch/series"},
 {title:"The Book of Heart Softeners — Dhul Hijjah 2026",category:"Shows/Series",publisher:"Yaqeen Institute",url:"https://yaqeeninstitute.org/series/the-book-of-heart-softeners-dhul-hijjah-2026"},
 {title:"Servants of the Most Merciful",category:"Shows/Series",publisher:"Yaqeen Institute",url:"https://yaqeeninstitute.org/series/servants-of-the-most-merciful"}
] as const;
/* Official Yaqeen uploads with confirmed YouTube watch pages; do not infer IDs for other episodes. */
const verifiedYaqeenEpisodes:RegisteredVideo[]=[
 {videoId:"A_8r2hoYDo0",title:"The Book of Heart Softeners — What Happens When We Die? | Dhul Hijjah 2026",category:"Series",categories:["Shows","Educational Series","Yaqeen Institute"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"e7TzVR84PLc",title:"Servants of the Most Merciful — Ep. 1: Those Who Walk on the Earth Humbly | Dr. Omar Suleiman",category:"Series",categories:["Shows","Educational Series","Yaqeen Institute"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"5kfDmMFWbMs",title:"Servants of the Most Merciful — Episode 1: The Benefits of Being Called Servants of the Most Merciful (2020)",category:"Series",categories:["Shows","Educational Series","Yaqeen Institute"],startSeconds:0,endSeconds:null,format:"desktop"}
];
/* Full-length official uploads: Islamic and general educational kids content. */
/* Creator-published, long-form Islamic films; keep outside the shared 100-slot feed registry. */
const officialIslamicFilms:RegisteredVideo[]=[
 {videoId:"ZtmfL6uZfa4",title:"The Stories of Prophet Adam, Yunus & Ibrahim (AS) — Animated Movie Compilation | One Islam Productions",category:"Animated Movies",categories:["Movies","Animation","Kids","Prophet Stories","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"wuNAlw5kmW8",title:"The Story of Prophet Ibrahim (AS) — Animated Full Movie | One Islam Productions",category:"Animated Movies",categories:["Movies","Animation","Kids","Prophet Stories","One Islam Productions"],startSeconds:0,endSeconds:null,format:"desktop"}
];
/* User-submitted YouTube livestream. Live status and embed permissions are checked by YouTube at playback time. */
const featuredLive:RegisteredVideo={videoId:"Xqycaqp0yWU",title:"Featured YouTube Live",category:"Live",categories:["Live","Featured Live"],startSeconds:0,endSeconds:null,format:"desktop"};
const curatedKidsVideos:RegisteredVideo[]=[
 {videoId:"CoHv_vQ8Gps",title:"Curious George — George Hears Loud Noises, Magnets & Doctor Monkey | 1 Hour",category:"Kids",categories:["Kids","Animation","Educational","Curious George"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"KilSYa-J3vU",title:"Curious George — 1 Hour Compilation | Official",category:"Kids",categories:["Kids","Animation","Educational","Curious George"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"RAnj0V452f8",title:"Sesame Street — Solve Mysteries on Sesame Street | 4 Full Episodes",category:"Kids",categories:["Kids","Educational","Sesame Street","Full Episodes"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"6LmUcFmlaJ0",title:"Sesame Street — Tractors, Submarines, Planes & More with Elmo | 4 Full Episodes",category:"Kids",categories:["Kids","Educational","Sesame Street","Full Episodes"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"hm8gkqelr-k",title:"Sesame Street — Library Helpers, Babysitters & More | Four Full Episodes",category:"Kids",categories:["Kids","Educational","Sesame Street","Full Episodes"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"YJ1SnN2unTY",title:"Sesame Street — Sharing with Elmo & Friends! | Four Full Episodes",category:"Kids",categories:["Kids","Educational","Sesame Street","Full Episodes"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"XbgHiacEFgM",title:"Omar & Hana — Have Patience Daddy, Sweet Raju & More Episodes | Official English",category:"Kids",categories:["Kids","Animation","Islamic","Omar & Hana"],startSeconds:0,endSeconds:null,format:"desktop"},
 {videoId:"hJX3UGgIRVU",title:"Wild Kratts — Butternut Tree | Full Episode | PBS KIDS",category:"Kids",categories:["Kids","Animation","Science","PBS KIDS"],startSeconds:0,endSeconds:null,format:"desktop"}
];
const kidsCatalogIds=new Set([...officialIslamicFilms.map(v=>v.videoId),...curatedKidsVideos.map(v=>v.videoId),...videoRegistry.filter(isKidsVideo).map(v=>v.videoId)]);
const isDeepWatchKids=(v:RegisteredVideo)=>kidsCatalogIds.has(v.videoId);
const deepwatchCatalog=Array.from(new Map([featuredLive,...officialIslamicFilms,...curatedKidsVideos,...verifiedYaqeenEpisodes,...videoRegistry.filter(v=>v.format==="desktop")].filter(v=>v.format==="desktop"&&!/shorts?/i.test([v.category,...(v.categories||[])].join(" "))).map(v=>[v.videoId,v] as const)).values());
const oneIslamIds=new Set(["ZtmfL6uZfa4","wuNAlw5kmW8","W-C-qyaTJ9A","bBHSA4l8LJQ","QuxSwXGvCDE","6W3MDgUsrG0","oVFGrvEwgdE","3JJpHR59598","XWiVlPH8ycw","XFX5q0JILd0","iVtFN5NDkCw","Qdm70F47b5k","PDfCJRqOXQI","k4hRONalWU4","jktPehmOlmo","hzoo_llwzBI","kYJLOA3Ku20","LgzRb5SYAvo","Zor1et-rT8c","RerLVM4pWeE","4elQ8MMqq6Q","74an2nHujZU","eRMdvy0oWKw","GWHggtbGQ4s","Dyf-hcQHVSg","-O7LWSejY0E","q2_NhdYU_Tg","w9pnYXQcxrs","M-qTbC0ST_A","50o4JLaFfY4","C7XZEcvQTXM","xsJg5cV_BYw","dsgc7wOATtU","N6vkcVBd5-M","eNRdgzVgt-o","HXHzI7FSQc8","O38OhlRifrk","l3mfoSVXFrQ","KjHaAItddDo","2-BVXtBdxw8","e87KDhW3biE","y1wrwkjR-NM","qAVVG3-Iqv8","JTJ37FNaPSU","Av2JfPcNgsE","4QBftmqAGFI"]);
const oneIslamVideos=deepwatchCatalog.filter(v=>oneIslamIds.has(v.videoId)).sort((a,b)=>{const ep=(v:RegisteredVideo)=>Number(v.title.match(/\bEP(\d+)\b/i)?.[1]||999);return /Stories of the Prophets/i.test(a.title)&&/Stories of the Prophets/i.test(b.title)?ep(a)-ep(b):0});
const tabs=["Home","Kids","Movies","TV Shows","Series","The Prophets","Scary","Animation","International","Live","My List"] as const;
type Tab=typeof tabs[number];
const isProphetVideo=(v:RegisteredVideo)=>/prophet|adam|hawwa|ibrahim|yunus|nooh|nuh|hud \(as\)|idrees|sheeth|habil|qabil|iblees|iblis/i.test([v.title,v.category,...(v.categories||[])].join(" "));
/* Scary is a curated Islamic reminders collection, not fictional horror. */
const isScaryVideo=(v:RegisteredVideo)=>oneIslamIds.has(v.videoId)&&/dajjal|grave|death|dead people|afterlife|judgment|jahannam|hell|qiyamah|akhirah|punishment|torment|scary/i.test([v.title,v.category,...(v.categories||[])].join(" "));
type DeepWatchEpisode={video_id:string;title:string;canonical_title:string|null;original_title:string|null;content_type:string|null;season_number:number|null;episode_number:number|null;episode_title:string|null;duration_seconds:number|null;categories:string[];language:string|null;genres:string[];cover_url:string|null;series_id:string|null};
type DeepWatchSeries={id:string;canonical_title:string;cover_url:string|null;categories:string[];genres:string[];language:string|null};
const formatDuration=(seconds:number|null|undefined)=>seconds==null?"Duration unavailable":seconds>=3600?`${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m`:`${Math.floor(seconds/60)}m`;
const image=(id:string)=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const group=(v:RegisteredVideo):Tab=>{
 const value=[v.category,...(v.categories||[]),v.title].join(" ").toLowerCase();
 if(/animat|cartoon|kids|shorts/.test(value))return "Animation";
 if(/movie|film|cinema/.test(value))return "Movies";
 if(/series|episode|ep\\.|prophet stories/.test(value))return "Series";
 if(/international|urdu|turkish|arabic|somali|indonesian/.test(value))return "International";
 if(/live|performance|speaking/.test(value))return "Live";
 return "TV Shows";
};
export default function DeepWatch(){
 const [tab,setTab]=useState<Tab>("Home");
 const [selected,setSelected]=useState<RegisteredVideo|null>(null);
 const [info,setInfo]=useState<RegisteredVideo|null>(null);
 const [seriesInfo,setSeriesInfo]=useState<DeepWatchSeries|null>(null);
 const [dbSeries,setDbSeries]=useState<DeepWatchSeries[]>([]);
 const [dbEpisodes,setDbEpisodes]=useState<DeepWatchEpisode[]>([]);
 const [episodeSeason,setEpisodeSeason]=useState(1);
 useEffect(()=>{let active=true;const base=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!base||!anon)return;
 const headers={apikey:anon,Authorization:`Bearer ${anon}`};
 Promise.all([
 fetch(`${base}/rest/v1/deepwatch_series?select=id,canonical_title,cover_url,categories,genres,language&status=eq.approved&order=canonical_title.asc`,{headers}).then(r=>r.ok?r.json():[]),
 fetch(`${base}/rest/v1/islamic_video_registry?select=video_id,title,canonical_title,original_title,content_type,season_number,episode_number,episode_title,duration_seconds,categories,language,genres,cover_url,series_id&status=eq.approved&series_id=not.is.null&order=season_number.asc,episode_number.asc&limit=1000`,{headers}).then(r=>r.ok?r.json():[])
 ]).then(([series,episodes])=>{if(active){setDbSeries(Array.isArray(series)?series:[]);setDbEpisodes(Array.isArray(episodes)?episodes:[])}}).catch(()=>{});
 return()=>{active=false};
 },[]);
 const [playing,setPlaying]=useState(true);
 const [seconds,setSeconds]=useState(0);
 const [captions,setCaptions]=useState(false);
 const [settings,setSettings]=useState(false);
 const [search,setSearch]=useState("");
 const [saved,setSaved]=useState<string[]>([]);
 const player=useRef<HTMLIFrameElement>(null);
 const selectedRef=useRef<RegisteredVideo|null>(null);
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem("1muslim:deepwatch-list")||"[]");if(Array.isArray(value))setSaved(value.filter((x):x is string=>typeof x==="string"))}catch{}},[]);
 const filtered=useMemo(()=>deepwatchCatalog.filter(v=>(tab==="Home"||(tab==="Kids"?isDeepWatchKids(v):tab==="My List"?saved.includes(v.videoId):tab==="The Prophets"?isProphetVideo(v):tab==="Scary"?isScaryVideo(v):tab==="Movies"?(group(v)==="Movies"||officialIslamicFilms.some(f=>f.videoId===v.videoId)):group(v)===tab))&&(!search||v.title.toLowerCase().includes(search.toLowerCase()))),[tab,search,saved]);
 const heroSlides=useMemo(()=>{
  const categories:Tab[]=tab==="Home"?["Kids","The Prophets","Scary","Series","Movies","TV Shows","Animation","International","Live"]:tab==="My List"?["My List"]: [tab];
  const used=new Set<string>();
  const picks=categories.map(category=>filtered.find(v=>!used.has(v.videoId)&&(category==="My List"||(category==="Kids"?isDeepWatchKids(v):category==="The Prophets"?isProphetVideo(v):category==="Scary"?isScaryVideo(v):category==="Movies"?(group(v)==="Movies"||officialIslamicFilms.some(f=>f.videoId===v.videoId)):group(v)===category)))).filter((v):v is RegisteredVideo=>Boolean(v));
  picks.forEach(v=>used.add(v.videoId));
  for(const v of filtered){if(picks.length>=5)break;if(!used.has(v.videoId)){picks.push(v);used.add(v.videoId)}}
  return picks;
 },[filtered,tab]);
 const [heroIndex,setHeroIndex]=useState(0);
 const [heroPaused,setHeroPaused]=useState(false);
 useEffect(()=>{setHeroIndex(0)},[tab,search]);
 useEffect(()=>{if(heroPaused||selected||heroSlides.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const timer=window.setInterval(()=>setHeroIndex(i=>(i+1)%heroSlides.length),4000);
  return()=>window.clearInterval(timer);
 },[heroPaused,selected,heroSlides.length]);
 const featured=heroSlides[heroIndex]||heroSlides[0];
 const collections=useMemo(()=>tab==="Home"?[
  {name:"Featured Tonight",items:deepwatchCatalog.slice(0,14)},
  {name:"The Prophets",items:deepwatchCatalog.filter(isProphetVideo)},
  {name:"Scary · Afterlife & Warnings",items:deepwatchCatalog.filter(isScaryVideo)},
  {name:"Stories of Dead People · One Islam Productions",items:deepwatchCatalog.filter(v=>(v.categories||[]).includes("Stories of Dead People"))},
  {name:"Series to Get Into",items:deepwatchCatalog.filter(v=>group(v)==="Series")},
  {name:"Movie Night",items:deepwatchCatalog.filter(v=>group(v)==="Movies"||officialIslamicFilms.some(f=>f.videoId===v.videoId))},
  {name:"Animated Adventures",items:deepwatchCatalog.filter(v=>group(v)==="Animation")},
  {name:"International Spotlight",items:deepwatchCatalog.filter(v=>group(v)==="International")},
  {name:"More to Explore",items:deepwatchCatalog.slice(14,44)}
 ]:[{name:tab==="My List"?"Your Watchlist":tab,items:filtered}], [tab,filtered]);
 const send=(func:string,args?:unknown[])=>{player.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args:args||[]}),"*")};
 const open=(v:RegisteredVideo)=>{setSeriesInfo(null);setInfo(null);selectedRef.current=v;setSelected(v);setSeconds(v.startSeconds||0);setPlaying(true);setSettings(false)};
 const close=()=>{setSelected(null);selectedRef.current=null;setSettings(false)};
 const next=()=>{const index=deepwatchCatalog.findIndex(v=>v.videoId===selectedRef.current?.videoId);open(deepwatchCatalog[(index+1)%deepwatchCatalog.length])};
 useEffect(()=>{if(!selected)return;const onMessage=(event:MessageEvent)=>{if(!event.origin.includes("youtube.com")&&!event.origin.includes("youtube-nocookie.com"))return;try{const d=typeof event.data==="string"?JSON.parse(event.data):event.data;if(typeof d?.info?.currentTime==="number")setSeconds(Math.floor(d.info.currentTime))}catch{}};window.addEventListener("message",onMessage);const timer=setInterval(()=>{send("getCurrentTime");window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:selected.videoId,seconds,format:"desktop"}}))},900);return()=>{clearInterval(timer);window.removeEventListener("message",onMessage);window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format:"desktop"}}))}},[selected,seconds]);
 const toggleSaved=(id:string)=>setSaved(prev=>{const value=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];try{localStorage.setItem("1muslim:deepwatch-list",JSON.stringify(value))}catch{}return value});
 return <main className="deepwatch"><style>{`.deepwatchInlinePlayIcon{display:inline-block;width:1.25em;height:1.25em;vertical-align:-.27em;flex-shrink:0;margin-right:2px}`}</style>
  <header className="deepwatchHeader"><Link href="/" className="deepwatchBrand" aria-label="DeepWatch by 1Muslim — Home"><img src="/assets/deepwatch-icon-2.PNG" alt="DeepWatch by 1Muslim" width={160} height={72} style={{display:"block",width:"auto",maxWidth:"min(38vw,160px)",height:64,objectFit:"contain"}}/></Link><nav aria-label="DeepWatch categories">{tabs.map(item=><button type="button" key={item} aria-current={tab===item?"page":undefined} onClick={()=>setTab(item)}>{item==="Live"?<span className="deepwatchLiveNav"><span className="deepwatchLivePulse" aria-hidden="true"/>LIVE</span>:item}</button>)}</nav><input type="search" aria-label="Search DeepWatch" placeholder="Search titles" value={search} onChange={e=>setSearch(e.target.value)}/></header>
  {(tab==="Live")&&<section className="deepwatchLiveSpotlight" aria-label="DeepWatch Live spotlight"><div className="deepwatchLiveSpotlightCopy"><span className="deepwatchLiveBadge"><span className="deepwatchLivePulse" aria-hidden="true"/> LIVE CHANNEL</span><h1>DeepWatch Live</h1><p>Watch livestreams and available replays, all in one place.</p><button type="button" onClick={()=>open(featuredLive)}><PlayIcon className="deepwatchInlinePlayIcon"/> Watch Featured Stream</button></div><img src={image(featuredLive.videoId)} alt="" loading="lazy"/></section>}
  <section className="deepwatchHeroCarousel" aria-label="Featured DeepWatch titles" onMouseEnter={()=>setHeroPaused(true)} onMouseLeave={()=>setHeroPaused(false)} onFocusCapture={()=>setHeroPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHeroPaused(false)}}>
   {heroSlides.map((v,i)=><div key={v.videoId} className={`deepwatchHero ${i===heroIndex?"isActive":""}`} aria-hidden={i!==heroIndex} style={{backgroundImage:`linear-gradient(90deg,#07090d 4%,rgba(7,9,13,.92) 38%,rgba(7,9,13,.3)),url("${image(v.videoId)}")`}}>
    <div className="deepwatchHeroText"><p>1MUSLIM · {group(v).toUpperCase()}</p><h1>{v.title}</h1><span>Movie night starts here. Discover something worth your time.</span><div><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>open(v)}><PlayIcon className="deepwatchInlinePlayIcon"/> Play Now</button><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>toggleSaved(v.videoId)}>{saved.includes(v.videoId)?"✓ In My List":"+ My List"}</button></div></div>
   </div>)}
   {heroSlides.length>1&&<><button type="button" className="deepwatchHeroArrow previous" aria-label="Previous featured title" onClick={()=>setHeroIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}>‹</button><button type="button" className="deepwatchHeroArrow next" aria-label="Next featured title" onClick={()=>setHeroIndex(i=>(i+1)%heroSlides.length)}>›</button><div className="deepwatchHeroDots" aria-label="Choose featured title">{heroSlides.map((v,i)=><button key={v.videoId} type="button" aria-label={`Show slide ${i+1}: ${v.title}`} aria-current={i===heroIndex?"true":undefined} onClick={()=>setHeroIndex(i)}/>)}</div></>}
  </section>
  {(tab==="Home"||tab==="Series"||tab==="Scary"||tab==="The Prophets"||tab==="Movies"||tab==="Animation")&&<section className="deepwatchRow" aria-label="One Islam Productions official channel collection" style={{padding:"12px 24px"}}><h2>🎬 One Islam Productions · Official Collection</h2><p style={{opacity:.8,fontSize:13}}>Animated Islamic films, Prophet Stories, and Letters From Jannah · No Shorts</p><div className="deepwatchRail">{oneIslamVideos.filter(v=>!search||v.title.toLowerCase().includes(search.toLowerCase())).map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>setInfo(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>One Islam Productions · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>}
  {(tab==="Home"||tab==="Series"||tab==="Movies"||tab==="Animation")&&[
   {name:"One Islam · Stories of the Prophets (Mufti Menk)",test:(v:RegisteredVideo)=>/Stories of the Prophets/i.test(v.title)},
   {name:"One Islam · Islamic Education & Lectures",test:(v:RegisteredVideo)=>/25 Prophets|Purpose of Life/i.test(v.title)},
   {name:"One Islam · Stories of Dead People",test:(v:RegisteredVideo)=>(v.categories||[]).includes("Stories of Dead People")},
   {name:"One Islam · Letters From Jannah",test:(v:RegisteredVideo)=>/Letters From Jannah/i.test(v.title)},
   {name:"One Islam · Prophet Stories & Animated Films",test:(v:RegisteredVideo)=>/Prophet|Animated|Ibrahim|Yunus/i.test(v.title)},
   {name:"One Islam · Afterlife & Reminders",test:(v:RegisteredVideo)=>/Grave|Dajjal|Afterlife/i.test(v.title)}
  ].map(section=>{const items=oneIslamVideos.filter(v=>section.test(v)&&(!search||v.title.toLowerCase().includes(search.toLowerCase())));return items.length?<section className="deepwatchRow" key={section.name}><h2>{section.name}</h2><div className="deepwatchRail">{items.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>One Islam Productions · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>:null})}
  {(tab==="Home"||tab==="Live")&&<section className="deepwatchRow" aria-label="Featured YouTube livestream"><h2>🔴 Featured Live Stream</h2><div className="deepwatchRail"><button type="button" className="deepwatchTile" onClick={()=>open(featuredLive)}><img src={image(featuredLive.videoId)} alt="" loading="lazy"/><span>{featuredLive.title}</span><small><PlayIcon className="deepwatchInlinePlayIcon"/> Watch live or replay when available</small></button></div></section>}
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" style={{padding:"12px 24px"}}><h2>Verified Yaqeen Episodes · Play in DeepWatch</h2><div className="deepwatchRail">{verifiedYaqeenEpisodes.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>Yaqeen Institute · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>}
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" aria-label="Official Islamic series awaiting video verification" style={{padding:"20px 24px"}}>
   <h2>Official Yaqeen Series · Explore</h2>
   <p style={{opacity:.8,fontSize:13,margin:"8px 0 16px"}}>Publisher-confirmed series. Individual YouTube episodes are not yet verified for DeepWatch playback.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
    {officialSeries.filter(item=>!search||item.title.toLowerCase().includes(search.toLowerCase())).map(item=><a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",flexDirection:"column",gap:8,padding:18,border:"1px solid rgba(255,255,255,.22)",borderRadius:16,background:"rgba(255,255,255,.06)",color:"inherit",textDecoration:"none"}}>
     <strong>{item.title}</strong><small>{item.publisher} · {item.category}</small><small>Official series page ↗</small>
    </a>)}
   </div>
  </section>}
  {dbSeries.length>0&&<section className="deepwatchRow" aria-label="DeepWatch shows" style={{padding:"12px 24px"}}><h2>Shows &amp; Series</h2><div className="deepwatchRail">{dbSeries.filter(s=>!search||s.canonical_title.toLowerCase().includes(search.toLowerCase())).map(s=><button type="button" className="deepwatchTile" key={s.id} onClick={()=>{setSeriesInfo(s);setEpisodeSeason(1)}}><img src={s.cover_url||image(dbEpisodes.find(e=>e.series_id===s.id)?.video_id||"")} alt="" loading="lazy"/><span>{s.canonical_title}</span><small>{s.genres.join(" · ")||s.categories.join(" · ")||"Series"}</small></button>)}</div></section>}
  {seriesInfo&&<div className="deepwatchInfoBackdrop" onClick={()=>setSeriesInfo(null)}><section className="deepwatchInfoSheet" role="dialog" aria-modal="true" aria-label={seriesInfo.canonical_title} onClick={e=>e.stopPropagation()}><div className="deepwatchInfoHandle"/><button className="deepwatchInfoClose" onClick={()=>setSeriesInfo(null)} aria-label="Close details">×</button><div className="deepwatchInfoArtwork"><img src={seriesInfo.cover_url||image(dbEpisodes.find(e=>e.series_id===seriesInfo.id)?.video_id||"")} alt=""/><div className="deepwatchInfoArtworkShade"/></div><div className="deepwatchInfoContent"><p className="deepwatchInfoEyebrow">DEEPWATCH · SERIES</p><h2>{seriesInfo.canonical_title}</h2><p className="deepwatchInfoMeta">{[seriesInfo.language,...seriesInfo.genres,...seriesInfo.categories].filter(Boolean).join(" · ")}</p><h3>Episodes</h3><div className="deepwatchInfoSeasons">{[...new Set(dbEpisodes.filter(e=>e.series_id===seriesInfo.id).map(e=>e.season_number||1))].sort((a,b)=>a-b).map(season=><button type="button" key={season} aria-pressed={episodeSeason===season} onClick={()=>setEpisodeSeason(season)}>Season {season}</button>)}</div><div className="deepwatchInfoEpisodes">{dbEpisodes.filter(e=>e.series_id===seriesInfo.id&&(e.season_number||1)===episodeSeason).sort((a,b)=>(a.episode_number||9999)-(b.episode_number||9999)).map(e=><button className="deepwatchInfoEpisode" type="button" key={e.video_id} onClick={()=>open({videoId:e.video_id,title:e.title,category:"Series",categories:e.categories,startSeconds:0,endSeconds:null,format:"desktop"})}><img src={e.cover_url||image(e.video_id)} alt="" loading="lazy"/><span><strong>{e.episode_number?"Episode "+e.episode_number+": ":""}{e.episode_title||e.title}</strong><small>{formatDuration(e.duration_seconds)}</small></span><PlayIcon className="deepwatchInlinePlayIcon"/></button>)}</div></div></section></div>}
  <div className="deepwatchCollections">{collections.map(collection=>collection.items.length>0&&<section key={collection.name} className="deepwatchRow"><h2>{collection.name}</h2><div className="deepwatchRail">{collection.items.map(v=><button type="button" className="deepwatchTile" key={v.videoId} onClick={()=>setInfo(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>{group(v)} · Watch now</small></button>)}</div></section>)}</div>
  {info&&<div className="deepwatchInfoBackdrop" onClick={()=>setInfo(null)}><section className="deepwatchInfoSheet" role="dialog" aria-modal="true" aria-label={info.title} onClick={e=>e.stopPropagation()}><div className="deepwatchInfoHandle" aria-hidden="true"/><button type="button" className="deepwatchInfoClose" onClick={()=>setInfo(null)} aria-label="Close details">×</button><div className="deepwatchInfoArtwork"><img src={image(info.videoId)} alt="" /><div className="deepwatchInfoArtworkShade"/></div><div className="deepwatchInfoContent"><p className="deepwatchInfoEyebrow">DEEPWATCH · {group(info).toUpperCase()}</p><h2>{info.title}</h2><p className="deepwatchInfoMeta">{(info.categories||[]).join(" · ")}</p><div className="deepwatchInfoActions"><button type="button" className="deepwatchInfoPlay" onClick={()=>open(info)}><PlayIcon className="deepwatchInlinePlayIcon"/> Play</button><button type="button" onClick={()=>toggleSaved(info.videoId)}>{saved.includes(info.videoId)?"✓ In My List":"+ My List"}</button></div><h3>Episodes &amp; More</h3><div className="deepwatchInfoEpisodes">{deepwatchCatalog.filter(v=>v.videoId===info.videoId||((v.categories||[]).some(tag=>(info.categories||[]).includes(tag))&&v.videoId!==info.videoId)).slice(0,24).map((v,i)=><button type="button" key={v.videoId} className="deepwatchInfoEpisode" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span><strong>{v.title}</strong><small>{i===0?"Selected title":"Watch episode / related video"}</small></span><PlayIcon className="deepwatchInlinePlayIcon"/></button>)}</div></div></section></div>}
  {selected&&<div className="deepwatchScreen" role="dialog" aria-modal="true" aria-label={selected.title}><div className="deepwatchScreenInner"><div className="deepwatchScreenTop"><button onClick={close}>← DeepWatch</button><strong>{selected.title}</strong><button onClick={()=>toggleSaved(selected.videoId)}>{saved.includes(selected.videoId)?"✓ Saved":"+ My List"}</button></div><div className="deepwatchWatchCanvas"><div className="deepwatchPlayer"><iframe key={selected.videoId} ref={player} title={selected.title} src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&start=${selected.startSeconds||0}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><div className="deepwatchControls"><button onClick={()=>setSettings(v=>!v)}>⚙ Settings</button><button onClick={()=>send("seekTo",[Math.max(0,seconds-10),true])}>↶ 10s</button><button className="deepwatchPlay" onClick={()=>{send(playing?"pauseVideo":"playVideo");setPlaying(!playing)}}>{playing?"Ⅱ Pause":<><PlayIcon className="deepwatchInlinePlayIcon"/> Play</>}</button><button onClick={()=>send("seekTo",[seconds+10,true])}>10s ↷</button><button onClick={next}>Next Episode →</button></div>{settings&&<div className="deepwatchSettings"><button onClick={()=>{setCaptions(!captions);send(captions?"unloadModule":"loadModule",["captions"])}}>Captions: {captions?"On":"Off"}</button><button onClick={()=>send("setPlaybackRate",[1])}>Speed: Normal</button></div>}<div className="deepwatchTimed"><HomeLiveConversation room="desktop"/></div></div></div></div>}
 </main>;
}
