"use client";
import "./HudHudFullAccessAgent.css";
import {usePathname,useRouter} from "next/navigation";
import {useCallback,useEffect,useRef,useState} from "react";
import {hudhudDeleteTarget,hudhudScreenLabel,parseHudHudCommand} from "../lib/hudhud-agent-actions";

const ACCESS_KEY="1muslim:hudhud-full-access";
const MEMORY_KEY="1muslim:hudhud-device-navigation";
const REMEMBER_KEY="1muslim:hudhud-remember-navigation";
const VOICE_KEY="1muslim:hudhud-voice-uri";
const RATE_KEY="1muslim:hudhud-speech-rate";
const ALOUD_KEY="1muslim:hudhud-read-aloud";
export const HUDHUD_ACCESS_EVENT="1muslim:hudhud-full-access";
export const HUDHUD_SETTINGS_EVENT="1muslim:hudhud-agent-preferences";
type RecognitionResult={isFinal:boolean;0:{transcript:string}};
type RecognitionEvent={resultIndex:number;results:ArrayLike<RecognitionResult>};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:RecognitionEvent)=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void};
type VoiceWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
type Highlight={left:number;top:number;width:number;height:number;id:number};
type Memory={counts:Record<string,number>;last:string};
const memoryDefault:Memory={counts:{},last:""};
function visible(node:HTMLElement):boolean {
 const rect=node.getBoundingClientRect(),style=window.getComputedStyle(node);
 return rect.width>1&&rect.height>1&&style.visibility!=="hidden"&&style.display!=="none"&&!node.closest(".hudAgent,.hudPage,.hudDrawer");
}
function nameOf(node:HTMLElement):string {
 return (node.getAttribute("aria-label")||node.getAttribute("data-label")||node.textContent||"").trim().replace(/\s+/g," ").slice(0,110).toLowerCase();
}
function matching(nodes:HTMLElement[],phrase:string):HTMLElement|null {
 const needle=phrase.trim().toLowerCase();
 const eligible=nodes.filter(node=>visible(node));
 return eligible.find(node=>nameOf(node)===needle)||
 eligible.find(node=>nameOf(node).startsWith(needle+" "))||
 eligible.find(node=>nameOf(node).includes(needle))||null;
}
function pageHeadings():string[] {
 return [...document.querySelectorAll<HTMLElement>("main h1,main h2,main h3,[role=main] h1,[role=main] h2,[role=heading]")].filter(visible)
  .map(node=>nameOf(node)).filter(Boolean).slice(0,6);
}

