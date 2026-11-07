"use client";
import {useState} from "react";
export type Publication="article"|"newsletter";
export type Layout="cover"|"gallery"|"motion";
export type Media={type:"image"|"video";url:string};
export type Design={layout:Layout;media:Media[]};
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
export default function PublicationDesigner({kind,design,onChange,disabled}:{kind:Publication;design:Design;onChange:(d:Design)=>void;disabled:boolean}){
 const [showPreview,setShowPreview]=useState(true);
 const options=templates[kind];const chosen=options.find(x=>x.id===design.layout)||options[0];
 const updateLayout=(layout:Layout)=>onChange({layout,media:[]});
 return <section className={"publicationDesigner "+(kind==="article"?"magazineDesigner":"newsletterDesigner")}>
 <div className="designerHead"><span>{kind==="article"?"◆ THE MAGAZINE · YOUTH EDITION":"● THE NEWSLETTER · NEWS DESK"}</span><strong>02 / Choose your layout</strong></div>
 <div className="templateGrid">{options.map(t=><button type="button" disabled={disabled} key={t.id} className={design.layout===t.id?"chosen":""} onClick={()=>updateLayout(t.id)} aria-pressed={design.layout===t.id}><span className={"templateThumb "+t.id}><i/><i/><i/></span><b>{t.name}</b><small>{t.description}</small><em>{t.slots.filter(s=>s==="image").length} photos · {t.slots.filter(s=>s==="video").length} videos</em></button>)}</div>
 <div className="designerHead"><strong>03 / Add media</strong><span>{chosen.slots.length} slots · URL links for now</span></div>
 <div className="mediaGrid">{chosen.slots.map((type,i)=><label key={i}>{type==="image"?"▧ PHOTO":"▷ VIDEO"} {i+1}<input disabled={disabled} type="url" inputMode="url" placeholder={type==="image"?"https://…image.jpg":"https://…video.mp4 or YouTube link"} value={design.media[i]?.type===type?design.media[i].url:""} onChange={e=>{const media=chosen.slots.map((slot,n)=>({type:slot,url:n===i?e.target.value:design.media[n]?.type===slot?design.media[n].url:""}));onChange({...design,media})}}/></label>)}</div>
 <button type="button" className="previewToggle" onClick={()=>setShowPreview(!showPreview)}>{showPreview?"Hide":"Show"} layout preview ↗</button>
 {showPreview&&<div className={"layoutPreview "+design.layout}><div className="previewKicker">{kind==="article"?"1MUSLIM MAGAZINE":"1MUSLIM NEWSLETTER"}</div><h3>{chosen.name}</h3><div className="previewMedia">{chosen.slots.map((slot,i)=><div key={i} className={slot}><span>{slot==="image"?"PHOTO":"▶ VIDEO"} {i+1}</span>{slot==="image"&&design.media[i]?.url&&<img alt="" src={design.media[i].url}/>}</div>)}</div><p>{kind==="article"?"A vibrant visual story with editorial personality.":"A structured newsroom report built for clarity and trust."}</p></div>}
 <style jsx>{`
 .publicationDesigner{--accent:#e7a0c6;--panel:#271525;margin:24px 0;padding:20px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:20px;background:linear-gradient(145deg,var(--panel),#0b1614);color:#f7f2f5}.newsletterDesigner{--accent:#7db8e9;--panel:#10243b}.designerHead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0 16px;font-size:11px;letter-spacing:.09em}.designerHead span{color:var(--accent)}.templateGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.templateGrid button{display:flex;flex-direction:column;gap:7px;text-align:left;border:1px solid #ffffff30;background:#ffffff08;color:inherit;border-radius:15px;padding:10px;min-width:0}.templateGrid button.chosen{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 8px 25px #0005}.templateGrid small{font-size:11px;opacity:.8;line-height:1.4}.templateGrid em{font-size:10px;font-style:normal;color:var(--accent)}.templateThumb{height:74px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;width:100%}.templateThumb i{background:color-mix(in srgb,var(--accent) 50%,#233a3b);border-radius:4px}.templateThumb i:first-child{grid-row:span 2}.templateThumb.gallery i:first-child{grid-row:auto;grid-column:span 2}.templateThumb.motion i:last-child{grid-row:span 2}.mediaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mediaGrid label{font-size:11px;letter-spacing:.08em;color:var(--accent)}.mediaGrid input{width:100%;box-sizing:border-box;display:block;margin-top:8px;border:1px solid #ffffff40;border-radius:10px;padding:12px;background:#050e11;color:white;font-size:14px}.previewToggle{margin:18px 0;border:1px solid var(--accent);border-radius:30px;padding:9px 14px;background:transparent;color:var(--accent)}.layoutPreview{border:1px solid #ffffff35;border-radius:15px;padding:20px;background:#ffffff09}.previewKicker{font-size:10px;letter-spacing:.22em;color:var(--accent)}.layoutPreview h3{font-family:Georgia,serif;font-size:28px;margin:8px 0 15px}.previewMedia{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.previewMedia>div{min-height:80px;background:#ffffff16;border-radius:8px;display:grid;place-items:center;position:relative;overflow:hidden}.previewMedia>div:first-child{grid-row:span 2}.previewMedia img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.previewMedia span{z-index:1;text-shadow:0 1px 8px #000}.layoutPreview.gallery .previewMedia>div:first-child{grid-row:auto;grid-column:span 2}.layoutPreview.motion .previewMedia>div:last-child{grid-row:span 2}.layoutPreview p{opacity:.8;font-size:12px}@media(max-width:600px){.templateGrid{grid-template-columns:1fr 1fr}.mediaGrid{grid-template-columns:1fr}.templateThumb{height:55px}.publicationDesigner{padding:14px}}
 `}</style></section>
}