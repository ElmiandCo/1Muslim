"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../../utils/supabase/client";
type Notice={id:string;title:string;body:string;type:string;read_at:string|null;created_at:string};
export default function NotificationFeed(){
 const [items,setItems]=useState<Notice[]>([]);const [status,setStatus]=useState("Loading…");
 useEffect(()=>{let active=true;const db=createClient();const load=async()=>{const {data:{user}}=await db.auth.getUser();if(!active)return;if(!user){setStatus("Sign in to see notifications.");return}const {data,error}=await db.from("notifications").select("id,title,body,type,read_at,created_at").eq("recipient_id",user.id).order("created_at",{ascending:false}).limit(40);if(!active)return;if(error){setStatus("Unable to load notifications.");return}setItems(data||[]);setStatus((data||[]).length?"":"No notifications yet.")};void load();const timer=setInterval(()=>void load(),30000);return()=>{active=false;clearInterval(timer)}},[]);
 const markRead=async(id:string)=>{const db=createClient();const {error}=await db.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);if(!error)setItems(old=>old.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n))};
 return <div style={{display:"grid",gap:10}}><p role="status">{status}</p>{items.map(n=><article key={n.id} style={{padding:14,border:"1px solid #cbb77855",borderRadius:12,background:n.read_at?"#ffffff08":"#c5b66a20"}}><small>{n.type} · {new Date(n.created_at).toLocaleString()}</small><h3 style={{margin:"6px 0"}}>{n.title}</h3><p>{n.body}</p>{!n.read_at&&<button type="button" onClick={()=>void markRead(n.id)} style={{border:0,borderRadius:9,padding:9,background:"#e4d299",color:"#173c2c"}}>Mark read</button>}</article>)}</div>;
}
