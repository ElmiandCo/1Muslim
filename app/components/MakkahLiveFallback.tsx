"use client";
import Link from "next/link";
import {useState} from "react";
const broadcasts=[
 {name:"Makkah",detail:"Masjid al-Haram · broadcast",video:"oqQ8XEPEwTg",kind:"LIVE FEED",source:"https://www.youtube.com/watch?v=oqQ8XEPEwTg"},
 {name:"Madinah",detail:"Masjid an-Nabawi · Saudi Sunnah TV",video:"9A1S0xAPVIs",kind:"LIVE FEED",source:"https://www.youtube.com/watch?v=9A1S0xAPVIs"},
 {name:"Al-Aqsa",detail:"Jumu’ah khutbah · July 2026 replay",video:"u1uFu1jH2iM",kind:"REPLAY",source:"https://www.youtube.com/watch?v=u1uFu1jH2iM"}
] as const;
export default function MakkahLiveFallback(){
 const [index,setIndex]=useState(0);
 const selected=broadcasts[index];
 const move=(step:number)=>setIndex(current=>(current+step+broadcasts.length)%broadcasts.length);
 return <span className="makkahFallback" onClick={e=>e.stopPropagation()}>
 <span className="makkahVideo">
 <iframe key={selected.video} title={selected.detail} src={`https://www.youtube-nocookie.com/embed/${selected.video}?autoplay=1&mute=1&playsinline=1&rel=0`} allow="autoplay;encrypted-media;picture-in-picture;fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="eager"/>
 <span className="makkahLiveBadge"><i/> {selected.kind} · {selected.name.toUpperCase()}</span>
 </span>
 <nav className="makkahSwitch" aria-label="Browse mosque broadcasts"><button type="button" onClick={()=>move(-1)} aria-label="Previous broadcast">‹</button><span><strong>{selected.name}</strong><small>{selected.detail}</small></span><button type="button" onClick={()=>move(1)} aria-label="Next broadcast">›</button></nav>
 <span className="makkahCaption"><strong>Wanna address the Ummah?</strong><small>Get featured here when you go live.</small><Link href="/live">🎥 Go Live ↗</Link></span>
 <style jsx>{`
 .makkahFallback{display:flex;flex-direction:column;width:100%;height:100%;min-height:350px;gap:10px;color:#f7e6bd}
 .makkahVideo{position:relative;display:block;flex:1;min-height:255px;border-radius:16px;overflow:hidden;border:1px solid #e9c98785;background:radial-gradient(circle at 50% 45%,#245a4c,#071b18 80%);box-shadow:0 0 18px #e4c78322}
 .makkahVideo iframe{display:block;width:100%;height:100%;min-height:255px;border:0}
 .makkahStart{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:9px;width:100%;height:100%;min-height:170px;border:0;background:transparent;color:#fff2d4;font-weight:800;font-size:15px;cursor:pointer}
 .makkahStart small{font-size:10px;font-weight:500;color:#d9cba7}.makkahIcon{font-size:40px}
 .makkahLiveBadge{position:absolute;top:10px;left:10px;padding:6px 10px;border:1px solid #efcb9080;border-radius:99px;background:#061b19cc;backdrop-filter:blur(9px);font-size:10px;font-weight:800;letter-spacing:.09em;pointer-events:none}
 .makkahLiveBadge i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f05252;box-shadow:0 0 9px #f05252;margin-right:5px}
.makkahSwitch{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:39px}.makkahSwitch>span{display:flex;flex-direction:column;text-align:center;gap:2px;min-width:0}.makkahSwitch strong{font-size:13px;color:#f9e7bc}.makkahSwitch small{font-size:10px;color:#d5c6a9}.makkahSwitch button{flex:none;width:39px;height:39px;border-radius:50%;border:1px solid #e8cf9299;background:#073b33cc;color:#f9e7bc;font-size:28px;line-height:1;cursor:pointer}
 .makkahCaption{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;padding:4px 6px 8px}
 .makkahCaption strong{font-size:clamp(12px,2.6vw,17px)}.makkahCaption small{font-size:11px;color:#d2c4a6}
 .makkahCaption :global(a){display:inline-flex;align-items:center;justify-content:center;margin-top:3px;padding:8px 20px;border:1px solid #e7cc8e80;border-radius:99px;background:#0a5b47b0;color:#f7e5b7;font-size:12px;font-weight:800;text-decoration:none}
 `}</style>
 </span>
}