export default function HudHudFullAccessAgent(){
 const pathname=usePathname()||"/";
 const router=useRouter();
 const [enabled,setEnabled]=useState(false);
 const [listening,setListening]=useState(false);
 const [paused,setPaused]=useState(true);
 const [status,setStatus]=useState("Microphone paused · tap the orb to listen");
 const [partial,setPartial]=useState("");
 const [highlight,setHighlight]=useState<Highlight|null>(null);
 const [confirmDelete,setConfirmDelete]=useState<{kind:"legacy"|"ummah";id:string}|null>(null);
 const [working,setWorking]=useState(false);
 const [readAloud,setReadAloud]=useState(false);
 const [voiceURI,setVoiceURI]=useState("");
 const [rate,setRate]=useState(1);
 const [remember,setRemember]=useState(false);
 const [speakerActive,setSpeakerActive]=useState(false);
 const recognition=useRef<Recognition|null>(null);
 const activated=useRef(false);
 const speaking=useRef(false);
 const restarts=useRef(0);
 const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const highlightTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const pending=useRef<{kind:"legacy"|"ummah";id:string}|null>(null);
 const handling=useRef<(text:string)=>void>(()=>{});
 const startRef=useRef<()=>void>(()=>{});
 const speechChoice=useRef({readAloud:false,voiceURI:"",rate:1});
 const rememberRef=useRef(false);
 const pathRef=useRef(pathname);
 pathRef.current=pathname;
 useEffect(()=>{
  try{
   setEnabled(localStorage.getItem(ACCESS_KEY)==="on");
   setReadAloud(localStorage.getItem(ALOUD_KEY)==="on");
   setVoiceURI(localStorage.getItem(VOICE_KEY)||"");
   const savedRate=Number(localStorage.getItem(RATE_KEY)||1);
   if(Number.isFinite(savedRate))setRate(Math.max(.8,Math.min(1.25,savedRate)));
   setRemember(localStorage.getItem(REMEMBER_KEY)==="on");
  }catch{}
 },[]);
 useEffect(()=>{speechChoice.current={readAloud,voiceURI,rate};},[readAloud,voiceURI,rate]);
 useEffect(()=>{rememberRef.current=remember},[remember]);
 const clearRecognition=useCallback(()=>{
  if(restartTimer.current){clearTimeout(restartTimer.current);restartTimer.current=null}
  const rec=recognition.current;recognition.current=null;
  if(rec){rec.onend=null;rec.onerror=null;rec.onresult=null;try{rec.abort()}catch{}}
  setListening(false);setPartial("");
 },[]);
 const stop=useCallback((disabled=false)=>{
  activated.current=false;clearRecognition();window.speechSynthesis?.cancel();speaking.current=false;setSpeakerActive(false);
  setPaused(true);setConfirmDelete(null);pending.current=null;
  if(disabled){try{localStorage.setItem(ACCESS_KEY,"off")}catch{};setEnabled(false);window.dispatchEvent(new CustomEvent("1muslim:hudhud-access-changed",{detail:{enabled:false}}));}
  else setStatus("Microphone paused · tap to resume");
 },[clearRecognition]);
 const speak=useCallback((message:string,priority=false)=>{
  const {readAloud,voiceURI,rate}=speechChoice.current;
  if((!readAloud&&!priority)||!("speechSynthesis" in window))return;
  // Stop speech capture while synthesized speech plays, avoiding HudHud responding to itself.
  clearRecognition();speaking.current=true;setSpeakerActive(true);
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(message.slice(0,1500));
  const voices=window.speechSynthesis.getVoices();
  const selected=voices.find(x=>x.voiceURI===voiceURI)||
   voices.find(x=>x.lang.toLowerCase().startsWith("en")&&x.localService)||
   voices.find(x=>x.lang.toLowerCase().startsWith("en"));
  if(selected)utterance.voice=selected;
  utterance.lang=selected?.lang||"en-US";utterance.rate=rate;utterance.pitch=1;
  utterance.onend=utterance.onerror=()=>{
   speaking.current=false;setSpeakerActive(false);
   if(activated.current&&!document.hidden){
    restarts.current=0;setStatus("Resume voice control if the microphone stops");
    // Some browsers cannot resume recognition without a fresh user gesture.
    restartTimer.current=setTimeout(()=>startRef.current(),450);
   }
  };
  window.speechSynthesis.speak(utterance);
 },[clearRecognition]);
 const mark=useCallback((node:HTMLElement)=>{
  const rect=node.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  setHighlight({left:Math.max(3,rect.left-5),top:Math.max(3,rect.top-5),
   width:Math.min(window.innerWidth-6,rect.width+10),height:Math.min(window.innerHeight-6,rect.height+10),id:Date.now()});
  if(highlightTimer.current)clearTimeout(highlightTimer.current);
  highlightTimer.current=setTimeout(()=>setHighlight(null),1850);
 },[]);
 const saveVisit=(path:string)=>{
  if(!rememberRef.current)return;
  try{
   const old=JSON.parse(localStorage.getItem(MEMORY_KEY)||"null") as Memory|null;
   const counts=old?.counts||{};
   const next={counts:{...counts,[path]:Math.min(10000,(Number(counts[path])||0)+1)},last:path};
   localStorage.setItem(MEMORY_KEY,JSON.stringify(next));
  }catch{}
 };
 const navigate=(path:string,label:string)=>{
  setStatus("Opening "+label+"…");saveVisit(path);
  setConfirmDelete(null);pending.current=null;
  router.push(path);
  // Provide a short location cue, without narrating every action.
  if(speechChoice.current.readAloud&&path!==pathRef.current)
   window.setTimeout(()=>speak("Opened "+label+"."),650);
 };
 const announce=(msg:string,verbal=false)=>{setStatus(msg);if(verbal)speak(msg)};
 const deletePost=async(target:{kind:"legacy"|"ummah";id:string})=>{
  if(working)return;
  if(pending.current?.id!==target.id||pending.current.kind!==target.kind)return;
  setWorking(true);setStatus("Verifying ownership and removing this post…");
  pending.current=null;setConfirmDelete(null);
  try{
   const url=target.kind==="legacy"?"/api/moderation":"/api/community-posts";
   const body=target.kind==="legacy"?{targetType:"post",targetId:target.id,confirmation:"DELETE"}:{id:target.id};
   const response=await fetch(url,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(String(data?.error||"Could not delete this post."));
   announce("Your post was deleted.",true);
   router.push("/posts");router.refresh();
  }catch(e){announce(e instanceof Error?e.message:"Deletion failed.",true)}finally{setWorking(false)}
 };
 const act=async(phrase:string)=>{
  if(!activated.current)return;
  const command=phrase.trim().replace(/^((?:hey|okay)\s+)?hud\s?hud[,\s]*/i,"");
  if(pending.current&&/^(?:yes )?confirm delete(?: this post)?$/i.test(command)){
   const target=pending.current;void deletePost(target);return;
  }
  if(pending.current&&/^(?:cancel|never mind|do not delete)$/i.test(command)){
   pending.current=null;setConfirmDelete(null);announce("Deletion canceled.");return;
  }
  const action=parseHudHudCommand(phrase);
  switch(action.kind){
   case "navigate":navigate(action.path,action.label);break;
   case "back":announce("Going back");router.back();break;
   case "scroll":{
    const amount=Math.max(260,Math.round(window.innerHeight*.64));
    window.scrollBy({top:action.direction==="down"?amount:-amount,behavior:"smooth"});
    // Nested scroll containers, including viewer panes, need a separate scroll target.
    const centered=document.elementFromPoint(window.innerWidth/2,window.innerHeight*.55);
    const scrollable=centered?.closest<HTMLElement>('[data-scroll-container],main,[role="main"],[class*="Scroll"],[class*="scroll"]');
    if(scrollable&&scrollable.scrollHeight>scrollable.clientHeight+40&&window.scrollY===0)
     scrollable.scrollBy({top:action.direction==="down"?amount:-amount,behavior:"smooth"});
    announce("Scrolling "+action.direction);break;
   }
   case "find":{
    const all=[...document.querySelectorAll<HTMLElement>("main h1,main h2,main h3,main h4,[role='heading'],[aria-label],[data-section],[role='region']")];
    const target=matching(all,action.label);
    if(!target){announce("I couldn't find a visible section called "+action.label+".",true);break}
    target.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
    setTimeout(()=>mark(target),480);
    announce("Located "+action.label);break;
   }
   case "tab":{
    const all=[...document.querySelectorAll<HTMLElement>('[role="tab"],button[aria-pressed],button[aria-selected],a[role="tab"]')];
    const target=matching(all,action.label);
    if(!target||/(?:delete|remove|confirm|sign out|pay|purchase)/i.test(nameOf(target))){announce("I couldn't safely find that tab.",true);break}
    mark(target);target.click();announce("Selected "+action.label);break;
   }
   case "fill":{
    const all=[...document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input[type="text"],input[type="search"],input:not([type]),textarea')];
    const target=all.find(input=>visible(input)&&
      [input.getAttribute("aria-label"),input.placeholder,input.getAttribute("name")].some(text=>text?.toLowerCase().includes(action.field.toLowerCase())));
    if(!target){announce("I couldn't locate that text field.",true);break}
    if(target.disabled||target.readOnly){announce("That field can't be edited.",true);break}
    const setter=Object.getOwnPropertyDescriptor(target instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value")?.set;
    setter?.call(target,action.value);
    target.dispatchEvent(new Event("input",{bubbles:true}));target.focus({preventScroll:true});target.scrollIntoView({behavior:"smooth",block:"center"});
    mark(target);announce("Filled "+action.field+". I haven't submitted it.");break;
   }
   case "refresh":announce("Refreshing this page's data.");router.refresh();break;
   case "describe":{
    const headings=pageHeadings();
    const summary="You're on "+hudhudScreenLabel(pathRef.current)+(headings.length?". Visible sections include "+headings.join(", ")+".":".");
    announce(summary,true);break;
   }
   case "usual":{
    let path="";
    if(rememberRef.current)try{const memory=JSON.parse(localStorage.getItem(MEMORY_KEY)||"null") as Memory|null;path=Object.entries(memory?.counts||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||""}catch{}
    if(!path){announce("Turn on navigation memory in HudHud settings, then visit a few pages.",true);break}
    // Never route to stored arbitrary values: the allowlist is required here.
    const safe=["/search","/profile","/posts","/messages","/quran-library","/widget-tools/prayer","/deepwatch","/streaming","/qibla","/notifications","/settings","/hudhud"];
    if(safe.includes(path))navigate(path,hudhudScreenLabel(path));
    break;
   }
   case "delete":{
    const target=hudhudDeleteTarget(pathRef.current);
    if(!target){announce("Open the individual post first. I can only delete a post you own from its post page.",true);break}
    pending.current=target;setConfirmDelete(target);
    announce("This will permanently delete the post if you own it. Say confirm delete, or tap the confirmation button.",true);
    break;
   }
   case "pause":stop();break;
   case "disable":stop(true);break;
   case "question":{
    setStatus("HudHud is considering your question…");
    // Only explicit questions are sent to the existing AI endpoint; ordinary navigation stays local.
    const context="Current 1Muslim page: "+hudhudScreenLabel(pathRef.current)+". Visible section headings: "+pageHeadings().join(", ")+".";
    try{
     const response=await fetch("/api/discover/ask",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({query:"",message:action.text+"\n\nUser-provided browsing context: "+context,history:[]})});
     const data=await response.json();
     if(!response.ok)throw Error(String(data?.error||"HudHud could not answer."));
     announce(String(data.reply||"No answer was returned.").slice(0,1300),true);
    }catch(e){announce(e instanceof Error?e.message:"HudHud could not answer.",true)}
    break;
   }
   case "unknown":announce("Try “open Qur’an”, “scroll down”, “find comments”, or “what page am I on?”");break;
  }
 };
 handling.current=(text)=>{void act(text)};
 const startVoice=useCallback(()=>{
  if(document.hidden||speaking.current)return;
  const host=window as VoiceWindow,Constructor=host.SpeechRecognition||host.webkitSpeechRecognition;
  if(!Constructor){activated.current=false;setPaused(true);setStatus("Voice control is unavailable in this browser. You can still use HudHud chat.");return}
  if(recognition.current)return;
  try{
   const rec=new Constructor();recognition.current=rec;
   rec.lang="en-US";rec.continuous=true;rec.interimResults=true;
   rec.onresult=e=>{
    for(let i=e.resultIndex;i<e.results.length;i++){
     const result=e.results[i],text=result[0]?.transcript?.trim()||"";
     if(!text)continue;
     if(result.isFinal){setPartial("");restarts.current=0;handling.current(text);}
     else setPartial(text.slice(0,110));
    }
   };
   rec.onerror=e=>{
    if(e.error==="not-allowed"||e.error==="service-not-allowed"||e.error==="audio-capture"){
     activated.current=false;setPaused(true);
     setStatus("Microphone permission unavailable. Tap the orb after allowing microphone access.");
    }else if(e.error!=="no-speech"&&e.error!=="aborted")setStatus("Speech recognition stopped. Tap the orb to retry.");
   };
   rec.onend=()=>{
    if(recognition.current===rec)recognition.current=null;
    setListening(false);setPartial("");
    if(activated.current&&!document.hidden&&!speaking.current&&restarts.current<3){
     restarts.current++;
     restartTimer.current=setTimeout(()=>startRef.current(),850*restarts.current);
    }else if(activated.current){
     activated.current=false;setPaused(true);setStatus("Listening paused by the browser. Tap to resume.");
    }
   };
   rec.start();setListening(true);setPaused(false);setStatus("Listening for commands on "+hudhudScreenLabel(pathRef.current));
  }catch{
   recognition.current=null;activated.current=false;setListening(false);setPaused(true);
   setStatus("The browser couldn't start voice recognition. Tap to try again.");
  }
 },[]);
 startRef.current=startVoice;
 const activate=()=>{
  activated.current=true;restarts.current=0;setEnabled(true);
  try{localStorage.setItem(ACCESS_KEY,"on")}catch{}
  window.dispatchEvent(new CustomEvent("1muslim:hudhud-access-changed",{detail:{enabled:true}}));
  startVoice();
 };
 useEffect(()=>{
  const onChange=(event:Event)=>{
   const enabled=(event as CustomEvent<{enabled:boolean}>).detail?.enabled===true;
   if(enabled)activate();else stop(true);
  };
  const onPrefs=()=>{
   try{
    setReadAloud(localStorage.getItem(ALOUD_KEY)==="on");
    setVoiceURI(localStorage.getItem(VOICE_KEY)||"");
    const saved=Number(localStorage.getItem(RATE_KEY)||1);
    setRate(Number.isFinite(saved)?Math.max(.8,Math.min(1.25,saved)):1);
    setRemember(localStorage.getItem(REMEMBER_KEY)==="on");
   }catch{}
  };
  const onHidden=()=>{if(document.hidden){activated.current=false;clearRecognition();setPaused(true);setStatus("Microphone paused when the tab was hidden. Tap to resume.")}};
  window.addEventListener(HUDHUD_ACCESS_EVENT,onChange);
  window.addEventListener(HUDHUD_SETTINGS_EVENT,onPrefs);
  document.addEventListener("visibilitychange",onHidden);
  return()=>{window.removeEventListener(HUDHUD_ACCESS_EVENT,onChange);window.removeEventListener(HUDHUD_SETTINGS_EVENT,onPrefs);document.removeEventListener("visibilitychange",onHidden)};
 },[clearRecognition,stop,startVoice]);
 useEffect(()=>()=>{activated.current=false;clearRecognition();if(highlightTimer.current)clearTimeout(highlightTimer.current);window.speechSynthesis?.cancel()},[clearRecognition]);
 useEffect(()=>{if(!enabled)return;setStatus(old=>listening||!paused?"Listening on "+hudhudScreenLabel(pathname):old)},[pathname,enabled,listening,paused]);

 if(!enabled)return null;
 return <aside className={"hudAgent"+(listening?" hudAgentListening":"")+(speakerActive?" hudAgentSpeaking":"")} aria-label="HudHud Full Access voice control">
  {highlight&&<div key={highlight.id} className="hudAgentHighlight" aria-hidden="true" style={{left:highlight.left,top:highlight.top,width:highlight.width,height:highlight.height}}/>}
  {confirmDelete&&<div className="hudAgentConfirm" role="dialog" aria-modal="false" aria-label="Confirm post deletion">
    <strong>Delete this post permanently?</strong>
    <p>Only your own post can be deleted. This cannot be undone.</p>
    <div><button type="button" disabled={working} onClick={()=>{pending.current=null;setConfirmDelete(null);announce("Deletion canceled.")}}>Cancel</button>
    <button type="button" disabled={working} onClick={()=>void deletePost(confirmDelete)}>Confirm delete</button></div>
    <small>You can also say “confirm delete” or “cancel”.</small>
   </div>}
  <div className="hudAgentDock">
   <div className="hudAgentFeedback" role="status" aria-live="polite">
    <strong>HudHud · Full Access <i aria-hidden="true"/></strong>
    <span>{partial||status}</span>
   </div>
   <div className="hudAgentControls">
    <button className="hudAgentOrb" type="button" aria-label={listening?"Pause HudHud microphone":"Resume HudHud microphone"}
     aria-pressed={listening} onClick={()=>listening?stop():activate()}>
     <span className="hudAgentOrbCloud"/>
     <span className="hudAgentOrbCenter" aria-hidden="true">{listening?"•••":"▷"}</span>
    </button>
    <button className="hudAgentOff" type="button" aria-label="Turn off HudHud Full Access" onClick={()=>stop(true)}>×</button>
   </div>
  </div>
 </aside>;
}
