"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
const draftKey="1muslim-home-community-draft";
export default function HomeCreatePost(){
 const router=useRouter();
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [posted,setPosted]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{try{setDraft(sessionStorage.getItem(draftKey)||"");if(sessionStorage.getItem("1muslim-post-success")==="yes"){sessionStorage.removeItem("1muslim-post-success");setPosted(true);setNotice("✨ Your post was successfully shared with the community!")}}catch{}},[]);
 async function publish(e:React.FormEvent){
  e.preventDefault();const text=draft.trim();if(!text||busy)return;
  setBusy(true);setError("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(!user){sessionStorage.setItem(draftKey,text);router.push("/auth?next="+encodeURIComponent("/?compose=1"));return}
   const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Could not publish post");
   sessionStorage.removeItem(draftKey);setPosted(true);setNotice("✨ Your post was successfully shared with the community!");
  }catch(err){setError(err instanceof Error?err.message:"Could not publish your post")}finally{setBusy(false)}
 }
 return <div style={{margin:"20px 0"}}><div role="status" aria-live="polite" style={{color:"#82dba6",fontWeight:700,marginBottom:8}}>{notice}</div>{!posted&&<section className="home-compose" style={{padding:"22px",borderRadius:22,border:"1px solid #438564",background:"linear-gradient(130deg,#122d21,#102018)",color:"#eafff0",animation:"homePostEnter .5s ease-out"}}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}><span style={{width:42,height:42,borderRadius:"50%",display:"grid",placeItems:"center",background:"#285e43",fontSize:22}}>✍️</span><div><strong style={{fontSize:18}}>Share something with the community</strong><div style={{color:"#a6c6b4",fontSize:12}}>A reflection, question, or something worth sharing.</div></div></div><form onSubmit={e=>void publish(e)}><textarea aria-label="Write a community post" maxLength={2000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What's on your mind today?" rows={3} style={{width:"100%",boxSizing:"border-box",resize:"vertical",background:"#091a13",border:"1px solid #416c54",borderRadius:14,color:"#fff",padding:15,font:"inherit"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}><span style={{color:"#a5c5b1",fontSize:12}}>{draft.length}/2000</span><button type="submit" disabled={!draft.trim()||busy} style={{border:0,borderRadius:999,padding:"12px 25px",background:"#72e6a2",color:"#082618",fontWeight:800,opacity:busy?.6:1,cursor:"pointer"}}>{busy?"Publishing…":"Post to Community →"}</button></div></form>{error&&<p role="alert" style={{color:"#ffaaa7"}}>{error}</p>}</section>}<style jsx>{`@keyframes homePostEnter{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style></div>;
}
