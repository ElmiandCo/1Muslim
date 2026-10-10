"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {createClient} from "../../utils/supabase/client";

const KEY="1muslim:hudhud:last-activity:v1";
type Activity={path:string;label:string;at:number};
const title=(path:string)=>path.includes("quran")?"your Qur’an reading":path.includes("lesson")?"your learning journey":path.includes("stream")?"the live community":path.includes("profile")?"your profile":path.includes("tajweed")?"your Tajweed practice":"your last page";
const safePath=(path:string)=>path.startsWith("/")&&!path.startsWith("//")&&!path.includes("\\")?path:"/";
export default function HudHudPersonalWelcome(){
 const pathname=usePathname();
 const [greeting,setGreeting]=useState<string|null>(null);
 const [activity,setActivity]=useState<Activity|null>(null);
 const [reminder,setReminder]=useState(false);
 const [visible,setVisible]=useState(true);
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setTimeout>|undefined;const db=createClient();void(async()=>{
  const {data:{user}}=await db.auth.getUser();if(!user||!active)return;
  let previous:Activity|null=null;try{previous=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
  const {data:profile}=await db.from("profiles").select("display_name").eq("id",user.id).maybeSingle();
  const name=String(profile?.display_name||user.user_metadata?.full_name||user.email?.split("@")[0]||"friend").trim().slice(0,32);
  const {data:learning}=await db.from("hudhud_learning_profiles").select("last_surah,last_ayah,daily_verse_goal").eq("user_id",user.id).maybeSingle();
  const {count}=await db.from("tajweed_attempts").select("id",{count:"exact",head:true});
  const options=[
   `Assalamu alaikum, ${name}. HudHud remembers your corner of 1Muslim. 🌀`,
   `${name}, you're back! Even small steps count in a journey of learning. ✨`,
   `A familiar face! Welcome back, ${name}. Ready to discover something new? 🌙`
  ];
  if(count&&count>0)options.push(`${name}, ${count} Tajweed practice ${count===1?"attempt":"attempts"} already. Your effort is adding up. 🎙️`);
  if(learning?.last_surah&&learning.last_ayah)options.push(`${name}, I remember you were practicing verse ${learning.last_surah}:${learning.last_ayah}. 📖`);
  const pick=(new Date().getDate()+user.id.charCodeAt(0))%options.length;
  if(!active)return;setGreeting(options[pick]);setActivity(previous);
  timer=setTimeout(()=>{if(active)setReminder(true)},3800);
 })();return()=>{active=false;if(timer)clearTimeout(timer)}},[]);
 useEffect(()=>{if(!pathname||pathname==="/auth")return;try{localStorage.setItem(KEY,JSON.stringify({path:safePath(pathname),label:title(pathname),at:Date.now()}))}catch{}},[pathname]);
 if(!greeting||!visible)return null;
 return <aside role="status" aria-live="polite" style={{position:"fixed",bottom:110,left:16,zIndex:150,maxWidth:340,padding:16,borderRadius:18,background:"#081728f2",border:"1px solid #64ebdc",color:"white",boxShadow:"0 12px 35px #0009"}}>
  <button onClick={()=>setVisible(false)} aria-label="Dismiss HudHud welcome" style={{float:"right",background:"transparent",border:0,color:"white",cursor:"pointer",fontSize:20}}>×</button>
  <strong>🌀 HudHud</strong><p style={{fontSize:14,lineHeight:1.5,margin:"10px 0"}}>{greeting}</p>
  {reminder&&<div style={{borderTop:"1px solid #42636d",paddingTop:10,fontSize:13}}>{activity&&activity.path!=="/" ? <>Last time you were exploring {activity.label}. <Link href={safePath(activity.path)} style={{color:"#89f8db",display:"block",marginTop:8}}>Pick up where you left off →</Link></> : <Link href="/elm-tent/quran" style={{color:"#89f8db"}}>Continue your Qur’an journey →</Link>}</div>}
 </aside>;
}
