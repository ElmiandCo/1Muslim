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
const kidsCatalogIds=new Set([...curatedKidsVideos.map(v=>v.videoId),...videoRegistry.filter(isKidsVideo).map(v=>v.videoId)]);
const isDeepWatchKids=(v:RegisteredVideo)=>kidsCatalogIds.has(v.videoId);
const deepwatchCatalog=[...curatedKidsVideos,...verifiedYaqeenEpisodes,...videoRegistry.filter(v=>v.format!=="phone"&&!curatedKidsVideos.some(k=>k.videoId===v.videoId)&&!verifiedYaqeenEpisodes.some(ep=>ep.videoId===v.videoId))];
const tabs=["Home","Kids","Movies","TV Shows","Series","Animation","International","Live","My List"] as const;
type Tab=typeof tabs[number];
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
 const [playing,setPlaying]=useState(true);
 const [seconds,setSeconds]=useState(0);
 const [captions,setCaptions]=useState(false);
 const [settings,setSettings]=useState(false);
 const [search,setSearch]=useState("");
 const [saved,setSaved]=useState<string[]>([]);
 const player=useRef<HTMLIFrameElement>(null);
 const selectedRef=useRef<RegisteredVideo|null>(null);
 useEffect(()=>{try{const value=JSON.parse(localStorage.getItem("1muslim:deepwatch-list")||"[]");if(Array.isArray(value))setSaved(value.filter((x):x is string=>typeof x==="string"))}catch{}},[]);
 const filtered=useMemo(()=>deepwatchCatalog.filter(v=>(tab==="Home"||(tab==="Kids"?isDeepWatchKids(v):tab==="My List"?saved.includes(v.videoId):group(v)===tab))&&(!search||v.title.toLowerCase().includes(search.toLowerCase()))),[tab,search,saved]);
 const heroSlides=useMemo(()=>{
  const categories:Tab[]=tab==="Home"?["Kids","Series","Movies","TV Shows","Animation","International","Live"]:tab==="My List"?["My List"]: [tab];
  const used=new Set<string>();
  const picks=categories.map(category=>filtered.find(v=>!used.has(v.videoId)&&(category==="My List"||(category==="Kids"?isDeepWatchKids(v):group(v)===category)))).filter((v):v is RegisteredVideo=>Boolean(v));
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
  {name:"Series to Get Into",items:deepwatchCatalog.filter(v=>group(v)==="Series")},
  {name:"Movie Night",items:deepwatchCatalog.filter(v=>group(v)==="Movies")},
  {name:"Animated Adventures",items:deepwatchCatalog.filter(v=>group(v)==="Animation")},
  {name:"International Spotlight",items:deepwatchCatalog.filter(v=>group(v)==="International")},
  {name:"More to Explore",items:deepwatchCatalog.slice(14,44)}
 ]:[{name:tab==="My List"?"Your Watchlist":tab,items:filtered}], [tab,filtered]);
 const send=(func:string,args?:unknown[])=>{player.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args:args||[]}),"*")};
 const open=(v:RegisteredVideo)=>{selectedRef.current=v;setSelected(v);setSeconds(v.startSeconds||0);setPlaying(true);setSettings(false)};
 const close=()=>{setSelected(null);selectedRef.current=null;setSettings(false)};
 const next=()=>{const index=deepwatchCatalog.findIndex(v=>v.videoId===selectedRef.current?.videoId);open(deepwatchCatalog[(index+1)%deepwatchCatalog.length])};
 useEffect(()=>{if(!selected)return;const onMessage=(event:MessageEvent)=>{if(!event.origin.includes("youtube.com")&&!event.origin.includes("youtube-nocookie.com"))return;try{const d=typeof event.data==="string"?JSON.parse(event.data):event.data;if(typeof d?.info?.currentTime==="number")setSeconds(Math.floor(d.info.currentTime))}catch{}};window.addEventListener("message",onMessage);const timer=setInterval(()=>{send("getCurrentTime");window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:selected.videoId,seconds,format:"desktop"}}))},900);return()=>{clearInterval(timer);window.removeEventListener("message",onMessage);window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format:"desktop"}}))}},[selected,seconds]);
 const toggleSaved=(id:string)=>setSaved(prev=>{const value=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];try{localStorage.setItem("1muslim:deepwatch-list",JSON.stringify(value))}catch{}return value});
 return <main className="deepwatch">
  <header className="deepwatchHeader"><Link href="/" className="deepwatchBrand">DEEP<span>WATCH</span><small>BY 1MUSLIM</small></Link><nav aria-label="DeepWatch categories">{tabs.map(item=><button type="button" key={item} aria-current={tab===item?"page":undefined} onClick={()=>setTab(item)}>{item}</button>)}</nav><input type="search" aria-label="Search DeepWatch" placeholder="Search titles" value={search} onChange={e=>setSearch(e.target.value)}/></header>
  <section className="deepwatchHeroCarousel" aria-label="Featured DeepWatch titles" onMouseEnter={()=>setHeroPaused(true)} onMouseLeave={()=>setHeroPaused(false)} onFocusCapture={()=>setHeroPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHeroPaused(false)}}>
   {heroSlides.map((v,i)=><div key={v.videoId} className={`deepwatchHero ${i===heroIndex?"isActive":""}`} aria-hidden={i!==heroIndex} style={{backgroundImage:`linear-gradient(90deg,#07090d 4%,rgba(7,9,13,.92) 38%,rgba(7,9,13,.3)),url("${image(v.videoId)}")`}}>
    <div className="deepwatchHeroText"><p>1MUSLIM · {group(v).toUpperCase()}</p><h1>{v.title}</h1><span>Movie night starts here. Discover something worth your time.</span><div><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>open(v)}>▶ Play Now</button><button type="button" tabIndex={i===heroIndex?0:-1} onClick={()=>toggleSaved(v.videoId)}>{saved.includes(v.videoId)?"✓ In My List":"+ My List"}</button></div></div>
   </div>)}
   {heroSlides.length>1&&<><button type="button" className="deepwatchHeroArrow previous" aria-label="Previous featured title" onClick={()=>setHeroIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}>‹</button><button type="button" className="deepwatchHeroArrow next" aria-label="Next featured title" onClick={()=>setHeroIndex(i=>(i+1)%heroSlides.length)}>›</button><div className="deepwatchHeroDots" aria-label="Choose featured title">{heroSlides.map((v,i)=><button key={v.videoId} type="button" aria-label={`Show slide ${i+1}: ${v.title}`} aria-current={i===heroIndex?"true":undefined} onClick={()=>setHeroIndex(i)}/>)}</div></>}
  </section>
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" style={{padding:"12px 24px"}}><h2>Verified Yaqeen Episodes · Play in DeepWatch</h2><div className="deepwatchRail">{verifiedYaqeenEpisodes.map(v=><button key={v.videoId} type="button" className="deepwatchTile" onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>Yaqeen Institute · ▶ Play</small></button>)}</div></section>}
  {(tab==="Home"||tab==="Series")&&<section className="deepwatchRow" aria-label="Official Islamic series awaiting video verification" style={{padding:"20px 24px"}}>
   <h2>Official Yaqeen Series · Explore</h2>
   <p style={{opacity:.8,fontSize:13,margin:"8px 0 16px"}}>Publisher-confirmed series. Individual YouTube episodes are not yet verified for DeepWatch playback.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
    {officialSeries.filter(item=>!search||item.title.toLowerCase().includes(search.toLowerCase())).map(item=><a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" style={{display:"flex",flexDirection:"column",gap:8,padding:18,border:"1px solid rgba(255,255,255,.22)",borderRadius:16,background:"rgba(255,255,255,.06)",color:"inherit",textDecoration:"none"}}>
     <strong>{item.title}</strong><small>{item.publisher} · {item.category}</small><small>Official series page ↗</small>
    </a>)}
   </div>
  </section>}
  {(tab==="Home"||tab==="Movies")&&<section className="deepwatchRow" aria-label="Featured Muslim cinema" style={{padding:"20px 24px"}}>
   <h2>Featured Muslim Cinema</h2>
   <article style={{border:"1px solid rgba(255,255,255,.2)",borderRadius:18,padding:22,background:"rgba(255,255,255,.06)",display:"flex",flexDirection:"column",gap:12,maxWidth:720}}>
    <small>2026 · 1h 52m · Rated R · Ages 17+ · Action / Drama</small>
    <h3 style={{fontSize:"clamp(22px,4vw,32px)",fontWeight:800}}>Your Mother Your Mother Your Mother</h3>
    <p>Directed by Bassam Tariq and starring Mahershala Ali. After his wife dies, a Muslim father struggles to protect his children while confronting his violent past and his faith.</p>
    <p style={{fontSize:13,opacity:.8}}>Not available as an authorized free full-length YouTube embed. Watch through a licensed provider. This title is excluded from Kids Mode.</p>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     <a href="https://www.primevideo.com/detail/0GCYEXX1RWJO21AQG7IVVUHK2D" target="_blank" rel="noopener noreferrer" style={{padding:"12px 18px",borderRadius:10,background:"#fff",color:"#111",fontWeight:700,textDecoration:"none"}}>Rent or buy on Prime Video ↗</a>
     <a href="https://tv.apple.com/us/movie/your-mother-your-mother-your-mother/umc.cmc.4toc3jxlokjpogd9hhz472cc0" target="_blank" rel="noopener noreferrer" style={{padding:"12px 18px",borderRadius:10,border:"1px solid currentColor",color:"inherit",textDecoration:"none"}}>View on Apple TV ↗</a>
    </div>
   </article>
  </section>}
  <div className="deepwatchCollections">{collections.map(collection=>collection.items.length>0&&<section key={collection.name} className="deepwatchRow"><h2>{collection.name}</h2><div className="deepwatchRail">{collection.items.map(v=><button type="button" className="deepwatchTile" key={v.videoId} onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>{group(v)} · Watch now</small></button>)}</div></section>)}</div>
  {selected&&<div className="deepwatchScreen" role="dialog" aria-modal="true" aria-label={selected.title}><div className="deepwatchScreenInner"><div className="deepwatchScreenTop"><button onClick={close}>← DeepWatch</button><strong>{selected.title}</strong><button onClick={()=>toggleSaved(selected.videoId)}>{saved.includes(selected.videoId)?"✓ Saved":"+ My List"}</button></div><div className="deepwatchWatchCanvas"><div className="deepwatchPlayer"><iframe key={selected.videoId} ref={player} title={selected.title} src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&start=${selected.startSeconds||0}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><div className="deepwatchControls"><button onClick={()=>setSettings(v=>!v)}>⚙ Settings</button><button onClick={()=>send("seekTo",[Math.max(0,seconds-10),true])}>↶ 10s</button><button className="deepwatchPlay" onClick={()=>{send(playing?"pauseVideo":"playVideo");setPlaying(!playing)}}>{playing?"Ⅱ Pause":"▶ Play"}</button><button onClick={()=>send("seekTo",[seconds+10,true])}>10s ↷</button><button onClick={next}>Next Episode →</button></div>{settings&&<div className="deepwatchSettings"><button onClick={()=>{setCaptions(!captions);send(captions?"unloadModule":"loadModule",["captions"])}}>Captions: {captions?"On":"Off"}</button><button onClick={()=>send("setPlaybackRate",[1])}>Speed: Normal</button></div>}<div className="deepwatchTimed"><HomeLiveConversation room="desktop"/></div></div></div></div>}
 </main>;
}
