"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
type Video={id:string;placement:string;title:string;description:string;youtube_url:string;position:number;is_active:boolean};
const sections=[
 ["home_video_of_day","🏠 Homepage · Video of the Day"],
 ["elm_prayer","🕌 Elm Tent · Prayer"],
 ["elm_quran","📖 Elm Tent · Qur'an"],
 ["elm_history","📜 Elm Tent · Islamic History"],
 ["rewards_training","🏅 Rewards · Badge Training"],
 ["streaming_featured","📡 Streaming · Featured Videos"],
 ["learning_beginner","🎓 Learning · Beginner Courses"],
] as const;
const inputStyle={width:"100%",padding:"10px 12px",border:"1px solid #52604c",borderRadius:10,background:"#111d15",color:"#fff"} as const;
function validYoutube(raw:string){try{const u=new URL(raw);return u.protocol==="https:"&&["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtu.be"].includes(u.hostname)&&Boolean(u.searchParams.get("v")||u.pathname.replace(/^\/+/, ""));}catch{return false}}
export default function VideoManager(){
 const supabase=useMemo(()=>createClient(),[]);
 const [authorized,setAuthorized]=useState(false),[loading,setLoading]=useState(true),[rows,setRows]=useState<Video[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [placement,setPlacement]=useState<string>("home_video_of_day"),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[url,setUrl]=useState("");
 async function load(){const {data,error}=await supabase.from("site_video_placements").select("id,placement,title,description,youtube_url,position,is_active").order("position",{ascending:true});if(error)setMessage(error.message);else setRows((data||[]) as Video[])}
 useEffect(()=>{let active=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!active)return;if(user?.email?.toLowerCase()!=="hudhudbyelmi@gmail.com"){setLoading(false);return}setAuthorized(true);await load();if(active)setLoading(false)})();return()=>{active=false}},[]);
 async function add(){if(!title.trim()||!validYoutube(url)){setMessage("Enter a title and valid YouTube link.");return}setBusy(true);setMessage("");const position=Math.max(0,...rows.filter(r=>r.placement===placement).map(r=>r.position))+1;const {error}=await supabase.from("site_video_placements").insert({placement,title:title.trim(),description:description.trim(),youtube_url:url.trim(),position,is_active:true});if(error)setMessage(error.message);else{setTitle("");setDescription("");setUrl("");await load();setMessage("Video added.")}setBusy(false)}
 async function save(row:Video){if(!row.title.trim()||!validYoutube(row.youtube_url)){setMessage("A title and valid YouTube URL are required.");return}setBusy(true);const {error}=await supabase.from("site_video_placements").update({title:row.title.trim(),description:row.description,youtube_url:row.youtube_url.trim(),position:row.position,is_active:row.is_active,updated_at:new Date().toISOString()}).eq("id",row.id);if(error)setMessage(error.message);else{setMessage("Saved.");await load()}setBusy(false)}
 async function remove(row:Video){if(!confirm("Delete this video placement?"))return;const {error}=await supabase.from("site_video_placements").delete().eq("id",row.id);if(error)setMessage(error.message);else await load()}
 function patch(id:string,key:keyof Video,value:string|number|boolean){setRows(current=>current.map(r=>r.id===id?{...r,[key]:value}:r))}
 if(loading)return <main style={{padding:32}}>Checking admin access…</main>;
 if(!authorized)return <main style={{padding:32}}><h1>Admin access only</h1><Link href="/">Return home</Link></main>;
 return <main style={{maxWidth:1050,margin:"auto",padding:"32px 16px 80px",color:"var(--text)"}}>
 <Link href="/admin/videos">← Uploaded channel videos</Link><h1>🎬 1Muslim Video Manager</h1><p>Manage YouTube videos across 1Muslim. Changes take effect without a new deployment after the database migration is applied.</p>
 {message&&<p role="status" style={{padding:12,border:"1px solid #71886b",borderRadius:10}}>{message}</p>}
 <section style={{padding:20,border:"1px solid #52604c",borderRadius:18,marginBottom:28,display:"grid",gap:12}}>
 <h2 style={{margin:0}}>Add a video</h2><label>Placement<select style={inputStyle} value={placement} onChange={e=>setPlacement(e.target.value)}>{sections.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>Audience title<input style={inputStyle} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Watch This on 1Muslim"/></label>
 <label>YouTube URL<input style={inputStyle} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></label>
 <label>Description<textarea style={inputStyle} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <button disabled={busy} onClick={add} style={{padding:12,borderRadius:12,cursor:"pointer"}}>+ Add video</button></section>
 {sections.map(([id,label])=><section key={id} style={{marginBottom:28}}><h2>{label} ({rows.filter(r=>r.placement===id).length})</h2>
 {rows.filter(r=>r.placement===id).sort((a,b)=>a.position-b.position).map(row=><article key={row.id} style={{padding:16,marginBottom:12,border:"1px solid #52604c",borderRadius:14,display:"grid",gap:10}}>
 <label>Title<input style={inputStyle} value={row.title} onChange={e=>patch(row.id,"title",e.target.value)}/></label>
 <label>URL<input style={inputStyle} value={row.youtube_url} onChange={e=>patch(row.id,"youtube_url",e.target.value)}/></label>
 <label>Description<textarea style={inputStyle} value={row.description} onChange={e=>patch(row.id,"description",e.target.value)}/></label>
 <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}><label>Order <input type="number" min={1} style={{...inputStyle,width:85}} value={row.position} onChange={e=>patch(row.id,"position",Math.max(1,Number(e.target.value)||1))}/></label>
 <label><input type="checkbox" checked={row.is_active} onChange={e=>patch(row.id,"is_active",e.target.checked)}/> Active</label>
 <a href={row.youtube_url} target="_blank" rel="noopener noreferrer">Preview ↗</a>
 <button disabled={busy} onClick={()=>save(row)}>Save</button><button disabled={busy} onClick={()=>remove(row)}>Delete</button></div>
 </article>)}{!rows.some(r=>r.placement===id)&&<p>No videos assigned yet.</p>}</section>)}
 </main>
}
