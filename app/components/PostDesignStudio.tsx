"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
import styles from "./PostDesignStudio.module.css";

type Theme="emerald"|"gold"|"midnight"|"ivory";
type Template="reflection"|"reminder"|"verse"|"hadith"|"question"|"announcement";
type Motion="none"|"glow"|"float";
const templates:Template[]=["reflection","reminder","verse","hadith","question","announcement"];
const themes:Theme[]=["emerald","gold","midnight","ivory"];
const draftKey="1muslim-home-community-draft";
const badLanguage=(value:string)=>/(^|[^a-z])f[\\W_]*u[\\W_]*c[\\W_]*k(?:[\\W_]*(?:s|e[\\W_]*d|i[\\W_]*n[\\W_]*g))?(?=$|[^a-z])/i.test(value.normalize("NFKC"));
export default function PostDesignStudio(){
 const router=useRouter();
 const [text,setText]=useState("");const [theme,setTheme]=useState<Theme>("emerald");const [template,setTemplate]=useState<Template>("reflection");const [motion,setMotion]=useState<Motion>("none");
 const [panel,setPanel]=useState<"design"|"post"|"share">("post");const [tool,setTool]=useState<"background"|"template"|"effects"|"media"|null>(null);
 const [daily,setDaily]=useState(false);const [eligible,setEligible]=useState(false);const [checked,setChecked]=useState(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");const [confirm,setConfirm]=useState(false);
 const [media,setMedia]=useState<{url:string;type:"image"|"video";name:string}|null>(null);
 const mediaRef=useRef<HTMLInputElement>(null);const editorRef=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{try{setText(sessionStorage.getItem(draftKey)||"");const raw=localStorage.getItem("1muslim:post-design:v1");if(raw){const saved=JSON.parse(raw);if(themes.includes(saved.theme))setTheme(saved.theme);if(templates.includes(saved.template))setTemplate(saved.template);if(["none","glow","float"].includes(saved.motion))setMotion(saved.motion)}}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem("1muslim:post-design:v1",JSON.stringify({theme,template,motion}))}catch{}},[theme,template,motion]);
 useEffect(()=>{let active=true;const check=async()=>{try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!active)return;if(!user){setEligible(true);setDaily(true);setChecked(true);return}
 const now=new Date();const midnight=new Date(now);midnight.setHours(0,0,0,0);
 const {data,error}=await db.from("ummah_feed_posts").select("id,created_at").eq("author_id",user.id).gte("created_at",new Date(now.getTime()-86400000).toISOString()).order("created_at",{ascending:false}).limit(100);
 if(error)throw error;const allowed=!(data||[]).some(p=>new Date(p.created_at)>=midnight)&&(data||[]).length<2;setEligible(allowed);setDaily(allowed);setChecked(true);
 }catch{if(active){setEligible(false);setDaily(false);setChecked(true)}}};void check();const refresh=()=>void check();window.addEventListener("1muslim:community-post-published",refresh);const interval=setInterval(refresh,60000);return()=>{active=false;clearInterval(interval);window.removeEventListener("1muslim:community-post-published",refresh)}},[]);
 useEffect(()=>{const handle=(event:Event)=>{const mode=(event as CustomEvent<{mode:string}>).detail?.mode;if(mode==="daily"&&eligible)setDaily(true);if(mode==="regular")setDaily(false);setPanel("post");editorRef.current?.focus()};window.addEventListener("hudhud-compose",handle);return()=>window.removeEventListener("hudhud-compose",handle)},[eligible]);
 useEffect(()=>()=>{if(media)URL.revokeObjectURL(media.url)},[media]);
 const selectMedia=(file?:File)=>{if(!file)return;if(file.size>25*1024*1024){setError("Choose a file smaller than 25 MB.");return}if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")){setError("Choose an image or video.");return}setError("");setMedia({url:URL.createObjectURL(file),type:file.type.startsWith("image/")?"image":"video",name:file.name});setTool(null)};
 const publish=async()=>{if(!text.trim()||busy)return;if(media){setError("Media publishing is not connected yet. Remove the attachment to publish a text post.");return}if(badLanguage(text)){setError("Please revise the language before sharing.");setPanel("post");return}
 setBusy(true);setError("");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){sessionStorage.setItem(draftKey,text);router.push("/auth?next="+encodeURIComponent("/?compose=1"));return}
 const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:daily?"✦ DAILY UMMAH ✦\\n"+text.trim():text.trim()})});const data=await response.json();if(!response.ok)throw Error(data.error||"Unable to publish");
 if(data.flagged&&data.removed)throw Error("Your post was removed for review.");sessionStorage.removeItem(draftKey);setText("");setConfirm(false);setPanel("post");setEligible(false);setDaily(false);setNotice("✦ Shared with the Ummah!");window.dispatchEvent(new Event("1muslim:community-post-published"));
 }catch(e){setError(e instanceof Error?e.message:"Unable to publish")}finally{setBusy(false)}};
 const updateText=(value:string)=>{setText(value);try{sessionStorage.setItem(draftKey,value)}catch{}};
 const title={reflection:"A moment of reflection",reminder:"A gentle reminder",verse:"Qur'an reflection",hadith:"Hadith reflection",question:"A question for the Ummah",announcement:"Community announcement"}[template];
 return <section className={styles.studio} aria-label="Create post">
 <div className={styles.header}><strong>Create Post</strong><button type="button" className={styles.postButton} disabled={!text.trim()||busy} onClick={()=>setConfirm(true)}>{busy?"Posting…":"Post"}</button></div>
 <div className={styles.identity}><div className={styles.avatar}>1</div><div><strong>1Muslim</strong><span>◎ Public (Ummah)</span></div></div>
 <div className={styles.composer}><textarea ref={editorRef} maxLength={2000} aria-label="What's on your mind?" placeholder="What's on your mind?" value={text} onChange={e=>updateText(e.target.value)} /><span className={styles.counter}>{text.length} / 2000</span></div>
 {media&&<div className={styles.attachment}>{media.type==="image"?<img src={media.url} alt="Attachment preview"/>:<video src={media.url} controls playsInline/>}<button type="button" onClick={()=>setMedia(null)}>Remove {media.name} ×</button></div>}
 <div className={styles.attachments}><button type="button" onClick={()=>mediaRef.current?.click()}><span>▧</span>Photo</button><button type="button" onClick={()=>mediaRef.current?.click()}><span>▣</span>Video</button><button type="button" onClick={()=>setError("File attachments are not available for publishing yet.")}><span>▤</span>File</button><button type="button" onClick={()=>router.push("/elm-tent/quran")}><span>۞</span>Verse</button></div>
 <div className={styles.options}><div><span>✦</span>Post type <button type="button" onClick={()=>setDaily(!daily)}>{daily&&eligible?"Daily":"Regular"} ⌄</button></div><div><span>◎</span>Audience <strong>Public (Ummah)</strong></div></div>
 {eligible&&checked&&<p className={styles.hint}>Daily posts earn XP. Choose Daily under Post type to publish your daily post.</p>}
 <input ref={mediaRef} type="file" accept="image/*,video/*" className={styles.hidden} onChange={e=>selectMedia(e.target.files?.[0])}/>
 {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
  {confirm&&<div className={styles.confirmBackdrop} role="presentation"><div className={styles.confirmDialog} role="dialog" aria-modal="true" aria-label="Confirm post"><strong>Ready to share?</strong><p>Publish this {daily&&eligible?"Daily":"Regular"} post to the Ummah feed?</p><div><button type="button" onClick={()=>setConfirm(false)}>Keep editing</button><button type="button" disabled={busy} onClick={()=>void publish()}>{busy?"Publishing…":"Publish now ↗"}</button></div></div></div>}
 </section>;
}
