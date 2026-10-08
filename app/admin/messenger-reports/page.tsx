"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";
type Report={id:string;reporter_id:string;reported_id:string;conversation_id:string;reason:string;details:string;status:string;created_at:string};
export default function MessengerModeration(){
 const [client]=useState(()=>createClient());
 const [authorized,setAuthorized]=useState<boolean|null>(null);
 const [reports,setReports]=useState<Report[]>([]);
 const [error,setError]=useState("");
 const [saving,setSaving]=useState<string|null>(null);
 useEffect(()=>{let active=true;(async()=>{const {data:{user}}=await client.auth.getUser();if(!user){if(active)setAuthorized(false);return}const {data}=await client.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();if(!active)return;setAuthorized(!!data);if(!data)return;const result=await client.from("dm_reports").select("id,reporter_id,reported_id,conversation_id,reason,details,status,created_at").order("created_at",{ascending:false}).limit(100);if(active){setReports(result.data??[]);if(result.error)setError(result.error.message)}})();return()=>{active=false}},[client]);
 async function update(id:string,status:string){setSaving(id);const {error}=await client.from("dm_reports").update({status}).eq("id",id);if(error)setError(error.message);else setReports(v=>v.map(r=>r.id===id?{...r,status}:r));setSaving(null)}
 if(authorized===null)return <main style={{padding:32}}>Checking permissions…</main>;
 if(!authorized)return <main style={{padding:32}}><h1>Restricted</h1><p>Moderator access required.</p><Link href="/messages">Back to Messenger</Link></main>;
 return <main style={{maxWidth:1000,margin:"40px auto",padding:20,color:"var(--text)"}}><Link href="/messages">← Messenger</Link><h1>Messenger Reports</h1><p>Admin-only review queue. Review evidence before resolving a report.</p>{error&&<p role="alert">{error}</p>}{reports.length===0?<p>No reports.</p>:reports.map(r=><article key={r.id} style={{border:"1px solid #64748b66",borderRadius:12,padding:16,marginBottom:12}}><h2 style={{fontSize:17}}>{r.reason} · {r.status}</h2><p>{r.details||"No additional details"}</p><small>Reported: {new Date(r.created_at).toLocaleString()}</small><p style={{fontSize:12}}>Reporter: {r.reporter_id}<br/>Reported member: {r.reported_id}<br/>Conversation: {r.conversation_id}</p><label>Review status <select disabled={saving===r.id} value={r.status} onChange={e=>void update(r.id,e.target.value)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select></label></article>)}</main>
}