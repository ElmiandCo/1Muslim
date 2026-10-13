"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import DhikrStudio from "./DhikrStudio";
import PrayerTimes from "./PrayerTimes";
import NotificationFeed from "./NotificationFeed";
import ProgressWidget from "./ProgressWidget";
const names:Record<string,string>={prayer:"Prayer Times",dhikr:"Dhikr",progress:"XP & Progress",notifications:"Notifications"};
export default function WidgetToolPage(){
 const params=useParams();const tool=String(params.tool||"");
 const [location,setLocation]=useState("");const [permission,setPermission]=useState("default");
 useEffect(()=>{if(typeof Notification!=="undefined")setPermission(Notification.permission)},[]);
 if(!names[tool])return <main style={{padding:30}}><Link href="/">← Home</Link><h1>Widget not found</h1></main>;
 return <main style={{minHeight:"100dvh",background:"radial-gradient(circle at 50% 0%,#205b46,#071c19 70%)",color:"#f3eddb",padding:"clamp(20px,5vw,60px)",fontFamily:"system-ui,sans-serif"}}>
 <div style={{maxWidth:680,margin:"auto"}}><Link href="/" style={{color:"#dfca91",textDecoration:"none"}}>← Home · Widget Gallery</Link><p style={{color:"#d7c38a",letterSpacing:3,fontSize:12,marginTop:40}}>1MUSLIM · WIDGETS</p><h1 style={{fontSize:"clamp(30px,7vw,52px)",margin:"12px 0 24px"}}>{names[tool]}</h1>
 <section style={{border:"1px solid #b6a76b66",borderRadius:24,padding:24,background:"#ffffff0d",boxShadow:"0 20px 60px #0003"}}>
 {tool==="dhikr"&&<DhikrStudio/>}
 {tool==="prayer"&&<PrayerTimes/>}
 {tool==="progress"&&<ProgressWidget/>}
 {tool==="notifications"&&<NotificationFeed/>}
 </section></div></main>;
}
const button:React.CSSProperties={padding:"13px 18px",background:"#e4d299",color:"#173c2c",border:0,borderRadius:12,fontWeight:750,cursor:"pointer"};
