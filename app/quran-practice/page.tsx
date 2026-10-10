"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import VerseRecorder from "../elm-tent/quran/VerseRecorder";
import {createClient} from "../../utils/supabase/client";

export default function QuranPracticePage(){
 const [verse,setVerse]=useState("36:1");
 const [name,setName]=useState("Member");
 const [avatar,setAvatar]=useState("");
 const [attempts,setAttempts]=useState(0);
 const [hint,setHint]=useState("");
 useEffect(()=>{let live=true;const db=createClient();void(async()=>{const {data:{user}}=await db.auth.getUser();if(!user||!live)return;setName(String(user.user_metadata?.full_name||user.email?.split("@")[0]||"Member"));setAvatar(String(user.user_metadata?.avatar_url||""));const {data}=await db.from("hudhud_learning_profiles").select("last_surah,last_ayah").eq("user_id",user.id).maybeSingle();if(live&&data?.last_surah&&data.last_ayah)setVerse(`${data.last_surah}:${data.last_ayah}`);})();return()=>{live=false}},[]);
 useEffect(()=>{let active=true;const db=createClient();void(async()=>{const {data:{user}}=await db.auth.getUser();if(!user)return;const {count}=await db.from("tajweed_attempts").select("id",{head:true,count:"exact"}).eq("surah_number",Number(verse.split(":")[0])).eq("ayah_number",Number(verse.split(":")[1]));if(active)setAttempts(count||0)})();return()=>{active=false}},[verse]);
 useEffect(()=>{const handler=(e:Event)=>{const detail=(e as CustomEvent<{verse:string}>).detail;if(detail?.verse!==verse)return;setHint(attempts<=1?"You have a natural curiosity for recitation. Keep going! 🌙":"Your dedication shows. Let's focus on one sound at a time. 🌀")};window.addEventListener("1muslim:quran-recitation-saved",handler);return()=>window.removeEventListener("1muslim:quran-recitation-saved",handler)},[attempts,verse]);
 const valid=/^(?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]*$/.test(verse);
 return <><SiteNav/><main style={{minHeight:"100vh",padding:"110px 16px 130px",background:"linear-gradient(155deg,#050b16,#10152e)",color:"#eefcfb"}}>
 <div style={{maxWidth:720,margin:"auto"}}>
 <Link href="/elm-tent/quran" style={{color:"#90f5db"}}>← Back to Qur’an reading</Link>
 <header style={{textAlign:"center",margin:"25px 0"}}><img src="/assets/hudhud-logo.PNG" alt="HudHud" width={76} height={76} style={{objectFit:"contain",margin:"auto"}}/><p style={{color:"#8af0dc"}}>HUDHUD · QUR’AN PRACTICE</p><h1 style={{fontSize:32,fontWeight:800}}>Your Recitation Studio</h1><p>Practice privately, save your recitation, and return to reading.</p></header>
 <section style={{padding:20,border:"1px solid #487d83",borderRadius:22,background:"#0b2030"}}>
 <div style={{display:"flex",alignItems:"center",gap:12}}>{avatar?<img src={avatar} alt="" width={44} height={44} style={{borderRadius:"50%"}}/>:<span style={{fontSize:30}}>🌀</span>}<div><strong>{name}</strong><p style={{fontSize:12,color:"#acc6cc"}}>Personal practice · {attempts} recorded assessment attempts</p></div></div>
 <label style={{display:"block",marginTop:18}}>Verse reference (surah:ayah)<input aria-label="Verse reference" value={verse} onChange={e=>setVerse(e.target.value)} style={{display:"block",width:"100%",marginTop:7,padding:12,borderRadius:12,background:"#142d3a",color:"white",border:"1px solid #518a8a"}}/></label>
 {valid?<VerseRecorder key={verse} verse={verse}/>:<p>Enter a valid surah and verse reference.</p>}
 <p style={{fontSize:12,color:"#b1cbd1",marginTop:15}}>Saving audio does not certify Tajweed. Verified scoring and rank awards require the assessment service.</p>
 {hint&&<div role="status" style={{marginTop:15,padding:14,borderRadius:12,background:"#17463b"}}>✨ HudHud: {hint}</div>}
 </section></div></main></>;
}
