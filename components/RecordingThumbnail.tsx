"use client";

type RecordingThumbnailProps = {
  title: string;
  hostName: string;
  date: string;
  durationSeconds: number;
  photoUrl?: string | null;
  customThumbnailUrl?: string | null;
  compact?: boolean;
  gender?: string | null;
};

function duration(seconds:number){
  const safe=Math.max(0,Math.round(seconds||0));
  const h=Math.floor(safe/3600);
  const m=Math.floor((safe%3600)/60);
  const s=safe%60;
  return h ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
}

export default function RecordingThumbnail({title,hostName,date,durationSeconds,photoUrl,customThumbnailUrl,compact=false,gender}:RecordingThumbnailProps){
  const defaultAvatar = gender?.toLowerCase() === "female" ? "/assets/avatars/default-female.jpg" : "/assets/avatars/default-male.jpg";
  const photo=customThumbnailUrl||photoUrl||defaultAvatar;
  const initials=hostName.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()||"1M";
  return <div className={compact ? "recordingThumb compact" : "recordingThumb"}>
    <style jsx>{`
      .recordingThumb{position:relative;width:100%;height:100%;min-height:190px;overflow:hidden;background:radial-gradient(circle at 72% 25%,#17604b 0,#071b12 30%,#020604 72%);color:#fff}
      .recordingThumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.95)}
      .fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:76px;font-weight:950;color:#e6c765;text-shadow:0 0 30px rgba(61,255,221,.45)}
      .recordingThumb:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08) 8%,rgba(0,0,0,.2) 38%,rgba(0,0,0,.9) 100%)}
      .compact{min-height:155px}
      .brand{position:absolute;z-index:2;top:10px;left:10px;font-size:8px;letter-spacing:.18em;font-weight:900;padding:6px 8px;border:1px solid rgba(214,231,184,.35);border-radius:999px;background:rgba(3,8,5,.6);backdrop-filter:blur(8px)}
      .live{color:#fff;margin-left:5px}.dot{color:#ff4352}
      .info{position:absolute;z-index:2;left:12px;right:12px;bottom:11px}
      .title{font-size:clamp(14px,2vw,20px);line-height:1.08;font-weight:900;letter-spacing:-.025em;text-shadow:0 2px 10px rgba(0,0,0,.65);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .host{margin-top:6px;font-size:10px;font-weight:800;color:#e8eee9}
      .meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:5px;font-size:8px;color:#c7d1ca}
      .pill{padding:4px 6px;border-radius:6px;background:rgba(0,0,0,.48);border:1px solid rgba(255,255,255,.12)}
      .length{position:absolute;z-index:3;right:9px;bottom:9px;background:rgba(0,0,0,.78);padding:5px 7px;border-radius:6px;font-size:8px;font-weight:850}
      .compact .info{left:10px;right:10px;bottom:9px}.compact .title{font-size:13px}.compact .host{font-size:9px}.compact .meta{font-size:7px}
    `}</style>
    {photo ? <img src={photo} alt="" /> : <div className="fallback">{initials}</div>}
    <div className="brand">1MUSLIM <span className="live"><span className="dot">●</span> LIVE</span></div>
    <div className="info"><div className="title">{title}</div><div className="host">{hostName}</div><div className="meta"><span className="pill">{date}</span></div></div>
    <span className="length">{duration(durationSeconds)}</span>
  </div>;
}
