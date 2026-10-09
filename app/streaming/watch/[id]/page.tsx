"use client";

import SiteNav from "../../../components/SiteNav";
import FirstVisitGuide from "../../../components/FirstVisitGuide";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const library = [
  {id:"quran-01",title:"Surah Al-Ikhlas — A Short Reflection",creator:"1Muslim",category:"Qur'an",description:"A calm introduction to Surah Al-Ikhlas and the meaning of Allah's oneness.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
  {id:"new-muslim-01",title:"Where Do I Start?",creator:"1Muslim Learning",category:"New Muslim",description:"A welcoming first lesson for someone discovering Islam or beginning again.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
  {id:"prayer-01",title:"Salah: Standing, Bowing & Sujood",creator:"Prayer Academy",category:"Prayer",description:"A visual walkthrough of the core movements of salah.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
  {id:"seerah-01",title:"The Life of Muhammad ﷺ — The Beginning",creator:"1Muslim Seerah",category:"Seerah",description:"Start the Seerah with historical context and a careful timeline.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
  {id:"tawhid-01",title:"Why One God?",creator:"1Muslim Foundations",category:"Tawhid",description:"An accessible introduction to Tawhid and worship belonging to Allah alone.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
  {id:"community-01",title:"Ask 1Muslim: Faith, Doubt & Honest Questions",creator:"1Muslim Community",category:"Community",description:"A community conversation about asking difficult questions without shame.",src:"https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"},
];

export default function WatchPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const video = useMemo(() => library.find((item) => item.id === id), [id]);

  if (!video) return <main className="watchPage"><style jsx>{css}</style><div className="notFound"><h1>Video not found</h1><p>This stream may have moved or is not available yet.</p><Link href="/streaming">← Back to Streaming</Link></div></main>;

  return <main className="watchPage">
    <style jsx>{css}</style>
      <FirstVisitGuide area="watch-live"/><SiteNav />
    <div className="watchShell">
      <div className="videoFrame"><video src={video.src} controls autoPlay playsInline /></div>
      <div className="watchMeta"><span>{video.category} · {video.creator}</span><h1>{video.title}</h1><p>{video.description}</p><div className="actions"><button onClick={() => navigator.share?.({title:video.title,url:window.location.href})}>↗ Share</button><button onClick={() => alert("Saved to your 1Muslim library.")}>＋ Save</button></div></div>
    </div>
  </main>;
}

const css = `
.watchPage{min-height:100vh;background:#050806;color:#f2f6f2}.watchPage header{height:64px;border-bottom:1px solid #1b241f;display:flex;align-items:center;justify-content:space-between;padding:0 max(20px,calc((100vw - 1100px)/2));background:rgba(5,8,6,.9);backdrop-filter:blur(15px)}header a{color:#8f9a93;text-decoration:none;font-size:12px}header a:hover{color:#fff}header strong{font-size:16px}header strong span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#101811;border:1px solid #354237;color:#d6e7b8;margin-right:7px}.watchShell{max-width:1000px;margin:40px auto;padding:0 20px}.videoFrame{border:1px solid #273129;border-radius:20px;overflow:hidden;background:#000;box-shadow:0 25px 80px rgba(0,0,0,.4)}.videoFrame video{width:100%;display:block;aspect-ratio:16/9}.watchMeta{padding:24px 4px}.watchMeta>span{font-size:10px;color:#86a08b;letter-spacing:.12em;text-transform:uppercase}.watchMeta h1{font-size:32px;letter-spacing:-.05em;margin:9px 0}.watchMeta p{color:#8d9991;line-height:1.7;font-size:13px;max-width:700px}.actions{display:flex;gap:8px;margin-top:20px}.actions button{border:1px solid #29342d;background:#0d140f;color:#dce5de;border-radius:999px;padding:10px 15px;cursor:pointer}.notFound{max-width:700px;margin:20vh auto;text-align:center}.notFound p{color:#849088}.notFound a{color:#d6e7b8;text-decoration:none}
@media(max-width:600px){.watchPage header{padding:0 14px}.watchShell{margin:20px auto;padding:0 12px}.watchMeta h1{font-size:26px}}
`;
