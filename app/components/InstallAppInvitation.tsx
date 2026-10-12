"use client";
import {useEffect,useState} from "react";
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const KEY="1muslim-install-dismissed";
export default function InstallAppInvitation(){
 const [open,setOpen]=useState(false),[guide,setGuide]=useState(false),[prompt,setPrompt]=useState<InstallPromptEvent|null>(null),[ios,setIos]=useState(false);
 useEffect(()=>{
  const standalone=window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
  if(standalone)return;
  setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1));
  const before=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPromptEvent)};
  window.addEventListener("beforeinstallprompt",before);
  let timer:ReturnType<typeof setTimeout>|undefined;
  const activate=()=>{
   if(document.visibilityState!=="visible"||sessionStorage.getItem(KEY)==="1")return;
   timer=setTimeout(()=>{if(document.visibilityState==="visible"&&sessionStorage.getItem(KEY)!=="1")setOpen(true)},60000);
  };
  const reset=()=>{if(timer)clearTimeout(timer);activate()};
  ["pointerdown","keydown","scroll","touchstart"].forEach(e=>window.addEventListener(e,reset,{passive:true}));
  activate();
  const manually=()=>{setGuide(false);setOpen(true)};
  window.addEventListener("1muslim:open-install-app",manually);
  return()=>{window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("1muslim:open-install-app",manually);["pointerdown","keydown","scroll","touchstart"].forEach(e=>window.removeEventListener(e,reset));if(timer)clearTimeout(timer)};
 },[]);
 const close=()=>{setOpen(false);setGuide(false);sessionStorage.setItem(KEY,"1")};
 const install=async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;close()}else setGuide(true)};
 if(!open)return null;
 return <div className="installInvitationShade" role="dialog" aria-modal="true" aria-label="Install 1Muslim app" onClick={close}>
  <section className="installInvitation" onClick={e=>e.stopPropagation()}>
   <button className="installClose" onClick={close} aria-label="Close installation invitation">×</button>
   <img src="/assets/1muslim-live-logo.PNG" alt="" width="58" height="58"/>
   <span className="installEyebrow">1MUSLIM · ON YOUR PHONE</span>
   <h2>{guide?"Add 1Muslim to your Home Screen":"Take 1Muslim with you"}</h2>
   {guide?<><p>{ios?"In Safari, tap Share (the square with an arrow), choose Add to Home Screen, then tap Add.":"Open your browser menu and choose Install app or Add to Home Screen."}</p><button className="installPrimary" onClick={close}>Got it ✓</button></>:<><p>Open your Ummah, Quran Studio, and Live directly from your Home Screen.</p><button className="installPrimary" onClick={()=>void install()}>✦ {prompt?"Install 1Muslim":"Show me how to install"}</button><button className="installSecondary" onClick={close}>Maybe later</button></>}
  </section>
  <style jsx>{`
   .installInvitationShade{position:fixed;inset:0;z-index:10070;display:grid;place-items:center;padding:20px;background:rgba(0,10,7,.64);backdrop-filter:blur(13px);animation:installFade .35s ease}
   .installInvitation{position:relative;box-sizing:border-box;width:min(390px,100%);padding:32px 25px 26px;text-align:center;border:1px solid rgba(158,255,193,.37);border-radius:29px;background:linear-gradient(145deg,rgba(30,82,58,.94),rgba(7,24,18,.96));box-shadow:0 24px 80px #0008,inset 0 1px #ffffff38;color:#f4fff6;animation:installPop .48s cubic-bezier(.2,.85,.22,1)}
   .installInvitation img{object-fit:contain;border-radius:16px;margin-bottom:13px}.installEyebrow{display:block;font-size:10px;letter-spacing:.19em;color:#b8eac4;font-weight:800}.installInvitation h2{font-size:25px;letter-spacing:-.04em;margin:12px 0}.installInvitation p{font-size:14px;line-height:1.7;color:#d5e7da;margin:0 0 23px}.installClose{position:absolute;right:13px;top:11px;border:0;background:transparent;color:#e7fff1;font-size:28px;cursor:pointer}.installPrimary,.installSecondary{display:block;width:100%;border-radius:999px;padding:13px 16px;font-weight:800;cursor:pointer}.installPrimary{border:1px solid #bafbd0;background:linear-gradient(120deg,#b9ffd3,#70db9c);color:#09331c}.installSecondary{margin-top:9px;border:1px solid #ffffff24;background:#ffffff0c;color:#e3f5e7}
   @keyframes installFade{from{opacity:0}to{opacity:1}}@keyframes installPop{from{opacity:0;transform:translateY(18px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){.installInvitationShade,.installInvitation{animation:none}}
  `}</style>
 </div>;
}
