"use client";
import {useState} from "react";

export function youtubeVideoId(value:string):string|null {
 const match=value.match(/https?:\/\/[^\s<>]+/i);
 if(!match)return null;
 try {
  const url=new URL(match[0]);
  const host=url.hostname.toLowerCase();
  const parts=url.pathname.split("/").filter(Boolean);
  let id:string|null=null;
  if(host==="youtu.be"||host==="www.youtu.be")id=parts[0]||null;
  else if(["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(host))
   id=url.searchParams.get("v")||(["shorts","embed","live"].includes(parts[0])?parts[1]:null);
  return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
 }catch{return null}
}
export default function YouTubePostLink({onAdd}:{onAdd:(url:string)=>void}){
 const [open,setOpen]=useState(false),[value,setValue]=useState(""),[error,setError]=useState("");
 const id=youtubeVideoId(value);
 return <span style={{display:"inline-flex",flexDirection:"column",gap:8}}>
  <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} style={{border:"1px solid #8886",borderRadius:12,padding:"9px 12px",background:"transparent",color:"inherit",cursor:"pointer"}}>🔗 YouTube link</button>
  {open&&<span style={{display:"grid",gap:8,padding:12,borderRadius:14,background:"rgba(120,120,120,.10)",maxWidth:360}}>
   <label style={{fontSize:12}}>Paste a YouTube video URL</label>
   <input type="url" value={value} onChange={e=>{setValue(e.target.value);setError("")}} placeholder="https://youtu.be/…" aria-label="YouTube video URL" style={{width:"100%",minWidth:0,padding:10,borderRadius:9,border:"1px solid #8888",background:"transparent",color:"inherit"}}/>
   {id&&<img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="YouTube video preview" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",borderRadius:10}}/>}
   {error&&<small role="alert">{error}</small>}
   <button type="button" onClick={()=>{if(!id){setError("Enter a valid YouTube video link.");return}onAdd(`https://www.youtube.com/watch?v=${id}`);setValue("");setOpen(false)}} style={{padding:11,borderRadius:10,background:"#222",color:"white",border:0}}>Add video to post</button>
  </span>}
 </span>;
}
