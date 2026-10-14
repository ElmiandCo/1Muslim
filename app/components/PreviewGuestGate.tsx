"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
export default function PreviewGuestGate(){
 const router=useRouter();
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  let alive=true;let timer:ReturnType<typeof setTimeout>|undefined;
  const supabase=createClient();
  const check=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!alive)return;if(user){setVisible(false);if(timer)clearTimeout(timer)}else if(!timer){timer=setTimeout(()=>{if(alive)setVisible(true)},3000)}};
  void check();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{if(timer)clearTimeout(timer);timer=undefined;void check()});
  return()=>{alive=false;if(timer)clearTimeout(timer);subscription.unsubscribe()};
 },[]);
 useEffect(()=>{if(!visible)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous}},[visible]);
 if(!visible)return null;
 const enter=()=>router.push("/auth");
 return <div className="previewGate" role="dialog" aria-modal="true" aria-labelledby="previewGateTitle">
  <div className="gateNav"><span className="brand">✦ 1MUSLIM</span><span className="previewPill">A NEW CHAPTER</span><button onClick={enter}>Sign in ↗</button></div>
  <div className="gateCenter">
   <div className="gateCard">
    <div className="kicker">✦ 1MUSLIM · A NEW CHAPTER</div>
    <h1 id="previewGateTitle">We’re upgrading<span className="ellipsis">...</span></h1>
    <p className="question">What, you ask?</p>
    <div className="everything">EVERYTHING.</div>
    <p className="description">A new experience is on its way.<br/>Built for the Ummah, with you.</p>
    <button className="explore" onClick={enter}>I’d like to stay and explore 1Muslim ↗</button>
    <div className="storeRow"><div className="storeBadge"><span></span><div><small>COMING TO THE</small><strong>App Store</strong></div></div><div className="storeBadge"><span>▶</span><div><small>COMING TO</small><strong>Google Play</strong></div></div></div>
    <p className="footnote">Already a member? <button onClick={enter}>Sign in</button> · New here? <button onClick={enter}>Join 1Muslim</button></p>
   </div>
  </div>
  <style jsx>{`
  .previewGate{position:fixed;inset:0;z-index:100000;overflow:hidden;color:#f8f2df;background:radial-gradient(ellipse at 50% 48%,#153224 0%,#081911 48%,#020b07 100%);animation:dimIn 2.8s ease-out both;isolation:isolate}
  .previewGate:before{content:"";position:absolute;inset:-30%;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,transparent 10%,#0009 70%);animation:slowDim 16s ease-in-out infinite alternate}
  .gateNav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:clamp(14px,3vh,26px) clamp(18px,5vw,68px);border-bottom:1px solid #d7c18a23;backdrop-filter:blur(18px)}
  .brand{font-size:15px;font-weight:800;letter-spacing:.16em;color:#e7d19b}.previewPill{font-size:10px;letter-spacing:.2em;color:#c9b88b}.gateNav button{border:1px solid #e3d4a966;background:#ffffff08;color:#f8edd5;border-radius:30px;padding:9px 18px;cursor:pointer}
  .gateCenter{position:relative;z-index:1;height:calc(100dvh - 73px);display:grid;place-items:center;padding:12px 18px 22px}
  .gateCard{width:min(100%,680px);max-height:100%;overflow:hidden;text-align:center;border:1px solid #d8c58a42;border-radius:28px;padding:clamp(20px,4vh,38px) clamp(18px,4vw,42px);background:linear-gradient(150deg,#19352891,#07150fc9);box-shadow:inset 0 0 32px #d4b87309,0 18px 80px #0009,0 0 60px #d6c08b12;backdrop-filter:blur(22px)}
  .kicker{font-size:clamp(9px,1.4vw,12px);font-weight:750;letter-spacing:.24em;color:#e3c78c}.gateCard h1{font-size:clamp(29px,5vw,58px);letter-spacing:-.06em;line-height:1.12;margin:clamp(10px,2vh,22px) 0}.ellipsis{color:#d7bd85}.question{font-size:clamp(15px,2.4vw,23px);margin:10px 0;color:#cfd8c9}.everything{font-weight:850;letter-spacing:.015em;color:#eed49a;font-size:clamp(35px,8vw,92px);line-height:1.05;text-shadow:0 0 36px #e1c17b22}.description{font-size:clamp(13px,2vw,18px);line-height:1.5;color:#d5ded2;margin:clamp(12px,2vh,22px) 0}.explore{width:100%;border:1px solid #f6e2ad;border-radius:19px;background:linear-gradient(120deg,#d8bf83,#f6e3af);color:#102419;padding:clamp(12px,2vh,18px);font-size:clamp(13px,2vw,18px);font-weight:800;cursor:pointer;box-shadow:0 0 34px #e4cc8630}.storeRow{display:flex;justify-content:center;gap:12px;margin-top:clamp(12px,2.5vh,24px)}.storeBadge{min-width:0;flex:1;max-width:210px;display:flex;align-items:center;justify-content:center;gap:9px;padding:12px 10px;border:1px solid #d4c29a65;border-radius:15px;background:#ffffff08}.storeBadge>span{font-size:26px}.storeBadge small{display:block;letter-spacing:.13em;font-size:9px}.storeBadge strong{display:block;font-size:clamp(15px,2.5vw,23px)}.footnote{margin:16px 0 0;font-size:12px;color:#bdc9ba}.footnote button{border:0;background:transparent;color:#e7d3a2;text-decoration:underline;cursor:pointer}
  @keyframes dimIn{from{opacity:0}to{opacity:1}}@keyframes slowDim{0%{opacity:.3;transform:scale(1)}100%{opacity:.72;transform:scale(1.08)}}@media(max-width:440px){.previewPill{display:none}.gateCard{padding:18px 15px}.gateCenter{padding:8px 12px 14px}.storeBadge{padding:10px 6px}.storeBadge>span{font-size:20px}.storeBadge small{font-size:8px}}@media(max-height:650px){.gateCard{padding:12px 18px}.gateCard h1{margin:8px 0}.description{margin:8px 0}.storeRow{margin-top:8px}.footnote{margin-top:8px}}@media(prefers-reduced-motion:reduce){.previewGate,.previewGate:before{animation:none}}
  `}</style>
 </div>;
}
