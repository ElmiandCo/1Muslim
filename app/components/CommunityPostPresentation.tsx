"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./CommunityPostPresentation.module.css";
import {extractVerse,getYouTubeId} from "../../lib/community-post-content";

export type CommunityPostMedia = {
 id:string;
 url:string;
 mime_type:string;
 file_name?:string|null;
};

function VideoTile({item}:{item:CommunityPostMedia}){
 const [playing,setPlaying]=useState(false);
 const [ready,setReady]=useState(false);
 const [nearViewport,setNearViewport]=useState(false);
 const [ratio,setRatio]=useState<number|null>(null);
 const [duration,setDuration]=useState<number|null>(null);
 const posterRef=useRef<HTMLButtonElement>(null);
 // A video frame is requested only when its card approaches the viewport.
 // This avoids eager metadata requests for every post in the feed.
 useEffect(()=>{
  if(nearViewport||playing)return;
  const target=posterRef.current;
  if(!target)return;
  if(typeof IntersectionObserver==="undefined"){setNearViewport(true);return;}
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){setNearViewport(true);observer.disconnect();}
  },{rootMargin:"320px 0px"});
  observer.observe(target);
  return()=>observer.disconnect();
 },[nearViewport,playing]);
 const onMetadata=(video:HTMLVideoElement)=>{
  if(video.videoWidth&&video.videoHeight){
   setRatio(Math.max(.68,Math.min(1.9,video.videoWidth/video.videoHeight)));
  }
  if(Number.isFinite(video.duration)&&video.duration>0){
   setDuration(video.duration);
   try{video.currentTime=Math.min(.8,Math.max(0,video.duration-.1));}catch{}
  }
 };
 const timeLabel=duration==null?"":Math.floor(duration/60)+":"+String(Math.floor(duration%60)).padStart(2,"0");
 return <div className={styles.videoTile} style={ratio?{aspectRatio:String(ratio)}:undefined}>
  {playing?<video key={item.id+"-player"} src={item.url} controls autoPlay playsInline preload="metadata" aria-label={item.file_name||"Community video"} onEnded={()=>setPlaying(false)}/>:<button ref={posterRef} type="button" className={styles.videoPoster} aria-label={"Play "+(item.file_name||"community video")} onClick={()=>setPlaying(true)}>
   {nearViewport&&<video src={item.url+"#t=0.8"} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} onLoadedMetadata={e=>onMetadata(e.currentTarget)} onLoadedData={()=>setReady(true)} onSeeked={()=>setReady(true)} className={ready?styles.posterReady:""}/>}
   <span className={styles.playCircle} aria-hidden="true">▶</span>
   <span className={styles.playHint}>Tap to play</span>
   {timeLabel&&<span className={styles.videoDuration} aria-hidden="true">{timeLabel}</span>}
  </button>}
 </div>;
}

function YouTubeTile({id}:{id:string}){
 const [playing,setPlaying]=useState(false);
 return <div className={styles.youtubeTile}>
  {playing?<iframe title="YouTube video" src={"https://www.youtube-nocookie.com/embed/"+id} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button type="button" className={styles.youtubePoster} onClick={()=>setPlaying(true)} aria-label="Load YouTube video player">
   <img src={"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg"} loading="lazy" decoding="async" alt="YouTube video preview" />
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
 const galleryItems=media.filter(item=>item.mime_type.startsWith("video/")||item.mime_type.startsWith("image/"));
 const mosaic=galleryItems.length>=2&&galleryItems.length<=4&&galleryItems.every(item=>item.mime_type.startsWith("image/"));
 return <div className={[styles.presentation,compact?styles.compact:""].filter(Boolean).join(" ")} data-post-kind={kind}>
  {daily&&<span className={styles.daily}>✦ DAILY UMMAH</span>}
  {verse&&<section className={styles.verse} aria-label={verse.reference}>
   <span className={styles.verseEyebrow}>۞ QUR’AN REFLECTION</span>
   {verse.arabic&&<p lang="ar" dir="rtl" className={styles.arabic}>{verse.arabic}</p>}
   {verse.english&&<p className={styles.translation}>{verse.english}</p>}
   <span className={styles.reference}>{verse.reference}</span>
  </section>}
  {cleanText&&<p className={styles.body}>{cleanText}</p>}
  {!!galleryItems.length&&<div className={[styles.mediaGallery,mosaic?styles.mediaMosaic:""].filter(Boolean).join(" ")} data-count={galleryItems.length} aria-label="Post attachments">{galleryItems.map(item=>item.mime_type.startsWith("video/")?<VideoTile key={item.id} item={item}/>:<img key={item.id} className={styles.image} src={item.url} loading="lazy" decoding="async" alt={item.file_name||"Community post image"}/>)}</div>}
  {youtubeId&&<YouTubeTile id={youtubeId}/>}
  {!cleanText&&!verse&&!galleryItems.length&&!youtubeId&&<p className={styles.body}>Shared with the Ummah</p>}
 </div>;
}
