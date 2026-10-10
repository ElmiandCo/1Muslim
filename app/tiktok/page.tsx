"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";

const awards = [
  { icon: "✦", image: "/assets/badges/1Muslim-TikTok-badge.PNG", title: "Badge of Connection", detail: "Your TikTok connection achievement" },
  { icon: "⚡", image: "", title: "+15,000 XP", detail: "Awarded once after verified connection" },
  { icon: "◈", image: "/assets/avatars/silver-avatar-male.jpg", title: "Silver Avatar", detail: "A silver profile avatar finish to equip" },
  { icon: "◉", image: "", title: "Ashab Updates", detail: "Share eligible live and post activity with your circle" },
];

export default function TikTokConnectionPage() {
  const [showAwards, setShowAwards] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [topic, setTopic] = useState("Your topics");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/tiktok/status", {cache:"no-store"}).then(r=>r.json()).then(x=>{setConnected(!!x.connected);if(new URLSearchParams(location.search).get("connected")==="1"&&x.connected){setCelebrate(true);setShowAwards(true);window.history.replaceState(null,"",location.pathname);setTimeout(()=>{setShowAwards(false);setCelebrate(false)},5800)}}).catch(()=>{}); },[]);
  const disconnect = async () => {if(!confirm("Disconnect TikTok and remove your Connected badge?"))return;setBusy(true);try{const r=await fetch("/api/tiktok/disconnect",{method:"POST"});if(!r.ok)throw Error();setConnected(false);setShowAwards(false);setCelebrate(false)}catch{alert("Disconnect failed. Try again.")}finally{setBusy(false)}};
  return <main className="ttPage">
    <SiteNav />
    <section className="ttShell">
      <div className="ttTop"><span>✦ 1MUSLIM × TIKTOK</span><Link href="/settings">Settings ↗</Link></div>
      <div className="ttHero">
        <div className="ttGlow" aria-hidden="true" />
        <span className="ttPill">{connected ? "✦ TIKTOK CONNECTED • BADGE ACTIVE" : "✦ CONNECT YOUR TIKTOK"}</span>
        <h1>Your videos.<br/><em>Your community.</em><br/>One home.</h1>
        <p>Bring your TikTok identity into 1Muslim. Follow your favorite creators, discover meaningful conversations and keep your Ashab close.</p>
        <div className="ttActions">{connected ? <><button onClick={() => setShowAwards(true)}>✦ View Connected Badge</button><button disabled={busy} onClick={disconnect}>{busy?"Disconnecting…":"Disconnect TikTok"}</button></> : <a className="ttConnect" href="/api/tiktok/connect">♪ Connect with TikTok ↗</a>}<span>{connected?"Connected badge active":"Secure TikTok authorization"}</span></div>
      </div>
      <div className="ttGrid">
        <section className="ttPanel ttPreview">
          <span className="ttLabel">YOUR CONNECTED FEED · PREVIEW</span>
          <div className="ttVideo"><div className="ttPlay">▶</div><span>Creator videos will appear here when authorized</span></div>
          <div className="ttFeedFoot"><b>For You · Following · Ashab</b><span>♡ &nbsp; ◇ &nbsp; ↗</span></div>
        </section>
        <section className="ttPanel ttHudhud">
          <div className="ttBird"><img src="/assets/hudhud-logo.PNG" alt="HudHud" /></div><span className="ttLabel">HUDHUD EXPLAINS</span>
          <h2>We’re building the bridge.</h2>
          <p>“We’re working on pulling your stream from TikTok directly. For now, your Ashab and friends will be able to know when you go live on TikTok or share posts about topics you care about, as soon as the required permissions and activity detection are available.”</p>
          <label htmlFor="ttTopic">Example topic category</label>
          <select id="ttTopic" value={topic} onChange={e => setTopic(e.target.value)}>
            <option>Your topics</option><option>Qur’an & Reflection</option><option>Learning & Tajwīd</option><option>Community Conversations</option><option>Daily Reminders</option>
          </select>
          <div className="ttNotice"><span>◉ LIVE / POST UPDATE PREVIEW</span><strong>Your Ashab will see your {topic === "Your topics" ? "relevant topics" : topic} updates here.</strong><small>Automatic categories require authorized TikTok data. No live monitoring is active yet.</small></div>
        </section>
      </div>
      <section className="ttRewards"><div><span className="ttLabel">THE CONNECTION COLLECTION</span><h2>Connect. Earn. Shine silver.</h2><p>Your Connected badge is active only while TikTok is connected. Disconnect to remove it; reconnect to restore it.</p></div><button onClick={() => setShowAwards(true)}>View all awards →</button></section>
    </section>
    {showAwards && <div className="ttOverlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowAwards(false); }}><section className="ttModal" role="dialog" aria-modal="true" aria-labelledby="ttAwardTitle">
      <button className="ttClose" aria-label="Close awards" onClick={() => setShowAwards(false)}>✕</button>
      <div className={celebrate ? "ttPrizeSpin" : "ttMedal"}><img src="/assets/badges/1Muslim-TikTok-badge.PNG" alt="1Muslim TikTok Badge of Connection" /></div><span className="ttLabel">{celebrate ? "✦ BADGE AWARDED ✦" : "CONNECTED BADGE"}</span>
      <h2 id="ttAwardTitle">{celebrate ? "TikTok Connected! ✨" : "The Badge of Connection"}</h2><p>Your Connected badge represents an active TikTok connection. Other rewards shown below are previews.</p>
      <div className="ttAwardList">{awards.map(a => <div key={a.title}><span>{a.image?<img src={a.image} alt="" className="ttAwardIcon" />:a.icon}</span><div><strong>{a.title}</strong><small>{a.detail}</small></div></div>)}</div>
      <div className="ttSilver"><div className="ttAvatar"><img src="/assets/avatars/silver-avatar-male.jpg" alt="Silver profile avatar preview" /></div><div><b>SILVER PROFILE AVATAR</b><small>Metallic silver edition · unlockable and equipable after verification</small></div></div>
      <button className="ttDone" onClick={() => setShowAwards(false)}>Close</button>
    </section></div>}
    <style jsx>{`
      .ttConnect{display:inline-flex;align-items:center;padding:14px 22px;border-radius:999px;background:linear-gradient(90deg,#d5f1e5,#b9afff);color:#10221b;font-weight:900;text-decoration:none;box-shadow:0 0 35px #76e8c044}.ttPage{min-height:100vh;background:#080c0b;color:#f0f5f1}.ttShell{max-width:1120px;margin:auto;padding:32px 18px 100px}.ttTop{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.16em;color:#a9c7b8}.ttTop a{color:#c5d6ce;text-decoration:none}.ttHero{position:relative;overflow:hidden;border:1px solid #2a4b42;border-radius:32px;padding:72px 6%;margin:24px 0;background:linear-gradient(135deg,#132b27,#0a1010 65%,#161c21)}.ttGlow{position:absolute;right:-80px;top:-130px;width:470px;height:470px;border-radius:50%;background:radial-gradient(circle,#76e8c044,transparent 65%);pointer-events:none}.ttPill,.ttLabel{font-size:10px;letter-spacing:.18em;color:#9fd9c5;font-weight:800}.ttHero h1{position:relative;font-size:clamp(42px,7vw,84px);line-height:1.04;letter-spacing:-.06em;margin:24px 0}.ttHero em{font-style:normal;background:linear-gradient(90deg,#d2f6e8,#a4b3c7);background-clip:text;-webkit-text-fill-color:transparent}.ttHero p{max-width:510px;color:#a7b9b1;line-height:1.8}.ttActions{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:28px}.ttActions button,.ttRewards button,.ttDone{background:#d5f1e5;color:#10221b;border:0;border-radius:999px;padding:14px 22px;font-weight:800;cursor:pointer}.ttActions span{color:#8fa49a;font-size:12px}.ttGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.ttPanel{border:1px solid #26372f;background:#101816;border-radius:25px;padding:25px}.ttVideo{margin-top:20px;min-height:320px;border-radius:20px;background:radial-gradient(circle at 50% 40%,#305b4c,#101d1b 60%,#080c0b);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;color:#a3bcb1;font-size:12px;padding:20px}.ttPlay{display:grid;place-items:center;border:1px solid #9ec8b1;width:65px;height:65px;border-radius:50%;font-size:24px}.ttFeedFoot{display:flex;justify-content:space-between;gap:10px;padding-top:18px;color:#a7c8b7;font-size:12px}.ttBird{width:60px;height:60px;margin-bottom:14px}.ttBird img{width:100%;height:100%;object-fit:contain}.ttHudhud h2{font-size:32px;letter-spacing:-.04em}.ttHudhud p{color:#aebeb6;line-height:1.8;font-size:14px}.ttHudhud label{display:block;color:#a6c6b5;font-size:12px;margin:22px 0 8px}.ttHudhud select{width:100%;background:#1d2a26;color:white;border:1px solid #40594d;border-radius:12px;padding:13px}.ttNotice{display:flex;flex-direction:column;gap:9px;background:#17251f;border:1px solid #3a5649;border-radius:16px;margin-top:18px;padding:18px}.ttNotice span{font-size:10px;color:#a3d9bc}.ttNotice small{color:#a4b8ad;line-height:1.6}.ttRewards{display:flex;justify-content:space-between;align-items:center;gap:24px;border:1px solid #526b63;border-radius:24px;padding:28px;margin-top:18px;background:linear-gradient(120deg,#182b27,#22282b)}.ttRewards h2{font-size:28px;margin:9px 0}.ttRewards p{color:#a5b8ae}.ttOverlay{position:fixed;inset:0;background:#04050b44;z-index:9999;display:grid;place-items:center;padding:16px;backdrop-filter:blur(2px)}.ttModal{width:min(100%,520px);max-height:90vh;overflow:auto;position:relative;background:linear-gradient(155deg,#23312e,#101817 55%,#242b2c);border:1px solid #82958d;border-radius:30px;padding:32px;box-shadow:0 30px 100px #000}.ttClose{position:absolute;right:20px;top:18px;border:0;background:#ffffff16;color:white;border-radius:50%;height:35px;width:35px;cursor:pointer}.ttMedal{display:grid;place-items:center;width:112px;height:112px;margin:0 auto 20px;border-radius:50%;background:radial-gradient(circle,#b6d1cf33,transparent 75%);filter:drop-shadow(0 0 22px #b6d1cf66)}.ttPrizeSpin{display:grid;place-items:center;width:160px;height:160px;margin:0 auto 20px;animation:ttPrize 5.3s cubic-bezier(.14,.8,.3,1) both;filter:drop-shadow(0 0 38px #86ffe8)}.ttPrizeSpin img{width:100%;height:100%;object-fit:contain}.ttMedal img{width:100%;height:100%;object-fit:contain}.ttModal>.ttLabel{display:block;text-align:center}.ttModal h2{text-align:center;font-size:30px;margin:10px 0}.ttModal>p{text-align:center;color:#b2c1bb;line-height:1.6}.ttAwardList{display:grid;gap:9px;margin:23px 0}.ttAwardList>div{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid #445850;border-radius:14px;background:#ffffff0b}.ttAwardList>div>span{font-size:25px;width:34px;text-align:center;color:#dbe6e9}.ttAwardIcon{width:36px;height:36px;object-fit:contain;border-radius:50%}.ttAwardList strong,.ttAwardList small,.ttSilver b,.ttSilver small{display:block}.ttAwardList small,.ttSilver small{color:#aebeb7;font-size:11px;margin-top:4px}.ttSilver{display:flex;gap:16px;align-items:center;padding:16px;border-radius:18px;background:linear-gradient(120deg,#778b92,#3d5156,#a3b4b7);color:white}.ttSilver small{color:#e4e9e9}.ttAvatar{width:74px;height:74px;border-radius:50%;border:3px solid #e0e7e9;overflow:hidden;flex-shrink:0;background:#34484e}.ttAvatar img{width:100%;height:100%;object-fit:cover}@keyframes ttPrize{0%{opacity:0;transform:translateY(90px) scale(.25) rotateY(0)}15%{opacity:1}35%{transform:translateY(-25px) scale(1.25) rotateY(900deg)}65%{transform:translateY(0) scale(1.1) rotateY(1600deg)}100%{transform:translateY(0) scale(1) rotateY(1800deg)}}@media(prefers-reduced-motion:reduce){.ttPrizeSpin{animation:none}}.ttDone{width:100%;margin-top:20px}@media(max-width:720px){.ttGrid{grid-template-columns:1fr}.ttHero{padding:44px 25px}.ttRewards{flex-direction:column;align-items:flex-start}.ttModal{padding:24px}}
    `}</style>
  </main>;
}
