"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import HomeLiveConversation from "../components/HomeLiveConversation";
import {videoRegistry,type RegisteredVideo} from "../components/videoRegistry";
import "./deepwatch.css";

const tabs=["Home","Movies","TV Shows","Series","Animation","International","Live","My List"] as const;
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
 const filtered=useMemo(()=>videoRegistry.filter(v=>(tab==="Home"||(tab==="My List"?saved.includes(v.videoId):group(v)===tab))&&(!search||v.title.toLowerCase().includes(search.toLowerCase()))),[tab,search,saved]);
 const featured=filtered[0]||videoRegistry[0];
 const collections=useMemo(()=>tab==="Home"?[
  {name:"Featured Tonight",items:videoRegistry.slice(0,14)},
  {name:"Series to Get Into",items:videoRegistry.filter(v=>group(v)==="Series")},
  {name:"Movie Night",items:videoRegistry.filter(v=>group(v)==="Movies")},
  {name:"Animated Adventures",items:videoRegistry.filter(v=>group(v)==="Animation")},
  {name:"International Spotlight",items:videoRegistry.filter(v=>group(v)==="International")},
  {name:"More to Explore",items:videoRegistry.slice(14,44)}
 ]:[{name:tab==="My List"?"Your Watchlist":tab,items:filtered}], [tab,filtered]);
 const send=(func:string,args?:unknown[])=>{player.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args:args||[]}),"*")};
 const open=(v:RegisteredVideo)=>{selectedRef.current=v;setSelected(v);setSeconds(v.startSeconds||0);setPlaying(true);setSettings(false)};
 const close=()=>{setSelected(null);selectedRef.current=null;setSettings(false)};
 const next=()=>{const index=videoRegistry.findIndex(v=>v.videoId===selectedRef.current?.videoId);open(videoRegistry[(index+1)%videoRegistry.length])};
 useEffect(()=>{if(!selected)return;const onMessage=(event:MessageEvent)=>{if(!event.origin.includes("youtube.com")&&!event.origin.includes("youtube-nocookie.com"))return;try{const d=typeof event.data==="string"?JSON.parse(event.data):event.data;if(typeof d?.info?.currentTime==="number")setSeconds(Math.floor(d.info.currentTime))}catch{}};window.addEventListener("message",onMessage);const timer=setInterval(()=>{send("getCurrentTime");window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:selected.videoId,seconds,format:"desktop"}}))},900);return()=>{clearInterval(timer);window.removeEventListener("message",onMessage);window.dispatchEvent(new CustomEvent("elmi-home-video-time",{detail:{videoKey:"",seconds:0,format:"desktop"}}))}},[selected,seconds]);
 const toggleSaved=(id:string)=>setSaved(prev=>{const value=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];try{localStorage.setItem("1muslim:deepwatch-list",JSON.stringify(value))}catch{}return value});
 return <main className="deepwatch">
  <header className="deepwatchHeader"><Link href="/" className="deepwatchBrand">DEEP<span>WATCH</span><small>BY 1MUSLIM</small></Link><nav aria-label="DeepWatch categories">{tabs.map(item=><button type="button" key={item} aria-current={tab===item?"page":undefined} onClick={()=>setTab(item)}>{item}</button>)}</nav><input type="search" aria-label="Search DeepWatch" placeholder="Search titles" value={search} onChange={e=>setSearch(e.target.value)}/></header>
  <section className="deepwatchHero" style={{backgroundImage:featured?`linear-gradient(90deg,#07090d 4%,rgba(7,9,13,.92) 38%,rgba(7,9,13,.3)),url("${image(featured.videoId)}")`:undefined}}><div className="deepwatchHeroText"><p>1MUSLIM ORIGINAL COLLECTIONS</p><h1>{featured?.title||"Stories worth watching."}</h1><span>Movie night starts here. Discover something worth your time.</span><div><button onClick={()=>featured&&open(featured)}>▶ Play Now</button><button onClick={()=>featured&&toggleSaved(featured.videoId)}>{featured&&saved.includes(featured.videoId)?"✓ In My List":"+ My List"}</button></div></div></section>
  <div className="deepwatchCollections">{collections.map(collection=>collection.items.length>0&&<section key={collection.name} className="deepwatchRow"><h2>{collection.name}</h2><div className="deepwatchRail">{collection.items.map(v=><button type="button" className="deepwatchTile" key={v.videoId} onClick={()=>open(v)}><img src={image(v.videoId)} alt="" loading="lazy"/><span>{v.title}</span><small>{group(v)} · Watch now</small></button>)}</div></section>)}</div>
  {selected&&<div className="deepwatchScreen" role="dialog" aria-modal="true" aria-label={selected.title}><div className="deepwatchScreenInner"><div className="deepwatchScreenTop"><button onClick={close}>← DeepWatch</button><strong>{selected.title}</strong><button onClick={()=>toggleSaved(selected.videoId)}>{saved.includes(selected.videoId)?"✓ Saved":"+ My List"}</button></div><div className="deepwatchWatchCanvas"><div className="deepwatchPlayer"><iframe key={selected.videoId} ref={player} title={selected.title} src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&start=${selected.startSeconds||0}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><div className="deepwatchControls"><button onClick={()=>setSettings(v=>!v)}>⚙ Settings</button><button onClick={()=>send("seekTo",[Math.max(0,seconds-10),true])}>↶ 10s</button><button className="deepwatchPlay" onClick={()=>{send(playing?"pauseVideo":"playVideo");setPlaying(!playing)}}>{playing?"Ⅱ Pause":"▶ Play"}</button><button onClick={()=>send("seekTo",[seconds+10,true])}>10s ↷</button><button onClick={next}>Next Episode →</button></div>{settings&&<div className="deepwatchSettings"><button onClick={()=>{setCaptions(!captions);send(captions?"unloadModule":"loadModule",["captions"])}}>Captions: {captions?"On":"Off"}</button><button onClick={()=>send("setPlaybackRate",[1])}>Speed: Normal</button></div>}<div className="deepwatchTimed"><HomeLiveConversation room="desktop"/></div></div></div></div>}
 </main>;
}
