"use client";
import {useEffect} from "react";

export default function Error({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("1Muslim recovered from a page error",error)},[error]);
 return <main style={{minHeight:"100dvh",background:"#07130f",color:"#f0fff6",display:"grid",placeItems:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
  <section style={{maxWidth:420,width:"100%",textAlign:"center",padding:"36px 24px",border:"1px solid #ffffff22",borderRadius:26,background:"linear-gradient(145deg,#112a20,#091711)",boxShadow:"0 18px 60px #0008"}}>
   <div style={{fontSize:38,marginBottom:12}}>✦</div><h1 style={{fontSize:25,margin:"0 0 12px"}}>1Muslim is still here</h1>
   <p style={{opacity:.8,lineHeight:1.6,margin:"0 0 26px"}}>This screen had a temporary problem. Your account and saved content have not been changed by this error.</p>
   <button onClick={()=>reset()} style={{background:"#35bc7d",color:"#04150d",border:0,borderRadius:14,padding:"14px 24px",fontWeight:700,cursor:"pointer",width:"100%",fontSize:16}}>Try again</button>
   <button onClick={()=>window.location.assign("/")} style={{background:"transparent",color:"#c8f5da",border:"1px solid #ffffff44",borderRadius:14,padding:"13px 24px",fontWeight:600,cursor:"pointer",width:"100%",marginTop:12}}>Return home</button>
   <p style={{fontSize:12,opacity:.55,margin:"20px 0 0"}}>If this continues, reopen the app or contact support.</p>
  </section></main>
}
