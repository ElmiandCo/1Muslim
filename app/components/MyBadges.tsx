"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";

const catalog=[
 {id:"shahadah",name:"Shahadah Badge",icon:"✦",image:"/assets/badges/shahada-badge.png"},
 {id:"dua",name:"Dua Badge",icon:"🤲",image:"/assets/badges/dua-badge.PNG"},
 {id:"live",name:"Live Badge",icon:"🔴",image:""},
 {id:"community_steward",name:"Community Steward",icon:"🛡️",image:""},
 {id:"trust_guardian",name:"Trust Guardian",icon:"⚖️",image:""}
];
type Award={badge_key:string;awarded_at:string};
export default function MyBadges(){
 const [signedIn,setSignedIn]=useState(false);
 const [loading,setLoading]=useState(true);
 const [awards,setAwards]=useState<Award[]>([]);
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  const db=createClient();
  void db.auth.getUser().then(async({data:{user}})=>{
   if(!active)return;
   if(!user){setLoading(false);return}
   setSignedIn(true);
   const {data,error:fetchError}=await db.from("user_badges").select("badge_key,awarded_at").eq("user_id",user.id);
   if(!active)return;
   if(fetchError)setError("Verified badge awards are not available yet. No badges will be assumed earned.");
   else setAwards((data??[]) as Award[]);
   setLoading(false);
  }).catch(()=>{if(active){setError("Could not load badge awards.");setLoading(false)}});
  return ()=>{active=false};
 },[]);
 const owned=new Set(awards.map(a=>a.badge_key));
 return <section id="my-badges" aria-label="My badges" style={{marginTop:30,padding:22,border:"1px solid #8c8357",borderRadius:22,background:"var(--panel)"}}>
  <h2 style={{margin:"0 0 8px"}}>🏅 My Badges</h2>
  <p style={{color:"var(--muted)",marginTop:0}}>Your verified achievements, separate from badges still available to earn.</p>
  {loading?<p role="status">Loading your badges…</p>:!signedIn?<p><Link href="/auth">Sign in</Link> to see your badges.</p>:<>
   <strong>{owned.size} of {catalog.length} badges earned</strong>
   {error&&<p role="status">{error}</p>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginTop:16}}>
    {catalog.map(b=><article key={b.id} style={{padding:16,textAlign:"center",border:"1px solid #6a725f",borderRadius:16,opacity:owned.has(b.id)?1:.55}}>
     <div style={{fontSize:42,minHeight:72,display:"grid",placeItems:"center"}}>{b.image?<img src={b.image} alt="" style={{height:68,maxWidth:"100%",objectFit:"contain",filter:owned.has(b.id)?"none":"grayscale(1)"}}/>:b.icon}</div>
     <strong style={{display:"block",fontSize:14}}>{b.name}</strong>
     <small>{owned.has(b.id)?"✓ Earned":"🔒 Not earned"}</small>
    </article>)}
   </div>
  </>}
 </section>
}
