"use client";
import Link from "next/link";
import {useState} from "react";
const broadcasts=[
 {name:"Makkah",detail:"Masjid al-Haram · broadcast",video:"oqQ8XEPEwTg",kind:"LIVE FEED",source:"https://www.youtube.com/watch?v=oqQ8XEPEwTg"},
 {name:"Madinah",detail:"Masjid an-Nabawi · Saudi Sunnah TV",video:"Rs7St51oDDc",kind:"LIVE FEED",source:"https://www.youtube.com/watch?v=Rs7St51oDDc"},
 {name:"Al-Aqsa",detail:"Jumu’ah khutbah · July 2026 replay",video:"u1uFu1jH2iM",kind:"REPLAY",source:"https://www.youtube.com/watch?v=u1uFu1jH2iM"}
] as const;
export default function MakkahLiveFallback(){
 const [index,setIndex]=useState(0);
 const [preset,setPreset]=useState<"default"|"custom">("default");
 const [mic,setMic]=useState(true);
 const [guests,setGuests]=useState(false);
 const [camera,setCamera]=useState(false);
 const [screen,setScreen]=useState("Portrait");
 const choosePreset=(mode:"default"|"custom")=>{setPreset(mode);if(mode==="default"&&typeof window!=="undefined")setScreen(window.innerWidth>window.innerHeight?"Landscape":"Portrait")};
 const selected=broadcasts[index];
 const move=(step:number)=>setIndex(current=>(current+step+broadcasts.length)%broadcasts.length);
 return <span className="makkahFallback" onClick={e=>e.stopPropagation()}>
 <span className="makkahVideo">
 <iframe key={selected.video} title={selected.detail} src={`https://www.youtube-nocookie.com/embed/${selected.video}?autoplay=1&mute=1&playsinline=1&rel=0`} allow="autoplay;encrypted-media;picture-in-picture;fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="eager"/>
 <span className="makkahLiveBadge"><i/> {selected.kind} · {selected.name.toUpperCase()}</span>
 </span>
 <nav className="makkahSwitch" aria-label="Browse mosque broadcasts"><button type="button" onClick={()=>move(-1)} aria-label="Previous broadcast">‹</button><span><strong>{selected.name}</strong><small>{selected.detail}</small></span><button type="button" onClick={()=>move(1)} aria-label="Next broadcast">›</button></nav>
 <section className="makkahGoLive" aria-label="Go Live widget"><div className="makkahGoHead"><span><strong>✦ Go Live</strong><small>Wanna address the Ummah?</small></span><div className="makkahPresets"><button type="button" aria-pressed={preset==="default"} onClick={()=>choosePreset("default")}>◈ 1Muslim</button><button type="button" aria-pressed={preset==="custom"} onClick={()=>choosePreset("custom")}>⚙ Custom</button></div></div><small className="makkahGoHint">{preset==="default"?`Auto · ${screen} · optimized for device`:"Custom controls · adjust before broadcasting"}</small><div className="makkahGoTools"><button type="button" aria-pressed={mic} onClick={()=>setMic(v=>!v)}><b>♩</b><span>Mic <small>{mic?"On":"Off"}</small></span></button><button type="button" aria-pressed={camera} onClick={()=>setCamera(v=>!v)}><b>▣</b><span>Camera <small>{camera?"On · enable in studio":"Off"}</small></span></button><button type="button" aria-pressed={guests} onClick={()=>setGuests(v=>!v)}><b>♧</b><span>Guests <small>{guests?"On":"Off"}</small></span></button></div><Link className="makkahGoAction" href={`/streaming/go-live?preset=${preset}&mic=${mic?"on":"off"}&camera=${camera?"on":"off"}&guests=${guests?"on":"off"}`}>◉ Go Live <span>↗</span></Link><small className="makkahGoFoot">Get featured here when you go live.</small></section>
 <style jsx>{`
 .makkahFallback{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;gap:8px;color:#f7e6bd;box-sizing:border-box}
 .makkahVideo{position:relative;display:block;flex:0 0 auto;aspect-ratio:16/9;min-height:0;border-radius:16px;overflow:hidden;border:1px solid #e9c98785;background:radial-gradient(circle at 50% 45%,#245a4c,#071b18 80%);box-shadow:0 0 18px #e4c78322}
 .makkahVideo iframe{display:block;width:100%;height:100%;min-height:0;border:0}
 .makkahStart{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:9px;width:100%;height:100%;min-height:170px;border:0;background:transparent;color:#fff2d4;font-weight:800;font-size:15px;cursor:pointer}
 .makkahStart small{font-size:10px;font-weight:500;color:#d9cba7}.makkahIcon{font-size:40px}
 .makkahLiveBadge{position:absolute;top:10px;left:10px;padding:6px 10px;border:1px solid #efcb9080;border-radius:99px;background:#061b19cc;backdrop-filter:blur(9px);font-size:10px;font-weight:800;letter-spacing:.09em;pointer-events:none}
 .makkahLiveBadge i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f05252;box-shadow:0 0 9px #f05252;margin-right:5px}
.makkahSwitch{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:39px}.makkahSwitch>span{display:flex;flex-direction:column;text-align:center;gap:2px;min-width:0}.makkahSwitch strong{font-size:13px;color:#f9e7bc}.makkahSwitch small{font-size:10px;color:#d5c6a9}.makkahSwitch button{flex:none;width:39px;height:39px;border-radius:50%;border:1px solid #e8cf9299;background:#073b33cc;color:#f9e7bc;font-size:28px;line-height:1;cursor:pointer}
 .makkahGoLive{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid #d7bf8280;border-radius:18px;background:linear-gradient(145deg,#062f28e8,#08261dc9);box-shadow:inset 0 1px 12px #dfbf7020;backdrop-filter:blur(13px)}.makkahGoHead{display:flex;align-items:center;justify-content:space-between;gap:7px;flex-wrap:wrap}.makkahGoHead>span{display:flex;flex-direction:column;gap:3px}.makkahGoHead strong{font-size:17px;color:#f9e5b4}.makkahGoHead small,.makkahGoHint,.makkahGoFoot{font-size:10px;color:#c5d7c4}.makkahPresets{display:flex;gap:5px}.makkahPresets button{padding:7px 9px;border:1px solid #d7c08a85;border-radius:99px;background:#092d25;color:#e8dab6;font-size:11px;cursor:pointer}.makkahPresets button[aria-pressed=true]{background:#087c54;color:white;border-color:#b9f0b9}.makkahGoTools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.makkahGoTools button{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0;padding:8px 4px;border:1px solid #c4ad7e7c;border-radius:13px;background:#06382dbd;color:#f8e9c5;cursor:pointer}.makkahGoTools b{font-size:20px;font-weight:500}.makkahGoTools span{font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:flex-start}.makkahGoTools small{font-size:9px;color:#9fd6b2;font-weight:400}.makkahGoTools button[aria-pressed=false]{opacity:.72}.makkahGoLive :global(.makkahGoAction){display:flex;align-items:center;justify-content:center;position:relative;min-height:44px;border-radius:99px;border:1px solid #e8ce8d;background:linear-gradient(105deg,#057e54,#0ba06d);box-shadow:0 0 14px #18d58b55;color:white;font-size:18px;font-weight:800;text-decoration:none}.makkahGoLive :global(.makkahGoAction span){position:absolute;right:14px;font-size:14px}.makkahGoFoot{text-align:center}@media(max-width:390px){.makkahGoLive{padding:9px}.makkahPresets button{font-size:10px;padding:6px}.makkahGoHead strong{font-size:15px}.makkahGoTools button{gap:3px}}
 .makkahCaption{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;padding:4px 6px 8px}
 .makkahCaption strong{font-size:clamp(12px,2.6vw,17px)}.makkahCaption small{font-size:11px;color:#d2c4a6}
 .makkahCaption :global(a){display:inline-flex;align-items:center;justify-content:center;margin-top:3px;padding:8px 20px;border:1px solid #e7cc8e80;border-radius:99px;background:#0a5b47b0;color:#f7e5b7;font-size:12px;font-weight:800;text-decoration:none}
 `}</style>
 </span>
}
