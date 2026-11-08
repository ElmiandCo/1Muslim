"use client";
import {useState} from "react";
import {createClient} from "../../../utils/supabase/client";
export type Publication="article"|"newsletter";
export type Layout="cover"|"gallery"|"motion";
export type Media={type:"image"|"video";url:string;caption?:string};
export type StorySection={heading:string;subtitle:string;body:string};
export type Design={layout:Layout;media:Media[];columns?:"single"|"double"|"mixed";sections?:StorySection[];subtitles?:string[]};
export const templates:Record<Publication,{id:Layout;name:string;description:string;slots:("image"|"video")[]}[]>={
 article:[
  {id:"cover",name:"Cover Story",description:"Youth magazine · bold hero and image-led narrative",slots:["image","image","image","image"]},
  {id:"gallery",name:"Photo Essay",description:"Youth magazine · visual gallery and short editorial sections",slots:["image","image","image","video"]},
  {id:"motion",name:"Culture & Motion",description:"Youth magazine · cinematic mixed-media feature",slots:["image","video","video"]},
 ],
 newsletter:[
  {id:"cover",name:"Front Page",description:"News desk · lead report and supporting photography",slots:["image","image","image","image"]},
  {id:"gallery",name:"Field Report",description:"News desk · evidence-first photo and video coverage",slots:["image","image","image","video"]},
  {id:"motion",name:"Video Briefing",description:"News desk · two video reports with a context photograph",slots:["image","video","video"]},
 ]};
