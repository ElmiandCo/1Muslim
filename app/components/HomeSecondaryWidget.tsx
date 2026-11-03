"use client";
import {useEffect,useRef,useState} from "react";
import HomeMessagesChooser from "./HomeMessagesChooser";

type Widget="Messages"|"Qur’an"|"My Profile"|"Elm Tent"|"Posts";
const widgets:Widget[]=["Messages","Qur’an","My Profile","Elm Tent","Posts"];
const destinations:Record<Exclude<Widget,"Messages">,string>={
 "Qur’an":"/quran-studio","My Profile":"/profile","Elm Tent":"/elm-tent","Posts":"/community"
};
export default function HomeSecondaryWidget(){
 const [active,setActive]=useState<Widget>("Messages");
 const [shown,setShown]=useState<Widget>("Messages");
 const [phase,setPhase]=useState<"idle"|"exit"|"enter">("idle");
 const [open,setOpen]=useState(false);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const pending=useRef<Widget>("Messages");
 const reduced=useRef(false);
 useEffect(()=>{
  reduced.current=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{const stored=localStorage.getItem("1muslim-home-secondary-widget");if(widgets.includes(stored as Widget)){setActive(stored as Widget);setShown(stored as Widget);pending.current=stored as Widget}}catch{}
  return()=>timers.current.forEach(clearTimeout);
 },[]);
 function select(next:Widget){
  setOpen(false);
  pending.current=next;
  setActive(next);
  try{localStorage.setItem("1muslim-home-secondary-widget",next)}catch{}
  timers.current.forEach(clearTimeout);timers.current=[];
  if(reduced.current){setShown(next);setPhase("idle");return}
  if(next===shown&&phase==="idle")return;
  setPhase("exit");
  timers.current.push(setTimeout(()=>{
   setShown(pending.current);setPhase("enter");
   timers.current.push(setTimeout(()=>setPhase("idle"),1050));
  },900));
 }
 return <div className="omSecondaryWidget" aria-label="Desktop home secondary widget">
  <header className="omSecondaryHeader">
   <div className="omSecondaryPicker">
    <button type="button" className="omSecondaryTitle" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{active} <span aria-hidden="true">⌄</span></button>
    {open&&<div className="omSecondaryMenu" role="listbox" aria-label="Choose home widget">{widgets.map(widget=><button key={widget} type="button" role="option" aria-selected={active===widget} onClick={()=>select(widget)}>{widget}</button>)}</div>}
   </div>
   {shown!=="Messages"&&<a className="omSecondaryExpand" href={destinations[shown]} aria-label={"Open "+shown+" full page"}>⤢</a>}
  </header>
  <div className={"omSecondaryBody omSecondary-"+phase} aria-busy={phase!=="idle"} key={shown}>
   {shown==="Messages"?<HomeMessagesChooser/>:<iframe title={shown+" widget"} loading="lazy" src={destinations[shown]} className="omSecondaryFrame"/>}
  </div>
 </div>;
}
