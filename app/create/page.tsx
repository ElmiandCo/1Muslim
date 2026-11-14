"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import styles from "./creator-studio.module.css";

type Mode="camera"|"create"|"live";
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
 const [mode,setMode]=useState<Mode>("camera");
 const [streamError,setStreamError]=useState("");
 const [cameraReady,setCameraReady]=useState(false);
 const [facing,setFacing]=useState<"user"|"environment">("user");
 const [media,setMedia]=useState<Media|null>(null);
 const [theme,setTheme]=useState<string>("ramadan");
 const [recording,setRecording]=useState(false);
 const [soundOpen,setSoundOpen]=useState(false);
 const [filter,setFilter]=useState("Original");
 const videoRef=useRef<HTMLVideoElement>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const recorderRef=useRef<MediaRecorder|null>(null);
 const chunksRef=useRef<Blob[]>([]);
 const inputRef=useRef<HTMLInputElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const stopCamera=()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setCameraReady(false)};
 useEffect(()=>{return()=>{streamRef.current?.getTracks().forEach(t=>t.stop())}},[]);
 useEffect(()=>{if(media)return()=>{URL.revokeObjectURL(media.url)}},[media]);
 const startCamera=async(face=facing)=>{
  stopCamera();setStreamError("");
  if(!navigator.mediaDevices?.getUserMedia){setStreamError("Camera access is unavailable in this browser. Upload a photo or video instead.");return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:face}}});
   streamRef.current=stream;
   if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play().catch(()=>{})}
   setCameraReady(true);
  }catch{setStreamError("Camera access was blocked or unavailable. Enable camera permissions or upload media.")}
 };
 const loadFile=(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")){setStreamError("Choose an image or video file.");return}
  setMedia({url:URL.createObjectURL(file),type:file.type.startsWith("image/")?"image":"video",name:file.name});
  setMode("create");stopCamera();setStreamError("");
 };
 const capture=()=>{
  if(!videoRef.current||!canvasRef.current||!cameraReady)return;
  const video=videoRef.current,canvas=canvasRef.current;
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  canvas.getContext("2d")?.drawImage(video,0,0);
  canvas.toBlob(blob=>{if(blob)loadFile(new File([blob],"1muslim-photo.jpg",{type:"image/jpeg"}))},"image/jpeg",.92);
 };
 const record=()=>{
  if(recording){recorderRef.current?.stop();setRecording(false);return}
  const stream=streamRef.current;
  if(!stream||typeof MediaRecorder==="undefined"){setStreamError("Video recording is not supported in this browser.");return}
  try{
   const recorder=new MediaRecorder(stream);chunksRef.current=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
   recorder.onstop=()=>{const blob=new Blob(chunksRef.current,{type:recorder.mimeType||"video/webm"});loadFile(new File([blob],"1muslim-recording.webm",{type:blob.type}))};
   recorder.start();recorderRef.current=recorder;setRecording(true);
  }catch{setStreamError("Unable to record video on this device.")}
 };
 return <main className={styles.studio}>
  <header className={styles.header}><Link href="/posts" aria-label="Close Creator Studio" className={styles.close}>×</Link><strong>CREATOR STUDIO</strong><button className={styles.sound} onClick={()=>setSoundOpen(v=>!v)} type="button">♫ Sounds</button></header>
  {soundOpen&&<aside className={styles.notice} role="status">Islamic audio library is coming in Step 2. Only licensed, attributed tracks will be available.</aside>}
  <section className={styles.stage} aria-label="Creator preview">
   {mode==="camera"&&!media?<div className={styles.camera}>
    <video ref={videoRef} autoPlay playsInline muted className={styles.cameraVideo} style={{transform:facing==="user"?"scaleX(-1)":undefined,filter:filter==="Warm"?"sepia(.25) saturate(1.2)":filter==="Noir"?"grayscale(1)":undefined}}/>
    {!cameraReady&&<div className={styles.cameraPrompt}><div className={styles.moon}>☾</div><h1>Capture a moment</h1><p>Open your camera or choose something from your library.</p><button type="button" onClick={()=>void startCamera()}>Enable Camera</button></div>}
    {cameraReady&&<div className={styles.cameraTools}><button type="button" onClick={()=>{const next=facing==="user"?"environment":"user";setFacing(next);void startCamera(next)}}>↻ Flip</button><button type="button" onClick={()=>setFilter(v=>v==="Original"?"Warm":v==="Warm"?"Noir":"Original")}>✧ {filter}</button></div>}
   </div>:mode==="create"?<div className={styles.preview}>
    {media?(media.type==="image"?<img src={media.url} alt="Your selected media"/>:<video src={media.url} controls playsInline/>):<div className={styles.emptyPreview}><span>☾</span><h2>Make something meaningful</h2><p>Choose a template and add your own photos or videos.</p></div>}
    <span className={styles.previewBadge}>{themes.find(t=>t.id===theme)?.title}</span>
   </div>:<div className={styles.emptyPreview}><span>◉</span><h2>Go Live on 1Muslim</h2><p>Use the existing 1Muslim Live experience to connect with your community.</p><Link className={styles.liveLink} href="/">Open 1Muslim Live</Link></div>}
   {streamError&&<p role="alert" className={styles.error}>{streamError}</p>}
  </section>
  {mode==="camera"&&<div className={styles.captureBar}><button type="button" onClick={()=>inputRef.current?.click()} className={styles.upload}>▧<small>Library</small></button><button type="button" className={styles.shutter} aria-label="Take photo" onClick={capture} disabled={!cameraReady}><span/></button><button type="button" onClick={record} className={recording?styles.recording:styles.record} disabled={!cameraReady}>{recording?"■ Stop":"● Record"}</button></div>}
  {mode==="create"&&<div className={styles.createTools}><div className={styles.toolHeader}><strong>Islamic Themes</strong><button type="button" onClick={()=>inputRef.current?.click()}>＋ Add media</button></div><div className={styles.themes}>{themes.map(item=><button type="button" key={item.id} className={styles.theme+(theme===item.id?" "+styles.selected:"")} onClick={()=>setTheme(item.id)}><span className={styles[item.tone]}>☾</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>)}</div><p className={styles.disclaimer}>Step 1 preview only. Animated exports, licensed audio, filters and publishing are added in Steps 2–3.</p></div>}
  <nav className={styles.modes} aria-label="Studio mode"><button type="button" className={mode==="camera"?styles.active:""} onClick={()=>{setMode("camera");setMedia(null)}}>CAMERA</button><button type="button" className={mode==="create"?styles.active:""} onClick={()=>{setMode("create");stopCamera()}}>CREATE</button><button type="button" className={mode==="live"?styles.active:""} onClick={()=>{setMode("live");stopCamera()}}>LIVE</button></nav>
  <input ref={inputRef} type="file" accept="image/*,video/*" className={styles.hidden} onChange={e=>{loadFile(e.target.files?.[0]);e.target.value=""}}/>
  <canvas ref={canvasRef} className={styles.hidden}/>
 </main>;
}
