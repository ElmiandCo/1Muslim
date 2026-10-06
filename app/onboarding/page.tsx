"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type SpeechRecognitionLike = {
  lang:string; continuous:boolean; interimResults:boolean;
  start:()=>void; stop:()=>void;
  onresult:((event:any)=>void)|null; onerror:((event:any)=>void)|null; onend:(()=>void)|null;
};

const ENGLISH=[
  "i bear witness that there is no deity worthy of worship except allah and i bear witness that muhammad is his messenger",
  "i bear witness there is no god worthy of worship except allah and i bear witness muhammad is his messenger",
  "i testify that there is no deity worthy of worship except allah and i testify that muhammad is his messenger"
];

function normalize(value:string){return value.toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim()}

function closeEnough(transcript:string){
  const t=normalize(transcript);
  return ENGLISH.some(target=>{
    const words=target.split(" ");
    const hits=words.filter(word=>t.includes(word)).length;
    return hits/words.length>=0.78 && t.includes("allah") && t.includes("muhammad");
  });
}

export default function OnboardingPage(){
 const router=useRouter();
 const [step,setStep]=useState<"shahada"|"gender">("shahada");
 const [gender,setGender]=useState<"male"|"female"|"">("");
 const [checking,setChecking]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(""),[transcript,setTranscript]=useState(""),[listening,setListening]=useState(false),[verified,setVerified]=useState(false);
 const recognitionRef=useRef<SpeechRecognitionLike|null>(null);

 useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){router.replace("/auth");return}const {data:p}=await s.from("profiles").select("gender,shahada_verified_at").eq("id",user.id).single();if(p?.gender&&p?.shahada_verified_at){router.replace("/");return}if(p?.shahada_verified_at)setStep("gender");setChecking(false)})()},[router]);

 const startShahada=()=>{
   setMessage("");setTranscript("");
   const W=window as any; const SR=W.SpeechRecognition||W.webkitSpeechRecognition;
   if(!SR){setMessage("Voice verification is not supported in this browser. Please use a browser with microphone speech recognition enabled.");return}
   const rec=new SR() as SpeechRecognitionLike; rec.lang="en-US";rec.continuous=false;rec.interimResults=false;
   rec.onresult=(event:any)=>{const text=event.results?.[0]?.[0]?.transcript??"";setTranscript(text);if(closeEnough(text)){setVerified(true);setMessage("Shahada recognized. Continue to your profile setup.");}else{setMessage("We heard you, but the Shahada was not recognized clearly enough. Please try again.");}};
   rec.onerror=()=>{setListening(false);setMessage("We couldn't capture the Shahada. Check microphone permission and try again.")};
   rec.onend=()=>setListening(false); recognitionRef.current=rec;setListening(true);rec.start();
 };
 const finish=async()=>{
   if(!gender){setMessage("Please select a gender to continue.");return}
   setSaving(true);setMessage("");const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){router.replace("/auth");return}
   const {error}=await s.from("profiles").update({gender,avatar_gender:gender,avatar_config:{accent:"emerald",gender,package:"starter",accessories:[]},shahada_verified_at:new Date().toISOString(),shahada_verification_method:"voice-speech-recognition"}).eq("id",user.id).is("gender",null);
   if(error){setMessage(error.message);setSaving(false);return}router.replace("/");
 };
 if(checking)return <main className="onboardingPage"><section className="onboardingCard"><span className="eyebrow">1MUSLIM</span><h1>Preparing your profile…</h1></section></main>;
 return <main className="onboardingPage"><section className="onboardingCard">
   <div className="steps"><span className={step==="shahada"?"active":""}>1 Shahada</span><i>→</i><span className={step==="gender"?"active":""}>2 Profile</span></div>
   {step==="shahada"?<>
     <span className="eyebrow">COMMUNITY VERIFICATION</span><h1>Say the Shahada.</h1>
     <p className="lead">1Muslim is built for Muslims. Before creating a new account, say the Shahada aloud. Your browser transcribes the phrase locally in the sign-up flow so we can check that the words were spoken clearly.</p>
     <div className="voiceCard"><div className={listening?"mic listening":"mic"}>◉</div><strong>{listening?"Listening…":"Voice Shahada"}</strong><p>“I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is His Messenger.”</p><button className="continue" onClick={startShahada} disabled={listening}>{listening?"Listening…":"Start recording"}</button>{transcript&&<div className="transcript"><small>Heard</small><span>{transcript}</span></div>}</div>
     {message&&<div className={verified?"success":"error"}>{message}</div>}
     <button className="continue secondary" disabled={!verified} onClick={()=>setStep("gender")}>Continue to profile →</button>
     <small className="fine">This checks the spoken phrase; it does not identify your physical voice or prove identity.</small>
   </>:<>
     <span className="eyebrow">WELCOME TO 1MUSLIM</span><h1>Choose your profile.</h1><p className="lead">Select your gender once. This sets your default profile avatar and stays fixed after setup.</p>
     <div className="genderGrid"><button className={gender==="male"?"genderCard selected":"genderCard"} onClick={()=>setGender("male")}><img src="/assets/avatars/default-male.jpg" alt="" /><strong>Male</strong><span>Use the male default avatar</span></button><button className={gender==="female"?"genderCard selected":"genderCard"} onClick={()=>setGender("female")}><img src="/assets/avatars/default-female.jpg" alt="" /><strong>Female</strong><span>Use the female default avatar</span></button></div>
     {message&&<div className="error">{message}</div>}<button className="continue" onClick={finish} disabled={saving}>{saving?"Saving…":"Enter 1Muslim →"}</button><small className="fine">Gender is selected once during onboarding and cannot be changed later.</small>
   </>}
 </section><style jsx>{`
 .onboardingPage{min-height:100vh;background:#050805;color:#f4f7f4;display:grid;place-items:center;padding:24px}.onboardingCard{width:min(760px,100%);border:1px solid #1d2921;background:radial-gradient(circle at 85% 10%,rgba(132,174,116,.13),transparent 35%),linear-gradient(145deg,#0d140f,#070b08);border-radius:28px;padding:34px;box-shadow:0 30px 100px rgba(0,0,0,.45)}.eyebrow{font-size:10px;letter-spacing:.16em;color:#94ad91;font-weight:850}.onboardingCard h1{font-size:42px;letter-spacing:-.06em;margin:12px 0 8px}.lead{color:#89968d;line-height:1.65;font-size:14px;max-width:610px}.steps{display:flex;align-items:center;gap:10px;margin-bottom:26px;color:#657269;font-size:10px}.steps .active{color:#d8e9bd;font-weight:850}.steps i{font-style:normal;color:#4b5a50}.voiceCard{margin:24px 0 16px;border:1px solid #29372e;border-radius:22px;padding:24px;background:#0a100c;text-align:center}.mic{width:68px;height:68px;border-radius:50%;margin:0 auto 12px;display:grid;place-items:center;background:#152017;border:1px solid #3c4d3e;color:#d8e9bd;font-size:28px}.mic.listening{box-shadow:0 0 0 10px rgba(148,183,129,.08),0 0 30px rgba(148,183,129,.22)}.voiceCard strong{font-size:18px}.voiceCard p{color:#829087;font-size:12px;line-height:1.6;max-width:560px;margin:10px auto 18px}.continue{width:100%;border:0;border-radius:12px;padding:13px;background:#d6e7b8;color:#071008;font-weight:850;cursor:pointer}.continue:disabled{opacity:.45;cursor:not-allowed}.continue.secondary{margin-top:10px;background:#132016;color:#d8e9bd;border:1px solid #3a4c3d}.transcript{margin-top:15px;text-align:left;border:1px solid #26342b;border-radius:12px;padding:11px}.transcript small{display:block;color:#6f7c73;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.transcript span{display:block;color:#dce7df;font-size:11px;margin-top:5px}.genderGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:26px 0}.genderCard{background:#0a100c;border:1px solid #253128;border-radius:20px;padding:16px;color:#eaf0eb;text-align:left;cursor:pointer;transition:.2s}.genderCard:hover,.genderCard.selected{border-color:#a9c890;transform:translateY(-2px)}.genderCard img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;object-position:center 58%;background:#000;border:2px solid #2f3d32;border-radius:50%;margin-bottom:13px;overflow:hidden}.genderCard strong{display:block;font-size:16px}.genderCard span{display:block;color:#76837a;font-size:10px;margin-top:5px}.fine{display:block;text-align:center;color:#657269;font-size:10px;margin-top:11px}.error{color:#ffbcbc;font-size:11px;margin:10px 0}.success{color:#cce7c2;font-size:11px;margin:10px 0}@media(max-width:620px){.onboardingCard{padding:22px}.onboardingCard h1{font-size:34px}.genderGrid{grid-template-columns:1fr}}
 `}</style></main>;
}
