"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import type {ChangeEvent, FormEvent, KeyboardEvent, ReactNode} from "react";
import styles from "./HudHudChatWindow.module.css";
import {createHudHudAiVoicePlayer} from "../lib/hudhud-ai-voice-player";

export type HudHudMessage = {
 id:number; role:"user"|"hudhud"; text:string; image?:string; avatar?:boolean;
 links?:Array<{title:string;href:string}>;
};
type PendingImage = {url:string;name:string}|null;
type SpeechResult = {results:ArrayLike<ArrayLike<{transcript:string}>>};
type SpeechRecognizer = {
 lang:string; continuous:boolean; interimResults:boolean;
 onresult:((event:SpeechResult)=>void)|null;
 onerror:((event:{error?:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void; stop:()=>void; abort?:()=>void;
};
type SpeechConstructor = new()=>SpeechRecognizer;

type Props = {
 messages:HudHudMessage[]; draft:string; onDraftChange:(value:string)=>void;
 onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
 pending:PendingImage; onAttach:(event:ChangeEvent<HTMLInputElement>)=>void;
 onRemoveAttachment:()=>void; sending:boolean; notice:string;
 remaining:number|null; unlocked:boolean; signedIn:boolean; admin:boolean;
 onOpenLab:()=>void; onClose:()=>void; onNewChat:()=>void;
 settingsOpen:boolean; onSettingsChange:(value:boolean)=>void;
 settings:ReactNode;
};

const starters=[
 {title:"Explore the Qur'an",prompt:"Help me find Qur'an learning and reading tools on 1Muslim."},
 {title:"Discover the Ummah",prompt:"How can I discover Muslims and community posts?"},
 {title:"Get started",prompt:"Guide me through the main things I can do on 1Muslim."},
 {title:"Prayer & daily life",prompt:"Where can I find prayer times and Islamic learning on 1Muslim?"}
];

const quickLinks=[{title:"DeepWatch",href:"/deepwatch"},{title:"Go Live",href:"/streaming"},{title:"Qibla",href:"/qibla/newsroom"}];

export default function HudHudChatWindow({
 messages,draft,onDraftChange,onSubmit,pending,onAttach,onRemoveAttachment,sending,notice,
 remaining,unlocked,signedIn,admin,onOpenLab,onClose,onNewChat,
 settingsOpen,onSettingsChange,settings
}:Props){
 const file=useRef<HTMLInputElement>(null);
 const scroll=useRef<HTMLDivElement>(null);
 const compose=useRef<HTMLTextAreaElement>(null);
 const recognizer=useRef<SpeechRecognizer|null>(null);
 const voicePlayer=useRef<ReturnType<typeof createHudHudAiVoicePlayer>|null>(null);
 const voiceBusy=useRef(false);
 const voiceEpoch=useRef(0);
 const [menuOpen,setMenuOpen]=useState(false);
 const [listening,setListening]=useState(false);
 const [voiceError,setVoiceError]=useState("");
 const [copiedId,setCopiedId]=useState<number|null>(null);
 const endDictation=()=>{
  const rec=recognizer.current;
  recognizer.current=null;
  if(rec){rec.onresult=null;rec.onerror=null;rec.onend=null;try{if(rec.abort)rec.abort();else rec.stop()}catch{}}
  setListening(false);
 };

 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  document.body.style.overflow="hidden";
  return()=>{document.body.style.overflow=previousOverflow;endDictation();voiceEpoch.current++;voicePlayer.current?.stop();previousFocus?.focus({preventScroll:true});};
 },[]);

 useEffect(()=>{
  const key=(event:globalThis.KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   if(menuOpen){setMenuOpen(false);return;}
   if(settingsOpen){onSettingsChange(false);return;}
   onClose();
  };
  document.addEventListener("keydown",key);
  return()=>document.removeEventListener("keydown",key);
 },[menuOpen,settingsOpen,onSettingsChange,onClose]);

 useEffect(()=>{
  const element=scroll.current;
  if(element && !settingsOpen)element.scrollTop=element.scrollHeight;
 },[messages,sending,settingsOpen]);

 const choosePrompt=(prompt:string)=>{
  onDraftChange(prompt);onSettingsChange(false);setMenuOpen(false);
  compose.current?.focus();
 };
 const newChat=()=>{voiceEpoch.current++;voicePlayer.current?.stop();voiceBusy.current=false;onNewChat();onSettingsChange(false);setMenuOpen(false);compose.current?.focus();};
 const readAloud=(text:string)=>{
  // Only speak generated voice, and never run dictation at the same time.
  endDictation();
  const epoch=++voiceEpoch.current;
  voiceBusy.current=true;
  const player=voicePlayer.current||(voicePlayer.current=createHudHudAiVoicePlayer());
  void player.play(text).then(played=>{
   if(epoch!==voiceEpoch.current)return;
   voiceBusy.current=false;
   if(!played)setVoiceError("HudHud's AI voice is temporarily unavailable. Please read the answer.");
  });
 };
 const copy=(message:HudHudMessage)=>{
  if(!navigator.clipboard?.writeText)return;
  void navigator.clipboard.writeText(message.text).then(()=>{
   setCopiedId(message.id);window.setTimeout(()=>setCopiedId(null),1600);
  }).catch(()=>setVoiceError("Copy isn't available in this browser."));
 };
 const toggleDictation=()=>{
  setVoiceError("");
  if(voiceBusy.current){setVoiceError("Wait for HudHud to finish speaking before using your microphone.");return;}
  if(listening){recognizer.current?.stop();return;}
  const browser=window as Window & {SpeechRecognition?:SpeechConstructor;webkitSpeechRecognition?:SpeechConstructor};
  const Ctor=browser.SpeechRecognition||browser.webkitSpeechRecognition;
  if(!Ctor){setVoiceError("Voice typing is not supported in this browser. You can still type your message.");return;}
  try{
   const rec=new Ctor();
   rec.lang=document.documentElement.lang==="ar"?"ar-SA":"en-US";
   rec.continuous=false;rec.interimResults=false;
   rec.onresult=(event)=>{
    const words=Array.from(event.results).map(result=>result[0]?.transcript||"").join(" ").trim();
    if(words)onDraftChange([draft,words].filter(Boolean).join(" "));
   };
   rec.onerror=(event)=>{setVoiceError(event.error==="not-allowed"?"Microphone permission was denied.":"Voice typing was interrupted. Try again.");setListening(false);};
   rec.onend=()=>{setListening(false);recognizer.current=null;};
   recognizer.current=rec;rec.start();setListening(true);
  }catch{setVoiceError("Microphone isn't available. Try typing instead.");setListening(false);}
 };
 const onKey=(event:KeyboardEvent<HTMLTextAreaElement>)=>{
  if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){
   event.preventDefault();
   if(!sending&&(draft.trim()||pending))event.currentTarget.form?.requestSubmit();
  }
 };
 const atStart=messages.length<=1;

 return <section className={styles.shell} role="dialog" aria-modal="true" aria-label="HudHud AI conversation">
  <div className={styles.layout}>
   {menuOpen&&<button type="button" className={styles.menuBackdrop} aria-label="Close conversation menu" onClick={()=>setMenuOpen(false)}/>}
   <aside className={styles.sidebar+(menuOpen?" "+styles.sidebarVisible:"")} aria-label="HudHud navigation">
    <div className={styles.brand}>
     <img src="/assets/hudhud-logo.PNG" width={38} height={38} alt=""/>
     <div><strong>HudHud</strong><span>1Muslim AI</span></div>
    </div>
    <button type="button" className={styles.newChat} onClick={newChat}><span aria-hidden="true">＋</span> New conversation</button>
    <div className={styles.sidebarLabel}>YOUR SPACE</div>
    <button type="button" className={styles.currentChat} onClick={()=>{setMenuOpen(false);onSettingsChange(false);}}>✧ <span>Current conversation</span></button>
    <div className={styles.sidebarLabel}>EXPLORE WITH HUDHUD</div>
    <div className={styles.topicList}>{starters.map(item=><button type="button" key={item.title} onClick={()=>choosePrompt(item.prompt)}>{item.title}<span aria-hidden="true">↗</span></button>)}</div>
    <div className={styles.sidebarLabel}>QUICK ACCESS</div>
    <nav className={styles.quickNav} aria-label="1Muslim quick access">{quickLinks.map(item=><Link key={item.href} href={item.href} onClick={onClose}>{item.title}<span aria-hidden="true">↗</span></Link>)}</nav>
    <div className={styles.sidebarBottom}><span className={styles.onlineDot} aria-hidden="true"/> {signedIn?"Signed in to 1Muslim":"Guest conversation"}<small>Conversations aren't saved across visits yet.</small></div>
   </aside>

   <div className={styles.main}>
    <header className={styles.header}>
     <button type="button" className={styles.menuButton} aria-label="Open conversation menu" onClick={()=>setMenuOpen(true)}>☰</button>
     <div className={styles.headerTitle}><strong>HudHud</strong><span>Your Muslim-inspired AI companion</span></div>
     <div className={styles.headerActions}>
      <button type="button" title="New conversation" aria-label="New conversation" onClick={newChat}>＋</button>
      <button type="button" title="HudHud settings" aria-label="HudHud settings" aria-pressed={settingsOpen} onClick={()=>onSettingsChange(!settingsOpen)}>⚙</button>
      <button type="button" title="Close chat" aria-label="Close HudHud" onClick={onClose}>✕</button>
     </div>
    </header>
    {settingsOpen?<div className={styles.settingsView}>
      <div className={styles.settingsHeader}><div><small>PREFERENCES</small><h2>HudHud settings</h2><p>Personalize your assistant without leaving the conversation.</p></div><button type="button" onClick={()=>onSettingsChange(false)}>← Back to chat</button></div>
      <div className={styles.settingsContent}>{settings}{admin&&<button type="button" className={styles.adminLink} onClick={()=>{onSettingsChange(false);onOpenLab();}}>✧ ELMI LIGHT · Owner lab</button>}</div>
     </div>:
     <div ref={scroll} className={styles.scroll} aria-label="Conversation messages">
      <div className={styles.conversation}>
       {atStart&&<div className={styles.welcome}>
        <div className={styles.welcomeLogo}><img src="/assets/hudhud-logo.PNG" alt="" width={72} height={72}/></div>
        <h1>Assalamu alaikum<span className={styles.sparkle}> ✧</span></h1>
        <p>I'm HudHud. What can I help you discover today?</p>
        <div className={styles.starters}>{starters.map(item=><button type="button" key={item.title} onClick={()=>choosePrompt(item.prompt)}><strong>{item.title}</strong><span aria-hidden="true">↗</span></button>)}</div>
       </div>}
       {messages.filter(message=>message.id!==0).map(message=><article key={message.id} className={styles.message+" "+(message.role==="user"?styles.fromUser:styles.fromHudHud)}>
        {message.role==="hudhud"&&<img className={styles.avatar} src="/assets/hudhud-logo.PNG" alt="HudHud" width={30} height={30}/>}
        <div className={styles.messageContent}>
         {message.text&&<div className={styles.messageText}>{message.text}</div>}
         {message.image&&<img className={styles.messageImage} src={message.image} alt="Image attached for local preview"/>}
         {message.avatar&&<Link href="/profile" onClick={onClose} className={styles.resultLink}>Open your profile →</Link>}
         {message.links&&message.links.length>0&&<div className={styles.linkList}>{message.links.map(link=><Link key={link.href} href={link.href} onClick={onClose} className={styles.resultLink}>{link.title} ↗</Link>)}</div>}
         {message.role==="hudhud"&&<div className={styles.messageActions}><button type="button" aria-label="Copy HudHud response" onClick={()=>copy(message)}>{copiedId===message.id?"✓ Copied":"▢ Copy"}</button><button type="button" aria-label="Play HudHud AI-generated voice" onClick={()=>readAloud(message.text)}>◖ Listen</button></div>}
        </div>
       </article>)}
       {sending&&<div className={styles.thinking} role="status"><img src="/assets/hudhud-logo.PNG" width={28} height={28} alt=""/><span>HudHud is thinking</span><i/><i/><i/></div>}
      </div>
     </div>}
    {!settingsOpen&&<div className={styles.composerArea}>
      <form className={styles.composer} onSubmit={onSubmit}>
       {pending&&<div className={styles.attachment}><img src={pending.url} alt="Local attachment preview"/><span>{pending.name}</span><button type="button" onClick={onRemoveAttachment} aria-label="Remove attachment">✕</button></div>}
       <textarea ref={compose} className={styles.input} rows={1} value={draft} onChange={event=>onDraftChange(event.target.value)} onKeyDown={onKey} placeholder="Message HudHud…" aria-label="Message HudHud" maxLength={900}/>
       <div className={styles.composerControls}>
        <div className={styles.composeLeft}>
         <input ref={file} type="file" accept="image/*" hidden onChange={onAttach}/>
         <button type="button" title="Attach image preview" aria-label="Attach image preview" onClick={()=>file.current?.click()}>＋</button>
         <button type="button" className={listening?styles.recording:""} title="Dictate a message" aria-label={listening?"Stop voice typing":"Start voice typing"} aria-pressed={listening} onClick={toggleDictation}>🎙</button>
        </div>
        <button type="submit" className={styles.sendButton} disabled={sending||(!draft.trim()&&!pending)||(remaining===0)} aria-label="Send message">{sending?"···":"↑"}</button>
       </div>
      </form>
      <div className={styles.footerText}>
       <span>HudHud · 1Muslim voice and search</span>
       {remaining===0&&<Link href="/search" onClick={onClose}>Return to Search ↗</Link>}
      </div>
      {(notice||voiceError)&&<div className={styles.notice} role="status">{voiceError||notice}</div>}
      <p className={styles.disclaimer}>AI can make mistakes. Verify important information. Images are preview-only, not analyzed.</p>
     </div>}
   </div>
  </div>
 </section>;
}
