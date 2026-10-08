"use client";

import { useState } from "react";

export default function ShareLiveButton({ streamId, title, compact = false }: { streamId: string; title?: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const url = () => new URL("/streaming/live/" + encodeURIComponent(streamId), window.location.origin).toString();
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setMessage("Link copied!");
    } catch {
      // Older browsers and restricted clipboard contexts: show a selectable link.
      window.prompt("Copy this live link:", url());
      setMessage("Copy the link above to share.");
    }
    window.setTimeout(() => setMessage(""), 3500);
  };
  const share = async () => {
    const link = url();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title || "Watch live on 1Muslim", text: "Join this live on 1Muslim!", url: link });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <button type="button" onClick={() => void share()} aria-label="Share live using device apps" style={{border:"1px solid rgba(255,255,255,.24)",background:"rgba(0,0,0,.74)",color:"#fff",borderRadius:999,padding:compact?"7px 10px":"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>↗ Share</button>
      <button type="button" onClick={() => void copyLink()} aria-label="Copy live link" style={{border:"1px solid rgba(255,255,255,.24)",background:"rgba(0,0,0,.74)",color:"#fff",borderRadius:999,padding:compact?"7px 10px":"8px 11px",fontSize:11,fontWeight:800,cursor:"pointer"}}>🔗 Copy Link</button>
      {message && <span role="status" style={{fontSize:11,color:"#d6e7b8",background:"rgba(0,0,0,.7)",borderRadius:8,padding:"5px 7px"}}>{message}</span>}
    </span>
  );
}
