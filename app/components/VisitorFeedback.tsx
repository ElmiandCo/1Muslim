"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
const KEY="1muslim:feedback-v2";
export default function VisitorFeedback(){
 const [open,setOpen]=useState(false),[topic,setTopic]=useState(""),[stars,setStars]=useState(0),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  if(localStorage.getItem(KEY)==="submitted")return;
  const dismissed=Number(localStorage.getItem(KEY+":later")||0);
  if(dismissed&&Date.now()-dismissed<14*86400000)return;
  let elapsed=Number(sessionStorage.getItem(KEY+":elapsed")||0);
  let last=Date.now();
  const timer=setInterval(()=>{
   const now=Date.now();const delta=Math.min(now-last,1500);last=now;
   if(document.visibilityState!=="visible"||!document.hasFocus()||document.querySelector('[role="dialog"]')||/\/streaming\/live|\/streaming\/go-live/.test(location.pathname))return;
   elapsed+=delta;sessionStorage.setItem(KEY+":elapsed",String(elapsed));
   if(elapsed>=120000){clearInterval(timer);void createClient().auth.getUser().then(({data})=>{if(data.user)setOpen(true)})}
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
  const body="1Muslim feedback: "+stars+"/3\nFeature: "+(topic||"General")+"\nPage: "+location.pathname+"\n"+(message.trim()||"(No written feedback)");
  const {error:sendError}=await db.from("dm_messages").insert({conversation_id:conversationId,sender_id:user.id,body});
  if(sendError)throw Error("Could not send your message. Please try again.");
  localStorage.setItem(KEY,"submitted");setOpen(false);
 }catch(e){setError(e instanceof Error?e.message:"Try again")}finally{setBusy(false)}};
 if(!open)return null;
 return <div className="sf-wrap"><section role="dialog" aria-label="Quick feedback" className="sf-card"><button className="sf-x" onClick={later} aria-label="Close">×</button><strong>How's 1Muslim feeling?</strong><small>Two taps help us improve.</small><div className="sf-choices">{[["😍","Loving it"],["🙂","It's okay"],["😕","Needs work"]].map(([emoji,label],i)=><button key={label} className={stars===i+1?"selected":""} onClick={()=>setStars(i+1)}><span>{emoji}</span>{label}</button>)}</div>{stars>0&&<div className="sf-extra"><p>{stars===1?"What's working best?":"What should we improve?"}</p><div className="sf-topics">{["Videos","Live","Messages","Design","Performance","Other"].map(t=><button key={t} className={topic===t?"selected":""} onClick={()=>setTopic(t)}>{t}</button>)}</div><input value={message} maxLength={500} onChange={e=>setMessage(e.target.value)} placeholder="Anything else? (optional)"/></div>}{error&&<p role="alert">{error}</p>}<div className="sf-actions">{stars>0&&<button className="sf-send" disabled={busy} onClick={submit}>{busy?"Sending…":"Send feedback →"}</button>}<button onClick={later}>Maybe later</button></div></section><style jsx>{`
.sf-wrap{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:12px 12px max(20px,env(safe-area-inset-bottom));background:rgba(0,0,0,.12)}
.sf-card{position:relative;box-sizing:border-box;width:min(100%,410px);max-height:48dvh;overflow:auto;padding:15px;border-radius:19px;border:1px solid var(--theme-border,rgba(255,255,255,.22));background:var(--theme-panel,rgba(15,28,30,.8));color:var(--theme-text,#fff);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 14px 44px #0005;animation:sfIn .45s ease both}.sf-card strong{display:block;font-size:15px}.sf-card small{display:block;font-size:11px;opacity:.7;margin-top:3px}.sf-x{position:absolute;top:6px;right:9px;font-size:24px;border:0;background:none;color:inherit}.sf-choices{display:flex;gap:6px;margin-top:12px}.sf-choices button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;border:1px solid var(--theme-border,#ffffff33);border-radius:12px;background:#88888816;color:inherit;font-size:10px}.sf-choices span{font-size:22px}.sf-card .selected{border-color:var(--theme-primary,#42cda1);background:color-mix(in srgb,var(--theme-primary,#42cda1) 20%,transparent)}.sf-extra p{font-size:12px;margin:12px 0 7px}.sf-topics{display:flex;flex-wrap:wrap;gap:6px}.sf-topics button{border:1px solid var(--theme-border,#ffffff33);border-radius:20px;background:#88888816;color:inherit;padding:6px 9px;font-size:11px}.sf-extra input{box-sizing:border-box;width:100%;margin-top:9px;border:1px solid var(--theme-border,#ffffff33);border-radius:10px;padding:9px;background:#88888816;color:inherit}.sf-actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.sf-actions button{border:0;background:none;color:inherit;padding:8px;font-size:12px}.sf-actions .sf-send{background:var(--theme-primary,#42cda1);color:var(--theme-on-primary,#061913);border-radius:10px;font-weight:700}@keyframes sfIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@media(min-width:800px){.sf-wrap{justify-content:flex-end;padding:24px}.sf-card{width:345px}}@media(prefers-reduced-motion:reduce){.sf-card{animation:none}}
`}</style></div>;
}
