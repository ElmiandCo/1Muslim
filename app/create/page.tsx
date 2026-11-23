"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {animatePhoto} from "./photo-export";
import Link from "next/link";
import styles from "./creator-studio.module.css";
import {createClient} from "../../utils/supabase/client";
import {Upload} from "tus-js-client";
import {compressVideo} from "./video-compression";

type Mode="camera"|"create"|"live";
type StudioAsset={id:string;kind:"theme"|"filter"|"sound";slug:string;title:string;description:string;category:string;config:Record<string,unknown>;storage_path:string|null;attribution:string|null;license_name:string|null};
type Media={url:string;type:"image"|"video";name:string};
type PickedMedia=Media&{id:string;file:File};
type Step="select"|"edit"|"post";
type Transition="fade"|"slide"|"none";
async function bakedImageFilter(file:File,css:string):Promise<File>{
 if(css==="none"||!file.type.startsWith("image/"))return file;
 const bitmap=await createImageBitmap(file);
 try{
  const canvas=document.createElement("canvas");
  const scale=Math.min(1,2048/Math.max(bitmap.width,bitmap.height));
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext("2d");if(!context)throw Error("Unable to prepare image effects.");
  context.filter=css;context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error("Image processing failed.")),"image/jpeg",.9));
  return new File([blob],file.name.replace(/\.[^.]+$/,"")+"-effect.jpg",{type:"image/jpeg"});
 }finally{bitmap.close()}
}
const themes=[
 {id:"ramadan",title:"Ramadan Nights",subtitle:"Lantern glow · 12 sec",tone:"ramadan"},
 {id:"masjid",title:"Masjid Moments",subtitle:"Cinematic pan · 10 sec",tone:"masjid"},
 {id:"dua",title:"Du'a Reflection",subtitle:"Soft light · 8 sec",tone:"dua"},
 {id:"quran",title:"Qur'an Journey",subtitle:"Elegant typography · 15 sec",tone:"quran"},
 {id:"ummah",title:"Our Ummah",subtitle:"Photo memories · 12 sec",tone:"ummah"},
 {id:"art",title:"Islamic Geometry",subtitle:"Pattern motion · 10 sec",tone:"art"}
] as const;

