"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createClient} from "../../utils/supabase/client";
import {normalizeSpokenHudHudQuestion} from "../lib/hudhud-speech";
import AnimatedMuslimBrand from "../components/AnimatedMuslimBrand";
import SearchFeatureRails from "./SearchFeatureRails";
import ProfileImmersiveStage,{type ProfileSearchRequest} from "../profile/ProfileImmersiveStage";
import "./search-member-home.css";

type Member={
 id:string;display_name:string|null;first_name:string|null;last_name:string|null;
 username:string|null;hide_1muslim_id:boolean|null;gender:string|null;
 avatar_gender:string|null;avatar_url:string|null;avatar_config:Record<string,unknown>|null;
};
type SpeechEvent={results:ArrayLike<{isFinal:boolean;0:{transcript:string}}>} ;
type Recognition={
 lang:string;interimResults:boolean;continuous:boolean;
 onresult:((event:SpeechEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;abort:()=>void;
};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
type Cursor={text:string;caret:number;visible:boolean};
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const avatar=(member:Member|null)=>{
 if(!member)return "/assets/hudhud-logo.PNG";
 const options=member.avatar_config||{};
 const url=[options.adminAvatarUrl,options.customAvatarUrl,options.selectedAvatarUrl,options.avatarUrl,member.avatar_url]
  .find(x=>typeof x==="string"&&(/^(https:\/\/|\/assets\/avatars\/)/).test(x));
 return typeof url==="string"?url:(member.avatar_gender==="female"||member.gender==="female")
  ?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
};
const nameOf=(member:Member|null)=>member?.display_name?.trim()||
 [member?.first_name,member?.last_name].filter(Boolean).join(" ").trim()||
 (member?.username&&!member.hide_1muslim_id?member.username:"Member");

export default function SearchMemberHome({onSignOut}:{onSignOut:()=>Promise<void>}){
 const [member,setMember]=useState<Member|null>(null);
 const [night,setNight]=useState(false);
 const [search,setSearch]=useState("");
 const [focused,setFocused]=useState(false);
 const [request,setRequest]=useState<ProfileSearchRequest|null>(null);
 const [thinking,setThinking]=useState(false);
 const [nameDraft,setNameDraft]=useState("");
 const [nameEditor,setNameEditor]=useState(false);
 const [nameSaving,setNameSaving]=useState(false);
 const [nameError,setNameError]=useState("");
 const [cursor,setCursor]=useState<Cursor>({text:"Search 1Muslim",caret:14,visible:false});
 const [displayedName,setDisplayedName]=useState("");
 const [showHudLabel,setShowHudLabel]=useState(false);
 const [arriving,setArriving]=useState(false);
 const [micPermission,setMicPermission]=useState<"checking"|"granted"|"needs-tap"|"denied"|"unsupported">("checking");
 const [listening,setListening]=useState(false);
 const [paused,setPaused]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [spokenChars,setSpokenChars]=useState(0);
 const [voiceOn,setVoiceOn]=useState(true);
 const [voiceError,setVoiceError]=useState("");
 const [greetingFailed,setGreetingFailed]=useState(false);
 const recognition=useRef<Recognition|null>(null);
 const requestSequence=useRef(0);
 const userInput=useRef<HTMLInputElement>(null);
 const pendingGreeting=useRef(false);
 const speechTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const initialised=useRef(false);
 const speechActive=useRef(false);
 const voiceOnRef=useRef(voiceOn);voiceOnRef.current=voiceOn;
 useEffect(()=>{
  const device=window.matchMedia("(prefers-color-scheme: dark)");
  const update=()=>{
   let mode:string|null=null;
   try{mode=localStorage.getItem("1muslim-theme-mode")||localStorage.getItem("1muslim-theme")}catch{}
   const dark=mode==="night"||mode==="dark"||(mode==="auto"&&device.matches);
   setNight(dark);
   window.dispatchEvent(new CustomEvent("1muslim:route-appearance",{detail:{route:"/search",night:dark}}));
  };
  update();window.addEventListener("1muslim:theme-changed",update);device.addEventListener("change",update);
  return()=>{window.removeEventListener("1muslim:theme-changed",update);device.removeEventListener("change",update)};
 },[member?.id]);

 useEffect(()=>{
  let live=true;
  void createClient().auth.getUser().then(async ({data:{user}})=>{
   if(!user||!live)return;
   const {data}=await createClient().from("profiles")
    .select("id,display_name,first_name,last_name,username,hide_1muslim_id,gender,avatar_gender,avatar_url,avatar_config")
    .eq("id",user.id).maybeSingle();
   if(!live)return;
   setMember((data||{id:user.id,display_name:String(user.user_metadata?.display_name||user.user_metadata?.full_name||"Member")}) as Member);
   let fresh=true;
   try{
    const key="1muslim:member-search-visited:"+user.id;
    const stored=sessionStorage.getItem(key)==="1";
    const requested=sessionStorage.getItem("1muslim:member-home-arrival")==="1"||new URLSearchParams(location.search).get("arrival")==="1";
    fresh=requested||!stored;
    sessionStorage.setItem(key,"1");
    sessionStorage.removeItem("1muslim:member-home-arrival");
    sessionStorage.removeItem("1muslim:profile-arrival");
    if(new URLSearchParams(location.search).has("arrival"))history.replaceState(null,"","/search");
   }catch{}
   pendingGreeting.current=fresh;
   setArriving(fresh&&!reduced());
  }).catch(()=>{});
  return()=>{live=false};
 },[]);

 // The typing is presentation only: never place the simulated text in the actual search input.
 useEffect(()=>{
  if(!member||initialised.current)return;
  initialised.current=true;
  let active=true;
  const pause=(ms:number)=>new Promise<void>(resolve=>window.setTimeout(resolve,ms));
  const person=nameOf(member).slice(0,48);
  const greeting=person.length>26?person.split(" ")[0]:person;
  let value="",position=0;
  const frame=(visible=true)=>{if(active)setCursor({text:value,caret:position,visible})};
  const insert=async(text:string,ms=44)=>{
   for(const char of text){if(!active)return;value=value.slice(0,position)+char+value.slice(position);position++;frame();await pause(ms)}
  };
  const backspace=async(count:number,ms=20)=>{
   for(let i=0;i<count;i++){if(!active||position===0)return;value=value.slice(0,position-1)+value.slice(position);position--;frame();await pause(ms)}
  };
  const move=async(at:number)=>{
   while(active&&position!==at){position+=position>at?-1:1;frame();await pause(17)}
  };
  const deleteForward=async(count:number)=>{
   for(let i=0;i<count;i++){if(!active)return;value=value.slice(0,position)+value.slice(position+1);frame();await pause(29)}
  };
  const run=async()=>{
   if(reduced()){setCursor({text:"Search 1Muslim.Live",caret:19,visible:false});setDisplayedName(person);return}
   await pause(300);await insert("Search 1Muslim",37);await pause(170);
   await insert(" witg",45);await pause(90);await backspace(1,66);await insert("h HudHud",47);await pause(290);
   await backspace(value.length,14);await insert("Welcome "+greeting,31);await pause(180);
   await move(0);await deleteForward("Welcome ".length);await insert("Search ",31);
   await move(value.length);await backspace(greeting.length,18);await insert("1Muslim.Live",36);
   if(!active)return;
   frame(true);await pause(2040);frame(false);
  };
  void run();
  setDisplayedName("");
  const nameChars=[...person];
  if(reduced()){setDisplayedName(person);return()=>{active=false}}
  let i=0;
  const nameInterval=window.setInterval(()=>{
   if(!active)return;
   i++;
   setDisplayedName(nameChars.slice(0,i).join(""));
   if(i>=nameChars.length){window.clearInterval(nameInterval);setShowHudLabel(true)}
  },55);
  const fade=window.setTimeout(()=>setShowHudLabel(false),4300);
  return()=>{active=false;window.clearInterval(nameInterval);window.clearTimeout(fade)};
 },[member?.id]);

 const stopRecognition=()=>{
  const rec=recognition.current;recognition.current=null;
  if(rec){rec.onend=null;rec.onerror=null;rec.onresult=null;try{rec.abort()}catch{}}
  setListening(false);
 };
 const stopAudio=()=>{
  if(speechTimer.current){window.clearTimeout(speechTimer.current);speechTimer.current=null}
  window.speechSynthesis?.cancel();speechActive.current=false;setSpeaking(false);
 };
 // Listening requires browser permission and always has a visible pause control.
 const askMicPermission=async()=>{
  if(!navigator.mediaDevices?.getUserMedia){setMicPermission("unsupported");return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   stream.getTracks().forEach(track=>track.stop());
   setMicPermission("granted");setVoiceError("");
  }catch(err){
   const name=err instanceof Error?err.name:"";
   setMicPermission(name==="NotAllowedError"||name==="PermissionDeniedError"?"denied":"needs-tap");
  }
 };
 useEffect(()=>{
  if(!member)return;
  void askMicPermission();
  const onHide=()=>{if(document.hidden){stopRecognition();stopAudio()}};
  document.addEventListener("visibilitychange",onHide);
  return()=>{
   document.removeEventListener("visibilitychange",onHide);
   stopRecognition();stopAudio();
  };
 },[member?.id]);

 const say=(text:string,onEnd?:()=>void)=>{
  if(!voiceOnRef.current||!("speechSynthesis" in window)){onEnd?.();return}
  stopAudio();
  const words=text.trim().slice(0,2500);
  const utterance=new SpeechSynthesisUtterance(words);
  setSpokenChars(0);
  // Hold the microphone before speech starts, not after the browser emits onstart.
  speechActive.current=true;setSpeaking(true);
  utterance.lang="en-US";utterance.rate=.99;utterance.volume=.88;
  let finished=false,started=false;
  const finish=()=>{if(finished)return;finished=true;speechActive.current=false;setSpeaking(false);
   if(speechTimer.current){clearTimeout(speechTimer.current);speechTimer.current=null}onEnd?.()};
  utterance.onstart=()=>{started=true;speechActive.current=true;setSpeaking(true);setGreetingFailed(false)};
  utterance.onerror=()=>{setGreetingFailed(true);finish()};
  utterance.onboundary=event=>{if(typeof event.charIndex==="number")setSpokenChars(event.charIndex)};
  utterance.onend=finish;
  // iOS may reject sound without a direct user interaction; keep the manual replay control.
  speechTimer.current=setTimeout(()=>{if(!started)setGreetingFailed(true);finish()},Math.max(4500,words.length*125));
  try{window.speechSynthesis.speak(utterance)}catch{setGreetingFailed(true);finish()}
 };
 const greet=()=>{
  setGreetingFailed(false);
  say("Assalamu Alaikum Wa Rahmatullahi Wa Barakatuh");
 };
 useEffect(()=>{
  if(!member||!pendingGreeting.current)return;
  pendingGreeting.current=false;
  const timer=setTimeout(greet,1650);
  return()=>clearTimeout(timer);
 },[member?.id]);
 const runQuestion=(text:string,mode:"search"|"hudhud")=>{
  const question=text.trim().slice(0,900);
  if(!question)return;
  stopRecognition();stopAudio();
  userInput.current?.blur();setFocused(false);setSearch("");
  setVoiceError("");setThinking(true);
  setRequest({query:question,mode,token:++requestSequence.current});
 };
 const onReply=(answer:string)=>{
  setThinking(false);
  if(voiceOnRef.current)say(answer);
 };
 const onSettled=()=>setThinking(false);
 const startRecognition=()=>{
  if(recognition.current||thinking||speaking||speechActive.current||focused||paused||document.hidden)return;
  const host=window as SpeechWindow;
  const Voice=host.SpeechRecognition||host.webkitSpeechRecognition;
  if(!Voice){setMicPermission("unsupported");setVoiceError("Voice recognition is unavailable here. You can type.");return}
  try{
   const rec=new Voice();let spoken="";let completed=false;
   rec.lang="en-US";rec.interimResults=true;rec.continuous=false;
   rec.onresult=event=>{
    let phrase="",final=false;
    for(let i=0;i<event.results.length;i++){
     phrase+=(event.results[i][0]?.transcript||"")+" ";
     if(event.results[i].isFinal)final=true;
    }
    spoken=normalizeSpokenHudHudQuestion(phrase.trim());setSearch(spoken);
    if(final&&!completed&&spoken.length>2){completed=true;try{rec.stop()}catch{}}
   };
   rec.onerror=event=>{
    if(recognition.current!==rec)return;
    recognition.current=null;setListening(false);
    if(event.error==="aborted"||event.error==="no-speech")return;
    setPaused(true);
    if(event.error==="not-allowed"||event.error==="service-not-allowed"){setMicPermission("needs-tap");setVoiceError("Tap the mic to allow listening.");}
    else setVoiceError("Voice stopped. Tap the mic or type a question.");
   };
   rec.onend=()=>{
    if(recognition.current!==rec)return;
    recognition.current=null;setListening(false);
    const question=normalizeSpokenHudHudQuestion(spoken.trim());
    if(question.length>2)window.setTimeout(()=>runQuestion(question,"hudhud"),100);
   };
   rec.start();recognition.current=rec;setListening(true);setVoiceError("");
  }catch{setPaused(true);setMicPermission("needs-tap");setVoiceError("Tap the microphone to start listening.");}
 };
 useEffect(()=>{
  if(!member||paused||nameEditor||micPermission!=="granted"||listening||thinking||speaking||speechActive.current||focused||search.trim()||document.hidden)return;
  const timer=setTimeout(startRecognition,550);
  return()=>clearTimeout(timer);
 },[member?.id,paused,nameEditor,micPermission,listening,thinking,speaking,focused,search]);
 const toggleMic=()=>{
  if(listening){setPaused(true);stopRecognition();return}
  setPaused(false);if(micPermission!=="granted"){void askMicPermission();return}
  // Voice needs a user gesture on some mobile browsers.
  window.setTimeout(startRecognition,0);
 };
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();runQuestion(search,"search")};
 const saveName=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!member||nameSaving)return;
  const next=nameDraft.trim().replace(/\s+/g," ").slice(0,100);
  if(next.length<2){setNameError("Enter at least two characters.");return}
  setNameSaving(true);setNameError("");
  const {data:{user}}=await createClient().auth.getUser();
  if(!user||user.id!==member.id){setNameError("Your session expired. Please sign in again.");setNameSaving(false);return}
  const {error}=await createClient().from("profiles").update({display_name:next}).eq("id",user.id);
  if(error)setNameError("Could not save your name. Please retry.");
  else{setMember(old=>old?{...old,display_name:next}:old);setDisplayedName(next);setNameEditor(false)}
  setNameSaving(false);
 };
 const displayName=nameOf(member);
 return <main className={"smhPage dsPage dsHomeMode"+(night?" smhNight":"")+(arriving?" smhArriving":"")} aria-label="Your One Muslim Search Home">
  <header className="smhHeader">
   <Link className="smhLogo" href="/search" aria-label="One Muslim.Live home"><AnimatedMuslimBrand/><span className="smhLogoLive">.Live</span></Link>
   <nav aria-label="Account shortcuts" className="smhUtilities">
    <Link className="smhOrb smhPlus" href="/create" aria-label="Open Creator Studio to add a post" title="Create">+</Link>
    <Link className="smhOrb" href="/settings" aria-label="Settings" title="Settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.4 1.6.9 2.4-.7 2 3.5-1.8 1.7v1.9l1.8 1.7-2 3.5-2.4-.7-1.6.9L14 20h-4l-.6-2.4-1.6-.9-2.4.7-2-3.5 1.8-1.7v-1.9L3.4 8.6l2-3.5 2.4.7 1.6-.9L10 2Z"/></svg></Link>
    <button className="smhOrb" type="button" onClick={()=>{if(window.confirm("Sign out of 1Muslim?"))void onSignOut()}} aria-label="Sign out" title="Sign out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg></button>
   </nav>
  </header>
  <section className="smhWelcome">
    <div className="smhIdentity">
     <button type="button" aria-label="Edit your display name" title="Tap to change your name" onClick={()=>{stopRecognition();setNameDraft(displayName);setNameEditor(true);setNameError("")}} className="smhName">{displayedName||"\u00a0"}</button>
     <span className={"smhWithHudHud"+(showHudLabel?" smhWithVisible":"")}>with HudHud</span>
    </div>
    <form className="smhSearchForm" onSubmit={submit} role="search" aria-label="Search with HudHud">
      <span className="smhAvatar" aria-label="Your profile avatar"><img src={avatar(member)} alt=""/></span>
      <div className="smhInputWrap">
       <input ref={userInput} aria-label="Search 1Muslim with HudHud" value={search} onChange={e=>setSearch(e.target.value)}
        onFocus={()=>{setFocused(true);stopRecognition()}} onBlur={()=>setFocused(false)} type="search" autoComplete="off" maxLength={900}/>
       {!search&&!focused&&<span aria-hidden="true" className="smhTypewriter"><span>{cursor.text.slice(0,cursor.caret)}</span><i className={cursor.visible?"":"smhCaretOff"}/><span>{cursor.text.slice(cursor.caret)}</span></span>}
      </div>
      <button className={"smhMic"+(listening?" isListening":"")} type="button" onClick={toggleMic}
       aria-label={listening?"Pause HudHud listening":paused?"Resume HudHud listening":"Enable HudHud voice listening"}
       aria-pressed={listening} title={listening?"Pause listening":"Speak to HudHud"}>
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>
      </button>
      <button className="smhSubmit" type="submit" disabled={!search.trim()||thinking} aria-label="Ask HudHud">↗</button>
    </form>
    <div className="smhVoiceLine" aria-live="polite">
      {listening?<span className="smhListening"><i/>Listening…</span>:speaking?<span>HudHud is speaking…</span>:thinking?<span>HudHud is thinking…</span>:
      micPermission==="denied"||micPermission==="needs-tap"?<button type="button" onClick={()=>{setPaused(false);void askMicPermission()}}>Enable microphone to speak</button>:
      micPermission==="unsupported"?<span>Type to ask HudHud. Voice recognition is unavailable.</span>:null}
      {greetingFailed&&<button type="button" onClick={greet}>Hear the greeting</button>}
      <button type="button" className="smhVoiceToggle" aria-pressed={voiceOn} onClick={()=>{setVoiceOn(old=>!old);if(voiceOn)stopAudio()}}>{voiceOn?"Spoken replies on":"Spoken replies off"}</button>
    </div>
    {voiceError&&<p className="smhError" role="status">{voiceError}</p>}
  </section>
  <div className="smhResponseSpace">
   <ProfileImmersiveStage request={request} onReply={onReply} onSettled={onSettled} persist={false} showEmpty={false} speaking={speaking} spokenChars={spokenChars}/>
   {request&&<Link className="smhAllResults" href={"/search?q="+encodeURIComponent(request.query)}>All search results ↗</Link>}
  </div>
  <div className="smhExplore"><SearchFeatureRails/></div>
  {nameEditor&&<div className="smhDialogBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setNameEditor(false)}}>
   <form className="smhNameDialog" onSubmit={saveName} role="dialog" aria-modal="true" aria-label="Edit display name">
    <label htmlFor="smhNameInput">Your name</label>
    <input id="smhNameInput" autoFocus value={nameDraft} maxLength={100} onChange={e=>setNameDraft(e.target.value)} />
    {nameError&&<p role="alert">{nameError}</p>}
    <div><button type="button" onClick={()=>setNameEditor(false)} disabled={nameSaving}>Cancel</button><button type="submit" disabled={nameSaving}>{nameSaving?"Saving…":"Save"}</button></div>
   </form>
  </div>}
 </main>;
}
