"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {lessonNames,questions} from "../../../../lib/elmTentCurriculum";
const shuffled=<T,>(items:T[])=>items.map(v=>({v,k:Math.random()})).sort((a,b)=>a.k-b.k).map(x=>x.v);
export default function Lessons(){
 const [completed,setCompleted]=useState(0),[signedIn,setSignedIn]=useState(false),[answer,setAnswer]=useState(""),[result,setResult]=useState<{correct:boolean;explanation:string;source:string;xp:number;certified?:boolean}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[sound,setSound]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{void fetch("/api/elm-tent").then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setCompleted(d.completed);setSignedIn(d.signedIn)}).catch(e=>setError(e.message))},[]);
 const question=questions[completed]??null;
 const options=useMemo(()=>question?shuffled(question.choices):[],[question,revision]);
 const chime=(success:boolean)=>{if(!sound)return;try{const ctx=new AudioContext();const t=ctx.currentTime;const notes=success?[523,659,784]:[330,280];notes.forEach((n,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=n;o.type="sine";g.gain.setValueAtTime(.0001,t+i*.13);g.gain.exponentialRampToValueAtTime(.07,t+i*.13+.025);g.gain.exponentialRampToValueAtTime(.0001,t+i*.13+.27);o.connect(g).connect(ctx.destination);o.start(t+i*.13);o.stop(t+i*.13+.28)});setTimeout(()=>void ctx.close(),950)}catch{}};
 const submit=async()=>{if(!question||!answer||busy)return;setBusy(true);setError("");try{const r=await fetch("/api/elm-tent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson:question.lesson,choice:answer})});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to check answer");setResult(d);chime(d.correct)}catch(e){setError(e instanceof Error?e.message:"Try again")}finally{setBusy(false)}};
 const next=()=>{if(!result?.correct)return;setCompleted(c=>c+1);setResult(null);setAnswer("");setRevision(r=>r+1)};
 return <main className="quizShell"><style>{`
 .quizShell{min-height:100vh;padding:32px 18px;background:radial-gradient(circle at top,#264835,#091711 65%);color:#f2f8f0}
 .quizWrap{max-width:780px;margin:auto}.quizPanel{padding:clamp(22px,5vw,42px);background:linear-gradient(145deg,#1b3627,#10251b);border:1px solid #61866b;border-radius:28px;box-shadow:0 24px 70px #0006;animation:whoosh .5s cubic-bezier(.2,.85,.2,1) both}
 .quizPanel h1{font-size:clamp(30px,5vw,46px)}.quizPanel p{line-height:1.7;color:#d5e4d4}
 .quizOption{display:block;width:100%;text-align:left;padding:16px 18px;margin:11px 0;background:#203b2a;border:1px solid #55765d;color:#fff;border-radius:15px;cursor:pointer;transition:transform .2s,background .2s,border-color .2s}
 .quizOption:hover{transform:translateX(5px);background:#2d513a}.quizOption[aria-pressed=true]{border-color:#e0efb9;background:#416748;box-shadow:0 0 0 2px #d0eaa333}
 .quizButton{padding:14px 22px;background:#d7edba;color:#14281a;border:0;border-radius:999px;font-weight:850;cursor:pointer}.quizButton:disabled{opacity:.45}
 .quizProgress{height:9px;background:#334b39;border-radius:99px;overflow:hidden}.quizProgress>div{height:100%;background:linear-gradient(90deg,#9ccf9c,#f1e8a7);transition:width .5s}
 .quizResult{margin:20px 0;padding:17px;border:1px solid #8aad8b;border-radius:16px;background:#294a35;animation:pop .35s cubic-bezier(.2,.9,.2,1.2)}
 @keyframes whoosh{from{opacity:0;transform:translateY(22px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}@keyframes pop{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
 @media(prefers-reduced-motion:reduce){.quizPanel,.quizResult{animation:none}.quizOption,.quizProgress>div{transition:none}}
 `}</style>
 <div className="quizWrap"><Link href="/learn/elm-tent" style={{color:"#cce4b4"}}>← Elm Tent</Link><div className="quizPanel" style={{marginTop:22}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span>🌱 1MUSLIM LEARNING JOURNEY</span><button onClick={()=>setSound(x=>!x)} style={{background:"transparent",border:0,color:"white",cursor:"pointer"}}>{sound?"🔊 Sound on":"🔇 Sound off"}</button></div>
 <h1>{completed===12?"🎉 Certified 1Muslim!":"12 Lessons. One journey."}</h1>
 <div className="quizProgress"><div style={{width:completed/12*100+"%"}}/></div><p>{completed}/12 lessons completed · {completed===12?"Journey completed":"Questions get more challenging as you advance"}</p>
 {!signedIn&&<p>🔒 Sign in to answer questions and save certification progress.</p>}
 {completed===12?<div className="quizResult"><h2>🌟 1Muslim Learning Certificate</h2><p>You completed all 12 introductory learning assessments. This recognizes learning progress, not anyone's faith or religious standing.</p><Link href="/discovery-files" style={{color:"#d7edba"}}>See my learning files →</Link></div>:question&&<>
 <div style={{fontSize:12,color:"#d2e9ae",marginTop:28}}>LESSON {question.lesson} · {lessonNames[completed]}</div>
 <h2>{question.prompt}</h2><div key={question.id+revision}>{options.map((option,i)=><button key={option} type="button" className="quizOption" aria-pressed={answer===option} disabled={!!result?.correct||busy} onClick={()=>{setAnswer(option);setResult(null)}}><b>{String.fromCharCode(65+i)}.</b> {option}</button>)}</div>
 {!result?.correct&&<button className="quizButton" disabled={!signedIn||!answer||busy} onClick={()=>void submit()}>{busy?"Checking…":"Check answer →"}</button>}
 {result&&<div className="quizResult" role="status"><strong>{result.correct?"✨ Correct! +"+result.xp+" lesson points":"Not quite — try again 💚"}</strong><p>{result.explanation}</p><small>Source: {result.source}</small>{result.correct&&<div style={{marginTop:16}}><button className="quizButton" onClick={next}>{result.certified?"View certificate 🎓":"Next lesson →"}</button></div>}</div>}
 </>}
 {error&&<p role="alert" style={{color:"#ffb5b5"}}>{error}</p>}
 <p style={{fontSize:12,opacity:.75}}>Questions are currently reviewed, source-linked curriculum items. AI-generated question variants are planned, not yet enabled. Answer positions shuffle; grading checks the actual answer, not its position.</p>
 </div></div></main>;
}