export default function CreatorStudio(){
 const router=useRouter();
 const [mode,setMode]=useState<Mode>("create");
 const [step,setStep]=useState<Step>("select");
 const [queue,setQueue]=useState<PickedMedia[]>([]);
 const [activeIndex,setActiveIndex]=useState(0);
 const [transition,setTransition]=useState<Transition>("fade");
 const queueRef=useRef<PickedMedia[]>([]);
 useEffect(()=>{queueRef.current=queue},[queue]);
 useEffect(()=>()=>queueRef.current.forEach(item=>URL.revokeObjectURL(item.url)),[]);
 const activePick=queue[Math.min(activeIndex,Math.max(0,queue.length-1))]||null;

 const [file,setFile]=useState<File|null>(null);
 const [caption,setCaption]=useState("");
 const [busy,setBusy]=useState(false);
 const [exportStatus,setExportStatus]=useState("");
 const [streamError,setStreamError]=useState("");
 const [cameraReady,setCameraReady]=useState(false);
 const [facing,setFacing]=useState<"user"|"environment">("user");
 const [media,setMedia]=useState<Media|null>(null);
 const [theme,setTheme]=useState<string>("ramadan");
 const [recording,setRecording]=useState(false);
 const [soundOpen,setSoundOpen]=useState(false);
 const [catalog,setCatalog]=useState<StudioAsset[]>([]);
 const [draftStatus,setDraftStatus]=useState("");
 const [draftId,setDraftId]=useState<string|null>(null);
 const [soundSlug,setSoundSlug]=useState<string|null>(null);
 const [filter,setFilter]=useState("original");
 const [toolsExpanded,setToolsExpanded]=useState(false);
 const [previewOnly,setPreviewOnly]=useState(false);
 const [toolTab,setToolTab]=useState<"themes"|"filters"|"sounds">("themes");
 const [soundPreview,setSoundPreview]=useState<string|null>(null);
 const [personalSound,setPersonalSound]=useState<{name:string;url:string;path:string}|null>(null);
 const [soundUploadStatus,setSoundUploadStatus]=useState("");
 const soundInputRef=useRef<HTMLInputElement>(null);
 const uploadPersonalSound=async(source?:File)=>{if(!source)return;setSoundUploadStatus("");if(!(/\.mp3$/i.test(source.name)&&["audio/mpeg","audio/mp3","application/octet-stream",""].includes(source.type))){setSoundUploadStatus("Choose an MP3 audio file.");return}if(source.size>20*1024*1024){setSoundUploadStatus("MP3 files must be 20 MB or smaller.");return}try{setSoundUploadStatus("Uploading your sound…");const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sign in to upload a sound.");const path=user.id+"/personal-sounds/"+crypto.randomUUID()+".mp3";const {error}=await db.storage.from("community-media").upload(path,source,{contentType:"audio/mpeg",upsert:false});if(error)throw error;const {data:signed,error:signError}=await db.storage.from("community-media").createSignedUrl(path,3600);if(signError||!signed?.signedUrl)throw signError||new Error("Unable to preview your upload.");setPersonalSound({name:source.name,url:signed.signedUrl,path});setSoundSlug(null);setSoundUploadStatus("Your MP3 is ready to preview. Only you can select it here.");}catch(e){setSoundUploadStatus(e instanceof Error?e.message:"Upload failed.")}};
 const audioRef=useRef<HTMLAudioElement>(null);
 const builtInFilters=[{slug:"original",title:"Original",css:"none"},{slug:"warm",title:"Warm",css:"sepia(.25) saturate(1.2)"},{slug:"noir",title:"Noir",css:"grayscale(1)"},{slug:"golden",title:"Golden Hour",css:"sepia(.35) saturate(1.35) contrast(1.05)"},{slug:"moonlight",title:"Moonlight",css:"hue-rotate(18deg) saturate(.75) brightness(.9)"},{slug:"soft",title:"Soft Glow",css:"brightness(1.12) contrast(.9) saturate(1.08)"}];
 const filterOptions=catalog.filter(a=>a.kind==="filter");
 const selectedFilter=filterOptions.find(a=>a.slug===filter||a.title===filter);
 const filterCss=selectedFilter&&typeof selectedFilter.config.css_filter==="string"?selectedFilter.config.css_filter:builtInFilters.find(f=>f.slug===filter||f.title===filter)?.css||"none";
 const sounds=catalog.filter(a=>a.kind==="sound"&&!!a.storage_path);
 const previewSound=async(a:StudioAsset)=>{if(!a.storage_path)return;const db=createClient();const {data}=await db.storage.from("creator-studio-audio").createSignedUrl(a.storage_path,60);if(!data?.signedUrl)return;setSoundPreview(a.slug);if(audioRef.current){audioRef.current.src=data.signedUrl;await audioRef.current.play().catch(()=>setSoundPreview(null))}};
 const videoRef=useRef<HTMLVideoElement>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const recorderRef=useRef<MediaRecorder|null>(null);
 const chunksRef=useRef<Blob[]>([]);
 const inputRef=useRef<HTMLInputElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const cameraRequestRef=useRef(0);
 const modeRef=useRef<Mode>("create");
 const mountedRef=useRef(true);
 const recordingWantedRef=useRef(false);
 const stopCamera=()=>{
  cameraRequestRef.current++;
  recordingWantedRef.current=false;
  const recorder=recorderRef.current;
  recorderRef.current=null;
  if(recorder?.state==="recording"){try{recorder.stop()}catch{}}
  streamRef.current?.getTracks().forEach(t=>t.stop());
  streamRef.current=null;
  if(videoRef.current)videoRef.current.srcObject=null;
  setCameraReady(false);setRecording(false);
 };
 useEffect(()=>()=>{mountedRef.current=false;cameraRequestRef.current++;recordingWantedRef.current=false;const recorder=recorderRef.current;recorderRef.current=null;if(recorder?.state==="recording"){try{recorder.stop()}catch{}}streamRef.current?.getTracks().forEach(t=>t.stop())},[]);
 useEffect(()=>{let alive=true;const db=createClient();void db.from("creator_studio_assets").select("id,kind,slug,title,description,category,config,storage_path,attribution,license_name").eq("is_approved",true).eq("is_active",true).order("title").then(({data,error})=>{if(alive&&!error)setCatalog((data||[]) as StudioAsset[])});return()=>{alive=false}},[]);
 const uploadMedia=async(db:ReturnType<typeof createClient>,userId:string,source:File,prefix:string)=>{const path=userId+"/"+prefix+"/"+crypto.randomUUID()+"-"+source.name.replace(/[^a-zA-Z0-9._-]/g,"_");if(source.type.startsWith("video/")&&source.size>6*1024*1024){
 const {data:{session},error:sessionError}=await db.auth.getSession();
 if(sessionError||!session?.access_token)throw Error("Sign in again to upload your video.");
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!base||!key)throw Error("Video upload is not configured.");
 await new Promise<void>((resolve,reject)=>{
  const upload=new Upload(source,{
   endpoint:base.replace(/\/$/,"")+"/storage/v1/upload/resumable",
   headers:{authorization:"Bearer "+session.access_token,apikey:key},
   uploadDataDuringCreation:true,
   chunkSize:6*1024*1024,
   retryDelays:[0,3000,5000,10000,20000],
   removeFingerprintOnSuccess:true,
   metadata:{bucketName:"community-media",objectName:path,contentType:source.type||"video/mp4",cacheControl:"3600"},
   onError:(error)=>reject(error),
   onSuccess:()=>resolve()
  });
  void upload.findPreviousUploads().then(previous=>{if(previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start()}).catch(reject);
 });
 }else{
 const {error}=await db.storage.from("community-media").upload(path,source,{contentType:source.type,upsert:false});if(error)throw error;
 }return path};
 const saveDraft=async()=>{if(busy)return;setBusy(true);setDraftStatus("Saving…");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setDraftStatus("Sign in to save a draft.");return}let path:string|null=null;if(file)path=await uploadMedia(db,user.id,file,"studio-drafts");const payload={user_id:user.id,title:caption.trim().slice(0,120)||file?.name||"Untitled creation",theme_slug:theme,filter_slug:filter,sound_slug:soundSlug,settings:{mode,media_path:path,media_name:file?.name||null,caption:caption.slice(0,2000),personal_sound_path:personalSound?.path||null,personal_sound_name:personalSound?.name||null},updated_at:new Date().toISOString()};const result=draftId?await db.from("creator_studio_drafts").update(payload).eq("id",draftId).eq("user_id",user.id).select("id").single():await db.from("creator_studio_drafts").insert(payload).select("id").single();if(result.error){if(path)await db.storage.from("community-media").remove([path]);throw result.error}if(result.data?.id)setDraftId(result.data.id);setDraftStatus("Draft saved securely.");}catch(e){setDraftStatus(e instanceof Error?e.message:"Could not save draft.")}finally{setBusy(false)}};
 useEffect(()=>{let active=true;const restore=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||!active)return;const {data}=await db.from("creator_studio_drafts").select("id,theme_slug,filter_slug,sound_slug,settings").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();if(!active||!data)return;setDraftId(data.id);setTheme(data.theme_slug||"ramadan");setFilter(data.filter_slug||"original");setSoundSlug(data.sound_slug||null);const settings=data.settings as {caption?:string;media_path?:string;media_name?:string;personal_sound_path?:string;personal_sound_name?:string}|null;setCaption(settings?.caption||"");if(settings?.personal_sound_path){const {data:audioSigned}=await db.storage.from("community-media").createSignedUrl(settings.personal_sound_path,3600);if(audioSigned?.signedUrl&&active)setPersonalSound({path:settings.personal_sound_path,name:settings.personal_sound_name||"My sound.mp3",url:audioSigned.signedUrl})}if(settings?.media_path){const {data:signed}=await db.storage.from("community-media").createSignedUrl(settings.media_path,120);if(signed?.signedUrl&&active){try{const response=await fetch(signed.signedUrl);if(!response.ok)throw Error("download failed");const blob=await response.blob();if(!active)return;const restored=new File([blob],settings.media_name||"studio-media",{type:blob.type});setFile(restored);const url=URL.createObjectURL(restored);const kind=blob.type.startsWith("video/")?"video":"image";setMedia({url,type:kind,name:restored.name});setQueue(old=>{old.forEach(item=>URL.revokeObjectURL(item.url));return [{id:crypto.randomUUID(),file:restored,url,type:kind,name:restored.name}]});setActiveIndex(0);modeRef.current="create";setMode("create");}catch{setDraftStatus("Draft settings restored; media unavailable.")}}}else setDraftStatus("Last draft restored.");};void restore();return()=>{active=false}},[]);

 const pendingUploadsRef=useRef<Map<string,{path:string;uploaded:File}>>(new Map());
 const compressedRef=useRef<Map<string,File>>(new Map());
 const publish=async()=>{
  if(!queue.length||busy)return;
  setBusy(true);setExportStatus("Preparing your post…");
  try{
   const db=createClient();
   const {data:{user}}=await db.auth.getUser();
   if(!user)throw Error("Sign in before publishing.");
   const items:{storage_path:string;file_name:string;mime_type:string}[]=[];
   for(let index=0;index<queue.length;index++){
    const picked=queue[index];const source=picked.file;
    const cacheKey=picked.id+"|"+(picked.type==="image"?filter:"original");
    let cached=pendingUploadsRef.current.get(cacheKey);
    if(!cached){
     setExportStatus("Preparing "+(index+1)+" of "+queue.length+"…");
     let uploaded=source;
     if(picked.type==="image")uploaded=await bakedImageFilter(source,filterCss);
     if(picked.type==="video"&&source.size>8*1024*1024){
      uploaded=compressedRef.current.get(picked.id)||source;
      if(uploaded===source){
       try{
        setExportStatus("Optimizing video "+(index+1)+" of "+queue.length+"…");
        const encoded=await compressVideo(source,p=>{if(p%20===0)setExportStatus("Compressing video "+(index+1)+"… "+p+"%")});
        if(encoded.size<source.size){uploaded=encoded;compressedRef.current.set(picked.id,encoded)}
       }catch{setExportStatus("Uploading original video "+(index+1)+"…")}
      }
     }
     setExportStatus("Uploading "+(index+1)+" of "+queue.length+"…");
     const path=await uploadMedia(db,user.id,uploaded,"studio-posts/"+String(index).padStart(2,"0"));
     cached={path,uploaded};pendingUploadsRef.current.set(cacheKey,cached);
    }
    items.push({storage_path:cached.path,file_name:cached.uploaded.name,mime_type:cached.uploaded.type});
   }
   setExportStatus("Publishing to Ummah…");
   const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:caption.trim().slice(0,2000),media_items:items})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.error||"Publishing failed. Please retry.");
   if(result.flagged&&result.removed)throw Error("Your post was removed for review.");
   pendingUploadsRef.current.clear();
   window.dispatchEvent(new Event("1muslim:community-post-published"));
   setExportStatus("Published to Ummah Posts.");
   router.push("/posts");
  }catch(e){setExportStatus((e instanceof Error?e.message:"Publishing failed.")+" Your uploaded media remains saved; retry Post without re-uploading.");}
  finally{setBusy(false)}
 };
 const exportPhoto=async()=>{if(!file||!file.type.startsWith("image/")||busy)return;setBusy(true);setExportStatus("Animating photo…");try{const output=await animatePhoto(file,filterCss);setFile(output);const url=URL.createObjectURL(output);setMedia({url,type:"video",name:output.name});setQueue(old=>old.map((item,index)=>{if(index!==0)return item;URL.revokeObjectURL(item.url);return {...item,file:output,url,type:"video",name:output.name}}));setExportStatus("Animated video ready. Preview and publish it.");}catch(e){setExportStatus(e instanceof Error?e.message:"Animation unavailable on this device.")}finally{setBusy(false)}};


 const startCamera=async(face=facing)=>{
  stopCamera();const request=++cameraRequestRef.current;setStreamError("");
  if(!navigator.mediaDevices?.getUserMedia){setStreamError("Camera access is unavailable in this browser. Upload a photo or video instead.");return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:face}}});
   if(!mountedRef.current||request!==cameraRequestRef.current||modeRef.current!=="camera"){stream.getTracks().forEach(t=>t.stop());return}
   streamRef.current=stream;
   if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play().catch(()=>{})}
   if(!mountedRef.current||request!==cameraRequestRef.current||modeRef.current!=="camera"){stream.getTracks().forEach(t=>t.stop());return}
   setCameraReady(true);
  }catch{if(mountedRef.current&&request===cameraRequestRef.current)setStreamError("Camera access was blocked or unavailable. Enable camera permissions or upload media.")}
 };

 const addPickedFiles=(files?:FileList|null)=>{
  if(!files?.length)return;
  const valid=Array.from(files).filter(item=>item.type.startsWith("image/")||item.type.startsWith("video/"));
  if(!valid.length){setStreamError("Choose photos or videos.");return}
  const remaining=Math.max(0,10-queue.length);
  if(!remaining){setStreamError("You can select up to 10 photos or videos.");return}
  const additions:PickedMedia[]=valid.slice(0,remaining).map(item=>({id:crypto.randomUUID(),file:item,url:URL.createObjectURL(item),type:item.type.startsWith("video/")?"video":"image",name:item.name}));
  if(!queue.length){setFile(additions[0].file);setMedia(additions[0]);setActiveIndex(0)}
  setQueue(old=>[...old,...additions]);
  setStreamError(valid.length>remaining?"Only the first "+remaining+" items were added (10 maximum).":"");
  setMode("create");modeRef.current="create";stopCamera();
 };
 const loadFile=(newFile?:File)=>{
  if(!newFile)return;
  if(!newFile.type.startsWith("image/")&&!newFile.type.startsWith("video/")){setStreamError("Choose a photo or video.");return}
  const item:PickedMedia={id:crypto.randomUUID(),file:newFile,url:URL.createObjectURL(newFile),type:newFile.type.startsWith("image/")?"image":"video",name:newFile.name};
  setQueue(old=>{old.forEach(previous=>URL.revokeObjectURL(previous.url));return [item]});
  setActiveIndex(0);setFile(newFile);setMedia(item);setStep("select");
  modeRef.current="create";setMode("create");stopCamera();setStreamError("");
 };
 const removePicked=(index:number)=>{
  const previous=queue[index];if(!previous)return;
  URL.revokeObjectURL(previous.url);
  const next=queue.filter((_,i)=>i!==index);
  setQueue(next);setActiveIndex(Math.min(activeIndex,next.length-1)<0?0:Math.min(activeIndex,next.length-1));
  setFile(next[0]?.file||null);setMedia(next[0]||null);if(!next.length)setStep("select");
 };
 const shiftPicked=(index:number,delta:number)=>{
  const nextIndex=index+delta;if(nextIndex<0||nextIndex>=queue.length)return;
  const next=[...queue];[next[index],next[nextIndex]]=[next[nextIndex],next[index]];
  setQueue(next);setActiveIndex(nextIndex);setFile(next[0]?.file||null);setMedia(next[0]||null);
 };
 const capture=()=>{
  if(!videoRef.current||!canvasRef.current||!cameraReady)return;
  const video=videoRef.current,canvas=canvasRef.current;
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  canvas.getContext("2d")?.drawImage(video,0,0);
  canvas.toBlob(blob=>{if(blob)loadFile(new File([blob],"1muslim-photo.jpg",{type:"image/jpeg"}))},"image/jpeg",.92);
 };
 const record=()=>{
  if(recording){const recorder=recorderRef.current;if(recorder?.state==="recording")recorder.stop();setRecording(false);return}
  const stream=streamRef.current;
  if(!stream||typeof MediaRecorder==="undefined"){setStreamError("Video recording is not supported in this browser.");return}
  try{
   const recorder=new MediaRecorder(stream);chunksRef.current=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
   recordingWantedRef.current=true;
   recorder.onstop=()=>{if(recorderRef.current===recorder)recorderRef.current=null;if(mountedRef.current)setRecording(false);if(!recordingWantedRef.current||!mountedRef.current||modeRef.current!=="camera")return;recordingWantedRef.current=false;const blob=new Blob(chunksRef.current,{type:recorder.mimeType||"video/webm"});if(blob.size)loadFile(new File([blob],"1muslim-recording.webm",{type:blob.type}))};
   recorder.start();recorderRef.current=recorder;setRecording(true);
  }catch{setStreamError("Unable to record video on this device.")}
 };
 return <main className={styles.studio+" "+styles.galleryStudio}>
  <header className={styles.header}>
   <Link href="/posts" className={styles.close} aria-label="Close post creator">‹</Link>
   <div className={styles.brand}><strong>CREATE A POST</strong><small>{step==="select"?"01 / GALLERY":step==="edit"?"02 / CREATIVE TOOLS":"03 / PUBLISH"}</small></div>
   <Link href="/streaming/go-live" className={styles.liveShortcut}>◉ Go Live</Link>
  </header>
  <input ref={inputRef} type="file" accept="image/*,video/*" multiple className={styles.hidden} onChange={e=>{addPickedFiles(e.target.files);e.currentTarget.value=""}}/>
  <audio ref={audioRef} preload="none" onEnded={()=>setSoundPreview(null)}/>
  <section className={styles.galleryMain} aria-label="Post media preview">
   {activePick?<div className={styles.galleryFrame}>
     <div key={activePick.id+"-"+transition} className={styles.galleryVisual+" "+(transition==="fade"?styles.galleryFade:transition==="slide"?styles.gallerySlide:"")}>
      {activePick.type==="image"?<img src={activePick.url} alt={"Selected photo "+(activeIndex+1)} style={{filter:filterCss}}/>:<video src={activePick.url} controls playsInline preload="metadata" style={{filter:filterCss}}/>}
     </div>
     <div className={styles.gallerySideRail} aria-label="Preview of post engagement">
      <span title="Likes on your published post">♡<small>Likes</small></span>
      <span title="Comments on your published post">♧<small>Comments</small></span>
      <span title="Share your published post">↗<small>Share</small></span>
     </div>
     <div className={styles.galleryCounter}>{activeIndex+1} / {queue.length}</div>
     {queue.length>1&&<div className={styles.galleryArrows}><button type="button" onClick={()=>setActiveIndex(v=>(v-1+queue.length)%queue.length)} aria-label="Previous photo or video">‹</button><button type="button" onClick={()=>setActiveIndex(v=>(v+1)%queue.length)} aria-label="Next photo or video">›</button></div>}
    </div>:<div className={styles.galleryEmpty}>
     <span aria-hidden="true">▧</span><h1>Your next Ummah post</h1>
     <p>Choose photos or videos from your gallery. No camera opens here.</p>
     <button type="button" onClick={()=>inputRef.current?.click()}>＋ Choose from gallery</button>
    </div>}
   {streamError&&<p role="alert" className={styles.galleryError}>{streamError}</p>}
  </section>
  {queue.length>0&&<section className={styles.galleryTray} aria-label={"Selected media ("+queue.length+")"}>
    <div className={styles.galleryTrayTitle}><span>Highlights & clips ({queue.length})</span><button type="button" onClick={()=>inputRef.current?.click()} disabled={queue.length>=10}>＋ Add</button></div>
    <div className={styles.galleryThumbs}>
     {queue.map((item,index)=><div className={styles.galleryThumbWrap} key={item.id}>
      <button type="button" onClick={()=>setActiveIndex(index)} aria-label={"Preview item "+(index+1)} className={styles.galleryThumb+(activeIndex===index?" "+styles.galleryThumbActive:"")}>
       {item.type==="image"?<img src={item.url} alt=""/>:<video src={item.url} muted playsInline preload="metadata"/>}
       <span>{index+1}{item.type==="video"?" ▶":""}</span>
      </button>
      <button type="button" className={styles.galleryRemove} onClick={()=>removePicked(index)} aria-label={"Remove "+item.name}>×</button>
     </div>)}
    </div>
    {queue.length>1&&<div className={styles.galleryOrder}><button type="button" disabled={activeIndex===0} onClick={()=>shiftPicked(activeIndex,-1)}>← Move earlier</button><span>Tap to preview · reorder your clips</span><button type="button" disabled={activeIndex===queue.length-1} onClick={()=>shiftPicked(activeIndex,1)}>Move later →</button></div>}
   </section>}
  {step==="edit"&&<section className={styles.galleryEditor}>
   <nav className={styles.galleryTabs} aria-label="Creative tools">
    <button type="button" className={toolTab==="filters"?styles.galleryTabActive:""} onClick={()=>setToolTab("filters")}>✧ Effects</button>
    <button type="button" className={toolTab==="themes"?styles.galleryTabActive:""} onClick={()=>setToolTab("themes")}>⇄ Transitions</button>
    <button type="button" className={toolTab==="sounds"?styles.galleryTabActive:""} onClick={()=>setToolTab("sounds")}>♫ Media</button>
   </nav>
   {toolTab==="filters"&&<div className={styles.galleryOptionStrip}>{(filterOptions.length?filterOptions.map(a=>({slug:a.slug,title:a.title,css:typeof a.config.css_filter==="string"?a.config.css_filter:"none"})):builtInFilters).map(item=><button type="button" key={item.slug} className={filter===item.slug?styles.galleryOptionActive:""} onClick={()=>setFilter(item.slug)}><span style={{filter:item.css}}>◐</span><small>{item.title}</small></button>)}</div>}
   {toolTab==="themes"&&<div className={styles.galleryOptionStrip}>{([{slug:"fade",title:"Soft fade",glyph:"◐"},{slug:"slide",title:"Smooth slide",glyph:"⇄"},{slug:"none",title:"Clean cut",glyph:"▣"}] as const).map(item=><button type="button" key={item.slug} className={transition===item.slug?styles.galleryOptionActive:""} onClick={()=>setTransition(item.slug)}><span>{item.glyph}</span><small>{item.title}</small></button>)}</div>}
   {toolTab==="sounds"&&<div className={styles.gallerySoundTools}><p>{soundSlug?"Selected: "+(sounds.find(a=>a.slug===soundSlug)?.title||soundSlug):personalSound?"Your own audio selected":"Add audio to preview your post."}</p><button type="button" onClick={()=>setSoundOpen(true)}>♫ Choose sound</button></div>}
   <p className={styles.galleryHint}>Photo effects apply on publish. Video effects, selected sounds and transition styles are previews until export support is enabled.</p>
   {queue.length===1&&activePick?.type==="image"&&<button className={styles.galleryAnimate} type="button" disabled={busy} onClick={()=>void exportPhoto()}>✦ Animate photo into video</button>}
  </section>}
  {step==="post"&&<section className={styles.galleryCaption}>
    <label htmlFor="gallery-post-caption">Caption</label>
    <textarea id="gallery-post-caption" value={caption} onChange={event=>setCaption(event.target.value)} placeholder="Share your moment with the Ummah…" maxLength={2000} rows={3}/>
    <span>{caption.length} / 2000</span>
    <div className={styles.galleryDraft}><button type="button" disabled={busy||!queue.length} onClick={()=>void saveDraft()}>Save draft</button><small>Draft saves the first selected media item.</small></div>
   </section>}
  <footer className={styles.galleryFooter}>
   {step!=="select"&&<button type="button" className={styles.galleryBack} disabled={busy} onClick={()=>setStep(step==="post"?"edit":"select")}>Back</button>}
   {step==="select"?<button type="button" className={styles.galleryPrimary} disabled={!queue.length} onClick={()=>{setStep("edit");setToolTab("filters")}}>Next · Effects & media →</button>:step==="edit"?<button type="button" className={styles.galleryPrimary} disabled={!queue.length} onClick={()=>setStep("post")}>Next · Post →</button>:<button type="button" className={styles.galleryPrimary} disabled={busy||!queue.length} onClick={()=>void publish()}>{busy?"Posting…":"Post now"}</button>}
  </footer>
  {(exportStatus||draftStatus)&&<p role="status" className={styles.galleryStatus}>{exportStatus||draftStatus}</p>}
  {soundOpen&&<aside className={styles.notice} role="dialog" aria-label="Audio library">
   <div className={styles.toolHeader}><strong>Sounds</strong><button type="button" onClick={()=>{audioRef.current?.pause();setSoundPreview(null);setSoundOpen(false)}}>Close</button></div>
   <div className={styles.soundRow}><input ref={soundInputRef} type="file" accept=".mp3,audio/mpeg" className={styles.hidden} onChange={e=>{void uploadPersonalSound(e.target.files?.[0]);e.currentTarget.value=""}}/><button type="button" onClick={()=>soundInputRef.current?.click()}>＋ Upload MP3</button><span><strong>Your sound</strong><small>MP3 · up to 20 MB</small></span></div>
   {soundUploadStatus&&<p role="status">{soundUploadStatus}</p>}
   {personalSound&&<div className={styles.soundRow}><button type="button" onClick={()=>{if(audioRef.current){audioRef.current.src=personalSound.url;setSoundPreview("personal");void audioRef.current.play().catch(()=>setSoundPreview(null))}}}>{soundPreview==="personal"?"♫ Playing":"▶ Listen"}</button><span><strong>{personalSound.name}</strong><small>Personal MP3</small></span><button type="button" onClick={()=>{setSoundSlug(null);setSoundOpen(false)}}>Use</button></div>}
   {sounds.map(item=><div key={item.id} className={styles.soundRow}><button type="button" onClick={()=>void previewSound(item)}>{soundPreview===item.slug?"♫ Playing":"▶ Listen"}</button><span><strong>{item.title}</strong><small>{item.attribution||"Approved audio"}</small></span><button type="button" onClick={()=>{setSoundSlug(item.slug);audioRef.current?.pause();setSoundOpen(false)}}>Use</button></div>)}
   <button type="button" onClick={()=>{setSoundSlug(null);audioRef.current?.pause();setSoundOpen(false)}}>No sound</button>
  </aside>}
 </main>;
}
