"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "../../../utils/supabase/client";

type Member={id:string;display_name:string|null;username:string|null;avatar_config?:Record<string,unknown>|null};
const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function avatarUrl(member:Member){const config=member.avatar_config||{};for(const key of ["selectedAvatarUrl","adminAvatarUrl","avatarUrl"]){const value=config[key];if(typeof value==="string"&&/^https:\/\//i.test(value))return value}return null}

export default function MuslimSyncPage(){
 const db=useMemo(()=>createClient(),[]);
 const [uid,setUid]=useState("");
 const [recipient,setRecipient]=useState("");
 const [members,setMembers]=useState<Member[]>([]);
 const [query,setQuery]=useState("");
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [selectedName,setSelectedName]=useState("");
 useEffect(()=>{let active=true;void db.auth.getUser().then(({data})=>{if(active)setUid(data.user?.id||"")});return()=>{active=false}},[db]);
 useEffect(()=>{const candidate=new URLSearchParams(window.location.search).get("recipient")||"";if(isUuid(candidate))setRecipient(candidate)},[]);
 const loadMembers=useCallback(async()=>{
  if(!uid)return;
  setLoading(true);
  const {data,error}=await db.from("profiles").select("id,display_name,username,avatar_config").neq("id",uid).order("display_name",{ascending:true}).limit(200);
  if(error){
   const fallback=await db.from("profiles").select("id,display_name,username").neq("id",uid).order("display_name",{ascending:true}).limit(200);
   if(fallback.error){setNotice("Unable to load members: "+fallback.error.message);setMembers([])}
   else setMembers((fallback.data||[]) as Member[]);
  }else setMembers((data||[]) as Member[]);
  setLoading(false);
 },[db,uid]);
 useEffect(()=>{void loadMembers()},[loadMembers]);
 const filtered=members.filter(member=>(member.display_name||"").toLowerCase().includes(query.trim().toLowerCase())||(member.username||"").toLowerCase().includes(query.trim().toLowerCase()));
 const selected=members.find(member=>member.id===recipient);
 const invite=async()=>{
  setNotice("");
  if(!uid){setNotice("Sign in first.");return}
  if(!isUuid(recipient)||recipient===uid){setNotice("Select another member to Ping.");return}
  setBusy(true);
  const {error}=await db.from("muslim_sync_sessions").insert({initiator_id:uid,invitee_id:recipient,current_page:"/"});
  setBusy(false);
  setNotice(error?error.message:"Ping sent! The member can accept or decline from anywhere in 1Muslim.");
 };
 return <main style={{maxWidth:680,margin:"24px auto",padding:"clamp(16px,4vw,28px)",color:"var(--text,#e8fff3)",minHeight:"75vh"}}>
  <Link href="/messages" style={{color:"#c8c8cf",textDecoration:"none"}}>← Messages</Link>
  <header style={{margin:"24px 0",textAlign:"center"}}>
   <div style={{fontSize:28,marginBottom:8}}>🔗</div>
   <h1 style={{fontSize:"clamp(26px,5vw,36px)",margin:"0 0 8px",letterSpacing:".02em"}}>Ping a member</h1>
   <p style={{opacity:.75,lineHeight:1.5,margin:0}}>Invite a 1Muslim member to navigate together in a private session.</p>
  </header>
  <section aria-label="Select a Ping member" style={{border:"1px solid rgba(201,196,209,.28)",borderRadius:26,padding:"clamp(16px,4vw,24px)",background:"linear-gradient(155deg,rgba(35,36,46,.94),rgba(9,10,16,.94))",boxShadow:"0 22px 65px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
   <label htmlFor="ping-search" style={{display:"block",fontSize:12,letterSpacing:".13em",fontWeight:700,opacity:.75,marginBottom:10}}>CHOOSE A MEMBER</label>
   <input id="ping-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or username" autoComplete="off" style={{width:"100%",boxSizing:"border-box",borderRadius:16,padding:"14px 16px",background:"rgba(255,255,255,.08)",color:"white",border:"1px solid rgba(255,255,255,.2)",outlineOffset:3,fontSize:16}}/>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"16px 0 10px",fontSize:12,opacity:.7}}><span>{loading?"Loading members…":filtered.length+" members"}</span><button type="button" onClick={()=>void loadMembers()} disabled={loading||!uid} style={{border:0,background:"transparent",color:"#e4d5ac",cursor:"pointer"}}>↻ Refresh</button></div>
   <div role="listbox" aria-label="Members available to Ping" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:12,maxHeight:360,overflowY:"auto",padding:"4px 2px 12px"}}>
    {filtered.map(member=>{const active=recipient===member.id;const image=avatarUrl(member);return <button type="button" role="option" aria-selected={active} key={member.id} onClick={()=>{setRecipient(member.id);setSelectedName(member.display_name||member.username||"Member");setNotice("")}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 8px",borderRadius:18,border:active?"2px solid #e4d5ac":"1px solid rgba(255,255,255,.13)",background:active?"rgba(228,213,172,.17)":"rgba(255,255,255,.04)",color:"white",cursor:"pointer",minWidth:0,boxShadow:active?"0 0 24px rgba(228,213,172,.12)":"none"}}>
     <span style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",display:"grid",placeItems:"center",background:"linear-gradient(145deg,#494757,#17171d)",border:"1px solid #a99d82",fontSize:28}}>{image?<img src={image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"☪"}</span>
     <strong style={{fontSize:13,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{member.display_name||member.username||"Member"}</strong>
     {member.username&&<small style={{opacity:.65,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>@{member.username}</small>}
     <small style={{color:active?"#e4d5ac":"#b6b4c0"}}>{active?"✓ Selected":"Select"}</small>
    </button>})}
   </div>
   {!loading&&!filtered.length&&<p style={{textAlign:"center",opacity:.7,padding:16}}>{query?"No matching members. Try another name.":"No members available yet."}</p>}
   {recipient&&<p style={{margin:"16px 0",fontSize:14,color:"#e4d5ac"}}>✓ Selected: {selected?.display_name||selected?.username||selectedName||"Member"}</p>}
   <button type="button" disabled={busy||!uid||!recipient} onClick={()=>void invite()} style={{width:"100%",padding:"15px 20px",borderRadius:16,border:"1px solid #d5c69c",background:recipient?"linear-gradient(120deg,#e4d5ac,#a99b77)":"rgba(255,255,255,.12)",color:recipient?"#17171d":"#a7a7b0",fontWeight:800,fontSize:16,cursor:recipient?"pointer":"not-allowed"}}>{busy?"Sending Ping…":recipient?"🔗 Send Ping invitation":"Select a member to continue"}</button>
   {notice&&<p role="status" style={{padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,.07)",lineHeight:1.5}}>{notice}</p>}
  </section>
  <p style={{textAlign:"center",fontSize:13,opacity:.65,lineHeight:1.6,marginTop:18}}>Ping shares navigation only inside 1Muslim. Both members retain control of their own accounts and can end the session at any time.</p>
 </main>
}
