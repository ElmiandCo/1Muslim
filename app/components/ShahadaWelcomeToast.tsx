"use client";
import {useEffect,useState} from "react";
export default function ShahadaWelcomeToast(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  let shouldShow=false;
  try{shouldShow=sessionStorage.getItem("1muslim:shahada-welcome")==="yes";if(shouldShow)sessionStorage.removeItem("1muslim:shahada-welcome")}catch{}
  if(!shouldShow)return;
  const enter=window.setTimeout(()=>setVisible(true),180);
  const leave=window.setTimeout(()=>setVisible(false),6500);
  return()=>{clearTimeout(enter);clearTimeout(leave)};
 },[]);
 return <div role="status" aria-live="polite" style={{position:"fixed",top:visible?"max(14px, env(safe-area-inset-top))":"-180px",left:"50%",transform:"translateX(-50%)",zIndex:9999,width:"min(92vw,420px)",display:"flex",alignItems:"center",gap:14,padding:"16px 20px",border:"1px solid rgba(194,223,162,.5)",borderRadius:22,background:"linear-gradient(125deg,#172b1d,#09140d)",color:"#f1f5e8",boxShadow:"0 20px 65px #0009,0 0 32px #73bf7633",transition:"top .75s cubic-bezier(.2,.8,.2,1)",pointerEvents:visible?"auto":"none"}}>
  <div aria-hidden="true" style={{width:60,height:60,flexShrink:0,borderRadius:"50%",display:"grid",placeItems:"center",border:"2px solid #d3c88c",background:"radial-gradient(circle,#f4e7ac,#8b8150)",color:"#1a2616",fontSize:30}}>✦</div>
  <div style={{flex:1}}><div style={{fontSize:10,letterSpacing:".14em",color:"#c4d5ac"}}>SHAHADA BADGE UNLOCKED</div><strong style={{display:"block",fontSize:18,margin:"4px 0"}}>Congratulations!</strong><span style={{fontSize:12,color:"#c6d4c5"}}>Welcome to the 1Muslim community.</span></div>
  <button type="button" onClick={()=>setVisible(false)} aria-label="Dismiss welcome" style={{border:0,background:"transparent",color:"#e4efda",fontSize:22,cursor:"pointer"}}>×</button>
 </div>;
}
