"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
export default function FirstVisitWidgetFocus(){
 const [step,setStep]=useState(-1);
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setTimeout>|undefined;void createClient().auth.getUser().then(({data:{user}})=>{if(!active||!user)return;const key="1muslim:widget-intro-v1:"+user.id;try{if(localStorage.getItem(key))return;localStorage.setItem(key,"seen")}catch{return}timer=setTimeout(()=>setStep(0),1200)});return()=>{active=false;if(timer)clearTimeout(timer)}},[]);
 useEffect(()=>{if(step<0)return;const selectors=step===0?['a[href="/profile"]']:['a[href="/messages"]'];const target=selectors.map(q=>document.querySelector(q)).find(Boolean);if(!target){setStep(step===0?1:-1);return}const el=target as HTMLElement;el.classList.add("oneMuslimIntroFocus");const timer=setTimeout(()=>{el.classList.remove("oneMuslimIntroFocus");setStep(step===0?1:-1)},step===0?2300:2600);return()=>{clearTimeout(timer);el.classList.remove("oneMuslimIntroFocus")}},[step]);
 if(step<0)return null;return <><div className="oneMuslimIntroDim" aria-hidden="true"/><style>{`.oneMuslimIntroDim{position:fixed;inset:0;z-index:90;pointer-events:none;background:#03150d55;animation:oneMuslimIntroFade .55s ease both}.oneMuslimIntroFocus{position:relative!important;z-index:91!important;transform:scale(1.055)!important;filter:brightness(1.15);box-shadow:0 0 0 5px #c4edbf44,0 0 45px #80ecb17d!important;transition:transform 1.2s ease,box-shadow 1.2s ease!important}@keyframes oneMuslimIntroFade{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.oneMuslimIntroFocus{transform:none!important;transition:none!important}.oneMuslimIntroDim{animation:none}}`}</style></>
}
