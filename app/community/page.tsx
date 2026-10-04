"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";

type Comment = { id: string; name: string; text: string; created: number };
type Post = { id: string; name: string; handle: string; text: string; created: number; likes: number; liked: boolean; comments: Comment[] };

const seed: Post[] = [
  { id:"welcome", name:"1Muslim", handle:"@1muslim", text:"Welcome to the community. Ask questions, share a reflection, encourage someone, or simply listen. 🤍", created:Date.now()-7200000, likes:18, liked:false, comments:[{id:"c1",name:"Amina",text:"May Allah make the path easy for everyone.",created:Date.now()-3600000}] },
  { id:"question", name:"Abdullah", handle:"@abdullah", text:"What helped you stay consistent with salah when you were first learning?", created:Date.now()-3600000, likes:11, liked:false, comments:[] },
];

const key = "1muslim-community-posts";

export default function Community() {
  const [posts,setPosts]=useState<Post[]>(seed);
  const [draft,setDraft]=useState("");
  const [commentDraft,setCommentDraft]=useState<Record<string,string>>({});
  const [following,setFollowing]=useState<Record<string,boolean>>({});
  const [notifications,setNotifications]=useState(false);

  useEffect(()=>{ try { const saved=localStorage.getItem(key); if(saved) setPosts(JSON.parse(saved)); } catch {} },[]);
  useEffect(()=>{ localStorage.setItem(key,JSON.stringify(posts)); },[posts]);

  const sorted=useMemo(()=>[...posts].sort((a,b)=>b.created-a.created),[posts]);

  const createPost=(e:FormEvent)=>{
    e.preventDefault();
    if(!draft.trim()) return;
    setPosts(p=>[{id:crypto.randomUUID(),name:"You",handle:"@you",text:draft.trim(),created:Date.now(),likes:0,liked:false,comments:[]},...p]);
    setDraft("");
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
      <section className="communityHero"><span className="eyebrow">COMMUNITY</span><h1>Stay connected.</h1><p>Ask, reflect, encourage and learn with the 1Muslim community.</p></section>
      <div className="communityGrid">
        <section>
          <form className="composer" onSubmit={createPost}>
            <div className="avatar">YOU</div><div className="composerBody"><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="What’s on your mind? Share a reflection or question…" maxLength={500}/><div className="composerBottom"><span>{draft.length}/500</span><button className="postButton">Post</button></div></div>
          </form>
          {sorted.map(post=><article className="socialPost" key={post.id}>
            <div className="avatar">{post.name==="You"?"YOU":"1M"}</div>
            <div className="postBody">
              <div className="postHeader"><strong>{post.name}</strong><span>{post.handle} · {new Date(post.created).toLocaleDateString()}</span><button>•••</button></div>
              <p>{post.text}</p>
              <div className="postActions">
                <button onClick={()=>setCommentDraft(c=>({...c,[post.id]:c[post.id]===undefined?"":c[post.id]}))}>💬 {post.comments.length}</button>
                <button className={post.liked?"liked":""} onClick={()=>like(post.id)}>❤️ {post.likes}</button>
                <button onClick={()=>navigator.share?.({title:"1Muslim",text:post.text,url:location.href})}>↗ Share</button>
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
  </main>;
}
