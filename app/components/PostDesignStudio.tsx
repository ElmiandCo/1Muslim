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
 return <section className={styles.studio} aria-label="Design Post Share studio">
  <div className={styles.header}><span>✦ POST STUDIO</span><span lang="ar">صمّم · اكتب · شارك</span></div>
  <div className={styles.steps} role="tablist" aria-label="Post creation steps">{(["design","post","share"] as const).map((step,i)=><button key={step} type="button" role="tab" aria-selected={panel===step} onClick={()=>{setPanel(step);setTool(null)}}><small>0{i+1}</small> {step.toUpperCase()}</button>)}</div>
  <div className={styles.previewArea}><div className={styles.floating} data-theme={theme} data-motion={motion} data-template={template}>
   <span className={styles.accent} aria-hidden="true">۞</span><div className={styles.previewTop}><span>✦ 1MUSLIM</span><span>{template.toUpperCase()}</span></div>
   <span className={styles.previewTitle}>{title}</span>
   <textarea ref={editorRef} aria-label="Write your post directly on the preview" maxLength={2000} placeholder="What's on your mind? Tap to write…" value={text} onFocus={()=>setPanel("post")} onChange={e=>updateText(e.target.value)} className={styles.editor}/>
   {media&&(media.type==="image"?<img className={styles.media} src={media.url} alt="Attached preview"/>:<video className={styles.media} src={media.url} controls playsInline/>)}
   <div className={styles.previewBottom}><span>✧</span><span>{text.length} / 2000</span></div>
  </div></div>
  {panel==="design"&&<div className={styles.toolArea}><div className={styles.tools}>{(["background","template","effects","media"] as const).map((name)=><button type="button" key={name} aria-pressed={tool===name} onClick={()=>{setTool(tool===name?null:name);if(name==="media")mediaRef.current?.click()}}>{name==="background"?"◐":name==="template"?"▦":name==="effects"?"✧":"＋"} <span>{name}</span></button>)}</div>
   {tool==="background"&&<div className={styles.choices}>{themes.map(name=><button type="button" key={name} aria-pressed={theme===name} onClick={()=>setTheme(name)}>{name}</button>)}</div>}
   {tool==="template"&&<div className={styles.choices}>{templates.map(name=><button type="button" key={name} aria-pressed={template===name} onClick={()=>setTemplate(name)}>{name}</button>)}</div>}
   {tool==="effects"&&<div className={styles.choices}>{(["none","glow","float"] as const).map(name=><button type="button" key={name} aria-pressed={motion===name} onClick={()=>setMotion(name)}>{name}</button>)}</div>}
   {media&&<button type="button" className={styles.removeMedia} onClick={()=>setMedia(null)}>Remove attachment · {media.name}</button>}
   <p className={styles.hint}>Live preview · visual styles are draft-only until feed rendering is enabled.</p>
  </div>}
  {panel==="post"&&<div className={styles.toolArea}><div className={styles.quickRow}><span>Tap the floating card to write</span><button type="button" onClick={()=>editorRef.current?.focus()}>✎ Edit text</button></div><div className={styles.choices}>{eligible&&checked&&<button type="button" aria-pressed={daily} onClick={()=>setDaily(true)}>✦ Daily</button>}<button type="button" aria-pressed={!daily} onClick={()=>setDaily(false)}>Regular</button><button type="button" onClick={()=>{setPanel("design");setTool("background")}}>◐ Customize</button></div></div>}
  {panel==="share"&&<div className={styles.toolArea}><div className={styles.quickRow}><span>{daily&&eligible?"✦ Daily Ummah Post":"Community Post"} · Public</span><span>{text.trim().length?"Ready to share":"Write something first"}</span></div><p className={styles.hint}>Your text will publish to the Ummah feed. Custom styling is preview-only for now.</p></div>}
  <input ref={mediaRef} type="file" accept="image/*,video/*" className={styles.hidden} onChange={e=>selectMedia(e.target.files?.[0])}/>
  {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
  <div className={styles.footer}>{panel!=="share"?<button type="button" className={styles.share} onClick={()=>{setPanel("share");setTool(null)}}>Review & Share ↗</button>:<><button type="button" className={styles.back} onClick={()=>setPanel("post")}>← Edit</button><button type="button" className={styles.share} disabled={!text.trim()||busy} onClick={()=>setConfirm(true)}>Share with Ummah ↗</button></>}</div>
  {confirm&&<div className={styles.confirmBackdrop} role="presentation"><div className={styles.confirmDialog} role="dialog" aria-modal="true" aria-label="Confirm post"><strong>Ready to share?</strong><p>Publish this {daily&&eligible?"Daily":"Regular"} post to the Ummah feed?</p><div><button type="button" onClick={()=>setConfirm(false)}>Keep editing</button><button type="button" disabled={busy} onClick={()=>void publish()}>{busy?"Publishing…":"Publish now ↗"}</button></div></div></div>}
 </section>;
}
