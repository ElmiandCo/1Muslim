"use client";
import {useState} from "react";
import Link from "next/link";
export default function QuranLiveWidget({compact=false}:{compact?:boolean}){
 const [open,setOpen]=useState(false);
 return <div className={"quran-live-widget"+(compact?" is-compact":"")}>
 <button type="button" className="quran-live-trigger" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span aria-hidden="true">●</span> Go Live + Qur’an <span aria-hidden="true">{open?"−":"⌄"}</span></button>
 {open&&<div className="quran-live-panel"><div className="quran-live-crown"><strong>Read Qur’an on Live</strong><small>1MUSLIM · LIVE STUDIO</small></div><p>Keep Qur’an Studio open while you host a live recitation or lesson.</p><div className="quran-live-steps"><span>① Open Live Studio in a new tab</span><span>② Start your broadcast with microphone enabled</span><span>③ Return here to read the verses</span></div><div className="quran-live-actions"><a href="/streaming/go-live" target="_blank" rel="noopener noreferrer" className="quran-live-primary">● Open Live Studio ↗</a><Link href="/elm-tent/quran" onClick={()=>setOpen(false)}>Open Qur’an ↗</Link></div><small className="quran-live-note">Your microphone broadcasts from the Live Studio tab. Switching tabs may pause your camera on some devices. Sharing the Qur’an screen with viewers is not yet automatic.</small></div>}
 </div>;
}
