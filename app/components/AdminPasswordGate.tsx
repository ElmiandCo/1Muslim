"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import "./admin-password-gate.css";
export default function AdminPasswordGate(){
 const [password,setPassword]=useState(""),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/security-recheck",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password}),cache:"no-store"});
   const data=await r.json();if(!r.ok)throw Error(data.error||"Admin verification failed");
   setPassword("");window.location.reload();
  }catch(err){setMessage(err instanceof Error?err.message:"Please retry.")}
  finally{setBusy(false)}
 }
 return <main className="hudAdminGate"><header><Link href="/search" aria-label="Return to One Muslim Search Home">One Muslim<span>.live</span></Link></header>
  <section className="hudAdminGateBody" aria-labelledby="hudAdminGateTitle">
   <span className="hudAdminGateEyebrow">PRIVATE SECURITY</span>
   <h1 id="hudAdminGateTitle">Administrator</h1>
   <p>Re-enter your account password to continue.</p>
   <form onSubmit={submit}>
    <label htmlFor="hudAdminPassword">Password</label>
    <div className="hudAdminPasswordPill"><input id="hudAdminPassword" type={visible?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Your account password"/><button type="button" onClick={()=>setVisible(v=>!v)}>{visible?"Hide":"Show"}</button></div>
    <button className="hudAdminUnlock" disabled={busy||!password}>{busy?"Verifying…":"Unlock securely →"}</button>
   </form>
   {message&&<p role="alert" className="hudAdminError">{message}</p>}
   <Link href="/search" className="hudAdminBack">← Back to search</Link>
  </section>
 </main>;
}
