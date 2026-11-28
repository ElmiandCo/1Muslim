"use client";
import {useEffect,useRef,useState,type ChangeEvent} from "react";
import styles from "./HudHudImageStudio.module.css";

type Palette="blue"|"gray"|"yellow"|"red";
type Style="banner"|"outline";
type Props={onClose:()=>void};
const colors:Record<Palette,{light:string;dark:string;lightInk:string;darkInk:string;banner:string;edge:string}>={
 blue:{light:"#e9f3ff",dark:"#071c37",lightInk:"#102d51",darkInk:"#f5f9ff",banner:"#1762b4",edge:"#9dcafd"},
 gray:{light:"#e8ecee",dark:"#20272e",lightInk:"#24313a",darkInk:"#f7f8f9",banner:"#586876",edge:"#bdc9cf"},
 yellow:{light:"#fff6d7",dark:"#332807",lightInk:"#493710",darkInk:"#fff6cb",banner:"#dc970e",edge:"#f8dd86"},
 red:{light:"#fff1f0",dark:"#350d13",lightInk:"#431b20",darkInk:"#fff7f6",banner:"#c51c2c",edge:"#ff9d9e"}
};
const containsArabic=(text:string)=>/[\u0600-\u06ff]/.test(text);

function drawFitted(ctx:CanvasRenderingContext2D,text:string,y:number,maximum:number,starting:number,ink:string,outlined=false){
 if(!text.trim())return;
 let size=starting;
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.direction=containsArabic(text)?"rtl":"ltr";
 do{ctx.font="900 "+size+"px Arial, sans-serif";if(ctx.measureText(text).width<=maximum||size<=34)break;size-=3;}while(size>34);
 ctx.lineWidth=outlined?4:0;ctx.strokeStyle=ink;ctx.fillStyle=outlined?"transparent":ink;
 if(outlined)ctx.strokeText(text,540,y,maximum);else ctx.fillText(text,540,y,maximum);
 ctx.direction="inherit";
}
async function loadImage(source:string){
 return await new Promise<HTMLImageElement>((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>resolve(img);img.onerror=()=>reject(Error("Could not decode image."));
  img.src=source;
 });
}
function cover(ctx:CanvasRenderingContext2D,image:HTMLImageElement){
 const scale=Math.max(1080/image.naturalWidth,1920/image.naturalHeight);
 const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 ctx.drawImage(image,(1080-width)/2,(1920-height)/2,width,height);
}

