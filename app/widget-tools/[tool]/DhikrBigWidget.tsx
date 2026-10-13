"use client";
import {useEffect,useState} from "react";
import FingerCounter from "./FingerCounter";
import {createClient} from "../../../utils/supabase/client";
const KEY="1muslim:dhikr-studio:v1";
type Stored={counts:Record<string,number>;total:number;xp:number;selected:string;custom:{id:string;label:string;arabic:string}[]};
const names:Record<string,string>={subhan:"Subḥān Allāh",astaghfir:"Astaghfirullāh",alhamdulillah:"Alḥamdulillāh",tawhid:"Lā ilāha illā Allāh",takbir:"Allāhu Akbar",hawqala:"Lā ḥawla wa lā quwwata illā billāh",combined:"All Together",bihamdihi:"Subḥān Allāhi wa biḥamdih"};
export default function DhikrBigWidget({openStudio}:{openStudio:()=>void}){
 const [data,setData]=useState<Stored|null>(null);
 useEffect(()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||"null");setData(d&&d.counts?d:{counts:{},total:0,xp:0,selected:"subhan",custom:[]})}catch{setData({counts:{},total:0,xp:0,selected:"subhan",custom:[]})}},[]);
 const selected=data?.selected||"subhan",count=data?.counts?.[selected]||0;
 const tap=()=>{if(!data)return;const next={...data,total:data.total+1,xp:(data.xp||0)+10,counts:{...data.counts,[selected]:count+1}};setData(next);try{localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event("1muslim:dhikr-updated"))}catch{}void (async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(user)await db.rpc("award_dhikr_tap")})()};
 return <div style={{width:"100%",height:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:7,padding:12,overflow:"auto",color:"#f5ebd2"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><strong style={{fontSize:15}}>📿 Dhikr</strong><button type="button" onClick={openStudio} style={{border:"1px solid #e5d5a877",background:"#ffffff14",color:"#efdfb7",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:11}}>✦ Studio / Duʿā</button></div>
 <small style={{fontSize:11,color:"#e9d69f"}}>{data?.custom?.find(x=>x.id===selected)?.label||names[selected]||"Dhikr"}</small>
 <FingerCounter count={count} onCount={tap} compact/>
 <small style={{fontSize:10,opacity:.7}}>Tap the palms · +10 XP saved quietly · {data?.total||0} total</small>
 </div>;
}
