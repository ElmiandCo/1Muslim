"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {animatePhoto} from "./photo-export";
import Link from "next/link";
import styles from "./creator-studio.module.css";
import {createClient} from "../../utils/supabase/client";

type Mode="camera"|"create"|"live";
type StudioAsset={id:string;kind:"theme"|"filter"|"sound";slug:string;title:string;description:string;category:string;config:Record<string,unknown>;storage_path:string|null;attribution:string|null;license_name:string|null};
type Media={url:string;type:"image"|"video";name:string};
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
 const [mode,setMode]=useState<Mode>("camera");
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
 const [toolTab,setToolTab]=useState<"themes"|"filters"|"sounds">("themes");
 const [soundPreview,setSoundPreview]=useState<string|null>(null);
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
 const modeRef=useRef<Mode>("camera");
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
 const uploadMedia=async(db:ReturnType<typeof createClient>,userId:string,source:File,prefix:string)=>{const path=userId+"/"+prefix+"/"+crypto.randomUUID()+"-"+source.name.replace(/[^a-zA-Z0-9._-]/g,"_");const {error}=await db.storage.from("community-media").upload(path,source,{contentType:source.type,upsert:false});if(error)throw error;return path};
 const saveDraft=async()=>{if(busy)return;setBusy(true);setDraftStatus("Saving…");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setDraftStatus("Sign in to save a draft.");return}let path:string|null=null;if(file)path=await uploadMedia(db,user.id,file,"studio-drafts");const payload={user_id:user.id,title:caption.trim().slice(0,120)||file?.name||"Untitled creation",theme_slug:theme,filter_slug:filter,sound_slug:soundSlug,settings:{mode,media_path:path,media_name:file?.name||null,caption:caption.slice(0,2000)},updated_at:new Date().toISOString()};const result=draftId?await db.from("creator_studio_drafts").update(payload).eq("id",draftId).eq("user_id",user.id).select("id").single():await db.from("creator_studio_drafts").insert(payload).select("id").single();if(result.error){if(path)await db.storage.from("community-media").remove([path]);throw result.error}if(result.data?.id)setDraftId(result.data.id);setDraftStatus("Draft saved securely.");}catch(e){setDraftStatus(e instanceof Error?e.message:"Could not save draft.")}finally{setBusy(false)}};
 useEffect(()=>{let active=true;const restore=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||!active)return;const {data}=await db.from("creator_studio_drafts").select("id,theme_slug,filter_slug,sound_slug,settings").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();if(!active||!data)return;setDraftId(data.id);setTheme(data.theme_slug||"ramadan");setFilter(data.filter_slug||"original");setSoundSlug(data.sound_slug||null);const settings=data.settings as {caption?:string;media_path?:string;media_name?:string}|null;setCaption(settings?.caption||"");if(settings?.media_path){const {data:signed}=await db.storage.from("community-media").createSignedUrl(settings.media_path,120);if(signed?.signedUrl&&active){try{const response=await fetch(signed.signedUrl);if(!response.ok)throw Error("download failed");const blob=await response.blob();if(!active)return;const restored=new File([blob],settings.media_name||"studio-media",{type:blob.type});setFile(restored);setMedia({url:URL.createObjectURL(restored),type:blob.type.startsWith("video/")?"video":"image",name:restored.name});modeRef.current="create";setMode("create");}catch{setDraftStatus("Draft settings restored; media unavailable.")}}}else setDraftStatus("Last draft restored.");};void restore();return()=>{active=false}},[]);
 const publish=async()=>{if(!file||busy)return;setBusy(true);setExportStatus("Uploading media…");let path:string|null=null;let postId:string|null=null;try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sign in before publishing.");path=await uploadMedia(db,user.id,file,"studio-posts");postId=crypto.randomUUID();const {error:postError}=await db.from("posts").insert({id:postId,user_id:user.id,body:caption.trim().slice(0,2000)});if(postError)throw postError;const {error:mediaError}=await db.from("post_media").insert({post_id:postId,user_id:user.id,storage_path:path,file_name:file.name,mime_type:file.type});if(mediaError)throw mediaError;setExportStatus("Published to Ummah Posts.");router.push("/posts");}catch(e){if(postId)await createClient().from("posts").delete().eq("id",postId);if(path)await createClient().storage.from("community-media").remove([path]);setExportStatus(e instanceof Error?e.message:"Publishing failed.")}finally{setBusy(false)}};
 const exportPhoto=async()=>{if(!file||!file.type.startsWith("image/")||busy)return;setBusy(true);setExportStatus("Animating photo…");try{const output=await animatePhoto(file,filterCss);setFile(output);setMedia({url:URL.createObjectURL(output),type:"video",name:output.name});setExportStatus("Animated video ready. Preview and publish it.");}catch(e){setExportStatus(e instanceof Error?e.message:"Animation unavailable on this device.")}finally{setBusy(false)}};

 useEffect(()=>{if(media)return()=>{URL.revokeObjectURL(media.url)}},[media]);
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
 const loadFile=(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")){setStreamError("Choose an image or video file.");return}
  setFile(file);setMedia({url:URL.createObjectURL(file),type:file.type.startsWith("image/")?"image":"video",name:file.name});
  modeRef.current="create";setMode("create");stopCamera();setStreamError("");
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
 return <main className={styles.studio}>
  <header className={styles.header}><Link href="/posts" aria-label="Close Creator Studio" className={styles.close}>×</Link><strong>CREATOR STUDIO</strong><button className={styles.sound} onClick={()=>setSoundOpen(v=>!v)} type="button">♫ Sounds</button></header>
  <audio ref={audioRef} onEnded={()=>setSoundPreview(null)} preload="none" />
  {soundOpen&&<aside className={styles.notice} role="dialog" aria-label="Approved sounds"><div className={styles.toolHeader}><strong>Approved sounds</strong><button type="button" onClick={()=>{audioRef.current?.pause();setSoundPreview(null);setSoundOpen(false)}}>Close</button></div>{sounds.length?sounds.map(a=><div className={styles.soundRow} key={a.id}><button type="button" onClick={()=>void previewSound(a)} aria-label={"Preview "+a.title}>{soundPreview===a.slug?"♫ Playing":"▶ Preview"}</button><span><strong>{a.title}</strong><small>{a.attribution||"Licensed audio"} · {a.license_name||"Approved"}</small></span><button type="button" onClick={()=>{setSoundSlug(a.slug);audioRef.current?.pause();setSoundPreview(null);setSoundOpen(false)}}>{soundSlug===a.slug?"✓ Selected":"Use"}</button></div>):<p>No licensed audio has been approved yet. Uploads must be licensed before appearing here.</p>}<button type="button" onClick={()=>{setSoundSlug(null);audioRef.current?.pause();setSoundOpen(false)}}>No sound</button></aside>}
  <section className={styles.stage} aria-label="Creator preview">
   {mode==="camera"&&!media?<div className={styles.camera}>
    <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} style={{transform:facing==="user"?"scaleX(-1)":undefined,filter:filterCss}}/>
    {!cameraReady&&<div className={styles.cameraPrompt}><div className={styles.moon}>☾</div><h1>Capture a moment</h1><p>Open your camera or choose something from your library.</p><button type="button" onClick={()=>void startCamera()}>Enable Camera</button></div>}
    {cameraReady&&<div className={styles.cameraTools}><button type="button" onClick={()=>{const next=facing==="user"?"environment":"user";setFacing(next);void startCamera(next)}}>↻ Flip</button><button type="button" onClick={()=>{const options=filterOptions.length?filterOptions.map(a=>a.slug):builtInFilters.map(a=>a.slug);setFilter(v=>options[(options.indexOf(v)+1)%options.length])}}>✧ {filter}</button></div>}
   </div>:mode==="create"?<div className={styles.preview}>
    {media?(media.type==="image"?<img src={media.url} alt="Your selected media" style={{filter:filterCss}}/>:<video src={media.url} controls playsInline style={{filter:filterCss}}/>):<div className={styles.emptyPreview}><span>☾</span><h2>Make something meaningful</h2><p>Choose a template and add your own photos or videos.</p></div>}
    <span className={styles.previewBadge}>{themes.find(t=>t.id===theme)?.title}</span>
   </div>:<div className={styles.emptyPreview}><span>◉</span><h2>Go Live on 1Muslim</h2><p>Use the existing 1Muslim Live experience to connect with your community.</p><Link className={styles.liveLink} href="/">Open 1Muslim Live</Link></div>}
   {streamError&&<p role="alert" className={styles.error}>{streamError}</p>}
  </section>
  {mode==="camera"&&<div className={styles.captureBar}><button type="button" onClick={()=>inputRef.current?.click()} className={styles.upload}>▧<small>Library</small></button><button type="button" className={styles.shutter} aria-label="Take photo" onClick={capture} disabled={!cameraReady}><span/></button><button type="button" onClick={record} className={recording?styles.recording:styles.record} disabled={!cameraReady}>{recording?"■ Stop":"● Record"}</button></div>}
  {mode==="create"&&<div className={styles.createTools}><div className={styles.toolHeader}><strong>Creative tools</strong><button type="button" onClick={()=>inputRef.current?.click()}>＋ Add media</button></div><div className={styles.toolTabs} role="tablist" aria-label="Creation tools">{(["themes","filters","sounds"] as const).map(tab=><button key={tab} type="button" role="tab" aria-selected={toolTab===tab} className={toolTab===tab?styles.selectedTab:""} onClick={()=>setToolTab(tab)}>{tab==="themes"?"✦ Themes":tab==="filters"?"◐ Filters":"♫ Sounds"}</button>)}</div>{toolTab==="themes"&&<div className={styles.themes}>{(catalog.filter(a=>a.kind==="theme").length?catalog.filter(a=>a.kind==="theme").map(a=>({id:a.slug,title:a.title,subtitle:a.description,tone:String(a.config.tone||"art")})):themes).map(item=><button type="button" key={item.id} className={styles.theme+(theme===item.id?" "+styles.selected:"")} onClick={()=>setTheme(item.id)}><span className={styles[item.tone as keyof typeof styles]||styles.art}>☾</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>)}</div>}{toolTab==="filters"&&<div className={styles.filterStrip}>{(filterOptions.length?filterOptions.map(a=>({slug:a.slug,title:a.title,css:typeof a.config.css_filter==="string"?a.config.css_filter:"none"})):builtInFilters).map(item=><button key={item.slug} type="button" className={filter===item.slug?styles.selected:""} onClick={()=>setFilter(item.slug)}><span style={{filter:item.css}}>◐</span><small>{item.title}</small></button>)}</div>}{toolTab==="sounds"&&<div className={styles.soundPicker}><p>{soundSlug?"Selected: "+(sounds.find(a=>a.slug===soundSlug)?.title||soundSlug):"No sound selected"}</p><button type="button" onClick={()=>setSoundOpen(true)}>Browse approved sounds</button></div>}<label className={styles.captionLabel}>Caption<textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={2000} placeholder="Share your moment with the Ummah…" rows={3}/></label><div className={styles.publishActions}><button type="button" disabled={busy} onClick={()=>void saveDraft()}>Save Draft</button><button type="button" disabled={busy||!file||file.type.startsWith("video/")} onClick={()=>void exportPhoto()}>✦ Animate Photo</button><button type="button" disabled={busy||!file} onClick={()=>void publish()}>Publish to Ummah →</button></div><p aria-live="polite">{draftStatus} {exportStatus}</p><p className={styles.disclaimer}>Approved templates and filters are previews. Animation exports a short video; selected audio is preview-only until licensed audio mixing is enabled.</p></div>}
  <nav className={styles.modes} aria-label="Studio mode"><button type="button" className={mode==="camera"?styles.active:""} onClick={()=>{modeRef.current="camera";setMode("camera");setMedia(null);setFile(null);stopCamera()}}>CAMERA</button><button type="button" className={mode==="create"?styles.active:""} onClick={()=>{modeRef.current="create";setMode("create");stopCamera()}}>CREATE</button><button type="button" className={mode==="live"?styles.active:""} onClick={()=>{modeRef.current="live";setMode("live");stopCamera()}}>LIVE</button></nav>
  <input ref={inputRef} type="file" accept="image/*,video/*" className={styles.hidden} onChange={e=>{loadFile(e.target.files?.[0]);e.target.value=""}}/>
  <canvas ref={canvasRef} className={styles.hidden}/>
 </main>;
}
