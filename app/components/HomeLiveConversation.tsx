"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
type Comment={id:string;name:string;avatar:string|null;text:string;demo:boolean};
const seed:Comment[]=[{id:"demo-amina",name:"Amina",avatar:null,text:"As-salāmu ʿalaykum everyone 🌙",demo:true},{id:"demo-yusuf",name:"Yusuf",avatar:null,text:"May Allah bless this gathering 🙌",demo:true}];
export default function HomeLiveConversation({live,roomName}:{live:boolean;roomName?:string|null}){
 const [comments,setComments]=useState<Comment[]>(seed);
 const [name,setName]=useState("Guest");
 const [avatar,setAvatar]=useState<string|null>(null);
 const [draft,setDraft]=useState("");
 useEffect(()=>{let mounted=true;const db=createClient();db.auth.getUser().then(async({data:{user}})=>{if(!mounted||!user)return;const {data}=await db.from("profiles").select("display_name,username,avatar_url").eq("id",user.id).maybeSingle();if(!mounted)return;setName(data?.display_name||data?.username||"Member");setAvatar(data?.avatar_url||null)}).catch(()=>{});return()=>{mounted=false}},[]);
 const send=(e:React.FormEvent)=>{e.preventDefault();const text=draft.trim();if(!text)return;setComments(prev=>[...prev,{id:crypto.randomUUID(),name,avatar,text,demo:true}].slice(-15));setDraft("")};
 return <section className="homeLiveViewerConversation" aria-label="Live conversation"><header><strong>💬 LIVE CONVERSATION</strong><small>1Muslim · {live?"Live preview":"Demo comments"}</small></header><div className="homeLiveDemoComments" aria-live="polite">{comments.map(c=><p key={c.id}><span className="homeLiveCommentAvatar">{c.avatar?<Image src={c.avatar} alt="" width={38} height={38} unoptimized/>:c.name.slice(0,1).toUpperCase()}</span><span><strong>{c.name}</strong><small>{c.text}</small></span></p>)}</div><form className="homeLiveCommentForm" onSubmit={send}><input aria-label="Write a demo comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={280} placeholder="Comment as guest or member…" /><button type="submit" disabled={!draft.trim()}>Send</button></form><small className="homeLiveCommentDisclaimer">Preview only · Guest comments appear here, not in the live broadcast.</small>{live&&roomName?<Link className="homeLiveStudioEntry" href="/live">Join live to participate ↗</Link>:<Link className="homeLiveStudioEntry" href="/streaming/go-live">Start your own Live ↗</Link>}</section>
}
