"use client";
import {useEffect} from "react";
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("1Muslim global error",error)},[error]);
 return <html lang="en"><body style={{margin:0,background:"#07130f",color:"#f0fff6",fontFamily:"system-ui,sans-serif"}}><main style={{minHeight:"100dvh",display:"grid",placeItems:"center",padding:24}}><section style={{maxWidth:420,textAlign:"center",border:"1px solid #ffffff25",borderRadius:24,padding:32,background:"#11251c"}}><h1 style={{fontSize:26}}>1Muslim is recovering</h1><p style={{lineHeight:1.6,opacity:.8}}>Something interrupted this page. You can retry without losing your account.</p><button onClick={()=>reset()} style={{background:"#35bc7d",color:"#07130f",border:0,borderRadius:12,padding:"14px 26px",fontWeight:700,cursor:"pointer"}}>Try again</button><p><a href="/" style={{color:"#91e9b5"}}>Return home</a></p></section></main></body></html>
}
