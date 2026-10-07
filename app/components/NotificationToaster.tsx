"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

function hrefFor(n: Notification) {
  if (n.entity_type === "live_stream" && n.entity_id) return `/streaming/live/${n.entity_id}`;
  if (n.entity_type === "live_schedule" && n.entity_id) return "/streaming/scheduled";
  return "/notifications";
}

export default function NotificationToaster() {
  const [items, setItems] = useState<Notification[]>([]);
  const mountedAt = useRef(new Date().toISOString());
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const s = createClient();
    let alive = true;

    const poll = async () => {
      const { data: { user } } = await s.auth.getUser();
      if (!user || !alive) return;
      const { data } = await s.from("notifications")
        .select("id,type,title,body,entity_type,entity_id,created_at")
        .eq("recipient_id", user.id)
        .is("read_at", null)
        .gt("created_at", mountedAt.current)
        .order("created_at", { ascending: true })
        .limit(8);
      if (!alive || !data) return;
      const fresh = (data as Notification[]).filter(n => !seen.current.has(n.id));
      if (!fresh.length) return;
      fresh.forEach(n => seen.current.add(n.id));
      setItems(prev => [...prev, ...fresh].slice(-4));
      void Promise.all(fresh.map(n => s.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id).eq("recipient_id", user.id)));
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const timer = window.setTimeout(() => setItems(prev => prev.slice(1)), 3600);
    return () => window.clearTimeout(timer);
  }, [items]);

  if (!items.length) return null;

  return <div className="oneMuslimToasts" aria-live="polite" aria-atomic="false">
    {items.map(item => <Link key={item.id} href={hrefFor(item)} className="oneMuslimToast" onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))}>
      <span className="toastIcon">{item.type.startsWith("live") ? "🔴" : "🔔"}</span>
      <span className="toastCopy"><strong>{item.title}</strong><small>{item.body}</small></span>
      <button type="button" className="toastClose" aria-label="Dismiss" onClick={e => { e.preventDefault(); e.stopPropagation(); setItems(prev => prev.filter(x => x.id !== item.id)); }}>×</button>
    </Link>)}
    <style jsx global>{`
      .oneMuslimToasts{position:fixed;z-index:9999;top:14px;left:50%;transform:translateX(-50%);width:min(430px,calc(100vw - 24px));display:grid;gap:8px;pointer-events:none}
      .oneMuslimToast{pointer-events:auto;display:flex;align-items:center;gap:11px;padding:12px 13px;border:1px solid rgba(188,218,191,.28);border-radius:17px;background:rgba(13,20,15,.94);box-shadow:0 18px 50px rgba(0,0,0,.35),0 2px 12px rgba(0,0,0,.2);backdrop-filter:blur(18px);color:#edf5ee;text-decoration:none;animation:oneMuslimToastIn .32s cubic-bezier(.2,.8,.2,1)}
      .toastIcon{width:32px;height:32px;display:grid;place-items:center;border-radius:11px;background:rgba(219,233,196,.1);font-size:15px;flex:0 0 auto}
      .toastCopy{min-width:0;display:grid;gap:3px;flex:1}.toastCopy strong{font-size:11px}.toastCopy small{font-size:10px;line-height:1.35;color:#aebdb2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .toastClose{border:0;background:transparent;color:#849187;font-size:18px;cursor:pointer;padding:2px 4px}
      @keyframes oneMuslimToastIn{from{opacity:0;transform:translateY(-18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:600px){.oneMuslimToasts{top:8px}}
    `}</style>
  </div>;
}
