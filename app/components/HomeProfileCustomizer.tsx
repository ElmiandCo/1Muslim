"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

const options=[
 {url:"/assets/avatars/default-male.jpg",label:"Classic Male",xp:0},
 {url:"/assets/avatars/Default-women.png",label:"Classic Female",xp:0},
 {url:"/assets/avatars/silver-avatar-male.jpg",label:"Silver Male",xp:5000},
 {url:"/assets/avatars/silver-avatar-female.jpg",label:"Silver Female",xp:5000},
 {url:"/assets/avatars/gold-avatar-male.PNG",label:"Gold Male",xp:5000},
 {url:"/assets/avatars/gold-avatar-female.PNG",label:"Gold Female",xp:5000},
 {url:"/assets/avatars/water-avatar-male.PNG",label:"Water Male",xp:5000},
 {url:"/assets/avatars/water-avatar-female.PNG",label:"Water Female",xp:5000}
];
export default function HomeProfileCustomizer(){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0),[xp,setXp]=useState(0);
 const [id,setId]=useState(""),[config,setConfig]=useState<Record<string,unknown>>({}),[saving,setSaving]=useState(false),[status,setStatus]=useState("");
 useEffect(()=>{
  if(!open)return;
  let active=true;
  const db=createClient();
  void db.auth.getUser().then(async({data:{user}})=>{
   if(!active||!user){setStatus("Sign in to customize your avatar.");return}
   const {data}=await db.from("profiles").select("xp_total,avatar_config").eq("id",user.id).maybeSingle();
   if(!active)return;
   const cfg=(data?.avatar_config||{}) as Record<string,unknown>;
   setId(user.id);setXp(Number(data?.xp_total||0));setConfig(cfg);
   const current=options.findIndex(o=>o.url===cfg.selectedAvatarUrl);
   if(current>=0)setIndex(current);
  });
  return()=>{active=false};
 },[open]);
 useEffect(()=>{
  if(!open||saving)return;
  const timer=window.setInterval(()=>setIndex(i=>(i+1)%options.length),3000);
  return()=>window.clearInterval(timer);
 },[open,saving]);
 async function equip(){
  if(!id)return setStatus("Sign in to customize your avatar.");
  const choice=options[index];
  if(xp<choice.xp)return setStatus("Unlock this avatar at 5,000 XP.");
  setSaving(true);setStatus("Saving avatar…");
  const db=createClient();
  const next={...config,selectedAvatarUrl:choice.url};
  const {error}=await db.from("profiles").update({avatar_config:next}).eq("id",id);
  if(error)setStatus("Could not save avatar: "+error.message);
  else{setConfig(next);setStatus(choice.label+" equipped!");window.dispatchEvent(new Event("1muslim:profile-avatar-updated"))}
  setSaving(false);
 }
 const current=options[index];
 return <>
  <button type="button" onClick={()=>setOpen(true)} aria-label="Customize profile avatar" title="Customize profile avatar" style={{border:"1px solid #bc9b57",borderRadius:"50%",width:37,height:37,background:"rgba(6,25,18,.75)",color:"#e9cf8b",cursor:"pointer"}}>◉</button>
  {open&&<div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}} style={{position:"fixed",inset:0,zIndex:99999,display:"grid",placeItems:"center",background:"rgba(0,0,0,.77)",backdropFilter:"blur(14px)",padding:16}}>
   <section role="dialog" aria-modal="true" aria-label="Profile avatar customization" style={{width:"min(420px,100%)",border:"1px solid rgba(226,190,102,.5)",borderRadius:28,padding:22,background:"linear-gradient(145deg,#102b20,#040a08)",boxShadow:"0 25px 90px #000,0 0 40px #10462d",color:"#f7edd2",textAlign:"center"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>✦ Customize Profile</strong><button type="button" onClick={()=>setOpen(false)} aria-label="Close" style={{background:"transparent",border:0,color:"white",fontSize:23}}>×</button></header>
    <p style={{fontSize:12,opacity:.75}}>{xp.toLocaleString()} XP · Gold & Water unlock at 5,000 XP</p>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"16px 0"}}>
     <button type="button" onClick={()=>setIndex(i=>(i+options.length-1)%options.length)} aria-label="Previous avatar" style={{background:"transparent",border:0,color:"#e8cc84",fontSize:30}}>‹</button>
     <div key={current.url} style={{width:190,height:190,borderRadius:"50%",overflow:"hidden",border:"2px solid #bfa05e",boxShadow:"0 0 32px #116c44",animation:"profileAvatarSpin .7s ease-out both",position:"relative"}}>
      <img src={current.url} alt={current.label} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      {xp<current.xp&&<span style={{position:"absolute",bottom:0,left:0,right:0,background:"#000b",padding:7,fontSize:12}}>🔒 5,000 XP</span>}
     </div>
     <button type="button" onClick={()=>setIndex(i=>(i+1)%options.length)} aria-label="Next avatar" style={{background:"transparent",border:0,color:"#e8cc84",fontSize:30}}>›</button>
    </div>
    <strong>{current.label}</strong><p style={{fontSize:12,opacity:.7}}>Auto-spinning carousel · Swipe choices with arrows</p>
    <button type="button" disabled={saving||xp<current.xp} onClick={()=>void equip()} style={{width:"100%",padding:12,borderRadius:16,border:"1px solid #d3ae5b",background:xp<current.xp?"#303630":"linear-gradient(100deg,#95702a,#dfbe6b)",color:xp<current.xp?"#aaa":"#07140c",fontWeight:700,cursor:"pointer"}}>{xp<current.xp?"Locked · 5,000 XP":saving?"Saving…":"Equip Avatar"}</button>
    <p role="status" style={{minHeight:18,fontSize:12}}>{status}</p>
   </section>
  </div>}
  <style jsx global>{`@keyframes profileAvatarSpin{from{transform:perspective(600px) rotateY(-90deg) scale(.9);opacity:.3}to{transform:perspective(600px) rotateY(0deg) scale(1);opacity:1}}@media(prefers-reduced-motion:reduce){[role="dialog"] div{animation:none!important}}`}</style>
 </>;
}