export default function HudHudImageStudio({onClose}:Props){
 const input=useRef<HTMLInputElement>(null);
 const [palette,setPalette]=useState<Palette>("red");
 const [dark,setDark]=useState(false);
 const [style,setStyle]=useState<Style>("banner");
 const [headline,setHeadline]=useState("Remember Allah ..");
 const [mainText,setMainText]=useState("الله");
 const [subtitle,setSubtitle]=useState("Find Peace In Allah");
 const [searchLabel,setSearchLabel]=useState("Search Islam..");
 const [prompt,setPrompt]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [filePreview,setFilePreview]=useState("");
 const [created,setCreated]=useState("");
 const [loading,setLoading]=useState(false);
 const [exporting,setExporting]=useState(false);
 const [error,setError]=useState("");
 const [feedback,setFeedback]=useState("");
 const [generationMode,setGenerationMode]=useState<"poster"|"ai">("poster");

 useEffect(()=>{
  const sync=()=>{try{setDark(localStorage.getItem("1muslim-theme")==="dark"||document.documentElement.classList.contains("dark"))}catch{}};
  sync();window.addEventListener("1muslim:theme-changed",sync);
  return()=>window.removeEventListener("1muslim:theme-changed",sync);
 },[]);
 useEffect(()=>()=>{if(filePreview)URL.revokeObjectURL(filePreview)},[filePreview]);
 const chooseFile=(event:ChangeEvent<HTMLInputElement>)=>{
  const picked=event.target.files?.[0];if(!picked)return;
  if(!["image/png","image/jpeg","image/webp"].includes(picked.type)||picked.size>3_000_000){
   setError("Choose a PNG, JPEG or WebP image below 3 MB.");event.target.value="";return;
  }
  setFile(picked);setFilePreview(URL.createObjectURL(picked));
  setCreated("");setGenerationMode("ai");setError("");setFeedback("");
 };
 const removeFile=()=>{setFile(null);setFilePreview("");setCreated("");if(input.current)input.current.value=""};
 const generate=async()=>{
  if(!prompt.trim()){setError("Describe the background or edit you want first.");return;}
  setError("");setFeedback("");setLoading(true);
  try{
   const form=new FormData();
   form.set("mode",file?"edit":"generate");
   form.set("prompt",prompt.trim());
   if(file)form.set("image",file,file.name);
   const response=await fetch("/api/hudhud/images",{method:"POST",body:form,credentials:"same-origin",cache:"no-store"});
   const body=await response.json() as {image?:string;error?:string};
   if(!response.ok||!body.image?.startsWith("data:image/png;base64,"))throw Error(body.error||"Image creation failed.");
   setCreated(body.image);setFeedback("Image ready. Your border text remains editable.");
  }catch(caught){setError(caught instanceof Error?caught.message:"Unable to create image.");}
  finally{setLoading(false)}
 };
 const exportPoster=async()=>{
  setError("");setFeedback("");setExporting(true);
  try{
   const option=colors[palette],background=dark?option.dark:option.light,ink=dark?option.darkInk:option.lightInk;
   const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("Image export is unavailable in this browser.");
   ctx.fillStyle=background;ctx.fillRect(0,0,1080,1920);
   const source=created||filePreview;
   if(source){
    const img=await loadImage(source);
    ctx.save();ctx.globalAlpha=.32;cover(ctx,img);ctx.restore();
   }
   ctx.save();ctx.shadowColor="rgba(0,0,0,.12)";ctx.shadowBlur=20;ctx.shadowOffsetY=5;
   drawFitted(ctx,headline,720,985,88,ink);ctx.restore();
   if(style==="banner"){
    ctx.save();ctx.shadowColor=option.edge;ctx.shadowBlur=28;ctx.shadowOffsetY=16;
    ctx.beginPath();ctx.moveTo(166,820);ctx.lineTo(935,820);ctx.quadraticCurveTo(969,820,961,851);
    ctx.lineTo(918,1024);ctx.quadraticCurveTo(912,1053,882,1053);
    ctx.lineTo(130,1053);ctx.quadraticCurveTo(101,1053,107,1021);
    ctx.lineTo(143,854);ctx.quadraticCurveTo(147,820,166,820);ctx.closePath();
    const grad=ctx.createLinearGradient(80,820,970,1050);grad.addColorStop(0,option.banner);grad.addColorStop(1,"#68121f");
    ctx.fillStyle=palette==="red"?grad:option.banner;ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle=option.edge;ctx.stroke();ctx.restore();
    drawFitted(ctx,mainText,944,735,146,"#ffffff");
   }else{
    drawFitted(ctx,mainText,944,735,148,ink,true);
   }
   drawFitted(ctx,subtitle,1130,950,80,ink);
   ctx.save();
   ctx.beginPath();ctx.roundRect(65,1780,950,110,55);
   ctx.fillStyle=background;ctx.fill();
   ctx.lineWidth=2;ctx.strokeStyle=option.edge;ctx.stroke();
   drawFitted(ctx,searchLabel,1836,720,57,ink);
   ctx.restore();
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error("PNG export failed.")),"image/png"));
   const url=URL.createObjectURL(blob),anchor=document.createElement("a");
   anchor.href=url;anchor.download="hudhud-poster.png";document.body.appendChild(anchor);anchor.click();anchor.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),3000);
   setFeedback("Poster exported with clear, editable-source Arabic and border lettering.");
  }catch(caught){setError(caught instanceof Error?caught.message:"Could not export poster.");}
  finally{setExporting(false)}
 };
 const background=created||filePreview;
 return <div className={styles.stage} data-dark={dark} role="region" aria-label="HudHud Image Studio">
  <div className={styles.top}><div><small>HUDHUD · CREATIVE TOOLS</small><h2>Image &amp; Border Text Studio</h2></div>
   <button className={styles.close} type="button" onClick={onClose}>← Back to chat</button></div>
  <div className={styles.body}>
   <div className={styles.previewCard}>
    <div className={styles.poster} data-palette={palette} data-dark={dark} aria-label="Live poster preview">
     {background&&<img className={styles.backgroundImage} src={background} alt="Selected poster background"/>}
     {headline&&<h3 className={styles.posterTitle} dir="auto">{headline}</h3>}
     {mainText&&<div className={styles.banner+(style==="outline"?" "+styles.outline:"")}><span dir="auto">{mainText}</span></div>}
     {subtitle&&<p className={styles.posterSubtitle} dir="auto">{subtitle}</p>}
     {searchLabel&&<div className={styles.searchVisual} dir="auto">{searchLabel}</div>}
    </div>
    <p className={styles.note}>Preview: 9:16 story format · Arabic and other text use real browser fonts, not AI-drawn lettering.</p>
   </div>
   <div className={styles.controls}>
    <div className={styles.row}><button type="button" className={styles.choice} aria-pressed={generationMode==="poster"} onClick={()=>setGenerationMode("poster")}>Text poster</button>
     <button type="button" className={styles.choice} aria-pressed={generationMode==="ai"} onClick={()=>setGenerationMode("ai")}>AI background / edit</button></div>
    <div className={styles.field}>Background color
     <div className={styles.palette}>{(["blue","gray","yellow","red"] as const).map(color=>
      <button key={color} type="button" className={styles.swatch+" "+styles[color]} aria-pressed={palette===color} aria-label={color+" background"} title={color} onClick={()=>setPalette(color)}/>)}</div>
    </div>
    <label className={styles.field}>Headline<input maxLength={48} dir="auto" value={headline} onChange={e=>setHeadline(e.target.value)}/></label>
    <label className={styles.field}>Bordered text / Arabic<input maxLength={35} dir="auto" value={mainText} onChange={e=>setMainText(e.target.value)}/></label>
    <div className={styles.row}><button className={styles.choice} type="button" aria-pressed={style==="banner"} onClick={()=>setStyle("banner")}>Solid banner</button>
     <button className={styles.choice} type="button" aria-pressed={style==="outline"} onClick={()=>setStyle("outline")}>Outlined text</button></div>
    <label className={styles.field}>Supporting message<input maxLength={54} dir="auto" value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></label>
    <label className={styles.field}>Footer / search label<input maxLength={40} dir="auto" value={searchLabel} onChange={e=>setSearchLabel(e.target.value)}/></label>
    {generationMode==="ai"&&<>
     <label className={styles.field}>Photo to edit (optional)<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile}/></label>
     {file&&<button className={styles.choice} type="button" onClick={removeFile}>Remove {file.name}</button>}
     <label className={styles.field}>Tell HudHud what to create or change<textarea maxLength={1200} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Example: Create a peaceful sky at sunrise with soft light and plenty of space for a message."/></label>
     <button className={styles.primary} type="button" onClick={()=>void generate()} disabled={loading}>{loading?"Creating image…":file?"Edit image with HudHud":"Generate AI background"}</button>
     <p className={styles.note}>Images are sent to the AI provider only when you select Generate/Edit. Daily generation limits apply. New background results stay on this device until you export them.</p>
    </>}
    <button className={styles.primary} type="button" onClick={()=>void exportPoster()} disabled={exporting||loading}>{exporting?"Preparing PNG…":"Export poster · PNG"}</button>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    {feedback&&<p className={styles.note} role="status">{feedback}</p>}
   </div>
  </div>
 </div>;
}
