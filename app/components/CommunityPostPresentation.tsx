"use client";
import {useState} from "react";
import styles from "./CommunityPostPresentation.module.css";

export type CommunityPostMedia = {
 id:string;
 url:string;
 mime_type:string;
 file_name?:string|null;
};

const VIDEO_ID=/^[a-zA-Z0-9_-]{11}$/;
export function getYouTubeId(text:string):string|null {
 const links=text.match(/https?:\/\/[^\s<>"']+/g)||[];
 for(const raw of links){
  try{
   const url=new URL(raw.replace(/[),.!?]+$/,""));
   const host=url.hostname.toLowerCase();
   let id="";
   if(host==="youtu.be")id=url.pathname.split("/")[1]||"";
   else if(["youtube.com","www.youtube.com","m.youtube.com"].includes(host)){
    const path=url.pathname.split("/").filter(Boolean);
    id=path[0]==="watch"?url.searchParams.get("v")||"":(["shorts","live","embed"].includes(path[0])?path[1]||"":"");
   }
   if(VIDEO_ID.test(id))return id;
  }catch{}
 }
 return null;
}

function extractVerse(body:string){
 const lines=body.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const index=lines.findIndex(x=>/^Qur[’']?an\s+\d{1,3}:\d{1,3}$/i.test(x));
 if(index<0)return null;
 const reference=lines[index];
 const following=lines.slice(index+1);
 const arabic=following.find(x=>/[\u0600-\u06ff]/.test(x))||"";
 const english=following.find(x=>!/[\u0600-\u06ff]/.test(x)&&!/^https?:\/\//.test(x))||"";
 if(!arabic&&!english)return null;
 const consumed=new Set([index]);
 if(arabic)consumed.add(lines.indexOf(arabic,index+1));
 if(english)consumed.add(lines.indexOf(english,index+1));
 return {reference,arabic,english,remaining:lines.filter((_,i)=>!consumed.has(i)).join("\n\n")};
}

function VideoTile({item}:{item:CommunityPostMedia}){
 const [playing,setPlaying]=useState(false);
 const [ready,setReady]=useState(false);
 return <div className={styles.videoTile}>
  {playing?<video key={item.id+"-player"} src={item.url} controls autoPlay playsInline preload="metadata" aria-label={item.file_name||"Community video"} onEnded={()=>setPlaying(false)}/>:<button type="button" className={styles.videoPoster} aria-label={"Play "+(item.file_name||"community video")} onClick={()=>setPlaying(true)}>
   <video src={item.url+"#t=0.5"} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} onLoadedData={()=>setReady(true)} className={ready?styles.posterReady:""}/>
   <span className={styles.playCircle} aria-hidden="true">▶</span><span className={styles.playHint}>Tap to play</span>
  </button>}
 </div>;
}

function YouTubeTile({id}:{id:string}){
 const [playing,setPlaying]=useState(false);
 return <div className={styles.youtubeTile}>
  {playing?<iframe title="YouTube video" src={"https://www.youtube-nocookie.com/embed/"+id} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button type="button" className={styles.youtubePoster} onClick={()=>setPlaying(true)} aria-label="Load YouTube video player">
   <img src={"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg"} loading="lazy" alt="YouTube video preview" />
   <span className={styles.playCircle} aria-hidden="true">▶</span><span className={styles.playHint}>Watch on YouTube</span>
  </button>}
 </div>;
}

export default function CommunityPostPresentation({body,media=[],compact=false}:{body:string;media?:CommunityPostMedia[];compact?:boolean}){
 const verse=extractVerse(body||"");
 const youtubeId=getYouTubeId(body||"");
 const cleanText=(verse?verse.remaining:body||"").replace(/^✦ DAILY UMMAH ✦\s*/,"").replace(/https?:\/\/[^\s<>"']+/g,url=>getYouTubeId(url)?"":url).trim();
 const hasVideo=media.some(m=>m.mime_type.startsWith("video/"))||!!youtubeId;
 const hasImage=media.some(m=>m.mime_type.startsWith("image/"));
 const kind=verse?(hasVideo?"verse-video":hasImage?"verse-image":"verse"):hasVideo?"video":hasImage?"image":"text";
 const daily=(body||"").startsWith("✦ DAILY UMMAH ✦");
 return <div className={[styles.presentation,compact?styles.compact:""].filter(Boolean).join(" ")} data-post-kind={kind}>
  {daily&&<span className={styles.daily}>✦ DAILY UMMAH</span>}
  {verse&&<section className={styles.verse} aria-label={verse.reference}>
   <span className={styles.verseEyebrow}>۞ QUR’AN REFLECTION</span>
   {verse.arabic&&<p lang="ar" dir="rtl" className={styles.arabic}>{verse.arabic}</p>}
   {verse.english&&<p className={styles.translation}>{verse.english}</p>}
   <span className={styles.reference}>{verse.reference}</span>
  </section>}
  {cleanText&&<p className={styles.body}>{cleanText}</p>}
  {!!media.length&&<div className={styles.mediaGallery} aria-label="Post attachments">{media.map(item=>item.mime_type.startsWith("video/")?<VideoTile key={item.id} item={item}/>:item.mime_type.startsWith("image/")?<img key={item.id} className={styles.image} src={item.url} loading="lazy" alt={item.file_name||"Community post image"}/>:null)}</div>}
  {youtubeId&&<YouTubeTile id={youtubeId}/>}
  {!cleanText&&!verse&&!media.length&&!youtubeId&&<p className={styles.body}>Shared with the Ummah</p>}
 </div>;
}
