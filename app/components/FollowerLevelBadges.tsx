"use client";
import {useEffect,useState} from "react";
export const FOLLOWER_LEVELS=[
 {count:1,title:"First Follower",icon:"✨",description:"1 follower",mark:"×1"},
 {count:10,title:"Rising Member",icon:"🌱",description:"10 followers",mark:"×10"},
 {count:100,title:"Growing Creator",icon:"💠",description:"100 followers",mark:"×100"},
 {count:1000,title:"Community Influencer",icon:"👑",description:"1,000 followers",mark:"×1,000"},
 {count:10000,title:"Leader Candidate",icon:"🏅",description:"10,000 followers · Leader role eligibility",mark:"×10,000"},
] as const;
export default function FollowerLevelBadges({followers,ownerId,celebrate=false}:{followers:number;ownerId:string;celebrate?:boolean}){
 const [earned,setEarned]=useState<number[]>([]);
 const [newLevel,setNewLevel]=useState<number|null>(null);
 useEffect(()=>{
  const achieved=FOLLOWER_LEVELS.filter(x=>followers>=x.count).map(x=>x.count);
  setEarned(achieved);
  if(!celebrate)return;
  const key="1muslim-follower-badges-seen-"+ownerId;
  try{
   const seen=JSON.parse(localStorage.getItem(key)||"[]") as number[];
   const latest=achieved.filter(x=>!seen.includes(x)).at(-1);
   if(latest)setNewLevel(latest);
   localStorage.setItem(key,JSON.stringify([...new Set([...seen,...achieved])]));
  }catch{}
 },[followers,ownerId,celebrate]);
 const level=FOLLOWER_LEVELS.find(x=>x.count===newLevel);
 return <section aria-label="Follower milestone badges" style={{margin:"18px 0",padding:18,border:"1px solid #51618c",borderRadius:18,background:"linear-gradient(115deg,#121d32,#201839)",color:"#f6f5ff"}}>
  <h3 style={{margin:"0 0 6px"}}>🏅 Follower Level-Up Badges</h3>
  <p style={{margin:"0 0 14px",opacity:.8}}>{followers.toLocaleString()} followers · Earn each badge by reaching its milestone. Leader permissions require admin approval.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{FOLLOWER_LEVELS.map(x=><div key={x.count} title={x.description} style={{flex:"1 1 130px",padding:14,textAlign:"center",borderRadius:14,border:"1px solid "+(earned.includes(x.count)?"#b8a3ff":"#42465a"),opacity:earned.includes(x.count)?1:.48,background:"#ffffff0b"}}>
   <div style={{fontSize:32}}>{earned.includes(x.count)?x.icon:"🔒"}</div><div style={{fontSize:18,fontWeight:900,letterSpacing:1}}>{x.mark}</div><strong style={{display:"block"}}>{x.title}</strong><small>{x.description}</small><div style={{fontSize:11,marginTop:5}}>{earned.includes(x.count)?"UNLOCKED":`${Math.max(0,x.count-followers).toLocaleString()} to go`}</div>
  </div>)}</div>
  {level&&<div role="status" style={{marginTop:12,padding:12,borderRadius:12,background:"#4b3b78"}}>🎉 HudHud: You leveled up! {level.icon} {level.title} unlocked! <button type="button" onClick={()=>setNewLevel(null)} style={{marginLeft:10}}>Close</button></div>}
 </section>;
}
