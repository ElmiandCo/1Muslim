"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type MouseEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import "./RecentMuslimDiscovery.css";

type Member={id:string;display_name:string|null;username:string|null;avatar_url:string|null;avatar_gender:string|null;avatar_config:Record<string,unknown>|null};
const fallback=(m:Member)=>m.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
const photo=(m:Member)=>{
 const configured=m.avatar_config?.selectedAvatarUrl;
 return (typeof configured==="string"&&configured.trim())?configured:m.avatar_url||fallback(m);
};
/** Latest public profiles only; never exposes emails, precise location or private region choices. */
export default function RecentMuslimDiscovery({excludeId}:{excludeId?:string}){
 const [members,setMembers]=useState<Member[]>([]),[index,setIndex]=useState(0),[failed,setFailed]=useState(false);
 const [pictureError,setPictureError]=useState(false);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const didSwipe=useRef(false);
 useEffect(()=>{
  let active=true;const db=createClient();
  const load=async()=>{
   const {data,error}=await db.from("profiles")
    .select("id,display_name,username,avatar_url,avatar_gender,avatar_config")
    .order("created_at",{ascending:false}).limit(8);
   if(!active)return;
   if(error){setFailed(true);return}
   const next=(data||[]).filter((p)=>p.id!==excludeId).slice(0,3) as Member[];
   setMembers(next);setFailed(false);
   setIndex(old=>Math.min(old,Math.max(next.length-1,0)));
  };
  void load();const onResume=()=>{if(document.visibilityState==="visible")void load()};
  document.addEventListener("visibilitychange",onResume);
  const refresh=window.setInterval(()=>{if(document.visibilityState==="visible")void load()},60000);
  return()=>{active=false;document.removeEventListener("visibilitychange",onResume);window.clearInterval(refresh)};
 },[excludeId]);
 useEffect(()=>{
  if(members.length<2||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const timer=window.setInterval(()=>{if(document.visibilityState==="visible")setIndex(i=>(i+1)%members.length)},5000);
  return()=>window.clearInterval(timer);
 },[members.length]);
 useEffect(()=>setPictureError(false),[members,index]);
 const advance=(direction:number)=>setIndex(i=>(i+direction+members.length)%members.length);
 const member=members[index];
 const name=member?.display_name||member?.username||"New member";
 const open=(event:MouseEvent<HTMLAnchorElement>,id?:string)=>{event.preventDefault();window.dispatchEvent(new CustomEvent("1muslim:discover-muslims",{detail:{id}}))};
 return <section className="profileSocialDiscoveryShortcut recentMuslimDiscovery" aria-label="Discover recently joined Muslims"
  onTouchStart={e=>{didSwipe.current=false;const t=e.touches[0];if(t)touchStart.current={x:t.clientX,y:t.clientY}}}
  onTouchEnd={e=>{const start=touchStart.current;touchStart.current=null;const t=e.changedTouches[0];if(!start||!t||members.length<2)return;const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.25){didSwipe.current=true;advance(dx<0?1:-1)}}}
  onTouchCancel={()=>{touchStart.current=null}} onClickCapture={e=>{if(didSwipe.current){e.preventDefault();e.stopPropagation();didSwipe.current=false}}}>
   <Link className="recentMuslimProfile" href={member?"/profile?section=muslimeen&member="+encodeURIComponent(member.id):"/profile?section=muslimeen"} title={member?"View "+name+"'s profile":"Find Muslims"} onClick={e=>open(e,member?.id)}>
    <span className="recentMuslimAvatar" key={member?.id||"placeholder"}>
     {member&&!pictureError?<img src={photo(member)} alt={name+"'s avatar"} loading="eager" onError={()=>setPictureError(true)}/>:<span aria-hidden="true">◎</span>}
    </span>
    <span className="recentMuslimCopy"><strong>Discover Muslims</strong><small>{member?"Recently joined · "+name:failed?"Explore the Ummah":"Recently joined"}</small></span>
   </Link>
   <Link className="recentMuslimExplore" href="/profile?section=muslimeen" aria-label="Explore all Muslims" onClick={e=>open(e)}>Explore <span aria-hidden="true">→</span></Link>
   {members.length>1&&<span className="recentMuslimPips" aria-label={"Member "+(index+1)+" of "+members.length}>{members.map((m,i)=><button key={m.id} type="button" className={i===index?"on":""} aria-label={"Show recent member "+(i+1)} aria-pressed={i===index} onClick={()=>setIndex(i)}/>)}</span>}
  </section>;
}
