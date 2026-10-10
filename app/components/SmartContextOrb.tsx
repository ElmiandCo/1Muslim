"use client";
import {useEffect,useState} from "react";
import {usePathname,useRouter} from "next/navigation";

type Focus={title:string;description:string;target:string|null};
const presets=[
 {test:/quran|tajweed|ayah/,title:"Qur’an Studio",action:"Record verse",event:"1muslim:quran-record",description:"Read, listen, and practice the verse currently in view."},
 {test:/streaming\/go-live/,title:"Live Studio",action:"Go Live",event:"go-live",description:"Check your title, camera and microphone before broadcasting."},
 {test:/messages/,title:"Messages",action:"Open messages",href:"/messages",description:"Your conversations and message requests."},
 {test:/learn|lesson/,title:"Learning",action:"Continue learning",href:"/learn",description:"Resume lessons and track your progress."},
 {test:/profile/,title:"Profile",action:"View profile",href:"/profile",description:"Your profile, badges and community activity."}
];
export default function SmartContextOrb(){
 const pathname=usePathname()||"/",router=useRouter();
 const [open,setOpen]=useState(false),[focus,setFocus]=useState<Focus>({title:"This screen",description:"Explore the content visible here.",target:null});
 const [context,setContext]=useState<(typeof presets)[number]|null>(null);
 useEffect(()=>{
  setOpen(false);
  let frame=0;
  const scan=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const cx=innerWidth/2,cy=innerHeight*.42;
    const nodes=Array.from(document.elementsFromPoint(cx,cy)) as HTMLElement[];
    const el=nodes.find(n=>n.closest("main,article,section,[data-hudhud-context]")&&!n.closest(".muslimMobileDock,[data-smart-orb]"));
    const section=el?.closest<HTMLElement>("[data-hudhud-context],article,section,main");
    const heading=section?.querySelector<HTMLElement>("h1,h2,h3,[data-hudhud-title]");
    const title=section?.dataset.hudhudContext||heading?.textContent?.trim().slice(0,90)||document.querySelector("h1")?.textContent?.trim()||"This screen";
    const description=section?.dataset.hudhudDescription||section?.querySelector("p")?.textContent?.trim().slice(0,240)||"HudHud can explain this section and help you decide what to do next.";
    setFocus({title,description,target:section?.id||null});
    const text=(pathname+" "+title+" "+(section?.dataset.hudhudAction||"")).toLowerCase();
    setContext(presets.find(p=>p.test.test(text))||null);
   });
  };
  scan();window.addEventListener("scroll",scan,{passive:true});window.addEventListener("resize",scan);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",scan);window.removeEventListener("resize",scan)};
 },[pathname]);
 const explain=()=>{
  setOpen(false);
  window.dispatchEvent(new CustomEvent("1muslim:hudhud-vision-explain",{detail:{title:focus.title,description:focus.description,target:focus.target}}));
 };
 const act=()=>{
  setOpen(false);
  if(context?.href){router.push(context.href);return}
  if(context?.event==="go-live"){document.querySelector<HTMLButtonElement>("[data-go-live-start]")?.click();return}
  if(context?.event)window.dispatchEvent(new Event(context.event));
 };
 return <div data-smart-orb style={{position:"relative",display:"flex",justifyContent:"center",alignItems:"center"}}>
  <button type="button" className="dockCenter smartHudHudOrb" aria-label="Open HudHud smart actions" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className="smartOrbCore" aria-hidden="true">✦</span><span className="dockCenterText">HudHud</span></button>
  {open&&<><button type="button" className="smartOrbDismiss" aria-label="Close HudHud actions" onClick={()=>setOpen(false)}/><div className="smartOrbMenu" role="group" aria-label="HudHud smart actions"><strong>✦ {focus.title}</strong><button type="button" onClick={explain}>✧ Explain what’s on screen</button><button type="button" onClick={context?act:()=>{setOpen(false);router.push("/quran-studio")}}>{context?"↗ "+context.action:"📖 Open Qur’an Studio"}</button><button type="button" onClick={()=>{setOpen(false);router.push(context?.href||"/learn")}}>{context?"Explore "+context.title:"✦ Explore lessons"}</button></div></>}
  <style jsx>{`
   .smartHudHudOrb{border-radius:50%!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 25%,#a7ffe7,#477bc7 43%,#30215e 78%,#120d25)!important;box-shadow:0 0 20px #7be7ff99,inset 0 0 12px #ffffff77!important;color:white!important;border:1px solid #c1fff2!important;cursor:pointer}
   .smartOrbCore{font-size:24px;line-height:1;animation:smartOrbSpin 9s linear infinite;text-shadow:0 0 12px white}
   .smartOrbDismiss{position:fixed;inset:0;background:transparent;border:0;z-index:10001}
   .smartOrbMenu{position:absolute;bottom:calc(100% + 18px);left:50%;transform:translateX(-50%);width:min(290px,90vw);display:grid;gap:8px;padding:14px;border-radius:18px;background:#101c2cf5;color:white;border:1px solid #8bded4;box-shadow:0 14px 40px #000a;z-index:10002}
   .smartOrbMenu strong{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
   .smartOrbMenu button{text-align:left;padding:11px;border-radius:11px;background:#244151;color:#f5fff9;border:1px solid #5d8e99;cursor:pointer}
   .smartOrbMenu button:focus-visible,.smartHudHudOrb:focus-visible{outline:3px solid #aaffdf;outline-offset:3px}
   @keyframes smartOrbSpin{to{transform:rotate(360deg)}}
   @media(prefers-reduced-motion:reduce){.smartOrbCore{animation:none}}
  `}</style>
 </div>;
}
