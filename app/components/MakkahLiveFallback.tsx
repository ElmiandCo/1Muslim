"use client";
import Link from "next/link";
export default function MakkahLiveFallback(){
 return <span className="makkahFallback" onClick={e=>e.stopPropagation()}>
 <span className="makkahVideo">
 <iframe title="Live from Makkah — Masjid al-Haram" src="https://www.youtube-nocookie.com/embed/oqQ8XEPEwTg?autoplay=1&mute=1&playsinline=1&rel=0" allow="autoplay;encrypted-media;picture-in-picture;fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="eager"/>
 <span className="makkahLiveBadge"><i/> LIVE · MAKKAH</span>
 </span>
 <span className="makkahCaption"><strong>Wanna address the Ummah?</strong><small>Get featured here when you go live.</small><Link href="/live">🎥 Go Live ↗</Link></span>
 <style jsx>{`
 .makkahFallback{display:flex;flex-direction:column;width:100%;height:100%;min-height:350px;gap:10px;color:#f7e6bd}
 .makkahVideo{position:relative;display:block;flex:1;min-height:255px;border-radius:16px;overflow:hidden;border:1px solid #e9c98785;background:radial-gradient(circle at 50% 45%,#245a4c,#071b18 80%);box-shadow:0 0 18px #e4c78322}
 .makkahVideo iframe{display:block;width:100%;height:100%;min-height:255px;border:0}
 .makkahStart{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:9px;width:100%;height:100%;min-height:170px;border:0;background:transparent;color:#fff2d4;font-weight:800;font-size:15px;cursor:pointer}
 .makkahStart small{font-size:10px;font-weight:500;color:#d9cba7}.makkahIcon{font-size:40px}
 .makkahLiveBadge{position:absolute;top:10px;left:10px;padding:6px 10px;border:1px solid #efcb9080;border-radius:99px;background:#061b19cc;backdrop-filter:blur(9px);font-size:10px;font-weight:800;letter-spacing:.09em;pointer-events:none}
 .makkahLiveBadge i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f05252;box-shadow:0 0 9px #f05252;margin-right:5px}
 .makkahCaption{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;padding:4px 6px 8px}
 .makkahCaption strong{font-size:clamp(12px,2.6vw,17px)}.makkahCaption small{font-size:11px;color:#d2c4a6}
 .makkahCaption :global(a){display:inline-flex;align-items:center;justify-content:center;margin-top:3px;padding:8px 20px;border:1px solid #e7cc8e80;border-radius:99px;background:#0a5b47b0;color:#f7e5b7;font-size:12px;font-weight:800;text-decoration:none}
 `}</style>
 </span>
}
