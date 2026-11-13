"use client";
import CinemaControls from "../components/CinemaControls";
import PlayIcon from "../components/icons/PlayIcon";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import DeepWatchTimedComments from "../components/DeepWatchTimedComments";
import DeepWatchReviews from "../components/DeepWatchReviews";
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
// Series membership is determined by an explicit show title, never broad category overlap.
const seriesKey=(title:string)=>{
 const m=title.match(/^\s*(O Messenger|Beyond Eternity|Stories of the Prophets)\b/i);
 return m?m[1].toLowerCase().replace(/\s+/g," "):null;
};
const episodeOrder=(title:string)=>{
 const m=title.match(/\b(?:episode|ep\.?|part)\s*[:#.-]?\s*(\d{1,3})\b/i);
 return m?Number(m[1]):/\bfinal episode\b/i.test(title)?999:1000;
};
const orderedShowEpisodes=(item:RegisteredVideo)=>{
 const key=seriesKey(item.title);
 if(!key)return [item];
 return deepwatchCatalog.filter(v=>seriesKey(v.title)===key)
  .sort((a,b)=>episodeOrder(a.title)-episodeOrder(b.title)||a.title.localeCompare(b.title));
};
const oneIslamIds=new Set(["ZtmfL6uZfa4","wuNAlw5kmW8","W-C-qyaTJ9A","bBHSA4l8LJQ","QuxSwXGvCDE","6W3MDgUsrG0","oVFGrvEwgdE","3JJpHR59598","XWiVlPH8ycw","XFX5q0JILd0","iVtFN5NDkCw","Qdm70F47b5k","PDfCJRqOXQI","k4hRONalWU4","jktPehmOlmo","hzoo_llwzBI","kYJLOA3Ku20","LgzRb5SYAvo","Zor1et-rT8c","RerLVM4pWeE","4elQ8MMqq6Q","74an2nHujZU","eRMdvy0oWKw","GWHggtbGQ4s","Dyf-hcQHVSg","-O7LWSejY0E","q2_NhdYU_Tg","w9pnYXQcxrs","M-qTbC0ST_A","50o4JLaFfY4","C7XZEcvQTXM","xsJg5cV_BYw","dsgc7wOATtU","N6vkcVBd5-M","eNRdgzVgt-o","HXHzI7FSQc8","O38OhlRifrk","l3mfoSVXFrQ","KjHaAItddDo","2-BVXtBdxw8","e87KDhW3biE","y1wrwkjR-NM","qAVVG3-Iqv8","JTJ37FNaPSU","Av2JfPcNgsE","4QBftmqAGFI"]);
const oneIslamVideos=deepwatchCatalog.filter(v=>oneIslamIds.has(v.videoId)).sort((a,b)=>{const ep=(v:RegisteredVideo)=>Number(v.title.match(/\bEP(\d+)\b/i)?.[1]||999);return /Stories of the Prophets/i.test(a.title)&&/Stories of the Prophets/i.test(b.title)?ep(a)-ep(b):0});
const tabs=["Home","Classics","Movies","Series","Kids","Live","Comedy","Scary","Animation","Qur’an","History","The Prophets","Documentaries","TV Shows","International","Somali","Aqeedah","All Videos","My List"] as const;
type Tab=typeof tabs[number];
type QuranChapter={id:number;name_simple:string;name_arabic:string;verses_count:number;revelation_order?:number;translated_name?:{name:string}};
const normalizeSurah=(v:string)=>v.toLowerCase().normalize("NFKD").replace(/[’']/g,"").replace(/[^a-z0-9]/g,"");
const videoForSurah=(v:RegisteredVideo,c:QuranChapter)=>{const t=normalizeSurah(v.title);const n=normalizeSurah(c.name_simple);const variants=[n,n.replace(/^al/,""),n.replace(/^an/,""),n.replace(/^as/,""),n.replace(/^at/,"")].filter(x=>x.length>=4);return variants.some(x=>t.includes(x))&&/surah|surat|sura|quran|recitation|tilawah|chapter/i.test(v.title)};

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
 const [deepLinkVideo,setDeepLinkVideo]=useState<string|null>(null);
 useEffect(()=>{setDeepLinkVideo(new URLSearchParams(window.location.search).get("video"))},[]);
 const handledDeepLink=useRef<string|null>(null);
 const [tab,setTab]=useState<Tab>("Home");
 const [isGalleryAdmin,setIsGalleryAdmin]=useState(false);
 useEffect(()=>{let alive=true;const db=createClient();void db.auth.getUser().then(({data:{user}})=>{if(alive)setIsGalleryAdmin(user?.email?.toLowerCase()==="hudhudbyelmi@gmail.com")}).catch(()=>{});return()=>{alive=false}},[]);
 const [editorial,setEditorial]=useState<Record<string,{display_title:string;categories:string[];genres:string[]}>>({});
 const [editingVideo,setEditingVideo]=useState<RegisteredVideo|null>(null);
 const [editTitle,setEditTitle]=useState("");
 const [editCategories,setEditCategories]=useState("");
 const [editGenres,setEditGenres]=useState("");
 const [editBusy,setEditBusy]=useState(false);
 const [editError,setEditError]=useState("");
 useEffect(()=>{let active=true;const db=createClient();void db.from("deepwatch_video_editorial").select("video_id,display_title,categories,genres").then(({data,error})=>{if(!active||error)return;setEditorial(Object.fromEntries((data||[]).map(row=>[row.video_id,row])))});return()=>{active=false}},[]);
 const startEditing=(v:RegisteredVideo)=>{const e=editorial[v.videoId];setEditingVideo(v);setEditTitle(e?.display_title||v.title);setEditCategories((e?.categories||v.categories||[]).join(", "));setEditGenres((e?.genres||[]).join(", "));setEditError("")};
 const saveEditing=async()=>{if(!editingVideo)return;setEditBusy(true);setEditError("");try{const body={videoId:editingVideo.videoId,displayTitle:editTitle,categories:editCategories.split(",").map(x=>x.trim()).filter(Boolean),genres:editGenres.split(",").map(x=>x.trim()).filter(Boolean)};const res=await fetch("/api/deepwatch/edit-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.error||"Save failed");setEditorial(prev=>({...prev,[editingVideo.videoId]:data}));setEditingVideo(null)}catch(e){setEditError(e instanceof Error?e.message:"Save failed")}finally{setEditBusy(false)}};
 const [selected,setSelected]=useState<RegisteredVideo|null>(null);
 const [discussionTab,setDiscussionTab]=useState<"timed"|"review">("timed");
 const [info,setInfo]=useState<RegisteredVideo|null>(null);
 const [seriesInfo,setSeriesInfo]=useState<DeepWatchSeries|null>(null);
 const [dbSeries,setDbSeries]=useState<DeepWatchSeries[]>([]);
 const [dbEpisodes,setDbEpisodes]=useState<DeepWatchEpisode[]>([]);
 const [excludedIds,setExcludedIds]=useState<string[]>([]);
 const [hidingVideo,setHidingVideo]=useState(false);
 const [hideError,setHideError]=useState("");
 const hideSubscriptionVideo=async(v:RegisteredVideo)=>{
  if(!window.confirm(`Hide "${v.title}" from DeepWatch? Reason: Subscription Required. This does not delete it.`))return;
  setHidingVideo(true);setHideError("");
  try{
   const response=await fetch("/api/deepwatch/hide-video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId:v.videoId,reason:"Subscription Required"})});
   if(!response.ok)throw Error("Unable to hide video. Please try again.");
   setExcludedIds(prev=>prev.includes(v.videoId)?prev:[...prev,v.videoId]);setInfo(null);
  }catch(error){setHideError(error instanceof Error?error.message:"Unable to hide video")}finally{setHidingVideo(false)}
 };

 const [approvedRegistry,setApprovedRegistry]=useState<RegisteredVideo[]>([]);
 const [catalogMetadata,setCatalogMetadata]=useState<Record<string,{language:string|null;genres:string[]}>>({});
 const [quranChapters,setQuranChapters]=useState<QuranChapter[]>([]);
 const [chapterOrder,setChapterOrder]=useState<"compiled"|"revealed">("compiled");
 const [expandedSurah,setExpandedSurah]=useState<number|null>(null);
 useEffect(()=>{let active=true;fetch("https://api.quran.com/api/v4/chapters?language=en").then(r=>{if(!r.ok)throw Error("Quran chapter metadata unavailable");return r.json()}).then(d=>{if(active&&Array.isArray(d.chapters))setQuranChapters(d.chapters)}).catch(e=>console.warn(e));return()=>{active=false}},[]);

 const [libraryLoading,setLibraryLoading]=useState(true);
 useEffect(()=>{let live=true;const db=createClient();const load=async()=>{try{
  const cached=sessionStorage.getItem("1muslim:deepwatch-approved-cache");if(cached){try{const parsed=JSON.parse(cached);if(Array.isArray(parsed)&&live){setApprovedRegistry(parsed);setLibraryLoading(false)}}catch{}}
  const pageSize=500;const rows:{video_id:string;title:string;categories:string[]|null;language:string|null;format:string|null;published_at:string|null;discovered_at:string|null}[]=[];
  for(let offset=0;offset<5000;offset+=pageSize){
   const {data,error}=await db.from("islamic_video_registry").select("video_id,title,categories,language,format,published_at,discovered_at").eq("status","approved").order("discovered_at",{ascending:false}).range(offset,offset+pageSize-1);
   if(error)throw error;
   rows.push(...(data||[]));if(!data||data.length<pageSize)break;
  }
  const approved=rows.filter(v=>/^[A-Za-z0-9_-]{11}$/.test(v.video_id)).map(v=>({videoId:v.video_id,title:v.title,category:v.categories?.[0]||"Videos",categories:v.categories||[],startSeconds:0,endSeconds:null,format:"desktop" as const}));if(live){setCatalogMetadata(Object.fromEntries(rows.map(v=>[v.video_id,{language:v.language,genres:[]}])));setApprovedRegistry(approved);try{sessionStorage.setItem("1muslim:deepwatch-approved-cache",JSON.stringify(approved))}catch{}}
 }catch(e){console.error("DeepWatch approved library unavailable",e)}finally{if(live)setLibraryLoading(false)}};
 void load();return()=>{live=false}},[]);
 const [episodeSeason,setEpisodeSeason]=useState(1);
 useEffect(()=>{let active=true;const base=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!base||!anon)return;
 const headers={apikey:anon,Authorization:`Bearer ${anon}`};
 Promise.all([
 fetch(`${base}/rest/v1/deepwatch_series?select=id,canonical_title,cover_url,categories,genres,language&status=eq.approved&order=canonical_title.asc`,{headers}).then(r=>r.ok?r.json():[]),
 fetch(`${base}/rest/v1/islamic_video_registry?select=video_id,title,canonical_title,original_title,content_type,season_number,episode_number,episode_title,duration_seconds,categories,language,genres,cover_url,series_id&status=eq.approved&series_id=not.is.null&order=season_number.asc,episode_number.asc&limit=1000`,{headers}).then(r=>r.ok?r.json():[])
 ,fetch("/api/deepwatch/exclusions",{cache:"no-store"}).then(r=>r.ok?r.json():[])
 ]).then(([series,episodes,exclusions])=>{if(active){setExcludedIds(Array.isArray(exclusions)?exclusions.map((x:{item_id:string})=>x.item_id):[]);setDbSeries(Array.isArray(series)?series:[]);setDbEpisodes(Array.isArray(episodes)?episodes:[])}}).catch(()=>{});
 return()=>{active=false};
 },[]);
 const [somaliPrompt,setSomaliPrompt]=useState<"intro"|"trial"|"required"|null>(null);
 const [somaliStage,setSomaliStage]=useState<"first"|"followup"|"next">("first");
 const [somaliWatch,setSomaliWatch]=useState<{firstId:string;completed:boolean}|null>(null);
 useEffect(()=>{try{const raw=localStorage.getItem("1muslim:somali-gate-v1");if(raw)setSomaliWatch(JSON.parse(raw))}catch{}},[]);
 const somaliPrompted=useRef<Set<string>>(new Set());
 const isSomaliWatch=(v:RegisteredVideo)=>{const tags=[v.category,...(v.categories||[]),...(editorial[v.videoId]?.categories||[])].join(" ").toLowerCase();const lang=catalogMetadata[v.videoId]?.language?.toLowerCase();return lang==="so"||lang==="somali"||/somali|soomaali|somaliland/.test(tags)};
 const dismissSomaliPrompt=()=>{setSomaliPrompt(null);send("playVideo");setPlaying(true)};
 const [playing,setPlaying]=useState(true);
 const [controlsVisible,setControlsVisible]=useState(true);
 const [seconds,setSeconds]=useState(0);
 const [captions,setCaptions]=useState(false);
 const [settings,setSettings]=useState(false);
 const [search,setSearch]=useState("");
 const [debouncedSearch,setDebouncedSearch]=useState("");
 const [railLimits,setRailLimits]=useState<Record<string,number>>({});
 useEffect(()=>{const timer=window.setTimeout(()=>setDebouncedSearch(search.trim().toLowerCase()),180);return()=>window.clearTimeout(timer)},[search]);
 const WATCH_KEY="1muslim:deepwatch-watch-priority-v1";
 const [watchHistory,setWatchHistory]=useState<Record<string,{views:number;last:number}>>({});
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(WATCH_KEY)||"{}");if(raw&&typeof raw==="object")setWatchHistory(raw)}catch{}},[]);
 const markWatched=(videoId:string)=>setWatchHistory(prev=>{const next={...prev,[videoId]:{views:(prev[videoId]?.views||0)+1,last:Date.now()}};const trimmed=Object.fromEntries(Object.entries(next).sort((a,b)=>b[1].last-a[1].last).slice(0,250));try{localStorage.setItem(WATCH_KEY,JSON.stringify(trimmed))}catch{}return trimmed});
 const prioritize=(videos:RegisteredVideo[])=>videos.map((v,i)=>({v,i,history:watchHistory[v.videoId]})).sort((a,b)=>{
  const score=(x:typeof a)=>x.history?Math.min(x.history.views,10)*100+(Date.now()-x.history.last<604800000?1000:0):0;
  return score(b)-score(a)||a.i-b.i;
 }).map(x=>x.v);
 const [heroPreviewEnabled,setHeroPreviewEnabled]=useState(false);
 useEffect(()=>{if(search||document.visibilityState!=="visible"){setHeroPreviewEnabled(false);return}const id=window.setTimeout(()=>setHeroPreviewEnabled(true),4500);return()=>window.clearTimeout(id)},[search,tab]);
 const [saved,setSaved]=useState<string[]>([]);
 const player=useRef<HTMLIFrameElement>(null);
 const theaterRef=useRef<HTMLDivElement>(null);
 const [fullView,setFullView]=useState(false);
 const [nativeFullView,setNativeFullView]=useState(false);
 useEffect(()=>{const sync=()=>{const active=document.fullscreenElement===theaterRef.current;setNativeFullView(active);if(!document.fullscreenElement&&nativeFullView)setFullView(false)};document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync)},[nativeFullView]);
 useEffect(()=>{if(!fullView)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!document.fullscreenElement)setFullView(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[fullView]);
 const toggleFullView=async()=>{if(fullView){if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}setFullView(false);return}setFullView(true);const node=theaterRef.current;if(node?.requestFullscreen){try{await node.requestFullscreen({navigationUI:"hide"})}catch{/* iOS Safari uses immersive fixed-position fallback. */}}};
 const selectedRef=useRef<RegisteredVideo|null>(null);
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem("1muslim:deepwatch-list")||"[]");if(Array.isArray(value))setSaved(value.filter((x):x is string=>typeof x==="string"))}catch{}},[]);
 useEffect(()=>{if(!isGalleryAdmin)return;let active=true;const refresh=async()=>{try{const response=await fetch("/api/deepwatch/exclusions",{cache:"no-store"});if(!response.ok)return;const rows=await response.json();if(active&&Array.isArray(rows))setExcludedIds(rows.map((row:{item_id:string})=>row.item_id))}catch{}};const timer=window.setInterval(()=>void refresh(),30000);return()=>{active=false;window.clearInterval(timer)}},[isGalleryAdmin]);
 const fullCatalog=useMemo(()=>Array.from(new Map([...deepwatchCatalog,...approvedRegistry].map(v=>[v.videoId,v] as const)).values()),[approvedRegistry]);
 const galleryTotal=useMemo(()=>fullCatalog.filter(v=>!excludedIds.includes(v.videoId)).length,[fullCatalog,excludedIds]);
 const classify= (v:RegisteredVideo)=>{
  const meta=[v.category,...(v.categories||[]),...(editorial[v.videoId]?.categories||[]),...(editorial[v.videoId]?.genres||[])].join(" ").toLowerCase();
  const title=v.title.toLowerCase();
  const kids=isDeepWatchKids(v)||isKidsVideo(v)||/\\bkids?\\b|children|cartoon/.test(meta);
  const animated=/animat|cartoon/.test(meta+" "+title);
  const episodic=/\\b(series|episodes?|tv shows?)\\b/.test(meta)||/\\b(?:episode|ep\\.|season)\\s*[#:. -]*\\d+/.test(title);
  const movie=/\\b(movie|movies|film|films|cinema)\\b/.test(meta);
  const language=(catalogMetadata[v.videoId]?.language||dbEpisodes.find(e=>e.video_id===v.videoId)?.language||"").toLowerCase().split("-")[0];
  const international=/international|urdu|turkish|somali|indonesian|malay|bangla|hindi|arabic/.test(meta)||["ar","tr","so","ur","ms","id","hi","bn"].includes(language);
  const somaliEntertainment=/somali|somalia|somaliland|musalsal|af-soomaali|af soomaali/.test(meta+" "+title);
  const quran=/qur.an|surah|recitation|tilawah/.test(meta+" "+title);
  const prophet=isProphetVideo(v);
  const scary=isScaryVideo(v);
  const history=/historical|history|ottoman|seerah/.test(meta);
  const aqeedah=/\\b(aqeedah|aqidah|tawheed|tawhid|creed)\\b/.test(meta);
  const live=/\\blive(stream)?\\b/.test(meta);
  const comedy=/comedy|funny|humou?r|sketch|stand.up|sitcom|laugh/.test(meta+" "+title);
  const classics=/classic|the message|omar mukhtar|lion of the desert|historical film|old school|legacy|timeless|seerah|prophet stories/.test(meta+" "+title);
  const documentaries=/documentary|documentaries|historical|history|civilization|biography|explained|investigation/.test(meta+" "+title);
  return {Classics:classics,Comedy:comedy,Documentaries:documentaries,Kids:kids,Movies:movie,"TV Shows":episodic,Series:episodic,"The Prophets":prophet,Scary:scary,Animation:animated,International:international,"Somali":somaliEntertainment,Live:live,"Qur’an":quran,Aqeedah:aqeedah,History:history} as Record<string,boolean>;
 };
 const internationalGroups=["All","Shows","Genres","Arabic Videos"] as const;
 const internationalShows=["All Shows","Turkish Dramas","Arabic Series","Other Series"] as const;
 const internationalGenres=["All Genres","Drama","Historical","Action","Romance","Comedy","Documentary","Family"] as const;
 const [internationalGroup,setInternationalGroup]=useState<(typeof internationalGroups)[number]>("All");
 const [internationalShow,setInternationalShow]=useState<(typeof internationalShows)[number]>("All Shows");
 const [internationalGenre,setInternationalGenre]=useState<(typeof internationalGenres)[number]>("All Genres");
 const matchesInternational=(v:RegisteredVideo)=>{
  if(internationalGroup==="All")return true;
  const dbMeta=catalogMetadata[v.videoId];
  const episode=dbEpisodes.find(e=>e.video_id===v.videoId);
  const language=(episode?.language||dbMeta?.language||"").toLowerCase().split("-")[0];
  const tags=[v.category,...(v.categories||[]),...(episode?.genres||[]),...(episode?.categories||[])].join(" ").toLowerCase();
  // Language comes from stored language metadata, not guesses based on the title's script.
  const arabic=language==="ar";
  const turkish=language==="tr";
  const series=Boolean(episode?.series_id)||/\\b(series|drama|episodes?|tv shows?)\\b/.test(tags)||/\\b(?:episode|ep\\.?|season)\\s*[#:. -]*\\d+/.test(v.title.toLowerCase());
  if(internationalGroup==="Arabic Videos")return arabic;
  if(internationalGroup==="Shows"){
   if(internationalShow==="All Shows")return series;
   if(internationalShow==="Turkish Dramas")return turkish&&series;
   if(internationalShow==="Arabic Series")return arabic&&series;
   return series&&!turkish&&!arabic;
  }
  if(internationalGenre==="All Genres")return true;
  // Only use explicit category/genre tags. No genre inference from video titles.
  const genrePatterns:Record<string,RegExp>={
   Drama:/\\bdrama\\b/,Historical:/\\b(historical|history|period)\\b/,
   Action:/\\b(action|adventure)\\b/,Romance:/\\b(romance|romantic)\\b/,
   Comedy:/\\b(comedy|sitcom)\\b/,Documentary:/\\b(documentar(?:y|ies))\\b/,
   Family:/\\b(family|families)\\b/
  };
  return genrePatterns[internationalGenre]?.test(tags)??false;
 };
 const somaliSections=["All","Game Shows","News","Movies","Series","Comedy","Culture","Food & Travel","Talk Shows"] as const;
 const [somaliSection,setSomaliSection]=useState<(typeof somaliSections)[number]>("All");
 const matchesSomaliSection=(v:RegisteredVideo,section:string)=>{
  if(section==="All")return true;
  const tags=[v.category,...(v.categories||[])].join(" ").toLowerCase();
  const title=v.title.toLowerCase();
  const explicit=(pattern:RegExp)=>pattern.test(tags);
  switch(section){
   case "Game Shows":return explicit(/game shows?|quiz|competition/) || /\\b(game show|tartan|ciyaar|su.aalo)\\b/i.test(title);
   case "News":return explicit(/news|warar|broadcast/) || /\\b(warar|news|warka|wararka)\\b/i.test(title);
   case "Movies":return explicit(/movies?|films?|cinema/) || /\\b(filim|film|movie)\\b/i.test(title);
   case "Series":return explicit(/series|drama|musalsal/) || /\\b(musalsal|episode|qaybta|taxane)\\b/i.test(title);
   case "Comedy":return explicit(/comedy|funny|sketch/) || /\\b(qosol|maad|comedy)\\b/i.test(title);
   case "Culture":return explicit(/culture|documentary|heritage/) || /\\b(dhaqan|hiddaha|taariikh)\\b/i.test(title);
   case "Food & Travel":return explicit(/food|travel|cooking|tourism/) || /\\b(cunto|dalxiis|safar|food|travel)\\b/i.test(title);
   case "Talk Shows":return explicit(/talk shows?|interviews?|podcast/) || /\\b(waraysi|wareysi|gorfeyn|interview|podcast)\\b/i.test(title);
   default:return false;
  }
 };
 const filtered=useMemo(()=>fullCatalog.filter(v=>{
  if(excludedIds.includes(v.videoId))return false;
  const tags=[v.title,v.category,...(v.categories||[])].join(" ").toLowerCase();
  const matches=tab==="Home"||tab==="All Videos"||(tab==="My List"?saved.includes(v.videoId):classify(v)[tab]===true);
  return matches&&(tab!=="Somali"||matchesSomaliSection(v,somaliSection))&&(tab!=="International"||matchesInternational(v))&&(!debouncedSearch||tags.includes(debouncedSearch));
 }),[fullCatalog,tab,somaliSection,internationalGroup,internationalShow,internationalGenre,catalogMetadata,dbEpisodes,debouncedSearch,saved,excludedIds]);
 const visibleTabs=useMemo(()=>tabs.filter(t=>t==="Home"||t==="All Videos"||t==="My List"||t==="Somali"||fullCatalog.some(v=>!excludedIds.includes(v.videoId)&&classify(v)[t])),[fullCatalog,excludedIds]);
 const forYou=useMemo(()=>{
  const candidates=fullCatalog.filter(v=>!excludedIds.includes(v.videoId));
  const favorites=candidates.filter(v=>saved.includes(v.videoId));
  if(!favorites.length)return prioritize(candidates).slice(0,12);
  const favoriteTags=new Set(favorites.flatMap(v=>[v.category,...(v.categories||[])].map(t=>t.toLowerCase())));
  return candidates.filter(v=>!saved.includes(v.videoId)).map(v=>({v,score:[v.category,...(v.categories||[])].filter(t=>favoriteTags.has(t.toLowerCase())).length})).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.v);
 },[fullCatalog,saved,excludedIds,watchHistory]);
 const heroSlides=useMemo(()=>{
  const categories:Tab[]=tab==="Home"?["Classics","Movies","Series","Kids","Live","Comedy","Scary","Animation","Qur’an","History","Documentaries"]:tab==="My List"?["My List"]: [tab];
  const used=new Set<string>();
  const recentIds=new Map(videoRegistry.map((v,i)=>[v.videoId,i]));
  const ordered=tab==="Home"?[...filtered].sort((a,b)=>(recentIds.get(b.videoId)??-1)-(recentIds.get(a.videoId)??-1)):filtered;
  const picks=categories.map(category=>ordered.find(v=>!used.has(v.videoId)&&(category==="My List"||(category==="Kids"?isDeepWatchKids(v):category==="The Prophets"?isProphetVideo(v):category==="Scary"?isScaryVideo(v):category==="Movies"?(group(v)==="Movies"||officialIslamicFilms.some(f=>f.videoId===v.videoId)):group(v)===category)))).filter((v):v is RegisteredVideo=>Boolean(v));
  picks.forEach(v=>used.add(v.videoId));
  for(const v of ordered){if(picks.length>=5)break;if(!used.has(v.videoId)){picks.push(v);used.add(v.videoId)}}
  return picks;
 },[filtered,tab]);
 const [heroIndex,setHeroIndex]=useState(0);
 const [heroPaused,setHeroPaused]=useState(false);
 const [heroThumb,setHeroThumb]=useState(false);
 const heroTouch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{setHeroThumb(false);const timer=window.setTimeout(()=>setHeroThumb(true),7000);return()=>window.clearTimeout(timer)},[heroIndex,tab]);
 useEffect(()=>{setHeroIndex(0)},[tab,debouncedSearch]);
 useEffect(()=>{if(selected||heroSlides.length<2)return;
  const timer=window.setInterval(()=>setHeroIndex(i=>(i+1)%heroSlides.length),7000);
  return()=>window.clearInterval(timer);
 },[heroPaused,selected,heroSlides.length]);
 const featured=heroSlides[heroIndex]||heroSlides[0];
 const editorialTitle=(v:RegisteredVideo)=>{if(editorial[v.videoId]?.display_title)return editorial[v.videoId].display_title;
  // Display a concise editorial title; keep publisher attribution and original metadata in the detail view.
  let title=v.title.replace(/\\s*[|｜]\\s*(?:official (?:video|channel)|full (?:video|episode)|watch now|hd|4k).*$/i,"")
   .replace(/\\s*\\((?:official video|full episode|hd|4k)\\)/gi,"")
   .replace(/\\s*[|｜]\\s*(?:[A-Za-z ]+ (?:Official|Channel))$/i,"")
   .replace(/\\s+/g," ").trim();
  if(title.length>75){const cut=title.slice(0,73).lastIndexOf(" ");title=title.slice(0,cut>35?cut:73).trim()+"…";}
  return title||v.title;
 };
 const collectionTags=(v:RegisteredVideo)=>[v.category,...(v.categories||[]),...(editorial[v.videoId]?.categories||[]),...(editorial[v.videoId]?.genres||[])].join(" ").toLowerCase();
 const categoryRails=(videos:RegisteredVideo[])=>{
  const rails:{name:string;items:RegisteredVideo[]}[]=[];
  const add=(name:string,predicate:(v:RegisteredVideo)=>boolean)=>{
   const items=videos.filter(predicate);
   if(items.length)rails.push({name,items:prioritize(items)});
  };
  add("Recently Added",v=>videos.slice(-30).includes(v));
  const topics:[string,RegExp][]=[
   ["Qur’an & Recitations",/qur.an|surah|recitation|tilawah/],
   ["Faith & Aqeedah",/aqeedah|tawheed|creed|faith/],
   ["Prophets & History",/prophet|seerah|historical|history/],
   ["Game Shows",/game show|competition|quiz/],
   ["News & Broadcasts",/news|broadcast|warar/],
   ["Movies & Films",/movies?|films?|cinema/],
   ["Series & Dramas",/series|drama|musalsal/],
   ["Comedy",/comedy|sitcom|sketch/],
   ["Culture & Travel",/culture|travel|food|documentary/],
   ["Kids & Family",/kids|family|children|animation/]
  ];
  topics.forEach(([name,re])=>add(name,v=>re.test(collectionTags(v))));
  const genres:[string,RegExp][]=[["Drama",/\\bdrama\\b/],["Historical",/historical|history/],["Action",/\\baction\\b/],["Comedy",/\\bcomedy\\b/],["Documentaries",/documentar/],["Family",/\\bfamily\\b/]];
  genres.forEach(([name,re])=>add("Genre · "+name,v=>re.test(collectionTags(v))));
  // Ratings and cast rails are shown only when verified structured metadata exists.
  const rated=dbEpisodes.filter(e=>{const rating=(e as typeof e & {rating?:number}).rating;return e.video_id&&typeof rating==="number"&&rating>=4}).map(e=>e.video_id);
  if(rated.length)add("Highly Rated",v=>rated.includes(v.videoId));
  const castGroups=new Map<string,Set<string>>();
  dbEpisodes.forEach(e=>{const actors=(e as typeof e & {cast?:string[]}).cast;if(!Array.isArray(actors))return;actors.forEach(actor=>{if(typeof actor!=="string"||!actor.trim())return;const name=actor.trim();if(!castGroups.has(name))castGroups.set(name,new Set());castGroups.get(name)?.add(e.video_id)})});
  [...castGroups.entries()].filter(([,ids])=>ids.size>=2).sort((a,b)=>b[1].size-a[1].size).slice(0,4).forEach(([name,ids])=>add("Featuring · "+name,v=>ids.has(v.videoId)));
  rails.push({name:"Explore All "+(tab==="My List"?"Saved Videos":tab==="Home"?"Videos":tab),items:prioritize(videos)});
  return rails;
 };
 const collections=useMemo(()=>categoryRails(filtered),[tab,filtered,watchHistory,dbEpisodes,editorial]);
 const send=(func:string,args?:unknown[])=>{player.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args:args||[]}),"*")};
 const open=(v:RegisteredVideo)=>{markWatched(v.videoId);setSeriesInfo(null);setInfo(null);selectedRef.current=v;setSelected(v);setSeconds(v.startSeconds||0);setPlaying(true);setSettings(false)};
 useEffect(()=>{if(!deepLinkVideo||handledDeepLink.current===deepLinkVideo)return;if(!/^[a-zA-Z0-9_-]{11}$/.test(deepLinkVideo))return;const match=fullCatalog.find(v=>v.videoId===deepLinkVideo)||dbEpisodes.find(v=>v.video_id===deepLinkVideo);if(!match)return;handledDeepLink.current=deepLinkVideo;const v:RegisteredVideo="videoId" in match?match:{videoId:match.video_id,title:match.title,category:"Series",categories:match.categories||[],startSeconds:0,endSeconds:null,format:"desktop"};setInfo(v);},[deepLinkVideo,dbEpisodes]);
 const close=()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});setFullView(false);setSelected(null);selectedRef.current=null;setSettings(false)};
 const episodeQueue=(v:RegisteredVideo)=>{const db=dbEpisodes.find(e=>e.video_id===v.videoId);return db?dbEpisodes.filter(e=>e.series_id===db.series_id).sort((a,b)=>(a.season_number||1)-(b.season_number||1)||(a.episode_number||999)-(b.episode_number||999)).map(e=>({...v,videoId:e.video_id,title:e.title})):orderedShowEpisodes(v)};
 const navigate=(direction:number)=>{const current=selectedRef.current;if(!current)return;const queue=episodeQueue(current);const i=queue.findIndex(v=>v.videoId===current.videoId);const target=queue[i+direction];if(target)open(target)};
 const next=()=>navigate(1);
 useEffect(()=>{if(!selected)return;setControlsVisible(true);const timer=setTimeout(()=>setControlsVisible(false),2000);return()=>clearTimeout(timer)},[selected?.videoId,seconds,playing]);
 useEffect(()=>{if(!selected)return;const onMessage=(event:MessageEvent)=>{if(!event.origin.includes("youtube.com")&&!event.origin.includes("youtube-nocookie.com"))return;try{const d=typeof event.data==="string"?JSON.parse(event.data):event.data;if(typeof d?.info?.currentTime==="number")setSeconds(Math.floor(d.info.currentTime))}catch{}};window.addEventListener("message",onMessage);const timer=setInterval(()=>{send("getCurrentTime");window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:selected.videoId,seconds,format:"desktop"}}))},900);return()=>{clearInterval(timer);window.removeEventListener("message",onMessage);window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format:"desktop"}}))}},[selected,seconds]);
 useEffect(()=>{if(!selected||!isSomaliWatch(selected)||isGalleryAdmin)return;
  const completed=somaliWatch?.completed||false;
  const nextVideo=completed&&somaliWatch?.firstId!==selected.videoId;
  const key=selected.videoId+":"+(nextVideo?"required":seconds>=900?"trial":"intro");
  const due=nextVideo?seconds>=300:seconds>=900?true:seconds>=300;
  if(!due||somaliPrompt||somaliPrompted.current.has(key))return;
  if(!somaliWatch){const value={firstId:selected.videoId,completed:false};setSomaliWatch(value);localStorage.setItem("1muslim:somali-gate-v1",JSON.stringify(value))}
  if(nextVideo){somaliPrompted.current.add(key);send("pauseVideo");setPlaying(false);setSomaliPrompt("required");return}
  if(seconds>=900){if(somaliStage!=="followup")return;somaliPrompted.current.add(key);const value={firstId:somaliWatch?.firstId||selected.videoId,completed:true};setSomaliWatch(value);localStorage.setItem("1muslim:somali-gate-v1",JSON.stringify(value));send("pauseVideo");setPlaying(false);setSomaliPrompt("trial");return}
  if(somaliStage==="first"){somaliPrompted.current.add(key);send("pauseVideo");setPlaying(false);setSomaliPrompt("intro")}
 },[selected?.videoId,seconds,somaliWatch,somaliStage,somaliPrompt,isGalleryAdmin,editorial,catalogMetadata]);
 const toggleSaved=(id:string)=>setSaved(prev=>{const value=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];try{localStorage.setItem("1muslim:deepwatch-list",JSON.stringify(value))}catch{}return value});
 return <main className={"deepwatch"+(tab==="Kids"?" dwKidsMode":"")}><style>{`.deepwatchInlinePlayIcon{display:inline-block;width:1.25em;height:1.25em;vertical-align:-.27em;flex-shrink:0;margin-right:2px}`}</style>
  <header className="deepwatchHeader"><Link href="/" className="deepwatchBrand" aria-label="DeepWatch by 1Muslim — Home"><img src="/assets/deepwatch-icon-2.PNG" alt="DeepWatch by 1Muslim" width={160} height={72} style={{display:"block",width:"auto",maxWidth:"min(38vw,160px)",height:64,objectFit:"contain"}}/></Link><nav aria-label="DeepWatch categories">{visibleTabs.map(item=><button type="button" key={item} aria-current={tab===item?"page":undefined} onClick={()=>setTab(item)}>{item==="Live"?<span className="deepwatchLiveNav"><span className="deepwatchLivePulse" aria-hidden="true"/>LIVE</span>:item}</button>)}</nav><input type="search" aria-label="Search DeepWatch" placeholder="Search titles" value={search} onChange={e=>setSearch(e.target.value)}/>{isGalleryAdmin&&<output aria-live="polite" title="Unique registered titles in DeepWatch, excluding hidden videos" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 13px",border:"1px solid #43536b",borderRadius:14,color:"#f0f5ff",background:"#1a2434",fontSize:12,whiteSpace:"nowrap"}}><span style={{opacity:.7}}>GALLERY</span><strong>{galleryTotal.toLocaleString()}</strong>{libraryLoading&&<span style={{opacity:.7}}>Syncing…</span>}<span style={{opacity:.7}}>· IN CATEGORY {filtered.length.toLocaleString()}</span></output>}</header>
  {tab==="International"&&<section aria-label="International video categories" style={{padding:"12px 24px 4px"}}>
   <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
    {internationalGroups.map(section=><button key={section} type="button" aria-pressed={internationalGroup===section} onClick={()=>setInternationalGroup(section)} style={{flex:"0 0 auto",padding:"9px 15px",borderRadius:999,border:internationalGroup===section?"1px solid #8bcaff":"1px solid rgba(255,255,255,.24)",background:internationalGroup===section?"rgba(60,137,200,.22)":"rgba(255,255,255,.05)",color:"inherit",fontSize:13,fontWeight:internationalGroup===section?700:500}}>{section}</button>)}
   </div>
   {(internationalGroup==="Shows"||internationalGroup==="Genres")&&<div aria-label={internationalGroup+" filters"} style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
    {(internationalGroup==="Shows"?internationalShows:internationalGenres).map(item=><button key={item} type="button" aria-pressed={internationalGroup==="Shows"?internationalShow===item:internationalGenre===item} onClick={()=>internationalGroup==="Shows"?setInternationalShow(item as (typeof internationalShows)[number]):setInternationalGenre(item as (typeof internationalGenres)[number])} style={{flex:"0 0 auto",padding:"7px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.24)",background:(internationalGroup==="Shows"?internationalShow===item:internationalGenre===item)?"rgba(255,255,255,.19)":"transparent",color:"inherit",fontSize:12}}>{item}</button>)}
   </div>}
  </section>}
  {tab==="Somali"&&<section aria-label="Somali video categories" style={{padding:"12px 24px 4px",display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"thin"}}>
   {somaliSections.map(section=><button key={section} type="button" aria-pressed={somaliSection===section} onClick={()=>setSomaliSection(section)} style={{flex:"0 0 auto",padding:"9px 15px",borderRadius:999,border:somaliSection===section?"1px solid #8bcaff":"1px solid rgba(255,255,255,.24)",background:somaliSection===section?"rgba(60,137,200,.22)":"rgba(255,255,255,.05)",color:"inherit",fontSize:13,fontWeight:somaliSection===section?700:500}}>{section}</button>)}
  </section>}
  {tab==="Qur’an"&&<section className="deepwatchSurahLibrary" aria-label="114 Qur’an chapters">
   <div className="deepwatchSurahIntro"><span>THE HOLY QUR’AN · VIDEO LIBRARY</span><h2>THE 114 CHAPTERS</h2><p>Explore recitations and videos by Surah, in Qur’anic or revelation order.</p>
    <div className="deepwatchSurahControls"><button type="button" aria-pressed={chapterOrder==="compiled"} onClick={()=>setChapterOrder("compiled")}>Compiled</button><button type="button" aria-pressed={chapterOrder==="revealed"} onClick={()=>setChapterOrder("revealed")}>Revealed</button><Link href="/quran-library">Qur’an Reader ↗</Link></div></div>
   <div className="deepwatchSurahGrid">{[...quranChapters].sort((a,b)=>chapterOrder==="compiled"?a.id-b.id:(a.revelation_order||a.id)-(b.revelation_order||b.id)).filter(c=>!search||[String(c.id),c.name_simple,c.name_arabic,c.translated_name?.name||""].some(v=>v.toLowerCase().includes(search.toLowerCase()))).map(c=>{const videos=filtered.filter(v=>videoForSurah(v,c));return <div className="deepwatchSurahChapter" key={c.id}><button type="button" className="deepwatchSurahHeading" aria-expanded={expandedSurah===c.id} onClick={()=>setExpandedSurah(expandedSurah===c.id?null:c.id)}><span className="deepwatchSurahNumber">{c.id}</span><span className="deepwatchSurahTitle"><strong>{c.name_simple}</strong><small>{c.translated_name?.name||""} · {c.verses_count} Ayahs · {videos.length} videos</small></span><span className="deepwatchSurahArabic" lang="ar" dir="rtl">{c.name_arabic}</span><span aria-hidden="true">{expandedSurah===c.id?"−":"+"}</span></button>{expandedSurah===c.id&&<div className="deepwatchSurahVideos">{videos.length?videos.map(v=><button type="button" className="deepwatchSurahVideo" key={v.videoId} onClick={()=>setInfo(v)}><img src={image(v.videoId)} alt=""/><span>{v.title}</span></button>):<p>No approved video matched this Surah yet. <Link href="/quran-library">Read the chapter ↗</Link></p>}</div>}</div>})}</div>
   {quranChapters.length===0&&<p>Loading the 114 chapters…</p>}
  </section>}
  {(tab==="Live")&&<section className="deepwatchLiveSpotlight" aria-label="DeepWatch Live spotlight"><div className="deepwatchLiveSpotlightCopy"><span className="deepwatchLiveBadge"><span className="deepwatchLivePulse" aria-hidden="true"/> LIVE CHANNEL</span><h1>DeepWatch Live</h1><p>Watch livestreams and available replays, all in one place.</p><button type="button" onClick={()=>open(featuredLive)}><PlayIcon className="deepwatchInlinePlayIcon"/> Watch Featured Stream</button></div><img src={image(featuredLive.videoId)} alt="" loading="lazy"/></section>}
  <section className="deepwatchHeroCarousel dwCinematicBanner" aria-label="Featured DeepWatch titles" onTouchStart={e=>{heroTouch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const p=heroTouch.current;const t=e.changedTouches[0];if(p&&Math.abs(t.clientX-p.x)>45&&Math.abs(t.clientX-p.x)>Math.abs(t.clientY-p.y))setHeroIndex(i=>(i+(t.clientX<p.x?1:heroSlides.length-1))%heroSlides.length);heroTouch.current=null}}>
   {heroSlides.map((v,i)=><div key={v.videoId} className={`deepwatchHero ${i===heroIndex?"isActive":""}`} aria-hidden={i!==heroIndex} style={{backgroundImage:`linear-gradient(90deg,#07090d 4%,rgba(7,9,13,.92) 38%,rgba(7,9,13,.3)),url("${image(v.videoId)}")`}}>
    {i===heroIndex&&heroPreviewEnabled&&!search&&<div aria-hidden="true" style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      <iframe key={v.videoId} title="" src={`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&start=30&end=37&loop=1&playlist=${v.videoId}&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" tabIndex={-1} style={{position:"absolute",width:"145%",height:"145%",left:"-22.5%",top:"-12%",border:0,opacity:heroThumb?0:0.72,transition:"opacity .7s ease"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(90deg,#07090d 4%,rgba(7,9,13,.92) 38%,rgba(7,9,13,.3)),url("${image(v.videoId)}")`,backgroundSize:"cover",backgroundPosition:"center",opacity:heroThumb?1:0,transition:"opacity .7s ease"}}/>
    </div>}
    <div className="deepwatchHeroText"><p>1MUSLIM · {group(v).toUpperCase()}</p><h1>{editorialTitle(v)}</h1><span>Movie night starts here. Discover something worth your time.</span><div><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>open(v)}><PlayIcon className="deepwatchInlinePlayIcon"/> Watch Now</button><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>toggleSaved(v.videoId)}>{saved.includes(v.videoId)?"✓ In My List":"+ My List"}</button></div></div>
   </div>)}
   {heroSlides.length>1&&<><button type="button" className="dwHeroTapZone dwHeroTapLeft" aria-label="Previous featured title" onClick={()=>setHeroIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}/><button type="button" className="dwHeroTapZone dwHeroTapRight" aria-label="Next featured title" onClick={()=>setHeroIndex(i=>(i+1)%heroSlides.length)}/><div className="dwHeroProgress" aria-label={`Featured title ${heroIndex+1} of ${heroSlides.length}`}>{heroSlides.map((v,i)=><span key={v.videoId} className={i===heroIndex?"active":""}/>)}</div></>}
  </section>
  {(tab==="Home"||tab==="Classics")&&fullCatalog.some(v=>!excludedIds.includes(v.videoId)&&classify(v).Classics)&&<section className="deepwatchRow deepwatchClassicsRow" aria-label="DeepWatch Classics"><h2>✦ Classics <small>Timeless stories & historical favorites</small></h2><div className="deepwatchRail">{fullCatalog.filter(v=>!excludedIds.includes(v.videoId)&&classify(v).Classics&&(!search||[v.title,v.category,...(v.categories||[])].join(" ").toLowerCase().includes(search.toLowerCase()))).slice(0,24).map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small><PlayIcon className="deepwatchInlinePlayIcon"/> Watch Classic</small></button>)}</div></section>}
  {tab==="Home"&&forYou.length>0&&<section className="deepwatchRow" aria-label="For You recommendations"><h2>✦ For You</h2><p style={{opacity:.7,fontSize:13}}>{saved.length?"Because of titles in your list":"Discover titles from the DeepWatch library"}</p><div className="deepwatchRail">{forYou.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small><PlayIcon className="deepwatchInlinePlayIcon"/> Watch</small></button>)}</div></section>}
  {(tab==="The Prophets"||tab==="Scary")&&<section className="deepwatchRow" aria-label="One Islam Productions official channel collection" style={{padding:"12px 24px"}}><h2>🎬 One Islam Productions · Official Collection</h2><p style={{opacity:.8,fontSize:13}}>Animated Islamic films, Prophet Stories, and Letters From Jannah · No Shorts</p><div className="deepwatchRail">{oneIslamVideos.filter(v=>!excludedIds.includes(v.videoId)&&(!search||v.title.toLowerCase().includes(search.toLowerCase()))).map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>setInfo(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>One Islam Productions · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>}
  {(tab==="The Prophets")&&[
   {name:"One Islam · Stories of the Prophets (Mufti Menk)",test:(v:RegisteredVideo)=>/Stories of the Prophets/i.test(v.title)},
   {name:"One Islam · Islamic Education & Lectures",test:(v:RegisteredVideo)=>/25 Prophets|Purpose of Life/i.test(v.title)},
   {name:"One Islam · Stories of Dead People",test:(v:RegisteredVideo)=>(v.categories||[]).includes("Stories of Dead People")},
   {name:"One Islam · Letters From Jannah",test:(v:RegisteredVideo)=>/Letters From Jannah/i.test(v.title)},
   {name:"One Islam · Prophet Stories & Animated Films",test:(v:RegisteredVideo)=>/Prophet|Animated|Ibrahim|Yunus/i.test(v.title)},
   {name:"One Islam · Afterlife & Reminders",test:(v:RegisteredVideo)=>/Grave|Dajjal|Afterlife/i.test(v.title)}
  ].map(section=>{const items=oneIslamVideos.filter(v=>!excludedIds.includes(v.videoId)&&section.test(v)&&(!search||v.title.toLowerCase().includes(search.toLowerCase())));return items.length?<section className="deepwatchRow" key={section.name}><h2>{section.name}</h2><div className="deepwatchRail">{items.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>One Islam Productions · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>:null})}
  {(tab==="Home"||tab==="Live")&&<section className="deepwatchRow" aria-label="Featured YouTube livestream"><h2>🔴 Featured Live Stream</h2><div className="deepwatchRail"><button type="button" className="deepwatchTile" onClick={()=>open(featuredLive)}><img src={image(featuredLive.videoId)} alt="" loading="lazy"/><span>{featuredLive.title}</span><small><PlayIcon className="deepwatchInlinePlayIcon"/> Watch live or replay when available</small></button></div></section>}
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" style={{padding:"12px 24px"}}><h2>Verified Yaqeen Episodes · Play in DeepWatch</h2><div className="deepwatchRail">{verifiedYaqeenEpisodes.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>Yaqeen Institute · <PlayIcon className="deepwatchInlinePlayIcon"/> Play</small></button>)}</div></section>}
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" aria-label="Official Islamic series awaiting video verification" style={{padding:"20px 24px"}}>
   <h2>Official Yaqeen Series · Explore</h2>
   <p style={{opacity:.8,fontSize:13,margin:"8px 0 16px"}}>Publisher-confirmed series. Individual YouTube episodes are not yet verified for DeepWatch playback.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
    {officialSeries.filter(item=>!search||item.title.toLowerCase().includes(search.toLowerCase())).map(item=><a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",flexDirection:"column",gap:8,padding:18,border:"1px solid rgba(255,255,255,.22)",borderRadius:16,background:"rgba(255,255,255,.06)",color:"inherit",textDecoration:"none"}}>
     <strong>{item.title}</strong><small>{item.publisher} · {item.category}</small><small>Official series page <svg className="dwExternalLinkIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 5h6v6M19 5l-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg></small>
    </a>)}
   </div>
  </section>}
  {dbSeries.length>0&&<section className="deepwatchRow" aria-label="DeepWatch shows" style={{padding:"12px 24px"}}><h2>Shows &amp; Series</h2><div className="deepwatchRail">{dbSeries.filter(s=>!search||s.canonical_title.toLowerCase().includes(search.toLowerCase())).map(s=><button type="button" className="deepwatchTile" key={s.id} onClick={()=>{setSeriesInfo(s);setEpisodeSeason(1)}}><img src={s.cover_url||image(dbEpisodes.find(e=>e.series_id===s.id)?.video_id||"")} alt="" loading="lazy"/><span>{s.canonical_title}</span><small>{s.genres.join(" · ")||s.categories.join(" · ")||"Series"}</small></button>)}</div></section>}
  {seriesInfo&&<div className="deepwatchInfoBackdrop" onClick={()=>setSeriesInfo(null)}><section className="deepwatchInfoSheet" role="dialog" aria-modal="true" aria-label={seriesInfo.canonical_title} onClick={e=>e.stopPropagation()}><div className="deepwatchInfoHandle"/><button className="deepwatchInfoClose" onClick={()=>setSeriesInfo(null)} aria-label="Close details">×</button><div className="deepwatchInfoArtwork"><img src={seriesInfo.cover_url||image(dbEpisodes.find(e=>e.series_id===seriesInfo.id)?.video_id||"")} alt=""/><div className="deepwatchInfoArtworkShade"/></div><div className="deepwatchInfoContent"><p className="deepwatchInfoEyebrow">DEEPWATCH · SERIES</p><h2>{seriesInfo.canonical_title}</h2><p className="deepwatchInfoMeta">{[seriesInfo.language,...seriesInfo.genres,...seriesInfo.categories].filter(Boolean).join(" · ")}</p><h3>Ratings &amp; Reviews</h3>{dbEpisodes.filter(e=>e.series_id===seriesInfo.id).slice(0,1).map(e=><DeepWatchReviews key={e.video_id} videoId={e.video_id}/>)}<h3>Episodes</h3><div className="deepwatchInfoSeasons">{[...new Set(dbEpisodes.filter(e=>e.series_id===seriesInfo.id).map(e=>e.season_number||1))].sort((a,b)=>a-b).map(season=><button type="button" key={season} aria-pressed={episodeSeason===season} onClick={()=>setEpisodeSeason(season)}>Season {season}</button>)}</div><div className="deepwatchInfoEpisodes">{dbEpisodes.filter(e=>e.series_id===seriesInfo.id&&(e.season_number||1)===episodeSeason).sort((a,b)=>(a.episode_number||9999)-(b.episode_number||9999)).map(e=><button className="deepwatchInfoEpisode" type="button" key={e.video_id} onClick={()=>open({videoId:e.video_id,title:e.title,category:"Series",categories:e.categories,startSeconds:0,endSeconds:null,format:"desktop"})}><img src={e.cover_url||image(e.video_id)} alt="" loading="lazy"/><span><strong>{e.episode_number?"Episode "+e.episode_number+": ":""}{e.episode_title||e.title}</strong><small>{formatDuration(e.duration_seconds)}</small></span><PlayIcon className="deepwatchInlinePlayIcon"/></button>)}</div></div></section></div>}
  <div className="deepwatchCollections">{collections.map(collection=>collection.items.length>0&&<section key={collection.name} className="deepwatchRow"><h2>{collection.name}</h2><div className="deepwatchRail">{collection.items.slice(0,railLimits[collection.name]||20).map(v=><button type="button" className="deepwatchTile" key={v.videoId} onClick={()=>setInfo(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{editorialTitle(v)}</span><small>{group(v)} · Watch now</small>{isGalleryAdmin&&<span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();startEditing(v)}} onKeyDown={e=>{if(e.key==="Enter"){e.stopPropagation();startEditing(v)}}} style={{display:"inline-block",padding:"8px",color:"#d4c0ff",fontSize:12}}>✎ Edit</span>}</button>)}</div>{collection.items.length>(railLimits[collection.name]||20)&&<button type="button" className="deepwatchLoadMore" onClick={()=>setRailLimits(prev=>({...prev,[collection.name]:(prev[collection.name]||20)+20}))}>Show 20 more · {collection.items.length-(railLimits[collection.name]||20)} remaining</button>}</section>)}</div>
  {editingVideo&&<div className="deepwatchInfoBackdrop" onClick={()=>!editBusy&&setEditingVideo(null)}><section className="deepwatchInfoSheet" role="dialog" aria-modal="true" aria-label="Edit video metadata" onClick={e=>e.stopPropagation()} style={{padding:24,maxWidth:520,margin:"auto",color:"#fff"}}><h2>Edit DeepWatch Video</h2><p style={{opacity:.65,fontSize:12}}>Original: {editingVideo.title}</p><label style={{display:"block",marginTop:18}}>Display Title<input value={editTitle} maxLength={110} onChange={e=>setEditTitle(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:6,color:"#111"}}/></label><label style={{display:"block",marginTop:18}}>Categories (comma separated)<input value={editCategories} onChange={e=>setEditCategories(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:6,color:"#111"}}/></label><label style={{display:"block",marginTop:18}}>Genres (comma separated)<input value={editGenres} onChange={e=>setEditGenres(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:6,color:"#111"}}/></label>{editError&&<p role="alert" style={{color:"#ffaaaa"}}>{editError}</p>}<div style={{display:"flex",gap:12,marginTop:20}}><button type="button" disabled={editBusy} onClick={()=>setEditingVideo(null)}>Cancel</button><button type="button" disabled={editBusy||!editTitle.trim()} onClick={()=>void saveEditing()}>{editBusy?"Saving…":"Save Changes"}</button></div></section></div>}
  {info&&<div className="deepwatchInfoBackdrop" onClick={()=>setInfo(null)}><section className="deepwatchInfoSheet" role="dialog" aria-modal="true" aria-label={info.title} onClick={e=>e.stopPropagation()}><div className="deepwatchInfoHandle" aria-hidden="true"/><button type="button" className="deepwatchInfoClose" onClick={()=>setInfo(null)} aria-label="Close details">×</button><div className="deepwatchInfoArtwork"><img src={image(info.videoId)} alt="" /><div className="deepwatchInfoArtworkShade"/></div><div className="deepwatchInfoContent"><p className="deepwatchInfoEyebrow">DEEPWATCH · {group(info).toUpperCase()}</p><h2>{info.title}</h2><p className="deepwatchInfoMeta">{(info.categories||[]).join(" · ")}</p><div className="deepwatchInfoActions"><button type="button" className="deepwatchInfoPlay" onClick={()=>open(info)}><PlayIcon className="deepwatchInlinePlayIcon"/> Play</button><button type="button" onClick={()=>toggleSaved(info.videoId)}>{saved.includes(info.videoId)?"✓ In My List":"+ My List"}</button>{isGalleryAdmin&&<button type="button" disabled={hidingVideo} onClick={()=>void hideSubscriptionVideo(info)} aria-label="Hide video, reason subscription required">{hidingVideo?"Hiding…":"Hide Video · Subscription Required"}</button>}</div>{hideError&&<p role="alert">{hideError}</p>}<h3>Ratings &amp; Reviews</h3><DeepWatchReviews videoId={info.videoId}/><h3>{seriesKey(info.title)?"Episodes · In Order":"Selected Video"}</h3><div className="deepwatchInfoEpisodes">{orderedShowEpisodes(info).filter(v=>!excludedIds.includes(v.videoId)).slice(0,50).map((v,i)=><button type="button" key={v.videoId} className="deepwatchInfoEpisode" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span><strong>{v.title}</strong><small>{seriesKey(info.title)?`Episode ${episodeOrder(v.title)===999?"Final":episodeOrder(v.title)}`:"Selected title"}</small></span><PlayIcon className="deepwatchInlinePlayIcon"/></button>)}</div></div></section></div>}
  {somaliPrompt&&selected&&<div role="dialog" aria-modal="true" aria-label="1Muslim Unlocked" style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(0,0,0,.86)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:"#15131e",color:"white",border:"1px solid #7969a4",borderRadius:24,padding:28,maxWidth:430,width:"100%",textAlign:"center"}}><h2>1Muslim Unlocked</h2><p>{somaliPrompt==="intro"?"Enjoying Somali entertainment? Unlock the complete DeepWatch library.":somaliPrompt==="trial"?"Try 7 days free for unlimited access without viewing interruptions.":"Continue watching Somali videos with 1Muslim Unlocked. Start your free trial to keep watching."}</p><Link href="/unlocked" style={{display:"block",padding:14,background:"#b8a0ff",borderRadius:12,color:"#101019",fontWeight:700}}>Explore 7 Day Free Trial</Link>{somaliPrompt!=="required"&&<button type="button" onClick={()=>{if(somaliPrompt==="intro")setSomaliStage("followup");dismissSomaliPrompt()}} style={{marginTop:18,padding:12,color:"white"}}>{somaliPrompt==="intro"?"Maybe later":"Later · Finish this show"}</button>}</div></div>}
  {selected&&<div className="deepwatchScreen dwRedesigned" role="dialog" aria-modal="true" aria-label={selected.title} onPointerMove={()=>setControlsVisible(true)} onClick={()=>setControlsVisible(true)}><div className="deepwatchScreenInner"><header className="deepwatchScreenTop"><button type="button" onClick={close} aria-label="Back">←</button><div className="dwTitleMarquee" key={selected.videoId}><span>{selected.title} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {selected.title} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div><button type="button" onClick={()=>toggleSaved(selected.videoId)} aria-label="My List">{saved.includes(selected.videoId)?"✓":"＋"}</button><button type="button" onClick={()=>setSettings(v=>!v)} aria-label="DeepWatch settings">◈</button></header><div className="deepwatchWatchCanvas"><div ref={theaterRef} className={"dwTheater"+(fullView?" dwTheaterExpanded":"")}><div className="deepwatchPlayer"><iframe key={selected.videoId} ref={player} title={selected.title} src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&start=${selected.startSeconds||0}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><button type="button" className="dwTheaterExit" onClick={toggleFullView} aria-label="Exit full view" title="Exit full view">✕ <span>Exit full view</span></button></div><CinemaControls playing={playing} expanded={fullView} visible={controlsVisible} onPrevious={()=>navigate(-1)} onRewind={()=>send("seekTo",[Math.max(0,seconds-10),true])} onTogglePlay={()=>{send(playing?"pauseVideo":"playVideo");setPlaying(!playing)}} onForward={()=>send("seekTo",[seconds+10,true])} onNext={next} onFullscreen={toggleFullView}/>{settings&&<div className="deepwatchSettings"><button type="button" onClick={()=>{setCaptions(!captions);send(captions?"unloadModule":"loadModule",["captions"])}}>Captions {captions?"On":"Off"}</button><button type="button" onClick={()=>send("setPlaybackRate",[1])}>Speed 1×</button></div>}<div className="dwDiscussionTabs" role="tablist" aria-label="Video discussion"><button type="button" role="tab" aria-selected={discussionTab==="timed"} onClick={()=>setDiscussionTab("timed")}>◉ Timed Comments</button><button type="button" role="tab" aria-selected={discussionTab==="review"} onClick={()=>setDiscussionTab("review")}>☆ Write a Review</button></div><div className="dwDiscussionPane" key={discussionTab}>{discussionTab==="timed"?<DeepWatchTimedComments videoId={selected.videoId} seconds={seconds}/>:<DeepWatchReviews videoId={selected.videoId} compose/>}</div><div className="dwLandscapeWatermark" aria-hidden="true">1Muslim</div></div></div></div>}
 </main>;
}
