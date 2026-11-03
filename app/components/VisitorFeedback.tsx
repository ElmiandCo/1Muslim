"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
const KEY="1muslim:feedback-v1";
export default function VisitorFeedback(){
 const [eligible,setEligible]=useState(false);\n const [open,setOpen]=useState(false),[stars,setStars]=useState(0),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  const db=createClient();
  const verify=async()=>{const {data:{user}}=await db.auth.getUser();if(!active)return;setEligible(Boolean(user));if(!user)setOpen(false)};
  void verify();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(!active)return;setEligible(Boolean(session?.user));if(!session?.user)setOpen(false)});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!eligible)return;
  if(localStorage.getItem(KEY)==="submitted")return;
  const dismissed=Number(localStorage.getItem(KEY+":later")||0);
  if(dismissed&&Date.now()-dismissed<7*86400000)return;
  let elapsed=Number(sessionStorage.getItem(KEY+":elapsed")||0);
  let last=Date.now();
  const timer=setInterval(()=>{
   const now=Date.now();const delta=Math.min(now-last,1500);last=now;
   if(document.visibilityState!=="visible"||!document.hasFocus())return;
   elapsed+=delta;sessionStorage.setItem(KEY+":elapsed",String(elapsed));
   if(elapsed>=60000){clearInterval(timer);setOpen(true)}
  },1000);
  return()=>clearInterval(timer);
 },[]);
 const later=()=>{localStorage.setItem(KEY+":later",String(Date.now()));setOpen(false)};
 const submit=async()=>{if(!stars)return;setBusy(true);setError("");try{
  const db=createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)throw Error("Please sign in to send feedback through 1Muslim Messages.");
  const adminId="56373a95-38dc-4457-b6eb-0070af1630f8";
  if(user.id===adminId)throw Error("This feedback account cannot message itself.");
  const {data:conversationId,error:conversationError}=await db.rpc("dm_start_conversation",{other_user:adminId});
  if(conversationError||!conversationId)throw Error("Could not open the feedback conversation. Please try again.");
  const body="⭐ 1Muslim Feedback: "+stars+"/5\\nPage: "+location.pathname+"\\n"+(message.trim()||"(No written feedback)");
  const {error:sendError}=await db.from("dm_messages").insert({conversation_id:conversationId,sender_id:user.id,body});
  if(sendError)throw Error("Could not send your message. Please try again.");
  localStorage.setItem(KEY,"submitted");setOpen(false);
 }catch(e){setError(e instanceof Error?e.message:"Try again")}finally{setBusy(false)}};
 if(!open||!eligible)return null;
 return <div role="presentation" style={{position:"fixed",inset:0,zIndex:2147483000,display:"grid",placeItems:"center",background:"rgba(0,12,10,.68)",padding:20}}>
 <section role="dialog" aria-modal="true" aria-label="Rate 1Muslim" style={{width:"min(100%,420px)",padding:28,borderRadius:24,border:"1px solid rgba(129,255,202,.35)",background:"linear-gradient(145deg,rgba(13,65,50,.97),rgba(4,22,19,.98))",color:"#fff",boxShadow:"0 20px 80px #0009",textAlign:"center"}}>
 <h2 style={{fontSize:25,margin:"0 0 10px"}}>How is your 1Muslim experience?</h2><p style={{opacity:.8}}>Your feedback helps us improve the Ummah experience.</p>
 <div aria-label="Rating" style={{display:"flex",justifyContent:"center",gap:8,margin:"20px 0"}}>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={n+" stars"} aria-pressed={stars===n} onClick={()=>setStars(n)} style={{fontSize:36,color:n<=stars?"#ffd66e":"#9aa9a2",background:"none",border:0,cursor:"pointer"}}>★</button>)}</div>
 <textarea aria-label="Optional feedback" placeholder="Tell us what you like or what we can improve…" maxLength={2000} value={message} onChange={e=>setMessage(e.target.value)} style={{boxSizing:"border-box",width:"100%",minHeight:110,padding:14,borderRadius:14,background:"#ffffff12",color:"white",border:"1px solid #ffffff44",resize:"vertical"}}/>
 {error&&<p role="alert" style={{color:"#ffb6b6"}}>{error}</p>}
 <button disabled={!stars||busy} onClick={submit} style={{display:"block",width:"100%",marginTop:15,padding:14,border:0,borderRadius:14,background:"#31c889",color:"#062319",fontWeight:700,opacity:!stars||busy?.6:1}}>{busy?"Sending…":"Submit feedback"}</button>
 <button onClick={later} style={{marginTop:14,background:"none",border:0,color:"#d4e5de",cursor:"pointer"}}>Maybe later</button>
 </section></div>;
}
