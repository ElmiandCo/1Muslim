"use client";

import { createClient } from "../utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Comment = { id:string; user_id:string; body:string; created_at:string; display_name:string };

export default function RecordingComments({ recordingId }: { recordingId:string }) {
  const supabase = useMemo(() => createClient(), []);
  const [comments,setComments] = useState<Comment[]>([]);
  const [userId,setUserId] = useState<string|null>(null);
  const [draft,setDraft] = useState("");
  const [sending,setSending] = useState(false);
  const [notice,setNotice] = useState("");

  const load = async () => {
    const [{ data:userData }, { data:rows, error }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("live_recording_comments").select("id,user_id,body,created_at").eq("recording_id",recordingId).order("created_at",{ascending:true}).limit(300),
    ]);
    setUserId(userData.user?.id ?? null);
    if (error) { setNotice(error.message); return; }
    const ids=Array.from(new Set((rows??[]).map(row=>row.user_id)));
    let profiles:Record<string,{display_name:string|null;username:string|null}>={};
    if(ids.length){
      const {data}=await supabase.from("profiles").select("id,display_name,username").in("id",ids);
      profiles=Object.fromEntries((data??[]).map(p=>[p.id,p]));
    }
    setComments((rows??[]).map(row=>({
      ...row,
      display_name:profiles[row.user_id]?.display_name || profiles[row.user_id]?.username || "Muslim",
    })));
  };

  useEffect(()=>{
    void load();
    const channel=supabase.channel("recording-comments-"+recordingId).on("postgres_changes",{event:"INSERT",schema:"public",table:"live_recording_comments",filter:"recording_id=eq."+recordingId},async payload=>{
      const row=payload.new as {id:string;user_id:string;body:string;created_at:string};
      if(comments.some(item=>item.id===row.id)) return;
      const {data:profile}=await supabase.from("profiles").select("display_name,username").eq("id",row.user_id).maybeSingle();
      setComments(current=>current.some(item=>item.id===row.id)?current:[...current,{...row,display_name:profile?.display_name||profile?.username||"Muslim"}]);
    }).subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[recordingId,supabase]);

  const send=async(e:FormEvent)=>{
    e.preventDefault();
    const body=draft.trim();
    if(!body||!userId||sending)return;
    setSending(true);setNotice("");
    const {error}=await supabase.from("live_recording_comments").insert({recording_id:recordingId,user_id:userId,body});
    if(error)setNotice(error.message);else setDraft("");
    setSending(false);
  };

  return <section className="recordingComments">
    <style jsx>{`
      .recordingComments{border:1px solid #1b241f;border-radius:18px;background:#0a100c;overflow:hidden}
      .head{padding:14px 16px;border-bottom:1px solid #1b241f;display:flex;justify-content:space-between;align-items:center}.head strong{font-size:13px}.head span{font-size:9px;color:#68756d}
      .list{max-height:360px;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:12px}.item{display:flex;gap:9px}.avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#172119;border:1px solid #334038;color:#c4d7bc;font-size:10px;flex:none}.name{font-size:10px;font-weight:800;color:#dce7de}.body{font-size:11px;color:#aeb9b1;line-height:1.5;margin-top:2px}.time{font-size:8px;color:#66736b;margin-left:6px;font-weight:400}.empty{padding:20px;color:#66736b;font-size:10px}
      .notice{margin:0 12px 10px;padding:9px 11px;border-radius:10px;background:#1b0f10;border:1px solid #533536;color:#ffcaca;font-size:9px}
      .composer{display:flex;gap:7px;padding:12px;border-top:1px solid #1b241f}.composer input{flex:1;min-width:0;border:1px solid #263029;background:#0d140f;color:#fff;border-radius:999px;padding:10px 12px;outline:0;font-size:11px}.composer button{border:0;border-radius:999px;padding:0 14px;background:#d6e7b8;color:#071008;font-weight:850;font-size:10px}.composer button:disabled{opacity:.45}
    `}</style>
    <div className="head"><strong>💬 Comments</strong><span>{comments.length} comments</span></div>
    <div className="list">{comments.length?comments.map(comment=><div className="item" key={comment.id}><div className="avatar">{comment.display_name.slice(0,1).toUpperCase()}</div><div><div className="name">{comment.display_name}<span className="time">{new Date(comment.created_at).toLocaleString()}</span></div><div className="body">{comment.body}</div></div></div>):<div className="empty">Be the first to comment on this recorded Live.</div>}</div>
    {notice&&<div className="notice">{notice}</div>}
    <form className="composer" onSubmit={send}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} placeholder={userId?"Comment on this Live…":"Sign in to comment"} disabled={!userId||sending}/><button type="submit" disabled={!userId||!draft.trim()||sending}>{sending?"…":"Send"}</button></form>
  </section>;
}