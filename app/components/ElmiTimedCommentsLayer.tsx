"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../../utils/supabase/client";

type Comment={id:string;body:string;at_seconds:number;user_id:string};
type Floating=Comment&{born:number;until:number;lane:"screen"|"canvas";pinned:boolean;pausedUntil:number;popping?:boolean};
type Bounds={x:number;y:number;w:number;h:number};
export default function ElmiTimedCommentsLayer({videoKey,seconds,playing,bounds}:{videoKey:string;seconds:number;playing:boolean;bounds:Bounds}){
 const [entries,setEntries]=useState<Comment[]>([]);
 const [avatars,setAvatars]=useState<Record<string,string|null>>({});
 const [floating,setFloating]=useState<Floating[]>([]);
 const seen=useRef(new Set<string>());
 const previous=useRef(-1);
 const [ready,setReady]=useState(false);
 const [spotlight,setSpotlight]=useState<{body:string;atSeconds:number;started:number}|null>(null);
 useEffect(()=>{
   let timer:ReturnType<typeof setTimeout>|undefined;
   const onPosted=(event:Event)=>{
     const detail=(event as CustomEvent<{body:string;atSeconds:number;videoKey:string}>).detail;
     if(!detail||detail.videoKey!==videoKey)return;
     if(timer)clearTimeout(timer);
     setSpotlight({body:detail.body,atSeconds:detail.atSeconds,started:Date.now()});
     timer=setTimeout(()=>setSpotlight(null),3000);
   };
   window.addEventListener("elmi-layer-x-comment-posted",onPosted);
   return()=>{window.removeEventListener("elmi-layer-x-comment-posted",onPosted);if(timer)clearTimeout(timer)};
 },[videoKey]);
 useEffect(()=>setReady(true),[]);
 useEffect(()=>{
   let live=true;seen.current.clear();previous.current=-1;setEntries([]);setFloating([]);
   if(!videoKey)return;
   const db=createClient();
   const load=async()=>{const {data,error}=await db.from("featured_video_timed_comments").select("id,body,at_seconds,user_id").eq("video_key",videoKey).order("at_seconds",{ascending:true}).limit(500);if(live&&!error)setEntries((data||[]) as Comment[])};
   void load();const timer=window.setInterval(()=>void load(),15000);
   return()=>{live=false;window.clearInterval(timer)};
 },[videoKey]);
 useEffect(()=>{
   if(!playing||!videoKey)return;
   if(previous.current>=0&&(seconds<previous.current-2||seconds>previous.current+4)){seen.current.clear();setFloating([])}
   previous.current=seconds;
   const due=entries.filter(c=>Math.abs(c.at_seconds-seconds)<=1&&!seen.current.has(c.id)).slice(0,4);
   if(!due.length)return;
   const now=Date.now();due.forEach(c=>seen.current.add(c.id));
   setFloating(current=>[...current.filter(c=>c.until>now),...due.map((c,i)=>({...c,born:now+i*240,until:now+8000+i*240,lane:i%2===0?"canvas" as const:"screen" as const,pinned:false,pausedUntil:0}))].slice(-5));
 },[seconds,playing,videoKey,entries]);
 useEffect(()=>{let active=true;const ids=[...new Set(entries.map(e=>e.user_id))].filter(id=>!(id in avatars));if(!ids.length)return;void createClient().from("profiles").select("id,avatar_url").in("id",ids).then(({data})=>{if(active&&data)setAvatars(old=>({...old,...Object.fromEntries(data.map(p=>[p.id,p.avatar_url||null]))}))});return()=>{active=false}},[entries,avatars]);
 useEffect(()=>{const timer=window.setInterval(()=>setFloating(items=>items.filter(c=>c.until>Date.now())),300);return()=>window.clearInterval(timer)},[]);
 const audioRef=useRef<AudioContext|null>(null);
 const popCount=useRef(0);
 const playPop=()=>{
   try{
     const AudioContextClass=window.AudioContext;
     if(!AudioContextClass)return;
     const ctx=audioRef.current??new AudioContextClass();audioRef.current=ctx;
     if(ctx.state==="suspended")void ctx.resume();
     const variant=popCount.current++%3;
     const osc=ctx.createOscillator(),gain=ctx.createGain();
     osc.type=variant===1?"triangle":"sine";
     const t=ctx.currentTime;
     const start=[560,720,470][variant],end=[190,240,160][variant];
     osc.frequency.setValueAtTime(start,t);osc.frequency.exponentialRampToValueAtTime(end,t+.09);
     gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.075,t+.008);
     gain.gain.exponentialRampToValueAtTime(.0001,t+.115);
     osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.13);
   }catch{}
 };
 useEffect(()=>()=>{if(audioRef.current)void audioRef.current.close()},[]);
 const interact=(id:string)=>{
   const item=floating.find(c=>c.id===id);if(!item||item.popping)return;
   if(!item.pinned){setFloating(items=>items.map(c=>c.id===id?{...c,pinned:true,pausedUntil:Date.now()+5000,until:c.until+5000}:c));return}
   playPop();
   setFloating(items=>items.map(c=>c.id===id?{...c,popping:true}:c));
   window.setTimeout(()=>setFloating(items=>items.filter(c=>c.id!==id)),240);
 };
 if(!ready||!videoKey||bounds.w<=0||bounds.h<=0)return null;
 // One DOM node and one continuous animation per comment. No reparenting or remounting at crossover.
 // Canvas-to-screen depth is represented by a single viewport portal; its path crosses
 // the carousel boundary without any position or opacity discontinuity.
 return createPortal(<div className="elmi-timed-layers" aria-label="Timed video comments">\n   {spotlight&&<div className="elmi-post-spotlight" aria-hidden="true" style={{"--elmi-focus-x":`${bounds.x+bounds.w/2}px`,"--elmi-focus-y":`${bounds.y+bounds.h/2}px` } as React.CSSProperties}><div className="elmi-post-spotlight-video"/></div>}\n   {spotlight&&<div key={spotlight.started} className="elmi-post-spotlight-comment" role="status"><span>{spotlight.body}</span></div>}
   {floating.map((comment,i)=>{
     const canvasStart=comment.lane==="canvas";
     const startX=canvasStart?bounds.x+bounds.w*(.2+(i%3)*.09):Math.max(16,window.innerWidth*.17+(i%3)*28);
     const startY=canvasStart?bounds.y+bounds.h*.48:window.innerHeight-36;
     const endY=Math.max(-85,bounds.y-115);
     const distance=Math.max(120,startY-endY);
     const paused=comment.pausedUntil>Date.now();
     return <div key={comment.id} role="button" tabIndex={0} onClick={()=>interact(comment.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();interact(comment.id)}}}
       className={"elmi-timed-comment"+(canvasStart?" is-handoff":" is-screen")+(comment.pinned?" is-pinned":"")+(comment.popping?" is-popping":"")}
       style={{left:startX,top:startY,"--elmi-travel":-distance+"px",animationPlayState:paused?"paused":"running",animationDelay:(i%3)*160+"ms"} as React.CSSProperties}
       aria-label="Floating video comment">
       <span className="elmi-timed-content"><a className="elmi-timed-avatar" href={"/profile/"+encodeURIComponent(comment.user_id)} aria-label="View commenter profile and follow" onClick={e=>e.stopPropagation()}>{avatars[comment.user_id]?<img src={avatars[comment.user_id]!} alt="" loading="lazy"/>:<span aria-hidden="true">◉</span>}</a><span>{comment.body}</span></span>
     </div>
   })}
   <style>{`
    .elmi-timed-layers{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;isolation:isolate}\n    .elmi-post-spotlight{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse min(48vw,420px) min(30vh,260px) at var(--elmi-focus-x) var(--elmi-focus-y),rgba(255,255,255,.20),rgba(255,255,255,.055) 55%,transparent 80%);animation:elmi-post-light 3s ease-in-out both;z-index:1}\n    .elmi-post-spotlight-comment{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);max-width:min(340px,78vw);display:flex;flex-direction:column;gap:4px;padding:12px 18px;border-radius:16px;border:1px solid rgba(255,255,255,.42);background:rgba(8,18,30,.48);backdrop-filter:blur(12px);color:white;text-shadow:0 1px 8px #000;box-shadow:0 0 32px 9px rgba(255,255,255,.18);font:600 14px/1.35 sans-serif;animation:elmi-post-float 3s ease-in-out both;z-index:6;pointer-events:none}\n    .elmi-post-spotlight-comment small{font-size:11px;opacity:.8}\n    @keyframes elmi-post-light{0%,100%{opacity:0}16%,72%{opacity:1}}\n    @keyframes elmi-post-float{0%{opacity:0;transform:translate(-50%,65vh) scale(.8)}30%{opacity:1;transform:translate(-50%,-50%) scale(1)}72%{opacity:1;transform:translate(-50%,-55%) scale(1.04)}100%{opacity:0;transform:translate(-50%,-105%) scale(.95)}}\n    @media(prefers-reduced-motion:reduce){.elmi-post-spotlight,.elmi-post-spotlight-comment{animation:none;opacity:1}}
    .elmi-timed-comment{position:absolute;display:flex;flex-direction:column;gap:3px;max-width:min(340px,65vw);padding:7px 12px;text-align:left;color:white;font-size:clamp(12px,1.3vw,14px);font-weight:600;line-height:1.35;border:1px solid color-mix(in srgb,var(--theme-primary,#a6dce0) 32%,transparent);border-radius:13px;background:rgba(10,18,26,.24);backdrop-filter:blur(5px);text-shadow:0 1px 5px #000;box-shadow:0 5px 18px #0003;pointer-events:auto;cursor:pointer;animation:elmi-layer-handoff 8s cubic-bezier(.38,.12,.4,.94) both;will-change:transform,opacity;z-index:2}
    .elmi-timed-comment.is-handoff{z-index:2}.elmi-timed-comment.is-screen{z-index:3}
    .elmi-timed-comment.is-popping{animation:elmi-comment-pop .24s ease-out forwards!important;pointer-events:none}
    @keyframes elmi-comment-pop{0%{opacity:1;scale:1}55%{opacity:.95;scale:1.24}100%{opacity:0;scale:.25}}
    .elmi-timed-comment.is-pinned{border-color:color-mix(in srgb,var(--theme-primary,#a6dce0) 65%,transparent)}
    .elmi-timed-content{display:flex;align-items:center;gap:8px}.elmi-timed-avatar{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);color:white;text-decoration:none;pointer-events:auto}.elmi-timed-avatar img{width:100%;height:100%;object-fit:cover}
    @keyframes elmi-layer-handoff{
      0%{opacity:0;transform:translate3d(0,25px,0) scale(.88) rotate(-.8deg)}
      12%{opacity:.92;transform:translate3d(0,calc(var(--elmi-travel)*.10),0) scale(.94) rotate(.3deg)}
      36%{opacity:.97;transform:translate3d(0,calc(var(--elmi-travel)*.34),0) scale(1) rotate(-.3deg)}
      52%{opacity:.97;transform:translate3d(0,calc(var(--elmi-travel)*.53),0) scale(1.035) rotate(.2deg)}
      78%{opacity:.92;transform:translate3d(0,calc(var(--elmi-travel)*.82),0) scale(1.06) rotate(-.2deg)}
      100%{opacity:0;transform:translate3d(0,var(--elmi-travel),0) scale(1.09) rotate(0)}
    }
    @media(prefers-reduced-motion:reduce){.elmi-timed-comment{animation:none;opacity:1}}
   `}</style>
 </div>,document.body);
}
