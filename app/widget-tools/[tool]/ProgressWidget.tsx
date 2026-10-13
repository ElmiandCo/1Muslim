"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function ProgressWidget(){
 const [total,setTotal]=useState(0);const [xp,setXp]=useState(0);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("1muslim:dhikr-studio:v1")||"null");setTotal(Number(saved?.total)||0);setXp(Number(saved?.xp)||0)}catch{}},[]);
 return <div style={{display:"grid",gap:14}}><h2>Your Dhikr progress</h2><div style={{padding:18,borderRadius:14,background:"#ffffff0d"}}><strong style={{fontSize:32}}>{total.toLocaleString()}</strong><p>Recitations recorded on this device</p></div><div style={{padding:18,borderRadius:14,background:"#ffffff0d"}}><strong style={{fontSize:32}}>{xp.toLocaleString()}</strong><p>Local Dhikr XP</p></div><p style={{opacity:.7}}>Account XP and profile badges are separate until account synchronization is connected.</p><Link href="/profile" style={{color:"#e4d299"}}>View your profile →</Link></div>;
}
