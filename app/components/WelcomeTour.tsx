"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
const KEY="1muslim-welcome-tour-v1";
export default function WelcomeTour(){
 const path=usePathname();const [step,setStep]=useState(-1);const [rect,setRect]=useState<DOMRect|null>(null);
 useEffect(()=>{if(path!=="/"||localStorage.getItem(KEY))return;const id=window.setTimeout(()=>setStep(0),1200);return()=>clearTimeout(id)},[path]);
 useEffect(()=>{if(step<0)return;const selectors=step===0?["nav","header nav","[role=navigation]"]:step===1?["nav button[aria-label*=menu i]","header button[aria-label*=menu i]","nav button","header nav"]:["[data-hudhud]","[aria-label*=hudhud i]","[class*=hudhud i]"];
 const find=()=>{let el:Element|null=null;for(const selector of selectors){try{el=document.querySelector(selector)}catch{}if(el)break}setRect(el?.getBoundingClientRect()||null)};
 find();window.addEventListener("resize",find);window.addEventListener("scroll",find,true);const timer=window.setInterval(find,700);return()=>{window.removeEventListener("resize",find);window.removeEventListener("scroll",find,true);window.clearInterval(timer)}},[step,path]);
 const finish=()=>{localStorage.setItem(KEY,"done");setStep(-1)};
 if(step<0||path!=="/")return null;
 const message=step===0?"Welcome to 1Muslim! This navigation takes you around the platform.":step===1?"Explore the menu above to find Live, Learn, and your community.":"And this is HudHud, your guide. Tap it anytime you need help!";
 return <div role="dialog" aria-label="Welcome to 1Muslim" aria-modal="false" style={{position:"fixed",inset:0,zIndex:9998,pointerEvents:"none"}}>
 <div style={{position:"absolute",inset:0,background:"rgba(1,9,5,.72)",opacity:step===2?.35:1,transition:"opacity 1.1s ease",pointerEvents:"none"}}/>
 {rect&&<div aria-hidden style={{position:"fixed",left:Math.max(0,rect.left-7),top:Math.max(0,rect.top-7),width:rect.width+14,height:rect.height+14,borderRadius:16,border:"2px solid #b7f7c4",boxShadow:"0 0 0 9999px rgba(1,9,5,.42),0 0 28px #a4f5b7",pointerEvents:"none",transition:"all .35s ease"}}/>}
 <section style={{position:"absolute",bottom:"max(24px,env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",width:"min(92vw,420px)",padding:20,borderRadius:20,border:"1px solid #b8e8b988",background:"#10271c",boxShadow:"0 20px 70px #000a",color:"#f3fff3",pointerEvents:"auto"}}>
 <div style={{fontSize:12,color:"#b8e8b9",fontWeight:700}}>🕊️ HudHud · Welcome {step+1}/3</div><p style={{fontSize:16,lineHeight:1.5,margin:"12px 0"}}>{message}</p>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><button type="button" onClick={finish} style={{background:"none",border:0,color:"#d4dfd6",cursor:"pointer"}}>Skip</button><button type="button" onClick={()=>step===2?finish():setStep(step+1)} style={{border:0,borderRadius:12,padding:"11px 20px",background:"#c4f3cd",color:"#12321e",fontWeight:800,cursor:"pointer"}}>{step===2?"Start exploring":"Next →"}</button></div>
 </section></div>;
}
