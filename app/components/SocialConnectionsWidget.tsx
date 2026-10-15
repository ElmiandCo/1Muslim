"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = { displayName: string; username: string; avatarUrl: string };
export default function SocialConnectionsWidget() {
  const [tiktok, setTiktok] = useState<{ connected: boolean; profile?: Profile | null; profileUnavailable?: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/tiktok/status", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (active) setTiktok(data || { connected: false }); })
      .catch(() => { if (active) setTiktok({ connected: false }); });
    return () => { active = false; };
  }, []);
  const services = [
    { name: "TikTok", symbol: "♪", connected: !!tiktok?.connected, profile: tiktok?.profile, href: "/tiktok", action: "Connect TikTok", note: "TikTok Login Kit · Authorized profile" },
    { name: "YouTube", symbol: "▶", connected: false, profile: null, href: "/settings", action: "YouTube setup", note: "Account connection coming soon" },
    { name: "LinkedIn", symbol: "in", connected: false, profile: null, href: "/settings", action: "LinkedIn setup", note: "Account connection coming soon" },
  ];
  return <section aria-label="Social account connections" className="socialConnectShell">
    <div className="socialConnectHead"><span>✦ CONNECT YOUR WORLD</span><small>Social connections</small></div>
    <div className="socialConnectGrid">{services.map(service => <article key={service.name} className={`socialConnectCard ${service.connected ? "isConnected" : ""}`}>
      <div className="socialConnectTitle"><span className="socialConnectIcon">{service.symbol}</span><strong>{service.name}</strong><span className="socialConnectState">{service.connected ? "✓ Connected" : "Not connected"}</span></div>
      {service.connected && <div className="socialConnectProfile">
        {service.profile?.avatarUrl ? <img src={service.profile.avatarUrl} alt={service.name + " profile"} referrerPolicy="no-referrer" /> : <span className="socialConnectAvatar">{service.symbol}</span>}
        <div><b>{service.profile?.displayName || "TikTok account linked"}</b>{service.profile?.username && <small>@{service.profile.username}</small>}<small>{service.profile ? "Profile shared with permission" : "Profile details unavailable"}</small></div>
      </div>}
      {service.connected && <p className="socialConnectNote">{service.note}</p>}
      <Link href={service.href} className="socialConnectAction">{service.connected ? "View connection →" : service.action + " →"}</Link>
      {!service.connected && service.name !== "TikTok" && <small className="socialConnectSoon">Integration not enabled yet</small>}
    </article>)}</div>
    <style jsx>{`
      .socialConnectShell{margin:20px auto;max-width:1160px;padding:18px;border:1px solid #48675680;border-radius:25px;background:linear-gradient(125deg,#10231ed9,#111916dc);color:#edf7f1;backdrop-filter:blur(18px)}
      .socialConnectHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px;color:#b3e6cd;font-size:11px;letter-spacing:.12em}.socialConnectHead small{color:#a4b5aa;letter-spacing:normal}
      .socialConnectGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}
      .socialConnectCard{min-width:0;min-height:104px;display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:18px;border:1px solid #5b846a6b;background:#ffffff08;transition:padding .4s ease,box-shadow .4s ease,border-color .4s ease}
      .socialConnectCard.isConnected{padding:18px;border-color:#b5d6aa;box-shadow:0 0 30px #6bcb8b19;background:linear-gradient(140deg,#164332b5,#15211d)}
      .socialConnectTitle{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.socialConnectIcon{display:grid;place-items:center;width:29px;height:29px;border:1px solid #7b9b88;border-radius:10px;font-weight:900}.socialConnectTitle strong{font-size:14px}.socialConnectState{margin-left:auto;color:#a2c4b0;font-size:10px}
      .socialConnectProfile{display:flex;gap:12px;align-items:center;min-width:0}.socialConnectProfile img,.socialConnectAvatar{width:52px;height:52px;flex-shrink:0;border-radius:50%;object-fit:cover;border:1px solid #a9d4bc}.socialConnectAvatar{display:grid;place-items:center;font-size:24px}.socialConnectProfile div{min-width:0}.socialConnectProfile b{display:block;overflow-wrap:anywhere}.socialConnectProfile small{display:block;color:#a7c8b7;margin-top:3px;overflow-wrap:anywhere}
      .socialConnectNote{font-size:11px;color:#b0c6b9;margin:0}.socialConnectAction{color:#dbf8e7;text-decoration:none;font-size:12px;font-weight:800;align-self:flex-start}.socialConnectSoon{font-size:10px;color:#8fa79a}
      @media(max-width:700px){.socialConnectGrid{grid-template-columns:1fr}.socialConnectCard{min-height:75px}.socialConnectHead{font-size:10px}}
      @media(prefers-reduced-motion:reduce){.socialConnectCard{transition:none}}
    `}</style>
  </section>;
}
