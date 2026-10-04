"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Video = {
  id: string;
  title: string;
  creator: string;
  category: string;
  duration: string;
  description: string;
  accent: string;
  src: string;
  live?: boolean;
};

const videos: Video[] = [
  {
    id: "quran-01",
    title: "Surah Al-Ikhlas — A Short Reflection",
    creator: "1Muslim",
    category: "Qur'an",
    duration: "08:24",
    description: "A calm introduction to Surah Al-Ikhlas and the meaning of Allah's oneness.",
    accent: "☾",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
  {
    id: "new-muslim-01",
    title: "Where Do I Start?",
    creator: "1Muslim Learning",
    category: "New Muslim",
    duration: "14:12",
    description: "A welcoming first lesson for someone discovering Islam or beginning again.",
    accent: "✦",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
  {
    id: "prayer-01",
    title: "Salah: Standing, Bowing & Sujood",
    creator: "Prayer Academy",
    category: "Prayer",
    duration: "11:40",
    description: "A visual walkthrough of the core movements of salah.",
    accent: "⌁",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
  {
    id: "seerah-01",
    title: "The Life of Muhammad ﷺ — The Beginning",
    creator: "1Muslim Seerah",
    category: "Seerah",
    duration: "22:08",
    description: "Start the Seerah with historical context and a careful timeline.",
    accent: "◇",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
  {
    id: "tawhid-01",
    title: "Why One God?",
    creator: "1Muslim Foundations",
    category: "Tawhid",
    duration: "18:31",
    description: "An accessible introduction to Tawhid and worship belonging to Allah alone.",
    accent: "1",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
  {
    id: "community-01",
    title: "Ask 1Muslim: Faith, Doubt & Honest Questions",
    creator: "1Muslim Community",
    category: "Community",
    duration: "31:05",
    description: "A community conversation about asking difficult questions without shame.",
    accent: "◎",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
  },
];

const categories = ["All", "Qur'an", "New Muslim", "Prayer", "Seerah", "Tawhid", "Community"];

export default function StreamingPage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((video) => {
      const categoryMatch = category === "All" || video.category === category;
      const queryMatch = !q || [video.title, video.creator, video.category, video.description].join(" ").toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  return (
    <main className="streamingPage">
      <style jsx>{`
        .streamingPage{min-height:100vh;background:#050806;color:#f2f6f2}
        .streamTop{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:16px max(22px,calc((100vw - 1180px)/2));border-bottom:1px solid #1b241f;background:rgba(5,8,6,.9);backdrop-filter:blur(18px)}
        .brand{display:flex;align-items:center;gap:10px;font-weight:850;letter-spacing:-.04em}
        .mark{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;border:1px solid #354237;background:#101811;color:#d6e7b8}
        .back{color:#9aa69e;text-decoration:none;font-size:13px}.back:hover{color:#fff}
        .topLinks{display:flex;gap:9px;align-items:center}.topLink{padding:9px 13px;border:1px solid #263029;border-radius:999px;color:#aeb8b1;text-decoration:none;font-size:12px}.topLink.active{background:#d6e7b8;color:#071008;border-color:#d6e7b8;font-weight:800}
        .shell{max-width:1180px;margin:auto;padding:38px 22px 80px}
        .hero{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;align-items:stretch}
        .heroMain,.heroSide{border:1px solid #1b241f;border-radius:24px;background:linear-gradient(145deg,#101712,#080d09);padding:30px;overflow:hidden}
        .heroMain{position:relative;min-height:285px}.heroMain:after{content:"";position:absolute;width:330px;height:330px;border-radius:50%;right:-110px;top:-150px;background:radial-gradient(circle,rgba(145,180,125,.18),transparent 68%);pointer-events:none}
        .eyebrow{font-size:10px;letter-spacing:.15em;color:#829b87;font-weight:850}.hero h1{font-size:48px;line-height:1;letter-spacing:-.065em;margin:12px 0}.hero p{max-width:650px;color:#9ba69f;line-height:1.65;font-size:14px}
        .stats{display:flex;gap:20px;margin-top:25px}.stat strong{display:block;font-size:19px}.stat span{font-size:10px;color:#6e7a72}
        .heroSide h3{font-size:18px;margin:7px 0}.heroSide p{font-size:11px;color:#7f8b83;line-height:1.6}.liveBadge{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a463d;border-radius:999px;font-size:10px;color:#cbd8ce}.dot{width:7px;height:7px;border-radius:50%;background:#b9d98e;box-shadow:0 0 12px #b9d98e}
        .controls{display:flex;gap:10px;align-items:center;margin:24px 0 16px}.search{flex:1;min-width:160px;background:#0b110d;border:1px solid #1b241f;border-radius:999px;padding:11px 15px;color:#fff;outline:0;font-size:12px}.search:focus{border-color:#587052}
        .chips{display:flex;gap:7px;overflow:auto;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chip{border:1px solid #263029;background:#0b110d;color:#89958d;border-radius:999px;padding:9px 13px;font-size:10px;white-space:nowrap;cursor:pointer}.chip.active{background:#d6e7b8;border-color:#d6e7b8;color:#071008;font-weight:800}
        .sectionTitle{display:flex;justify-content:space-between;align-items:end;margin:27px 0 14px}.sectionTitle h2{font-size:21px;letter-spacing:-.04em;margin:5px 0}.count{font-size:10px;color:#66736a}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #1b241f;background:#0a100c;border-radius:18px;overflow:hidden;transition:.2s}.card:hover{transform:translateY(-2px);border-color:#344238}.thumb{height:155px;background:radial-gradient(circle at 70% 25%,rgba(214,231,184,.17),transparent 25%),linear-gradient(145deg,#172119,#070b08);display:flex;align-items:center;justify-content:center;position:relative}.thumbMark{font-size:50px;color:#b8ce9d;text-shadow:0 0 35px rgba(184,206,157,.25)}.duration{position:absolute;right:9px;bottom:9px;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:6px;font-size:9px}.cardBody{padding:14px}.meta{font-size:9px;color:#76917b;letter-spacing:.1em;text-transform:uppercase}.card h3{font-size:15px;line-height:1.25;margin:7px 0}.card p{font-size:10px;color:#7e8982;line-height:1.5;min-height:31px}.watch{width:100%;border:1px solid #2d3931;background:#101812;color:#dce8db;border-radius:10px;padding:9px;font-size:11px;font-weight:750;cursor:pointer}.watch:hover{background:#172219}
        .empty{border:1px dashed #263029;border-radius:18px;padding:40px;text-align:center;color:#738077}.empty strong{display:block;color:#cbd4cd;margin-bottom:6px}
        .playerOverlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);z-index:100;display:grid;place-items:center;padding:20px}.player{width:min(900px,100%);background:#080d09;border:1px solid #29352d;border-radius:20px;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.6)}.player video{display:block;width:100%;aspect-ratio:16/9;background:#000}.playerInfo{padding:17px;display:flex;justify-content:space-between;gap:15px}.playerInfo h3{margin:0 0 5px;font-size:16px}.playerInfo p{margin:0;color:#7e8982;font-size:10px}.close{border:1px solid #303b33;background:#0f1511;color:#fff;border-radius:999px;width:34px;height:34px;cursor:pointer}
        @media(max-width:900px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.topLinks .topLink:not(.active){display:none}.shell{padding:24px 15px 80px}.hero h1{font-size:39px}.heroMain,.heroSide{padding:22px}.controls{flex-direction:column;align-items:stretch}.grid{grid-template-columns:1fr}.thumb{height:185px}}
      `}</style>

      <header className="streamTop">
        <Link href="/" className="back">← Home</Link>
        <div className="brand"><span className="mark">1</span>1Muslim</div>
        <div className="topLinks"><Link href="/streaming" className="topLink active">Streaming</Link><Link href="/learn" className="topLink">Learn</Link></div>
      </header>

      <div className="shell">
        <section className="hero">
          <div className="heroMain">
            <span className="eyebrow">1MUSLIM STREAMING</span>
            <h1>Watch. Learn. Reflect.</h1>
            <p>A focused home for Qur'an, lessons, Seerah, prayer education, community conversations and live programming — built into the 1Muslim experience.</p>
            <div className="stats"><div className="stat"><strong>6</strong><span>FEATURED VIDEOS</span></div><div className="stat"><strong>7</strong><span>TOPICS</span></div><div className="stat"><strong>24/7</strong><span>LIBRARY ACCESS</span></div></div>
          </div>
          <div className="heroSide">
            <span className="liveBadge"><i className="dot" /> LIVE PROGRAMMING</span>
            <h3>Coming into the feed</h3>
            <p>When a live stream is available, it will appear here with a live badge and open directly into the player. Recorded sessions stay available afterward.</p>
            <button className="topLink" style={{marginTop:10,cursor:"pointer"}} onClick={() => setCategory("Community")}>Browse community</button>
          </div>
        </section>

        <div className="controls">
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos, teachers, topics..." />
        </div>
        <div className="chips">{categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div className="sectionTitle"><div><span className="eyebrow">LIBRARY</span><h2>Continue learning</h2></div><span className="count">{filtered.length} results</span></div>
        {filtered.length ? <div className="grid">{filtered.map((video) => <article className="card" key={video.id}><div className="thumb"><span className="thumbMark">{video.accent}</span><span className="duration">{video.duration}</span></div><div className="cardBody"><span className="meta">{video.category} · {video.creator}</span><h3>{video.title}</h3><p>{video.description}</p><button className="watch" onClick={() => setSelected(video)}>▶ Watch now</button></div></article>)}</div> : <div className="empty"><strong>No videos found.</strong>Try another search or topic.</div>}

        <div className="sectionTitle"><div><span className="eyebrow">NEXT</span><h2>Keep exploring</h2></div></div>
        <div className="chips"><Link href="/" className="chip">Home feed</Link><Link href="/learn" className="chip">Learning paths</Link><button className="chip" onClick={() => setCategory("Qur'an")}>Qur'an</button><button className="chip" onClick={() => setCategory("Prayer")}>Prayer Academy</button></div>
      </div>

      {selected && <div className="playerOverlay" onClick={() => setSelected(null)}><div className="player" onClick={(e) => e.stopPropagation()}><video src={selected.src} controls autoPlay playsInline /><div className="playerInfo"><div><h3>{selected.title}</h3><p>{selected.creator} · {selected.category} · {selected.duration}</p></div><button className="close" onClick={() => setSelected(null)} aria-label="Close player">×</button></div></div></div>}
    </main>
  );
}
