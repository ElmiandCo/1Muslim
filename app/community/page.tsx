"use client";

import "./community.css";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const safe=(s:string)=>{try{const u=new URL(s);return ["https:","http:"].includes(u.protocol)?u.toString():""}catch{return ""}};
  const youtube=(s:string)=>{try{const u=new URL(s);const id=u.hostname==="youtu.be"?u.pathname.slice(1):["youtube.com","www.youtube.com","m.youtube.com"].includes(u.hostname)?u.searchParams.get("v")||u.pathname.split("/shorts/")[1]:"";return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?id:""}catch{return ""}};
  const chime=()=>{if(!sounds)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=740;g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.2);setTimeout(()=>void c.close(),350)}catch{}};
  const pick=(file:File)=>{if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))return setNotice("Choose a photo or video");if(file.size>2500000)return setNotice("Preview uploads must be under 2.5MB until cloud storage is connected.");const reader=new FileReader();reader.onload=()=>{setMedia(String(reader.result||""));setMediaType(file.type.startsWith("video/")?"video":"image");setEdit(true)};reader.readAsDataURL(file)};
  useEffect(()=>{if(!effects)return;const t=setInterval(()=>setFloating(p=>p?null:posts[Math.floor(Math.random()*posts.length)]?.id||null),45000);return()=>clearInterval(t)},[effects,posts]);
  const preview=(p:Post)=><>{p.media&&<div className="omPostMedia" style={{filter:p.filter||"none"}}>{p.mediaType==="video"?<video src={p.media} controls playsInline/>:<img src={p.media} alt="Attached post media"/>}{p.overlay&&<strong className="omPostOverlay">{p.overlay}</strong>}</div>}{p.link&&<a className="omLinkPreview" href={p.link} target="_blank" rel="noopener noreferrer">{youtube(p.link)?<img src={"https://img.youtube.com/vi/"+youtube(p.link)+"/hqdefault.jpg"} alt="Video thumbnail"/>:<span>🔗</span>}<span> {youtube(p.link)?"▶ Watch video":"↗ Open website"}<small>{new URL(p.link).hostname}</small></span></a>}</>;

  const [commentDraft,setCommentDraft]=useState<Record<string,string>>({});
  const [following,setFollowing]=useState<Record<string,boolean>>({});
  const [notifications,setNotifications]=useState(false);

  useEffect(()=>{ try { const saved=localStorage.getItem(key); if(saved) setPosts(JSON.parse(saved)); } catch {} },[]);
  useEffect(()=>{ localStorage.setItem(key,JSON.stringify(posts)); },[posts]);

  const sorted=useMemo(()=>[...posts].sort((a,b)=>b.created-a.created),[posts]);

  const createPost=(e:FormEvent)=>{
    e.preventDefault();
    if(!draft.trim()&&!media&&!safe(link)) return;
    setPosts(p=>[{id:crypto.randomUUID(),name:"You",handle:"@you",text:draft.trim(),created:Date.now(),likes:0,liked:false,comments:[],media,mediaType,overlay,filter,link:safe(link)},...p]);
    setDraft("");setMedia("");setOverlay("");setFilter("none");setLink("");setEdit(false);chime();setNotice("✨ Saved to this browser.");
  };

  const like=(id:string)=>{
    setPosts(p=>p.map(x=>x.id===id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));
  };

  const addComment=(id:string)=>{
    const text=(commentDraft[id]||"").trim(); if(!text)return;
    setPosts(p=>p.map(x=>x.id===id?{...x,comments:[...x.comments,{id:crypto.randomUUID(),name:"You",text,created:Date.now()}]}:x));
    setCommentDraft(c=>({...c,[id]:""}));
  };

  return <main className="communityPage">
    <SiteNav />
    <div className="communityShell">
      <section className="communityHero"><span className="eyebrow">COMMUNITY</span><h1>Make your moment pop. ✨</h1><p>Ask, reflect, encourage and learn with the 1Muslim community.</p><label className="omPostToggle"><input type="checkbox" checked={effects} onChange={e=>setEffects(e.target.checked)}/> ✨ Floating posts</label><label className="omPostToggle"><input type="checkbox" checked={sounds} onChange={e=>setSounds(e.target.checked)}/> 🔊 Sounds</label><p className="omPostNotice">Preview: posts currently save only in your browser, not for other members.</p></section>
      <div className="communityGrid">
        <section>
          <form className="composer" onSubmit={createPost}>
            <div className="avatar">YOU</div><div className="composerBody"><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What’s on your mind? Share a reflection or question…" maxLength={500}/><div className="omPostTools"><label>📷 Photo / Video<input type="file" accept="image/*,video/*" hidden onChange={e=>{if(e.target.files?.[0])pick(e.target.files[0]);e.target.value=""}}/></label><button type="button" onClick={()=>setEdit(v=>!v)}>🎨 Edit</button><button type="button" onClick={()=>setDraft(v=>v+" ✨")}>✨ Express</button><button type="button" onClick={()=>setLink(v=>v||"https://")}>🔗 Link</button></div>
{edit&&<div className="omPostEditor"><input placeholder="Text over photo / video" maxLength={80} value={overlay} onChange={e=>setOverlay(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="none">Original</option><option value="grayscale(1)">Classic</option><option value="sepia(.8)">Warm</option><option value="saturate(1.7) contrast(1.1)">Vibrant</option><option value="contrast(1.4) brightness(.85)">Cinematic</option></select></div>}
{link&&<input className="omPostLinkInput" type="url" placeholder="Paste a YouTube or website link" value={link} onChange={e=>setLink(e.target.value)}/>}
{(media||safe(link))&&<div className="omPostPreview">{preview({id:"",name:"",handle:"",text:"",created:0,likes:0,liked:false,comments:[],media,mediaType,overlay,filter,link:safe(link)})}<button type="button" onClick={()=>{setMedia("");setLink("");setOverlay("")}}>✕ Remove media</button></div>}
<div className="composerBottom"><span>{draft.length}/500</span><button className="postButton" disabled={!draft.trim()&&!media&&!safe(link)}>✨ Post it</button></div></div>
          </form>
          {notice&&<p role="status" className="omPostNotice">{notice}</p>}
          {sorted.map(post=><article className="socialPost" id={"post-"+post.id} key={post.id}>
            <div className="avatar">{post.name==="You"?"YOU":"1M"}</div>
            <div className="postBody">
              <div className="postHeader"><strong>{post.name}</strong><span>{post.handle} · {new Date(post.created).toLocaleDateString()}</span><button>•••</button></div>
              <p>{post.text}</p>{preview(post)}
              <div className="postActions">
                <button onClick={()=>setCommentDraft(c=>({...c,[post.id]:c[post.id]===undefined?"":c[post.id]}))}>💬 {post.comments.length}</button>
                <button className={post.liked?"liked":""} onClick={()=>like(post.id)}>❤️ {post.likes}</button>
                <button onClick={()=>{const url=location.origin+"/community";if(navigator.share)void navigator.share({title:"1Muslim",text:post.text,url}).then(chime).catch(()=>{});else void navigator.clipboard.writeText(post.text+"\n"+url).then(()=>{setNotice("🔗 Copied post and community link!");chime()})}}>↗ Share</button>
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
  {floating&&effects&&<button type="button" className="omFloatingPost" onClick={()=>{document.getElementById("post-"+floating)?.scrollIntoView({behavior:"smooth",block:"center"});setFloating(null)}}>✨ Discover a community post <span>Tap to see ↗</span></button>}</main>;
}
