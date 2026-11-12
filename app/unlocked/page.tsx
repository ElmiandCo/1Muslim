"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
export default function UnlockedPage(){
 const [state,setState]=useState<"loading"|"active"|"locked"|"error">("loading");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{let alive=true;const check=async()=>{try{const r=await fetch("/api/stripe/status",{cache:"no-store"});if(r.status===401){if(alive)setState("locked");return;}if(!r.ok)throw Error("Subscription check unavailable");const d=await r.json();if(alive)setState(d.unlocked?"active":"locked");}catch{if(alive)setState("error");}};void check();const timer=setInterval(check,4000);return()=>{alive=false;clearInterval(timer)}},[]);
 const navigate=async(endpoint:string)=>{setBusy(true);setMessage("");try{const r=await fetch(endpoint,{method:"POST"});const d=await r.json();if(!r.ok||!d.url)throw Error(d.error||"Checkout unavailable");const u=new URL(d.url);if(u.protocol!=="https:"||!(u.hostname==="stripe.com"||u.hostname.endsWith(".stripe.com")))throw Error("Invalid billing URL");window.location.assign(u.href);}catch(e){setMessage(e instanceof Error?e.message:"Unable to open billing");}finally{setBusy(false)}};
 return <main style={{minHeight:"100vh",background:"#090b0f",color:"white",display:"grid",placeItems:"center",padding:24,fontFamily:"system-ui"}}><section style={{width:"100%",maxWidth:440,textAlign:"center",background:"#16181e",border:"1px solid #333",borderRadius:24,padding:32}}>
 <h1>✦ 1Muslim Unlocked</h1><p style={{lineHeight:1.6,color:"#ccc"}}>Go Live, calling, premium DeepWatch, expanded Qur’an tools, customization and Qibla editorial opportunities.</p><h2>$3.99 <small style={{fontSize:14,fontWeight:400}}>/ month</small></h2>
 {state==="loading"?<p>Checking your subscription…</p>:state==="active"?<><p>✓ Subscription active</p><Link href="/streaming/go-live" style={{display:"block",padding:14,background:"white",color:"black",borderRadius:12}}>Continue to Go Live</Link><button disabled={busy} onClick={()=>void navigate("/api/stripe/portal")} style={{marginTop:18,padding:12}}>Manage subscription</button></>:<button disabled={busy||state==="error"} onClick={()=>void navigate("/api/stripe/checkout")} style={{width:"100%",padding:16,borderRadius:12,border:0,fontWeight:700}}>{busy?"Opening Stripe…":"Unlock for $3.99/month"}</button>}
 {state==="error"&&<p>Unable to verify your subscription. Please refresh.</p>}{message&&<p role="alert">{message}</p>}<p style={{fontSize:12,color:"#aaa"}}>Recurring monthly subscription. Cancel anytime.</p><Link href="/" style={{color:"#ccc"}}>Back to 1Muslim</Link></section></main>;
}
