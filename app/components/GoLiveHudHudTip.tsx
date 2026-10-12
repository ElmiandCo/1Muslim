"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

const tips=[
 {title:"A Muslim space, a shared responsibility",body:"Keep your Live respectful, beneficial, and welcoming. You're helping shape the 1Muslim community."},
 {title:"Begin with Bismillah",body:"Say Bismillah before you start. A simple beginning can set the intention for a meaningful conversation."},
 {title:"Be the face of 1Muslim Live",body:"Your voice matters. Share knowledge, a reflection, or a positive moment with the Ummah."},
 {title:"Make every Live useful",body:"Ask a thoughtful question, teach something beneficial, or invite others to reflect together."},
 {title:"Protect your community",body:"Respect privacy, avoid sharing personal details, and use moderation tools if someone disrupts the Live."},
 {title:"Bring others into the conversation",body:"Welcome newcomers, encourage kindness, and invite viewers to participate respectfully."},
];
export default function GoLiveHudHudTip(){
 const [tip,setTip]=useState<number|null>(null);
 const [recent,setRecent]=useState<number|null>(null);
 useEffect(()=>{
  let active=true;
  const run=async()=>{
   try{
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user||!active)return;
    const since=new Date(Date.now()-24*60*60*1000).toISOString();
    const {count,error}=await supabase.from("live_streams").select("id",{count:"exact",head:true}).eq("host_id",user.id).gte("created_at",since);
    if(!active)return;
    if(!error&&typeof count==="number")setRecent(count);
    const next=Math.floor(Math.random()*tips.length);
    setTip(next);
   }catch{if(active)setTip(Math.floor(Math.random()*tips.length))}
  };
  void run();return()=>{active=false};
 },[]);
 if(tip===null)return null;
 const consistency=recent!==null&&recent>=2;
 return <aside aria-label="HudHud Vision Go Live reminder" style={{margin:"8px auto",maxWidth:640,padding:"10px 13px",border:"1px solid #7ad9d466",borderRadius:16,background:"linear-gradient(115deg,#081e2ddf,#251b43dc)",color:"#effffb",display:"flex",gap:12,alignItems:"start"}}>
 <span aria-hidden="true" style={{fontSize:22}}>🌀</span><div style={{flex:1,minWidth:0}}><strong style={{fontSize:13}}>HudHud Vision · {consistency?"You're building consistency!":tips[tip].title}</strong><p style={{fontSize:12,lineHeight:1.5,margin:"5px 0 0",opacity:.88}}>{consistency?`You've gone Live ${recent} times in the last 24 hours. Keep showing up with purpose—consistency helps the Ummah recognize your voice.`:tips[tip].body}</p></div>
 <button type="button" onClick={()=>setTip(null)} aria-label="Dismiss HudHud reminder" style={{border:0,background:"transparent",color:"#fff",fontSize:20,cursor:"pointer"}}>×</button></aside>;
}
