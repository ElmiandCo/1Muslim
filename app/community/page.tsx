"use client";

import "./community.css";
import "./daily-post-particles.css";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import StoriesRail from "../components/StoriesRail";
import PostCamera from "./PostCamera";
import UmmahConversation from "../components/UmmahConversation";

type Comment = { id: string; name: string; text: string; created: number };
type Post = { authorId?:string;avatarUrl?:string|null;media?:string; mediaType?:string; overlay?:string; filter?:string; link?:string; id: string; name: string; handle: string; text: string; created: number; likes: number; liked: boolean; comments: Comment[] };



export default function Community() {
  const [posts,setPosts]=useState<Post[]>([]);
  const [draft,setDraft]=useState("");
  useEffect(()=>{try{const saved=sessionStorage.getItem("1muslim-verse-share-draft");if(saved){setDraft(saved);sessionStorage.removeItem("1muslim-verse-share-draft")}}catch{}},[]);
  useEffect(()=>{const verse=new URLSearchParams(window.location.search).get("verse");if(verse&&/^(?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(verse)){setDraft("Reflecting on Qur’an "+verse+" 📖\\nhttps://quran.com/"+verse+"\\n");setLink("https://quran.com/"+verse)}},[]);
  const [serverPosts,setServerPosts]=useState<Post[]>([]);
  const [selectedConversation,setSelectedConversation]=useState<string|null>(null);
  const feedRef=useRef<HTMLElement>(null);
  useEffect(()=>{const root=feedRef.current;if(!root||typeof IntersectionObserver==="undefined")return;const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("omPostVisible");observer.unobserve(entry.target)}})},{threshold:.12,rootMargin:"0px 0px -30px 0px"});root.querySelectorAll(".socialPost").forEach(node=>observer.observe(node));return()=>observer.disconnect()},[serverPosts]);
  const [videoIndex,setVideoIndex]=useState<number|null>(null);
  const [videoMuted,setVideoMuted]=useState(false);
  const [videoPaused,setVideoPaused]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const touchStart=useRef<number|null>(null);
  const videos=useMemo(()=>serverPosts.filter(p=>p.mediaType==="video"&&!!p.media),[serverPosts]);
  const openVideo=(id:string)=>{const index=videos.findIndex(p=>p.id===id);if(index>=0){setVideoIndex(index);setVideoPaused(false)}};
  const nextVideo=(direction:number)=>{setVideoIndex(index=>index===null?null:Math.max(0,Math.min(videos.length-1,index+direction)));setVideoPaused(false)};
  useEffect(()=>{if(videoIndex===null)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setVideoIndex(null);if(e.key==="ArrowDown")nextVideo(1);if(e.key==="ArrowUp")nextVideo(-1)};document.addEventListener("keydown",key);const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.removeEventListener("keydown",key);document.body.style.overflow=previous}},[videoIndex,videos.length]);
  useEffect(()=>{if(videoIndex===null)return;const player=videoRef.current;if(player){player.currentTime=0;void player.play().catch(()=>{setVideoPaused(true)})}},[videoIndex]);
  const [media,setMedia]=useState("");
  const [cameraOpen,setCameraOpen]=useState(false);
  const [attachOpen,setAttachOpen]=useState(false);
  const [attachTab,setAttachTab]=useState<"menu"|"files"|"intelligence">("menu");
  const documentInputRef=useRef<HTMLInputElement>(null);
  const [inlineMuted,setInlineMuted]=useState(true);
  const [dropActive,setDropActive]=useState(false);
  const [selectedFileName,setSelectedFileName]=useState("");
  const fileInputRef=useRef<HTMLInputElement>(null);
  const dragDepth=useRef(0);
  const [mediaType,setMediaType]=useState("image");
  const [overlay,setOverlay]=useState("");
  const [filter,setFilter]=useState("none");
  const [link,setLink]=useState("");
  const [edit,setEdit]=useState(false);
  const [floating,setFloating]=useState<string|null>(null);
  const [sounds,setSounds]=useState(false);
  const [effects,setEffects]=useState(true);
  const [notice,setNotice]=useState("");
  const [publishing,setPublishing]=useState(false);
  const [burst,setBurst]=useState<{id:string;emoji:string;kind:string}|null>(null);
  const animate=(id:string,emoji:string,kind:string)=>{if(!effects)return;setBurst({id,emoji,kind});setTimeout(()=>setBurst(v=>v?.id===id?v&&v.kind===kind?null:v:v),1000)};
  const safe=(s:string)=>{try{const u=new URL(s);return ["https:","http:"].includes(u.protocol)?u.toString():""}catch{return ""}};
  const tiktok=(s:string)=>{try{const u=new URL(s);if(!["tiktok.com","www.tiktok.com","m.tiktok.com"].includes(u.hostname))return "";const match=u.pathname.match(new RegExp("/video/([0-9]+)"));return match?.[1]||""}catch{return ""}};
  const liveUrl=(s:string)=>{try{const u=new URL(s);if(u.origin!==window.location.origin)return "";return u.pathname.startsWith("/streaming/watch/")||u.pathname.startsWith("/streaming/live/")?u.pathname:""}catch{return ""}};
  const youtube=(s:string)=>{try{const u=new URL(s);const id=u.hostname==="youtu.be"?u.pathname.slice(1):["youtube.com","www.youtube.com","m.youtube.com"].includes(u.hostname)?u.searchParams.get("v")||u.pathname.split("/shorts/")[1]:"";return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?id:""}catch{return ""}};
  const chime=()=>{if(!sounds)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=740;g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);setTimeout(()=>void c.close(),350)}catch{}};
  const pick=(file:File)=>{setSelectedFileName(file.name);if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))return setNotice("Choose a photo or video");if(file.size>2500000)return setNotice("Preview uploads must be under 2.5MB until cloud storage is connected.");const reader=new FileReader();reader.onload=()=>{setMedia(String(reader.result||""));setMediaType(file.type.startsWith("video/")?"video":"image");setEdit(true)};reader.readAsDataURL(file)};
  useEffect(()=>{if(!effects)return;const t=setInterval(()=>setFloating(p=>p?null:serverPosts[Math.floor(Math.random()*serverPosts.length)]?.id||null),45000);return()=>clearInterval(t)},[effects,serverPosts]);
  const preview=(p:Post)=><>{p.media&&<div className="omPostMedia" style={{filter:p.filter||"none"}}>{p.mediaType==="video"?<div className="omLaminatedVideo"><video src={p.media} autoPlay loop muted={inlineMuted} playsInline preload="metadata" style={{width:"100%",maxHeight:420,objectFit:"cover"}}/><button type="button" onClick={()=>setInlineMuted(v=>!v)} aria-label={inlineMuted?"Unmute video":"Mute video"}>{inlineMuted?"🔇 Tap to unmute":"🔊 Tap to mute"}</button>{p.id&&<button type="button" onClick={()=>openVideo(p.id)}>⛶ Expand</button>}</div>:<img src={p.media} alt="Attached post media"/>}{p.overlay&&<strong className="omPostOverlay">{p.overlay}</strong>}</div>}{p.link&&youtube(p.link)&&<div className="omExternalVideo"><iframe title="YouTube shared video" src={"https://www.youtube-nocookie.com/embed/"+youtube(p.link)} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin"/><a href={p.link} target="_blank" rel="noopener noreferrer">View original on YouTube ↗</a></div>}{p.link&&tiktok(p.link)&&<div className="omExternalVideo"><iframe title="TikTok shared video" src={"https://www.tiktok.com/embed/v2/"+tiktok(p.link)} loading="lazy" allow="fullscreen" referrerPolicy="strict-origin-when-cross-origin"/><a href={p.link} target="_blank" rel="noopener noreferrer">View original on TikTok ↗</a></div>}{p.link&&liveUrl(p.link)&&<a className="omLivePostCard" href={liveUrl(p.link)}>🔴 Open 1Muslim Live · Watch in real time ↗</a>}{p.link&&<a className="omLinkPreview" href={p.link} target="_blank" rel="noopener noreferrer">{youtube(p.link)?<img src={"https://img.youtube.com/vi/"+youtube(p.link)+"/hqdefault.jpg"} alt="Video thumbnail"/>:<span>🔗</span>}<span> {youtube(p.link)?"▶ Watch video":"↗ Open website"}<small>{new URL(p.link).hostname}</small></span></a>}</>;

  const [commentDraft,setCommentDraft]=useState<Record<string,string>>({});
  type SharedComment={id:string;post_id:string;parent_id:string|null;name:string;body:string;likes:number;liked:boolean};
  const [sharedComments,setSharedComments]=useState<Record<string,SharedComment[]>>({});
  const [replyTo,setReplyTo]=useState<Record<string,string|null>>({});
  const [commentBusy,setCommentBusy]=useState(false);
  const refreshComments=async()=>{try{const r=await fetch("/api/ummah-comments",{cache:"no-store"});if(!r.ok)return;const data=await r.json();const grouped:Record<string,SharedComment[]>={};for(const c of data.comments||[]){(grouped[c.post_id]??=[]).push(c)}setSharedComments(grouped)}catch{}};
  useEffect(()=>{refreshComments();const t=setInterval(refreshComments,15000);return()=>clearInterval(t)},[]);
  const toggleCommentLike=async(id:string)=>{const r=await fetch("/api/ummah-comment-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:id})});if(!r.ok){setNotice("Sign in to like comments.");return}await refreshComments()};

  const [following,setFollowing]=useState<Record<string,boolean>>({});
  const [notifications,setNotifications]=useState(false);



  const [feedError,setFeedError]=useState("");
  useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok){if(active)setFeedError("Unable to load the shared Ummah feed.");return}const d=await r.json();if(active)setFeedError("");const rows=d.posts||[];if(active)setServerPosts(previous=>{const existing=new Map(previous.map(p=>[p.id,p]));const next=rows.map((p:{id:string;body:string;created_at:string;author_name?:string;author_handle?:string;like_count?:number;liked?:boolean})=>{const old=existing.get(p.id);return old&&old.text===p.body&&old.name===(p.author_name||"Community member")?old:{id:p.id,authorId:(p as {author_id?:string}).author_id,avatarUrl:(p as {avatar_url?:string|null}).avatar_url,name:p.author_name||"Community member",handle:p.author_handle||"@member",text:p.body,link:(p.body.match(/https?:\/\/[^\s]+/g)||[]).find((candidate:string)=>{try{const url=new URL(candidate);return ["tiktok.com","www.tiktok.com","m.tiktok.com","youtube.com","www.youtube.com","youtu.be"].includes(url.hostname)||url.pathname.startsWith("/streaming/")}catch{return false}})||"",created:new Date(p.created_at).getTime(),likes:p.like_count??old?.likes??0,liked:p.liked??old?.liked??false,comments:old?.comments||[]}});return next.length===previous.length&&next.every((p:Post,i:number)=>p===previous[i])?previous:next})}catch{if(active)setFeedError("Could not load community posts. Please refresh to try again.");}};void load();const t=setInterval(()=>void load(),20000);return()=>{active=false;clearInterval(t)}},[]);
  const [verseSeed,setVerseSeed]=useState(0);
  useEffect(()=>{setVerseSeed(Math.floor(Math.random()*10000))},[]);
  const verseCards=[
    {text:"Indeed, with hardship comes ease.",arabic:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",ref:"Qur’an 94:6",verse:"94:6"},
    {text:"My Lord, increase me in knowledge.",arabic:"رَبِّ زِدْنِي عِلْمًا",ref:"Qur’an 20:114",verse:"20:114"},
    {text:"Surely in the remembrance of Allah do hearts find comfort.",arabic:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",ref:"Qur’an 13:28",verse:"13:28"},
    {text:"Allah does not burden a soul beyond that it can bear.",arabic:"لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",ref:"Qur’an 2:286",verse:"2:286"},
    {text:"Do not despair of the mercy of Allah.",arabic:"لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",ref:"Qur’an 39:53",verse:"39:53"}
  ];
  const sorted=useMemo(()=>serverPosts.slice().sort((a,b)=>b.created-a.created),[serverPosts]);

  const createPost=async(e:FormEvent)=>{
    e.preventDefault();
    if((!draft.trim()&&!media&&!safe(link))||publishing)return;
    if(media){setNotice("Photo/video publishing is not connected yet. Your draft is preserved; no post was published.");return}
    setPublishing(true);
    try{
      const text=[draft.trim(),safe(link)].filter(Boolean).join("\n");
      const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
      const data=await response.json().catch(()=>({error:"The posting service returned an unexpected response. Please retry."}));
      if(!response.ok)throw Error(data.error||("Posting failed (HTTP "+response.status+"). Please try again."));
      if(data.removed){setNotice("🥚 This post did not meet community language standards and was removed.");return}
      const p=data.post;
      setServerPosts(v=>[{id:p.id,name:"You",handle:"@you",text:p.body,link:safe(link),created:new Date(p.created_at).getTime(),likes:0,liked:false,comments:[]},...v.filter(x=>x.id!==p.id)]);
      setDraft("");setLink("");setEdit(false);chime();setNotice("✨ Published to the Ummah! Other members can now see your post.");
    }catch(err){setNotice(err instanceof Error?err.message:"Could not publish; your draft was kept.")}
    finally{setPublishing(false)}
  };

  const sharePost=async(post:Post)=>{
    const url=location.origin+"/community#post-"+post.id;
    try{
      if(navigator.share)await navigator.share({title:"1Muslim",text:post.text.slice(0,140),url});
      else{await navigator.clipboard.writeText(url);setNotice("🔗 Post link copied.");}
      chime();
      // The share itself is available to guests; authenticated share events are counted.
      void fetch("/api/ummah-post-shares",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:post.id})}).catch(()=>{});
    }catch{/* Cancelled native share: no tracking. */}
  };
  const like=async(id:string)=>{
    const response=await fetch("/api/ummah-post-likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:id})});
    if(!response.ok){setNotice("Sign in to like posts.");return}
    const result=await response.json();
    setServerPosts(rows=>rows.map(p=>p.id===id?{...p,liked:!!result.liked,likes:typeof result.count==="number"?result.count:p.likes}:p));
    animate(id,"❤️","like");
  };

  const addComment=async(id:string)=>{
    const text=(commentDraft[id]||"").trim();if(!text||commentBusy)return;
    setCommentBusy(true);
    try{const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:id,parentId:replyTo[id]||null,body:text})});const result=await r.json();if(!r.ok){setNotice(result.error||"Could not save comment");return}setCommentDraft(d=>({...d,[id]:""}));setReplyTo(d=>({...d,[id]:null}));await refreshComments()}catch{setNotice("Unable to save comment. Try again.")}finally{setCommentBusy(false)}
  };

  return <main className="communityPage">
    <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 16px"}}><button type="button" disabled={!videos.length} onClick={()=>setVideoIndex(0)} style={{borderRadius:999,padding:"10px 16px",background:"#183c2b",color:"white",border:"1px solid #47765c"}}>▶ Swipe Videos {videos.length?("("+videos.length+")"):""}</button></div>
    {videoIndex!==null&&videos[videoIndex]&&<div role="dialog" aria-modal="true" aria-label="Swipe video posts" onTouchStart={e=>{touchStart.current=e.touches[0].clientY}} onTouchEnd={e=>{if(touchStart.current===null)return;const delta=touchStart.current-e.changedTouches[0].clientY;touchStart.current=null;if(Math.abs(delta)>55)nextVideo(delta>0?1:-1)}} onWheel={e=>{if(Math.abs(e.deltaY)>30)nextVideo(e.deltaY>0?1:-1)}} style={{position:"fixed",inset:0,zIndex:9999,background:"#050806",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"pan-y"}}>
      <video key={videos[videoIndex].id} ref={videoRef} src={videos[videoIndex].media} autoPlay loop playsInline muted={videoMuted} onClick={()=>{const player=videoRef.current;if(!player)return;if(player.paused){void player.play();setVideoPaused(false)}else{player.pause();setVideoPaused(true)}}} style={{width:"100%",height:"100%",maxWidth:580,objectFit:"contain",background:"#000"}}/>
      {videoPaused&&<span style={{position:"absolute",pointerEvents:"none",fontSize:52}}>▶</span>}
      <button type="button" onClick={()=>setVideoIndex(null)} aria-label="Close video viewer" style={{position:"absolute",top:20,left:20,zIndex:2,background:"#0009",color:"#fff",border:0,borderRadius:99,padding:"12px 16px"}}>✕ Close</button>
      <div style={{position:"absolute",right:16,top:"45%",display:"grid",gap:14,zIndex:2}}>
        <button type="button" onClick={()=>nextVideo(-1)} disabled={videoIndex===0} aria-label="Previous video" style={{padding:14,borderRadius:99}}>↑</button>
        <button type="button" onClick={()=>nextVideo(1)} disabled={videoIndex===videos.length-1} aria-label="Next video" style={{padding:14,borderRadius:99}}>↓</button>
        <button type="button" onClick={()=>setVideoMuted(v=>!v)} aria-label={videoMuted?"Unmute":"Mute"} style={{padding:14,borderRadius:99}}>{videoMuted?"🔇":"🔊"}</button>
      </div>
      <div style={{position:"absolute",bottom:32,left:20,right:80,pointerEvents:"none",textShadow:"0 2px 10px #000"}}><strong>{videos[videoIndex].name} · {videos[videoIndex].handle}</strong><p>{videos[videoIndex].text}</p><small>{videoIndex+1} / {videos.length} · Swipe up for next</small></div>
    </div>}
    <SiteNav />
    <div className="communityShell">
      <div className="ummahStoriesSpotlight"><StoriesRail /></div>
      <section className="communityHero"><span className="eyebrow">✦ THE UMMAH · TOGETHER</span><h1>Our Ummah. Our Moments. ✨</h1><p>Stories, reflections and conversations from your community — all in one place.</p><label className="omPostToggle"><input type="checkbox" checked={effects} onChange={e=>setEffects(e.target.checked)}/> ✨ Floating posts</label><label className="omPostToggle"><input type="checkbox" checked={sounds} onChange={e=>setSounds(e.target.checked)}/> 🔊 Sounds</label><p className="omPostNotice">Published posts are shared with the Ummah. Video links can be previewed; media uploads and shared engagement are still being connected.</p></section>
      <div className="ummahQuickActions"><a href="#ummah-compose">✦ Share a Moment</a><a href="/streaming">🔴 Watch Live</a><a href="/ashab">🤝 Find Ashab</a></div><div className="communityGrid">
        <section ref={feedRef}>{feedError&&<p role="alert">{feedError}</p>}
          <style>{`.omPostToolsCompact{display:flex!important;flex-wrap:nowrap!important;gap:7px!important;align-items:center!important;justify-content:flex-start!important;margin:7px 0!important;padding:0!important}.omPostToolsCompact button,.omPostToolsCompact .omMediaPickButton{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:46px!important;height:46px!important;min-width:46px!important;padding:0!important;margin:0!important;border-radius:13px!important;border:1px solid rgba(135,205,166,.34)!important;background:rgba(35,91,65,.12)!important;backdrop-filter:blur(12px);box-shadow:inset 0 1px rgba(255,255,255,.16)!important;font-size:23px!important;font-weight:500!important;line-height:1!important;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease!important}.omPostToolsCompact button:active,.omPostToolsCompact .omMediaPickButton:active{transform:scale(.92)}.communityGrid .composer{min-height:unset!important}.communityGrid .composer textarea{min-height:72px!important}.omPostToolsCompact button:hover,.omPostToolsCompact .omMediaPickButton:hover{animation:omToolJiggle .48s ease both;box-shadow:0 0 16px rgba(114,249,173,.25)!important}.omPostToolsCompact button:active,.omPostToolsCompact .omMediaPickButton:active{animation:omToolPop .4s ease both}.communityGrid .composer:focus-within .omPostToolsCompact>*{animation:omToolJiggle .48s ease both}.communityGrid .composer:focus-within .omPostToolsCompact>*:nth-child(2){animation-delay:.09s}.communityGrid .composer:focus-within .omPostToolsCompact>*:nth-child(3){animation-delay:.18s}@keyframes omToolJiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg) scale(1.05)}65%{transform:rotate(4deg) scale(1.04)}}@keyframes omToolPop{0%{transform:scale(.88);filter:brightness(1.4)}65%{transform:scale(1.12);filter:brightness(1.8)}100%{transform:scale(1);filter:brightness(1)}}.omFeedSequence{min-width:0}.omVerseGlass{position:relative;overflow:hidden;margin:16px 0 22px;padding:18px 45px 18px 20px;border-radius:19px;border:1px solid rgba(142,224,178,.28);background:linear-gradient(115deg,rgba(40,100,68,.13),rgba(255,255,255,.035));backdrop-filter:blur(18px);box-shadow:inset 0 1px rgba(255,255,255,.13);animation:omVerseEnter .7s ease both}.omVerseGlass:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(157,255,195,.13),transparent 70%);pointer-events:none;animation:omVerseLight 3s ease-in-out infinite}.omVerseGlass p{margin:5px 0 9px;font-size:clamp(14px,2.6vw,17px);line-height:1.55;font-weight:500}.omVerseGlass small{opacity:.72}.omVerseGlass>a{position:absolute;right:16px;bottom:16px;color:inherit;text-decoration:none}.omVerseMark{font-size:20px;opacity:.7}@keyframes omVerseEnter{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes omVerseLight{0%,100%{transform:translateX(-100%)}50%{transform:translateX(100%)}}@media(prefers-reduced-motion:reduce){.omVerseGlass,.omVerseGlass:before,.omPostToolsCompact button,.omPostToolsCompact .omMediaPickButton{animation:none!important}}.omPostToolsCompact .omMediaPickButton input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}@media(prefers-reduced-motion:reduce){.omPostToolsCompact button,.omPostToolsCompact .omMediaPickButton{transition:none!important}}`}</style>
          {cameraOpen&&<PostCamera onCapture={pick} onClose={()=>setCameraOpen(false)}/>}
          <form id="ummah-compose" className="composer" onSubmit={createPost}>
            <div className="avatar">YOU</div><div className="composerBody"><div className={`omLivingDrop ${dropActive?"omLivingDropActive":""} ${media?"omLivingDropFilled":""}`} onDragEnter={e=>{e.preventDefault();dragDepth.current++;setDropActive(true)}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="copy"}} onDragLeave={e=>{e.preventDefault();dragDepth.current=Math.max(0,dragDepth.current-1);if(!dragDepth.current)setDropActive(false)}} onDrop={e=>{e.preventDefault();dragDepth.current=0;setDropActive(false);const file=e.dataTransfer.files?.[0];if(file)pick(file)}}><button type="button" className="omLivingDropTrigger" onClick={()=>fileInputRef.current?.click()} aria-label="Tap to choose a photo or video"><span className="omLivingDropIcon" aria-hidden="true">{dropActive?"↓":media?"✓":"+"}</span><span className="omLivingDropTitle">{dropActive?"Release to preview":media?"Add or replace media":"Drop here or tap to add"}</span><span className="omLivingDropHint">{media?selectedFileName:"Photo or video · preview before posting"}</span></button><input ref={fileInputRef} className="omLivingDropInput" type="file" accept="image/*,video/*" aria-label="Choose a photo or video" onChange={e=>{const file=e.target.files?.[0];if(file)pick(file);e.target.value=""}}/></div><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What’s on your mind? Share a reflection or question…" maxLength={500}/><div className="omPostTools omPostToolsCompact"><button type="button" className="omAttachTrigger" title="Add to post" aria-label="Open post attachments" aria-expanded={attachOpen} onClick={()=>{setAttachTab("menu");setAttachOpen(true)}}>＋</button><button type="button" title="Edit media" aria-label="Edit media" onClick={()=>setEdit(v=>!v)}>✎</button><button type="button" title="Add a link" aria-label="Add a link" onClick={()=>setLink(v=>v||"https://")}>🔗</button></div>
{attachOpen&&<div className="omAttachBackdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setAttachOpen(false)}}><section className="omAttachSheet" role="dialog" aria-modal="true" aria-label="Add to your post"><div className="omAttachHandle"/><header><span className="omAttachMark">۞</span><div><small>1MUSLIM · POST STUDIO</small><h3>{attachTab==="files"?"Your files":attachTab==="intelligence"?"HudHud Intelligence":"Create something beautiful"}</h3></div><button type="button" className="omAttachClose" aria-label="Close attachment menu" onClick={()=>setAttachOpen(false)}>×</button></header>{attachTab==="menu"?<div className="omAttachItems"><button type="button" onClick={()=>{setAttachOpen(false);setCameraOpen(true)}}><span>📷</span><strong>Camera</strong><small>Capture a moment</small></button><button type="button" onClick={()=>{setAttachOpen(false);fileInputRef.current?.click()}}><span>▧</span><strong>Photos & videos</strong><small>Choose from your device</small></button><button type="button" onClick={()=>setAttachTab("files")}><span>♧</span><strong>Files</strong><small>Browse documents</small></button><button type="button" onClick={()=>{setAttachOpen(false);setLink(v=>v||"https://")}}><span>↗</span><strong>Links & live</strong><small>Share a video or stream</small></button><button type="button" onClick={()=>setAttachTab("intelligence")}><span>✧</span><strong>HudHud Intelligence</strong><small>Writing inspiration</small></button></div>:attachTab==="files"?<div className="omAttachSub"><p>Choose a document from your device. Your private file library will appear here once uploads are connected.</p><button type="button" onClick={()=>documentInputRef.current?.click()}>↑ Browse device files</button><input ref={documentInputRef} hidden type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={e=>{if(e.target.files?.length)setNotice("Document publishing is not connected yet. No file was uploaded.");setAttachOpen(false);e.target.value=""}}/><button type="button" onClick={()=>setAttachTab("menu")}>← All attachments</button></div>:<div className="omAttachSub"><p>Begin with a sincere reflection. HudHud can help you structure it, but your words remain yours.</p><button type="button" onClick={()=>{setDraft(v=>v||"Today I reflected on…");setAttachOpen(false)}}>✧ Start a reflection</button><button type="button" onClick={()=>setAttachTab("menu")}>← All attachments</button></div>}<footer>بِسْمِ اللَّهِ · Share what benefits others</footer></section></div>}
{edit&&<div className="omPostEditor"><input placeholder="Text over photo / video" maxLength={80} value={overlay} onChange={e=>setOverlay(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="none">Original</option><option value="grayscale(1)">Classic</option><option value="sepia(.8)">Warm</option><option value="saturate(1.7) contrast(1.1)">Vibrant</option><option value="contrast(1.4) brightness(.85)">Cinematic</option></select></div>}
{link&&<input className="omPostLinkInput" type="url" placeholder="Paste a YouTube or website link" value={link} onChange={e=>setLink(e.target.value)}/>}
{(media||safe(link))&&<div className="omPostPreview">{preview({id:"",name:"",handle:"",text:"",created:0,likes:0,liked:false,comments:[],media,mediaType,overlay,filter,link:safe(link)})}<button type="button" onClick={()=>{setMedia("");setSelectedFileName("");setLink("");setOverlay("")}}>✕ Remove media</button></div>}
<div className="composerBottom"><span>{draft.length}/500</span><button className="postButton" disabled={publishing||(!draft.trim()&&!safe(link))}>{publishing?"Publishing…":"✨ Post it"}</button></div></div>
          </form>
          {notice&&<p role="status" className="omPostNotice">{notice}</p>}
          {sorted.map((post,index)=><div key={post.id} className="omFeedSequence"><article className={"socialPost "+(post.text?.startsWith("✦ DAILY UMMAH ✦")?"dailyPostLit ":"")+(burst?.id===post.id?"omPostCelebrating":"")} id={"post-"+post.id} key={post.id}>{post.text?.startsWith("✦ DAILY UMMAH ✦")&&<span className="dailyPostParticles" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{["--p" as string]:i} as React.CSSProperties}/>)}</span>}{burst?.id===post.id&&<span className="omPostBurst" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{["--i" as string]:i} as React.CSSProperties}>{burst.emoji}</i>)}</span>}
            <div className="avatar">{post.name==="You"?"YOU":"1M"}</div>
            <div className="postBody">
              <div className="postHeader"><strong>{post.name}</strong><span>{post.handle} · {new Date(post.created).toLocaleDateString()}</span><button>•••</button></div>
              <p className="omPostTextReveal">{post.text.replace(/\\r\\n|\\n|\\r/g, "\n")}</p>{preview(post)}
              <div className="postActions">
                <button onClick={()=>setSelectedConversation(post.id)}>💬 {(sharedComments[post.id]||[]).length}</button>
                <button className={post.liked?"liked":""} onClick={()=>like(post.id)}>❤️ {post.likes}</button>
                <button onClick={()=>{animate(post.id,"✨","share");void sharePost(post)}}>↗ Share</button>
              </div>
              <button type="button" className="commentBox" onClick={()=>setSelectedConversation(post.id)} aria-label={"Open conversation for post by "+post.name}>💬 Open conversation · Reply, images & threads ↗</button>
            </div>
          </article>{(index+1)%5===0&&<aside className="omVerseGlass" aria-label="Quran reflection"><span className="omVerseMark">۞</span><p className="omVerseArabic" lang="ar" dir="rtl">{verseCards[(verseSeed+Math.floor(index/5))%verseCards.length].arabic}</p><p>{verseCards[(verseSeed+Math.floor(index/5))%verseCards.length].text}</p><small>{verseCards[(verseSeed+Math.floor(index/5))%verseCards.length].ref}</small><Link href={"/quran-studio?verse="+encodeURIComponent(verseCards[(verseSeed+Math.floor(index/5))%verseCards.length].verse)} aria-label="Open verse in Quran Studio">↗</Link></aside>}</div>)}
        </section>
        {selectedConversation&&serverPosts.find(p=>p.id===selectedConversation)&&<UmmahConversation
          post={{id:selectedConversation,author_id:serverPosts.find(p=>p.id===selectedConversation)?.authorId||"",body:serverPosts.find(p=>p.id===selectedConversation)?.text||"",created_at:new Date(serverPosts.find(p=>p.id===selectedConversation)?.created||Date.now()).toISOString(),author_name:serverPosts.find(p=>p.id===selectedConversation)?.name,author_handle:serverPosts.find(p=>p.id===selectedConversation)?.handle,avatar_url:serverPosts.find(p=>p.id===selectedConversation)?.avatarUrl}}
          onClose={()=>setSelectedConversation(null)}/>}
        <aside className="communityRail">
          <div className="railBox"><span className="eyebrow">YOUR COMMUNITY</span><h3>Build your circle.</h3><p>Follow creators and turn on notifications for the people and topics you want to keep up with.</p>
            <button onClick={()=>setFollowing(f=>({...f,teachers:!f.teachers}))}>{following.teachers?"✓ Following":"＋ Follow teachers"}</button>
            <button onClick={()=>setNotifications(!notifications)}>{notifications?"🔔 Notifications on":"🔕 Turn on notifications"}</button>
          </div>
          <div className="railBox"><span className="eyebrow">LIVE NOW</span><h3>Join the live conversation.</h3><p>Watch live lessons, reminders and community conversations.</p><Link href="/streaming">Open Streaming →</Link></div>
        </aside>
      </div>
    </div>
    <style jsx>{` .ummahStoriesSpotlight{position:relative;margin:12px 0 24px;padding:20px 12px;border-radius:28px;border:1px solid #a4ffb747;background:linear-gradient(135deg,#132f28,#10211f 60%,#222338);box-shadow:0 12px 45px #0005,0 0 30px #60ffac1b;overflow:hidden}.ummahStoriesSpotlight:before{content:"";position:absolute;inset:-130%;pointer-events:none;background:linear-gradient(105deg,transparent 47%,#caffdd1a 50%,transparent 53%);animation:ummahStoriesShimmer 9s linear infinite}.ummahQuickActions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px}.ummahQuickActions a{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border:1px solid #87f3b87a;border-radius:999px;color:#e5fff0;text-decoration:none;background:linear-gradient(130deg,#174e37,#182e35);font-weight:750;box-shadow:0 0 18px #74ffc326;transition:transform .2s,box-shadow .2s}.ummahQuickActions a:hover{transform:translateY(-3px);box-shadow:0 0 25px #74ffc355}@keyframes ummahStoriesShimmer{to{transform:translateX(40%)}}@media(max-width:600px){.ummahStoriesSpotlight{padding:12px 6px;border-radius:20px}.ummahQuickActions a{flex:1;font-size:12px;padding:11px 8px}}@media(prefers-reduced-motion:reduce){.ummahStoriesSpotlight:before{animation:none}} `}</style>
  {burst?.id==="new"&&<div className="omPublishCelebration" aria-hidden="true"><span>✨</span><strong>Post created!</strong></div>}</main>;
}
