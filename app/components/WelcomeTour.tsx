"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
const KEY="1muslim-welcome-tour-v2";
const targets=["[data-tour=primary-nav]","[data-tour=menu-button]","[data-tour=hudhud]"];\nfunction tourTarget(step:number){if(step===1)return document.querySelector(window.matchMedia("(max-width: 700px)").matches?"[data-tour=menu-button]":"[data-tour=desktop-menu-button]");return document.querySelector(targets[step])|| (step===2?document.querySelector("[class*=hudhud i]"):null)}
export default function WelcomeTour(){
 const path=usePathname();const [step,setStep]=useState(-1);const [rect,setRect]=useState<{left:number;top:number;width:number;height:number}|null>(null);
 useEffect(()=>{if(path!=="/"||localStorage.getItem(KEY))return;const timer=window.setTimeout(()=>setStep(0),1100);return()=>window.clearTimeout(timer)},[path]);
 useEffect(()=>{if(step<0)return;const update=()=>{const el=document.querySelector(targets[step]);const r=el?.getBoundingClientRect();setRect(r?{left:r.left,top:r.top,width:r.width,height:r.height}:null)};update();window.addEventListener("resize",update);window.addEventListener("scroll",update,true);const t=window.setInterval(update,500);return()=>{window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);window.clearInterval(t)}},[step]);
 useEffect(()=>{if(step!==1)return;const button=tourTarget(1) as HTMLButtonElement | null;if(!button){setStep(2);return}const onClick=()=>window.setTimeout(()=>setStep(2),250);button.addEventListener("click",onClick);return()=>button.removeEventListener("click",onClick)},[step]);
 useEffect(()=>{if(step!==2)return;const t=window.setTimeout(()=>finish(),5200);return()=>window.clearTimeout(t)},[step]);
 function finish(){localStorage.setItem(KEY,"done");setStep(-1)}
 if(step<0||path!=="/")return null;
 const message=step===0?"Welcome to 1Muslim! Here's your navigation for exploring the community.":step===1?"Now tap the highlighted menu above to discover more pages.":"This is HudHud, your guide. Tap HudHud whenever you need help. Enjoy exploring!";
 return <div role="dialog" aria-label="HudHud welcome guide" aria-modal="false" style={{position:"fixed",inset:0,zIndex:9998,pointerEvents:"none"}}>
 <div style={{position:"absolute",inset:0,background:"rgba(1,9,5,.72)",opacity:step===2?0.08:1,transition:"opacity 4.5s ease",pointerEvents:"none"}}/>
 {rect&&<div aria-hidden style={{position:"fixed",left:Math.max(0,rect.left-6),top:Math.max(0,rect.top-6),width:rect.width+12,height:rect.height+12,borderRadius:15,border:"2px solid #b7f7c4",boxShadow:"0 0 20px #a4f5b7",pointerEvents:"none",transition:"all .3s ease"}}/>}
 <section style={{position:"absolute",bottom:"max(95px,env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",width:"min(92vw,420px)",padding:20,borderRadius:20,border:"1px solid #b8e8b988",background:"#10271c",boxShadow:"0 20px 70px #000a",color:"#f3fff3",pointerEvents:"auto"}}>
 <div style={{fontSize:12,color:"#b8e8b9",fontWeight:700}}>🕊️ HudHud · Welcome {step+1}/3</div><p style={{fontSize:16,lineHeight:1.5,margin:"12px 0"}}>{message}</p>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><button type="button" onClick={finish} style={{background:"none",border:0,color:"#d4dfd6",cursor:"pointer"}}>Skip</button>{step===1?<span style={{fontSize:12,color:"#c4f3cd"}}>Tap highlighted menu ↑</span>:<button type="button" onClick={()=>step===2?finish():setStep(1)} style={{border:0,borderRadius:12,padding:"11px 20px",background:"#c4f3cd",color:"#12321e",fontWeight:800,cursor:"pointer"}}>{step===2?"Finish":"Next →"}</button>}</div>
 </section></div>;
}
