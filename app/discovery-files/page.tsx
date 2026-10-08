"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function DiscoveryFiles(){
 const [completed,setCompleted]=useState<string[]>([]);const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{void fetch("/api/discovery").then(r=>r.json()).then(d=>{setCompleted(d.completed??[]);setSignedIn(!!d.signedIn)}).catch(()=>{})},[]);
 const unlocked=completed.length>=2;
 return <main style={{maxWidth:680,margin:"50px auto",padding:24,color:"#eaf7e9",background:"#11251a",borderRadius:22}}>
 <Link href="/">← Home</Link><h1>📁 My Learning Files</h1><p>Your first discovery document unlocks after two lessons.</p>
 <section style={{padding:24,border:"1px solid #729a76",borderRadius:16}}>
 <h2>{unlocked?"📜 My First Islamic Words":"🔒 My First Islamic Words"}</h2>
 {unlocked?<><p><strong>Bismillah</strong> — In the name of Allah.</p><p><strong>As-salamu alaykum</strong> — Peace be upon you.</p><p><strong>Alhamdulillah</strong> — All praise belongs to Allah.</p><p><strong>Tawhid</strong> — The oneness of Allah.</p><button onClick={()=>window.print()}>Save or print this document</button></>:<p>{signedIn?completed.length+"/2 lessons complete":"Sign in to save your progress."}</p>}
 </section><p>🌟 Discovery Star avatar flair: {completed.length>=4?"Unlocked!":"Complete all four discoveries to unlock."}</p>
 </main>;
}
