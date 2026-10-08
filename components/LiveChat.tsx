"use client";

import { createClient } from "../utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ProfileAvatar from "../app/components/ProfileAvatar";

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  gender?: string | null;
  avatar_gender?: string | null;
  avatar_package?: string | null;
  avatar_config?: Record<string, unknown> | null;
  profile_accent?: string | null;
};
type Message = {
  id: string;
  stream_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  profile?: Profile | null;
};

export default function LiveChat({ streamId, hostId, overlay = false }: { streamId: string; hostId: string; overlay?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: rows }, { data: mutes }] = await Promise.all([
      supabase.from("live_chat_messages").select("id,stream_id,sender_id,body,created_at").eq("stream_id", streamId).order("created_at", { ascending: true }).limit(200),
      supabase.from("live_chat_mutes").select("user_id").eq("stream_id", streamId),
    ]);

    const ids = Array.from(new Set((rows ?? []).map((row) => row.sender_id)));
    let profiles: Record<string, Profile> = {};
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_package,avatar_config,profile_accent").in("id", ids);
      profiles = Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
    }

    setMessages((rows ?? []).map((row) => ({ ...row, profile: profiles[row.sender_id] ?? null })));
    setMutedUsers(new Set((mutes ?? []).map((mute) => mute.user_id)));
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel("live-chat-" + streamId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: "stream_id=eq." + streamId }, async (payload) => {
        const row = payload.new as Message;
        const { data: profile } = await supabase.from("profiles").select("id,display_name,username,gender,avatar_gender,avatar_package,avatar_config,profile_accent").eq("id", row.sender_id).maybeSingle();
        const typedProfile = profile as Profile | null;
        setMessages((current) => current.some((item) => item.id === row.id) ? current : [...current, { ...row, profile: typedProfile }]);
      }).subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [streamId, supabase]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !userId || sending || userId !== hostId && mutedUsers.has(userId)) return;
    setSending(true); setNotice("");
    const { error } = await supabase.from("live_chat_messages").insert({ stream_id: streamId, sender_id: userId, body });
    if (error) setNotice(error.message.includes("live_chat_messages") ? "You cannot comment in this Live right now." : error.message);
    else setDraft("");
    setSending(false);
  };

  const toggleMute = async (targetUserId: string) => {
    if (userId !== hostId || targetUserId === hostId) return;
    setNotice("");
    if (mutedUsers.has(targetUserId)) {
      const { error } = await supabase.from("live_chat_mutes").delete().eq("stream_id", streamId).eq("user_id", targetUserId);
      if (!error) setMutedUsers((current) => { const next = new Set(current); next.delete(targetUserId); return next; });
      else setNotice(error.message);
    } else {
      const { error } = await supabase.from("live_chat_mutes").insert({ stream_id: streamId, user_id: targetUserId, muted_by: userId });
      if (!error) setMutedUsers((current) => new Set(current).add(targetUserId));
      else setNotice(error.message);
    }
  };

  const displayName = (message: Message) => message.sender_id === hostId
    ? (message.profile?.display_name || message.profile?.username || "Host")
    : (message.profile?.display_name || message.profile?.username || "Muslim");
  const selfMuted = !!userId && userId !== hostId && mutedUsers.has(userId);

  return (
    <div className={`liveChat${overlay ? " chatOverlay" : ""}`}>
      <style jsx>{`
        .liveChat{display:flex;flex-direction:column;min-height:300px;background:#080d09}.chatOverlay{min-height:0;height:100%;background:transparent;color:white}.chatOverlay .chatHead{background:rgba(0,0,0,.35);border:0;border-radius:12px;padding:8px 12px}.chatOverlay .messages{min-height:0;max-height:none;overflow-y:auto;overscroll-behavior:contain;mask-image:linear-gradient(to bottom,transparent,black 18%);padding:20px 8px 8px}.chatOverlay .message{background:rgba(0,0,0,.66);border-radius:12px;padding:7px 9px;backdrop-filter:blur(8px);align-items:center}.chatOverlay .name{color:#fff}.chatOverlay .body{color:#f1f1f1}.chatOverlay .composer{border:0;padding:8px 0}.chatOverlay .composer input{background:rgba(0,0,0,.78)}
        .chatHead{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #1b241f}.chatHead strong{font-size:13px}.chatHead span{font-size:9px;color:#66736b}
        .messages{flex:1;max-height:360px;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:9px}.message{display:flex;gap:7px;align-items:flex-start}.avatar{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;overflow:hidden;border-radius:50%}.avatar :global(.profileAvatar){width:30px!important;height:30px!important;max-width:30px;max-height:30px;transform:none!important}.avatar :global(.profileAvatar img){width:100%;height:100%;object-fit:cover}.bubble{min-width:0;flex:1;overflow-wrap:anywhere}.bubble{min-width:0;flex:1}.name{font-size:10px;font-weight:800;color:#dce7de}.host{margin-left:5px;padding:2px 5px;border-radius:999px;background:#d6e7b8;color:#071008;font-size:7px;vertical-align:middle}.muted{margin-left:5px;color:#7c8780;font-size:8px}.body{font-size:11px;color:#aeb9b1;line-height:1.45;word-break:break-word}.muteBtn{margin-left:auto;border:1px solid #29352d;background:#0f1511;color:#8d9b91;border-radius:999px;padding:4px 7px;font-size:8px;cursor:pointer}.muteBtn:hover{color:#fff;border-color:#50624f}
        .composer{display:flex;gap:7px;padding:12px;border-top:1px solid #1b241f}.composer input{flex:1;min-width:0;border:1px solid #263029;background:#0d140f;color:#fff;border-radius:999px;padding:10px 12px;outline:none;font-size:11px}.composer button{border:0;border-radius:999px;padding:0 14px;background:#d6e9b8;color:#071008;font-weight:850;font-size:10px;cursor:pointer}.composer button:disabled{opacity:.45;cursor:not-allowed}.mutedNotice,.notice{margin:10px 12px;padding:9px 11px;border-radius:10px;font-size:9px}.mutedNotice{background:#1b1510;border:1px solid #4a3927;color:#d7bd9c}.notice{background:#1b0f10;border:1px solid #533536;color:#ffcaca}
      `}</style>
      {!overlay && <div className="chatHead"><strong>💬 Live chat</strong><span>{messages.length} messages</span></div>}
      <div className="messages">
        {messages.length ? messages.map((message) => {
          const isHost = message.sender_id === hostId;
          const isMuted = mutedUsers.has(message.sender_id);
          const avatar = <ProfileAvatar name={displayName(message)} gender={message.profile?.gender} avatarGender={message.profile?.avatar_gender} avatarPackage={message.profile?.avatar_package} avatarConfig={message.profile?.avatar_config} accent={message.profile?.profile_accent ?? "emerald"} size="sm" profileId={message.sender_id} />;
          return <div className="message" key={message.id}>
            <div className="avatar">{avatar}</div>
            <div className="bubble">
              <div className="name">{displayName(message)}{isHost && <span className="host">HOST</span>}{isMuted && !isHost && <span className="muted">muted</span>}</div>
              <div className="body">{message.body}</div>
            </div>
            {userId === hostId && !isHost && <button className="muteBtn" onClick={() => void toggleMute(message.sender_id)}>{isMuted ? "Unmute" : "Mute"}</button>}
          </div>;
        }) : <div style={{color:"#66736b",fontSize:10,padding:10}}>Be the first to say something.</div>}
      </div>
      {notice && <div className="notice">{notice}</div>}
      {selfMuted && <div className="mutedNotice">The host has muted you. You can still watch the Live.</div>}
      <form className="composer" onSubmit={send}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder={selfMuted ? "You are muted" : userId ? (userId === hostId ? "Comment as host…" : "Say something…") : "Sign in to comment"} disabled={!userId || selfMuted || sending} />
        <button type="submit" disabled={!userId || selfMuted || !draft.trim() || sending}>{sending ? "…" : "Send"}</button>
      </form>
    </div>
  );
}