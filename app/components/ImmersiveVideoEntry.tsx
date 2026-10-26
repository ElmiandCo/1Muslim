"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";

type Clip={id:string;src:string;caption:string;creator:string};
const DEMO:Clip={id:"demo",src:"/videos/prelive-intro.mp4",caption:"Welcome to 1Muslim · Preview video",creator:"1Muslim"};
export default function ImmersiveVideoEntry(){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[clips,setClips]=useState<Clip[]>([DEMO]),[index,setIndex]=useState(0),[muted,setMuted]=useState(true);
 const video=useRef<HTMLVideoElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{if(pathname!=="/"){setOpen(false);return}try{setOpen(sessionStorage.getItem("1muslim:video-entry-dismissed")!=="1")}catch{setOpen(true)}},[pathname]);
 useEffect(()=>{let alive=true;const load=async()=>{try{
  const db=createClient();
  const {data:media,error}=await db.from("post_media").select("id,post_id,user_id,storage_path,created_at").ilike("mime_type","video/%").order("created_at",{ascending:false}).limit(30);
  if(error||!media?.length)return;
  const {data:posts}=await db.from("posts").select("id,user_id,body").in("id",[...new Set(media.map(m=>m.post_id))]);
  const byId=new Map((posts||[]).map(p=>[p.id,p]));
  const valid=media.filter(m=>byId.get(m.post_id)?.user_id===m.user_id);
  if(!valid.length)return;
  const {data:urls}=await db.storage.from("community-media").createSignedUrls(valid.map(m=>m.storage_path),3600);
  const found=valid.flatMap((m,i)=>urls?.[i]?.signedUrl?[{id:m.id,src:urls[i].signedUrl,caption:byId.get(m.post_id)?.body||"1Muslim community video",creator:"Community"}]:[]);
  if(alive&&found.length)setClips(found);
 }catch{}};void load();return()=>{alive=false}},[]);
 useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=old}},[open]);
 useEffect(()=>{if(!open)return;const el=video.current;if(!el)return;el.muted=muted;el.load();void el.play().catch(()=>{});return()=>el.pause()},[index,open,muted,clips]);
 const close=()=>{setOpen(false);video.current?.pause();try{sessionStorage.setItem("1muslim:video-entry-dismissed","1")}catch{}};
 const step=(n:number)=>setIndex(i=>Math.max(0,Math.min(clips.length-1,i+n)));
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")close();if(e.key==="ArrowDown")step(1);if(e.key==="ArrowUp")step(-1)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[open,clips.length]);
 if(!open||pathname!=="/")return null;
 const clip=clips[index]||DEMO;
 return <div className="imv-root" role="dialog" aria-modal="true" aria-label="1Muslim full-screen video feed"
 onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}}
 onTouchEnd={e=>{const start=touch.current;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;touch.current=null;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.3)step(dy<0?1:-1)}}>
  <video key={clip.id} ref={video} src={clip.src} autoPlay muted={muted} playsInline loop preload="auto" onClick={e=>{const v=e.currentTarget;if(v.paused)void v.play();else v.pause()}} />
  <div className="imv-shade"/>
  <button className="imv-close" type="button" onClick={close} aria-label="Close videos and go home">✕ <span>Home</span></button>
  <div className="imv-brand">☪ <strong>1MUSLIM</strong><span>For You</span></div>
  <div className="imv-caption"><strong>@{clip.creator}</strong><p>{clip.caption}</p><small>{index+1} / {clips.length} · Swipe up or down</small></div>
  <div className="imv-actions"><button type="button" onClick={()=>setMuted(v=>!v)} aria-label={muted?"Unmute":"Mute"}>{muted?"🔇":"🔊"}</button><button type="button" onClick={()=>step(-1)} disabled={index===0} aria-label="Previous video">↑</button><button type="button" onClick={()=>step(1)} disabled={index===clips.length-1} aria-label="Next video">↓</button></div>
  <style jsx>{`
   .imv-root{position:fixed;inset:0;z-index:2147483000;background:#020705;color:white;overflow:hidden;touch-action:pan-y;overscroll-behavior:contain;font-family:inherit}
   video{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
   .imv-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#00180f99,transparent 24%,transparent 52%,#00150dcc)}
   .imv-close{position:absolute;top:max(22px,env(safe-area-inset-top));right:18px;border:1px solid #dfc58b9e;border-radius:24px;background:#073d30c9;color:#fff;padding:10px 14px;font-size:20px;z-index:3;backdrop-filter:blur(12px);cursor:pointer}
   .imv-close span{font-size:12px;margin-left:5px}
   .imv-brand{position:absolute;top:max(28px,env(safe-area-inset-top));left:18px;display:flex;align-items:center;gap:10px;color:#f2d995;text-shadow:0 2px 8px #000}
   .imv-brand span{margin-left:10px;border-bottom:2px solid #e7c777;color:white;font-size:14px}
   .imv-caption{position:absolute;left:20px;right:85px;bottom:max(42px,calc(env(safe-area-inset-bottom) + 24px));text-shadow:0 2px 8px #000}
   .imv-caption strong{color:#f5e5b8}.imv-caption p{font-size:16px;line-height:1.35;margin:9px 0}.imv-caption small{color:#e0e9e3}
   .imv-actions{position:absolute;right:14px;bottom:max(62px,calc(env(safe-area-inset-bottom) + 50px));display:grid;gap:15px}
   .imv-actions button{border:1px solid #cda9618c;border-radius:50%;width:48px;height:48px;background:#063a2ac7;color:white;font-size:24px;backdrop-filter:blur(10px);cursor:pointer}
   .imv-actions button:disabled{opacity:.3}
   @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `}</style>
 </div>;
}
