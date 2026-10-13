"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
const names:Record<string,string>={prayer:"Prayer Times",dhikr:"Dhikr",progress:"XP & Progress",notifications:"Notifications"};
export default function WidgetToolPage(){
 const params=useParams();const tool=String(params.tool||"");
 const [count,setCount]=useState(0);const [location,setLocation]=useState("");const [permission,setPermission]=useState("default");
 useEffect(()=>{try{setCount(Number(localStorage.getItem("1muslim-dhikr-count")||0))}catch{}if(typeof Notification!=="undefined")setPermission(Notification.permission)},[]);
 const change=(n:number)=>{setCount(n);try{localStorage.setItem("1muslim-dhikr-count",String(n))}catch{}};
 if(!names[tool])return <main style={{padding:30}}><Link href="/">← Home</Link><h1>Widget not found</h1></main>;
 return <main style={{minHeight:"100dvh",background:"radial-gradient(circle at 50% 0%,#205b46,#071c19 70%)",color:"#f3eddb",padding:"clamp(20px,5vw,60px)",fontFamily:"system-ui,sans-serif"}}>
 <div style={{maxWidth:680,margin:"auto"}}><Link href="/" style={{color:"#dfca91",textDecoration:"none"}}>← Home · Widget Gallery</Link><p style={{color:"#d7c38a",letterSpacing:3,fontSize:12,marginTop:40}}>1MUSLIM · WIDGETS</p><h1 style={{fontSize:"clamp(30px,7vw,52px)",margin:"12px 0 24px"}}>{names[tool]}</h1>
 <section style={{border:"1px solid #b6a76b66",borderRadius:24,padding:24,background:"#ffffff0d",boxShadow:"0 20px 60px #0003"}}>
 {tool==="dhikr"&&<div><p>Subḥān Allāh · Alḥamdulillāh · Allāhu Akbar</p><div aria-live="polite" style={{fontSize:78,textAlign:"center",padding:25,color:"#e3d095"}}>{count}</div><button onClick={()=>change(count+1)} style={button}>+ Count Dhikr</button><button onClick={()=>change(0)} style={{...button,marginLeft:10,background:"#ffffff1a",color:"#fff"}}>Reset</button><p style={{opacity:.7}}>Your count is saved on this device.</p></div>}
 {tool==="prayer"&&<div><h2>Prayer schedule</h2><p>Accurate prayer times require your location and a calculation method. We won't guess them.</p><label>City or location <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Enter your city" style={{display:"block",width:"100%",margin:"12px 0",padding:12,borderRadius:10}}/></label><p style={{opacity:.7}}>Location entered: {location||"Not selected"}. Prayer-time calculations and alerts are coming in the next integration.</p></div>}
 {tool==="progress"&&<div><h2>Your learning journey</h2><p>Track your badges, learning milestones, and XP from your profile.</p><Link href="/profile" style={{...button,display:"inline-block",textDecoration:"none"}}>Open Profile →</Link><p style={{opacity:.7}}>Live XP totals will appear here once connected to the profile data source.</p></div>}
 {tool==="notifications"&&<div><h2>Stay connected</h2><p>Messages, lives, and community updates belong here.</p><p>Browser notification permission: <strong>{permission}</strong></p><button style={button} onClick={async()=>{if(typeof Notification!=="undefined"){const p=await Notification.requestPermission();setPermission(p)}}}>Enable Browser Notifications</button><p style={{opacity:.7}}>Permission alone does not enable server push; notification feed integration is still needed.</p></div>}
 </section></div></main>;
}
const button:React.CSSProperties={padding:"13px 18px",background:"#e4d299",color:"#173c2c",border:0,borderRadius:12,fontWeight:750,cursor:"pointer"};