export const MARKER="\n\n<!-- 1QIBLA_EDITORIAL_DESIGN:";
export function unpack(raw:string):{body:string;design:Design}{
 const pos=raw.lastIndexOf(MARKER);
 if(pos<0)return {body:raw,design:{layout:"cover",media:[]}};
 try{const parsed=JSON.parse(raw.slice(pos+MARKER.length).split(" -->")[0]) as Design;if(!["cover","gallery","motion"].includes(parsed.layout)||!Array.isArray(parsed.media))throw Error();return {body:raw.slice(0,pos),design:parsed}}catch{return {body:raw,design:{layout:"cover",media:[]}}}
}
export function pack(body:string,design:Design){return body+MARKER+JSON.stringify(design)+" -->"}
export default function PublicationDesigner({kind,design,onChange,disabled,title="",subtitle="",body=""}:{kind:Publication;design:Design;onChange:(d:Design)=>void;disabled:boolean;title?:string;subtitle?:string;body?:string}){
 const [showPreview,setShowPreview]=useState(true);
 const [uploadingSlot,setUploadingSlot]=useState<number|null>(null);
 const [uploadError,setUploadError]=useState("");
 const uploadSlot=async(file:File,index:number,slots:("image"|"video")[])=>{
  if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)){setUploadError("Use JPG, PNG, WebP or GIF.");return}
  if(file.size>15*1024*1024){setUploadError("Maximum image size is 15 MB.");return}
  setUploadingSlot(index);setUploadError("");
  try{
   const db=createClient();const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error("Sign in to upload images.");
   const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"} as Record<string,string>)[file.type];
   const key=`${user.id}/qibla-${Date.now()}-${crypto.randomUUID()}.${ext}`;
   const {error}=await db.storage.from("qibla-editorial-media").upload(key,file,{contentType:file.type,upsert:false,cacheControl:"3600"});if(error)throw error;
   const {data}=db.storage.from("qibla-editorial-media").getPublicUrl(key);
   const media=slots.map((slot,n)=>n===index?{...design.media[n],type:"image" as const,url:data.publicUrl}:design.media[n]?.type===slot?design.media[n]:{type:slot,url:""});
   onChange({...design,media});
  }catch(e){setUploadError(e instanceof Error?e.message:"Image upload failed.")}finally{setUploadingSlot(null)}
 };

 const options=templates[kind];const chosen=options.find(x=>x.id===design.layout)||options[0];
 const slots=design.media.length?design.media.map(m=>m.type):chosen.slots;
 const updateLayout=(layout:Layout)=>{const next=options.find(t=>t.id===layout)||options[0];onChange({...design,layout,media:next.slots.map((type,i)=>design.media[i]?.type===type?design.media[i]:{type,url:""}),sections:design.sections||[]})};
 const addMedia=(type:"image"|"video")=>onChange({...design,media:[...slots.map((slot,i)=>design.media[i]||{type:slot,url:""}),{type,url:""}]});
 const removeMedia=(i:number)=>onChange({...design,media:slots.filter((_,n)=>n!==i).map((slot,n)=>design.media[n>=i?n+1:n]||{type:slot,url:""})});
 return <section className={"publicationDesigner "+(kind==="article"?"magazineDesigner":"newsletterDesigner")}>
 <div className="designerHead"><span>{kind==="article"?"◆ THE MAGAZINE · YOUTH EDITION":"● THE NEWSLETTER · NEWS DESK"}</span><strong>02 / Choose your layout</strong></div>
 <div className="templateGrid">{options.map(t=><button type="button" disabled={disabled} key={t.id} className={design.layout===t.id?"chosen":""} onClick={()=>updateLayout(t.id)} aria-pressed={design.layout===t.id}><span className={"templateThumb "+t.id}><i/><i/><i/></span><b>{t.name}</b><small>{t.description}</small><em>{t.slots.filter(s=>s==="image").length} photos · {t.slots.filter(s=>s==="video").length} videos</em></button>)}</div>
 <div className="designerPreviewPosition"><button type="button" className="previewToggle" onClick={()=>setShowPreview(!showPreview)}>{showPreview?"Hide":"Show"} layout preview ↗</button>
 {showPreview&&<div className={"layoutPreview "+design.layout}><div className="previewKicker">{kind==="article"?"1MUSLIM MAGAZINE":"1MUSLIM NEWSLETTER"}</div><h3>{title.trim()||chosen.name}</h3>{subtitle.trim()&&<h4 className="previewSubtitle">{subtitle}</h4>}<div className="previewMedia">{slots.map((slot,i)=><div key={i} className={slot}><span>{slot==="image"?"PHOTO":"▶ VIDEO"} {i+1}</span>{slot==="image"&&design.media[i]?.url&&<img alt="" src={design.media[i].url}/>} {slot==="video"&&design.media[i]?.url&&<video controls playsInline preload="metadata" src={design.media[i].url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>)}</div>{design.media.some(m=>m.caption?.trim())&&<div className="previewCaptions">{design.media.map((m,i)=>m.caption?.trim()?<p key={i}>PHOTO {i+1} — {m.caption}</p>:null)}</div>}{body.trim()?<p className="previewBody">{body}</p>:<p>{kind==="article"?"A vibrant visual story with editorial personality.":"A structured newsroom report built for clarity and trust."}</p>}{(design.sections||[]).map((s,i)=><div className="previewStorySection" key={i}>{s.heading&&<h4>{s.heading}</h4>}{s.subtitle&&<strong>{s.subtitle}</strong>}{s.body&&<p>{s.body}</p>}</div>)}</div>}
</div>
 <div className="designerHead"><strong>03 / Add media & captions</strong><span>{slots.length} media blocks · add as many as you need</span></div>
 <div className="mediaGrid">{slots.map((type,i)=><label key={i}>{type==="image"?"▧ PHOTO":"▷ VIDEO"} {i+1}<input disabled={disabled} type="url" inputMode="url" placeholder={type==="image"?"https://…image.jpg":"https://…video.mp4 or YouTube link"} value={design.media[i]?.type===type?design.media[i].url:""} onChange={e=>{const media=slots.map((slot,n)=>({type:slot,url:n===i?e.target.value:design.media[n]?.type===slot?design.media[n].url:""}));onChange({...design,media})}}/>{type==="image"&&<span className="uploadControl">📷 Upload photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled||uploadingSlot!==null} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadSlot(file,i,slots);e.currentTarget.value=""}}/></span>}{!disabled&&<button type="button" onClick={()=>removeMedia(i)} aria-label={"Remove media "+(i+1)}>× Remove</button>}{type==="image"&&<input disabled={disabled} placeholder="Caption beneath this photo" value={design.media[i]?.caption||""} onChange={e=>{const media=slots.map((slot,n)=>({type:slot,url:design.media[n]?.url||"",caption:n===i?e.target.value:design.media[n]?.caption||""}));onChange({...design,media})}}/>}</label>)}</div>{uploadError&&<p role="alert">{uploadError}</p>}{uploadingSlot!==null&&<p role="status">Uploading photo…</p>}<div className="mediaAdd"><button type="button" disabled={disabled} onClick={()=>addMedia("image")}>＋ Image</button><button type="button" disabled={disabled} onClick={()=>addMedia("video")}>＋ Video</button></div>
 <div className="designerHead"><strong>04 / Story sections & subtitles</strong><span>Arrange the narrative for your template</span></div><div className="sectionFields">{(design.sections||[]).map((section,i)=><div key={i}><strong>Section {i+1}</strong><input disabled={disabled} placeholder="Section heading" value={section.heading} onChange={e=>onChange({...design,sections:(design.sections||[]).map((s,n)=>n===i?{...s,heading:e.target.value}:s)})}/><input disabled={disabled} placeholder="Section subtitle" value={section.subtitle} onChange={e=>onChange({...design,sections:(design.sections||[]).map((s,n)=>n===i?{...s,subtitle:e.target.value}:s)})}/><textarea disabled={disabled} placeholder="Section body" rows={4} value={section.body} onChange={e=>onChange({...design,sections:(design.sections||[]).map((s,n)=>n===i?{...s,body:e.target.value}:s)})}/><button type="button" disabled={disabled} onClick={()=>onChange({...design,sections:(design.sections||[]).filter((_,n)=>n!==i)})}>Remove section</button></div>)}<button type="button" disabled={disabled} onClick={()=>onChange({...design,sections:[...(design.sections||[]),{heading:"",subtitle:"",body:""}]})}>＋ Add body section</button></div> <style jsx>{`
 .publicationDesigner{--accent:#e7a0c6;--panel:#271525;margin:24px 0;padding:20px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:20px;background:linear-gradient(145deg,var(--panel),#181325);color:#f7f2f5}.newsletterDesigner{--accent:#7db8e9;--panel:#10243b}.designerHead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0 16px;font-size:11px;letter-spacing:.09em}.designerHead span{color:var(--accent)}.templateGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.templateGrid button{display:flex;flex-direction:column;gap:7px;text-align:left;border:1px solid #ffffff30;background:#ffffff08;color:inherit;border-radius:15px;padding:10px;min-width:0}.templateGrid button.chosen{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 8px 25px #0005}.templateGrid small{font-size:11px;opacity:.8;line-height:1.4}.templateGrid em{font-size:10px;font-style:normal;color:var(--accent)}.templateThumb{height:74px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;width:100%}.templateThumb i{background:color-mix(in srgb,var(--accent) 50%,#233a3b);border-radius:4px}.templateThumb i:first-child{grid-row:span 2}.templateThumb.gallery i:first-child{grid-row:auto;grid-column:span 2}.templateThumb.motion i:last-child{grid-row:span 2}.mediaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mediaGrid label{font-size:11px;letter-spacing:.08em;color:var(--accent)}.mediaGrid input{width:100%;box-sizing:border-box;display:block;margin-top:8px;border:1px solid #ffffff40;border-radius:10px;padding:12px;background:#161120;color:white;font-size:14px}.mediaAdd{display:flex;gap:10px;margin:14px 0 26px}.mediaAdd button,.mediaGrid button{border:1px solid var(--accent);border-radius:10px;background:transparent;color:var(--accent);padding:8px 12px;margin-top:8px}.sectionFields{display:grid;gap:12px}.sectionFields>div{border:1px solid #ffffff30;border-radius:12px;padding:12px}.sectionFields input,.sectionFields textarea{display:block;width:100%;box-sizing:border-box;margin:9px 0;padding:10px;border:1px solid #ffffff35;border-radius:9px;background:#161120;color:white}.sectionFields button{border:1px solid var(--accent);border-radius:10px;background:transparent;color:var(--accent);padding:8px 12px}.previewToggle{margin:18px 0;border:1px solid var(--accent);border-radius:30px;padding:9px 14px;background:transparent;color:var(--accent)}.layoutPreview{border:1px solid #ffffff35;border-radius:15px;padding:20px;background:#ffffff09}.previewKicker{font-size:10px;letter-spacing:.22em;color:var(--accent)}.layoutPreview h3{font-family:Georgia,serif;font-size:28px;margin:8px 0 15px}.previewMedia{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.previewMedia>div{min-height:80px;background:#ffffff16;border-radius:8px;display:grid;place-items:center;position:relative;overflow:hidden}.previewMedia>div:first-child{grid-row:span 2}.previewMedia img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.previewMedia span{z-index:1;text-shadow:0 1px 8px #000}.layoutPreview.gallery .previewMedia>div:first-child{grid-row:auto;grid-column:span 2}.layoutPreview.motion .previewMedia>div:last-child{grid-row:span 2}.layoutPreview p{opacity:.8;font-size:12px}.designerPreviewPosition{margin:14px 0 24px}.previewSubtitle{font-family:Georgia,serif;font-size:17px;font-weight:400;margin:0 0 18px;opacity:.85}.previewBody{white-space:pre-wrap;line-height:1.6}.previewStorySection{border-top:1px solid #ffffff30;padding:14px 0}.previewStorySection h4{margin:0 0 8px;font-family:Georgia,serif}.previewStorySection strong{font-size:12px;color:var(--accent)}.previewCaptions p{font-style:italic}.previewVideoReady{font-size:12px;color:var(--accent)}@media(max-width:600px){.templateGrid{grid-template-columns:1fr 1fr}.mediaGrid{grid-template-columns:1fr}.templateThumb{height:55px}.publicationDesigner{padding:14px}}
 
/* Paper-style layout builder; separate blue accent for newsletter. */
.publicationDesigner{--accent:#245d8a;--panel:#fff;background:#fff;color:#1b3448;border:1px solid #d1dce4;box-shadow:0 12px 32px #18324912}
.newsletterDesigner{--accent:#184e79;--panel:#fff}
.templateGrid button{background:#f8fafb;color:#19384f;border-color:#d1dce4}
.templateGrid button.chosen{background:#eaf3f9;box-shadow:0 0 0 1px var(--accent),0 6px 18px #173c6014}
.templateThumb i{background:#b7c8d4}
.mediaGrid input,.sectionFields input,.sectionFields textarea{background:#fff;color:#172c3d;border-color:#bacbd6}
.sectionFields>div{background:#fbfcfd;border-color:#d0dce5}
.layoutPreview{background:#f8fafb;border-color:#cbd8e1;color:#1b3448}
.previewMedia>div{background:#dce6ec;color:#183a53}
.previewStorySection{border-top-color:#ccd9e1}
.previewMedia span{text-shadow:none}

`}</style></section>
}