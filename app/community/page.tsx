"use client";

import "./community.css";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";

type Comment = { id: string; name: string; text: string; created: number };
type Post = { media?:string; mediaType?:string; overlay?:string; filter?:string; link?:string; id: string; name: string; handle: string; text: string; created: number; likes: number; liked: boolean; comments: Comment[] };

const seed: Post[] = [
  { id:"welcome", name:"1Muslim", handle:"@1muslim", text:"Welcome to the community. Ask questions, share a reflection, encourage someone, or simply listen. 🤍", created:Date.now()-7200000, likes:18, liked:false, comments:[{id:"c1",name:"Amina",text:"May Allah make the path easy for everyone.",created:Date.now()-3600000}] },
  { id:"question", name:"Abdullah", handle:"@abdullah", text:"What helped you stay consistent with salah when you were first learning?", created:Date.now()-3600000, likes:11, liked:false, comments:[] },
];

const key = "1muslim-community-posts";

export default function Community() {
  const [posts,setPosts]=useState<Post[]>(seed);
  const [draft,setDraft]=useState("");
  useEffect(()=>{try{const saved=sessionStorage.getItem("1muslim-verse-share-draft");if(saved){setDraft(saved);sessionStorage.removeItem("1muslim-verse-share-draft")}}catch{}},[]);
  useEffect(()=>{const verse=new URLSearchParams(window.location.search).get("verse");if(verse&&/^(?:[1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(verse)){setDraft("Reflecting on Qur’an "+verse+" 📖\\nhttps://quran.com/"+verse+"\\n");setLink("https://quran.com/"+verse)}},[]);
  const feedRef=useRef<HTMLElement>(null);
  useEffect(()=>{const root=feedRef.current;if(!root||typeof IntersectionObserver==="undefined")return;const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("omPostVisible");observer.unobserve(entry.target)}})},{threshold:.12,rootMargin:"0px 0px -30px 0px"});root.querySelectorAll(".socialPost").forEach(node=>observer.observe(node));return()=>observer.disconnect()},[posts]);
  const [videoIndex,setVideoIndex]=useState<number|null>(null);
  const [videoMuted,setVideoMuted]=useState(false);
  const [videoPaused,setVideoPaused]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const touchStart=useRef<number|null>(null);
  const videos=useMemo(()=>posts.filter(p=>p.mediaType==="video"&&!!p.media),[posts]);
  const openVideo=(id:string)=>{const index=videos.findIndex(p=>p.id===id);if(index>=0){setVideoIndex(index);setVideoPaused(false)}};
  const nextVideo=(direction:number)=>{setVideoIndex(index=>index===null?null:Math.max(0,Math.min(videos.length-1,index+direction)));setVideoPaused(false)};
  useEffect(()=>{if(videoIndex===null)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setVideoIndex(null);if(e.key==="ArrowDown")nextVideo(1);if(e.key==="ArrowUp")nextVideo(-1)};document.addEventListener("keydown",key);const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.removeEventListener("keydown",key);document.body.style.overflow=previous}},[videoIndex,videos.length]);
  useEffect(()=>{if(videoIndex===null)return;const player=videoRef.current;if(player){player.currentTime=0;void player.play().catch(()=>{setVideoPaused(true)})}},[videoIndex]);
  const [media,setMedia]=useState("");
  const [mediaType,setMediaType]=useState("image");
  const [overlay,setOverlay]=useState("");
  const [filter,setFilter]=useState("none");
  const [link,setLink]=useState("");
  const [edit,setEdit]=useState(false);
  const [floating,setFloating]=useState<string|null>(null);
  const [sounds,setSounds]=useState(false);
  const [effects,setEffects]=useState(true);
  const [notice,setNotice]=useState("");
  const [burst,setBurst]=useState<{id:string;emoji:string;kind:string}|null>(null);
  const animate=(id:string,emoji:string,kind:string)=>{if(!effects)return;setBurst({id,emoji,kind});setTimeout(()=>setBurst(v=>v?.id===id?v&&v.kind===kind?null:v:v),1000)};
  const safe=(s:string)=>{try{const u=new URL(s);return ["https:","http:"].includes(u.protocol)?u.toString():""}catch{return ""}};
  const youtube=(s:string)=>{try{const u=new URL(s);const id=u.hostname==="youtu.be"?u.pathname.slice(1):["youtube.com","www.youtube.com","m.youtube.com"].includes(u.hostname)?u.searchParams.get("v")||u.pathname.split("/shorts/")[1]:"";return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?id:""}catch{return ""}};
  const chime=()=>{if(!sounds)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=740;g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);setTimeout(()=>void c.close(),350)}catch{}};
  const pick=(file:File)=>{if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))return setNotice("Choose a photo or video");if(file.size>2500000)return setNotice("Preview uploads must be under 2.5MB until cloud storage is connected.");const reader=new FileReader();reader.onload=()=>{setMedia(String(reader.result||""));setMediaType(file.type.startsWith("video/")?"video":"image");setEdit(true)};reader.readAsDataURL(file)};
  useEffect(()=>{if(!effects)return;const t=setInterval(()=>setFloating(p=>p?null:posts[Math.floor(Math.random()*posts.length)]?.id||null),45000);return()=>clearInterval(t)},[effects,posts]);
  const preview=(p:Post)=><>{p.media&&<div className="omPostMedia" style={{filter:p.filter||"none"}}>{p.mediaType==="video"?<button type="button" className="omVideoOpen" onClick={()=>openVideo(p.id)} aria-label="Play video in swipe viewer" style={{display:"block",width:"100%",position:"relative",padding:0,border:0,background:"#000",cursor:"pointer"}}><video src={p.media} preload="metadata" muted playsInline style={{width:"100%",maxHeight:420,objectFit:"contain",pointerEvents:"none"}}/><span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#000b",borderRadius:999,padding:"15px 20px",color:"#fff",fontSize:24}}>▶</span></button>:<img src={p.media} alt="Attached post media"/>}{p.overlay&&<strong className="omPostOverlay">{p.overlay}</strong>}</div>}{p.link&&<a className="omLinkPreview" href={p.link} target="_blank" rel="noopener noreferrer">{youtube(p.link)?<img src={"https://img.youtube.com/vi/"+youtube(p.link)+"/hqdefault.jpg"} alt="Video thumbnail"/>:<span>🔗</span>}<span> {youtube(p.link)?"▶ Watch video":"↗ Open website"}<small>{new URL(p.link).hostname}</small></span></a>}</>;

  const [commentDraft,setCommentDraft]=useState<Record<string,string>>({});
  const [following,setFollowing]=useState<Record<string,boolean>>({});
  const [notifications,setNotifications]=useState(false);

  useEffect(()=>{ try { const saved=localStorage.getItem(key); if(saved) setPosts(JSON.parse(saved)); } catch {} },[]);
  useEffect(()=>{ localStorage.setItem(key,JSON.stringify(posts)); },[posts]);

  const [serverPosts,setServerPosts]=useState<Post[]>([]);
  useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)return;const d=await r.json();const rows=d.posts||[];if(active)setServerPosts(rows.map((p:{id:string;body:string;created_at:string})=>({id:p.id,name:"Community member",handle:"@member",text:p.body,created:new Date(p.created_at).getTime(),likes:0,liked:false,comments:[]})))}catch{}};void load();const t=setInterval(()=>void load(),20000);return()=>{active=false;clearInterval(t)}},[]);
  const sorted=useMemo(()=>[...serverPosts,...posts].sort((a,b)=>b.created-a.created),[serverPosts,posts]);

  const createPost=(e:FormEvent)=>{
    e.preventDefault();
    if(!draft.trim()&&!media&&!safe(link)) return;
    setPosts(p=>[{id:crypto.randomUUID(),name:"You",handle:"@you",text:draft.trim(),created:Date.now(),likes:0,liked:false,comments:[],media,mediaType,overlay,filter,link:safe(link)},...p]);
    setDraft("");setMedia("");setOverlay("");setFilter("none");setLink("");setEdit(false);chime();setNotice("✨ Saved to this browser.");animate("new","✨","publish");
  };

  const like=(id:string)=>{animate(id,"❤️","like");chime();
    setPosts(p=>p.map(x=>x.id===id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));
  };

  const addComment=(id:string)=>{
    const text=(commentDraft[id]||"").trim(); if(!text)return;
    setPosts(p=>p.map(x=>x.id===id?{...x,comments:[...x.comments,{id:crypto.randomUUID(),name:"You",text,created:Date.now()}]}:x));
    setCommentDraft(c=>({...c,[id]:""}));animate(id,"💬","reply");chime();
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
      <section className="communityHero"><span className="eyebrow">COMMUNITY</span><h1>Make your moment pop. ✨</h1><p>Ask, reflect, encourage and learn with the 1Muslim community.</p><label className="omPostToggle"><input type="checkbox" checked={effects} onChange={e=>setEffects(e.target.checked)}/> ✨ Floating posts</label><label className="omPostToggle"><input type="checkbox" checked={sounds} onChange={e=>setSounds(e.target.checked)}/> 🔊 Sounds</label><p className="omPostNotice">Preview: posts currently save only in your browser, not for other members.</p></section>
      <div className="communityGrid">
        <section ref={feedRef}>
          <form className="composer" onSubmit={createPost}>
            <div className="avatar">YOU</div><div className="composerBody"><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What’s on your mind? Share a reflection or question…" maxLength={500}/><div className="omPostTools"><label>📷 Photo / Video<input type="file" accept="image/*,video/*" hidden onChange={e=>{if(e.target.files?.[0])pick(e.target.files[0]);e.target.value=""}}/></label><button type="button" onClick={()=>setEdit(v=>!v)}>🎨 Edit</button><button type="button" onClick={()=>setDraft(v=>v+" ✨")}>✨ Express</button><button type="button" onClick={()=>setLink(v=>v||"https://")}>🔗 Link</button></div>
{edit&&<div className="omPostEditor"><input placeholder="Text over photo / video" maxLength={80} value={overlay} onChange={e=>setOverlay(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="none">Original</option><option value="grayscale(1)">Classic</option><option value="sepia(.8)">Warm</option><option value="saturate(1.7) contrast(1.1)">Vibrant</option><option value="contrast(1.4) brightness(.85)">Cinematic</option></select></div>}
{link&&<input className="omPostLinkInput" type="url" placeholder="Paste a YouTube or website link" value={link} onChange={e=>setLink(e.target.value)}/>}
{(media||safe(link))&&<div className="omPostPreview">{preview({id:"",name:"",handle:"",text:"",created:0,likes:0,liked:false,comments:[],media,mediaType,overlay,filter,link:safe(link)})}<button type="button" onClick={()=>{setMedia("");setLink("");setOverlay("")}}>✕ Remove media</button></div>}
<div className="composerBottom"><span>{draft.length}/500</span><button className="postButton" disabled={!draft.trim()&&!media&&!safe(link)}>✨ Post it</button></div></div>
          </form>
          {notice&&<p role="status" className="omPostNotice">{notice}</p>}
          {sorted.map(post=><article className={"socialPost "+(burst?.id===post.id?"omPostCelebrating":"")} id={"post-"+post.id} key={post.id}>{burst?.id===post.id&&<span className="omPostBurst" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{["--i" as string]:i} as React.CSSProperties}>{burst.emoji}</i>)}</span>}
            <div className="avatar">{post.name==="You"?"YOU":"1M"}</div>
            <div className="postBody">
              <div className="postHeader"><strong>{post.name}</strong><span>{post.handle} · {new Date(post.created).toLocaleDateString()}</span><button>•••</button></div>
              <p className="omPostTextReveal">{post.text}</p>{preview(post)}
              <div className="postActions">
                <button onClick={()=>setCommentDraft(c=>({...c,[post.id]:c[post.id]===undefined?"":c[post.id]}))}>💬 {post.comments.length}</button>
                <button className={post.liked?"liked":""} onClick={()=>like(post.id)}>❤️ {post.likes}</button>
                <button onClick={()=>{animate(post.id,"✨","share");const url=location.origin+"/community";if(navigator.share)void navigator.share({title:"1Muslim",text:post.text,url}).then(chime).catch(()=>{});else void navigator.clipboard.writeText(post.text+"\n"+url).then(()=>{setNotice("🔗 Copied post and community link!");chime()})}}>↗ Share</button>
              </div>
              <div className="commentBox"><input value={commentDraft[post.id]||""} onChange={e=>setCommentDraft(c=>({...c,[post.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addComment(post.id)}}} placeholder="Reply to this post…"/><button onClick={()=>addComment(post.id)}>Reply</button></div>
              {post.comments.map(c=><div className="comment" key={c.id}><div className="smallAvatar">1M</div><div><strong>{c.name}</strong><p>{c.text}</p></div></div>)}
            </div>
          </article>)}
        </section>
        <aside className="communityRail">
          <div className="railBox"><span className="eyebrow">YOUR COMMUNITY</span><h3>Build your circle.</h3><p>Follow creators and turn on notifications for the people and topics you want to keep up with.</p>
            <button onClick={()=>setFollowing(f=>({...f,teachers:!f.teachers}))}>{following.teachers?"✓ Following":"＋ Follow teachers"}</button>
            <button onClick={()=>setNotifications(!notifications)}>{notifications?"🔔 Notifications on":"🔕 Turn on notifications"}</button>
          </div>
          <div className="railBox"><span className="eyebrow">LIVE NOW</span><h3>Join the live conversation.</h3><p>Watch live lessons, reminders and community conversations.</p><Link href="/streaming">Open Streaming →</Link></div>
        </aside>
      </div>
    </div>
  {burst?.id==="new"&&<div className="omPublishCelebration" aria-hidden="true"><span>✨</span><strong>Post created!</strong></div>}{floating&&effects&&<button type="button" className="omFloatingPost" onClick={()=>{document.getElementById("post-"+floating)?.scrollIntoView({behavior:"smooth",block:"center"});setFloating(null)}}>✨ Discover a community post <span>Tap to see ↗</span></button>}</main>;
}
