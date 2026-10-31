"use client";
import {useEffect,useMemo,useState} from "react";
import styles from "./ElmTentAlphabet.module.css";
const GLYPHS=["ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];
const NAMES=["Alif","Bā","Tā","Thā","Jīm","Ḥā","Khā","Dāl","Dhāl","Rā","Zāy","Sīn","Shīn","Ṣād","Ḍād","Ṭā","Ẓā","ʿAyn","Ghayn","Fā","Qāf","Kāf","Lām","Mīm","Nūn","Hā","Wāw","Yā"];
const KEY="1muslim:elm-tent:lesson-two-quiz:v1";
function shuffled(list:number[]){const a=[...list];for(let i=a.length-1;i>0;i--){const x=new Uint32Array(1);crypto.getRandomValues(x);const j=x[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
type Saved={order:number[];answers:number[];mistakes:number[]};
export default function ElmTentLetterQuiz({onPass,onReady}:{onPass:(answers:number[],correct:number)=>void;onReady?:()=>void}){
 const [order,setOrder]=useState<number[]>([]);
 const [answers,setAnswers]=useState<number[]>([]);
 const [mistakes,setMistakes]=useState<number[]>([]);
 const [feedback,setFeedback]=useState("");
 const [replay,setReplay]=useState(false);
 const [started,setStarted]=useState(false);
 const [voiceError,setVoiceError]=useState("");
 const [isSpeaking,setIsSpeaking]=useState(false);
 const [options,setOptions]=useState<number[]>([]);
 const current=order[answers.length];
 const correct=answers.filter((v,i)=>v===order[i]).length;
 const finished=started&&answers.length===28;
 const passed=finished&&correct>=26;
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||"null") as Saved|null;if(raw&&raw.order?.length===28&&new Set(raw.order).size===28&&raw.answers?.length<=28){setOrder(raw.order);setAnswers(raw.answers);setMistakes(raw.mistakes||[])}else setOrder(shuffled(GLYPHS.map((_,i)=>i)))}catch{setOrder(shuffled(GLYPHS.map((_,i)=>i)))}setStarted(true)},[]);
 useEffect(()=>{if(started&&order.length===28)localStorage.setItem(KEY,JSON.stringify({order,answers,mistakes}))},[order,answers,mistakes,started]);
 useEffect(()=>{if(current===undefined)return;const pool=shuffled(GLYPHS.map((_,i)=>i).filter(i=>i!==current)).slice(0,3);setOptions(shuffled([current,...pool]));setFeedback("");setReplay(false)},[current]);
 const speak=()=>{if(current===undefined||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();setIsSpeaking(false);const utterance=new SpeechSynthesisUtterance(GLYPHS[current]);utterance.lang="ar-SA";utterance.rate=.7;utterance.onstart=()=>setIsSpeaking(true);utterance.onend=()=>setIsSpeaking(false);utterance.onerror=()=>setIsSpeaking(false);const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("ar"));if(voice)utterance.voice=voice;else setVoiceError("Arabic voice unavailable; using device speech.");window.speechSynthesis.speak(utterance)};
 useEffect(()=>{if(current===undefined||!started)return;const timer=setTimeout(speak,250);return()=>clearTimeout(timer)},[current,started]);
 useEffect(()=>{const handler=()=>speak();window.addEventListener("1muslim:elm-tent-hudhud",handler);return()=>window.removeEventListener("1muslim:elm-tent-hudhud",handler)},[current]);
 const choose=(value:number)=>{if(current===undefined||feedback)return;const good=value===current;setFeedback(good?"✓ Correct!":"Not quite — "+NAMES[current]+" is "+GLYPHS[current]);if(!good)setMistakes(v=>[...v,current]);setTimeout(()=>{const next=[...answers,value];setAnswers(next);if(next.length===28&&next.filter((v,i)=>v===order[i]).length>=26)onPass(order.map((_,i)=>next[i]===order[i]?i:-1),next.filter((v,i)=>v===order[i]).length)},650)};
 const restart=()=>{setOrder(shuffled(GLYPHS.map((_,i)=>i)));setAnswers([]);setMistakes([]);setFeedback("");setReplay(false)};
 return <section className={styles.lessonQuiz} aria-label="Lesson 2 four-choice letter quiz"><div className={styles.quizHeader}><strong>✦ LESSON 2 · LISTEN & CHOOSE</strong><span>{Math.min(answers.length,28)} / 28</span></div><div className={styles.progress} role="progressbar" aria-label="Quiz progress" aria-valuenow={answers.length} aria-valuemin={0} aria-valuemax={28}><span style={{width:answers.length/28*100+"%"}}/></div>{finished?<div className={styles.quizFinish}><h3>{passed?"🏅 Passed!":"Keep practicing!"}</h3><p>{correct}/28 correct · {passed?"Arabic Letters Badge unlocked":"You need 26 correct to pass"}</p><button type="button" onClick={restart}>Practice another randomized round ↻</button>{passed&&<button type="button" onClick={onReady}>Continue to Lesson 3 →</button>}</div>:<><button type="button" className={`${styles.quizSpeaker} ${isSpeaking?styles.quizSpeakerPlaying:""}`} onClick={speak} aria-label="Play Arabic letter pronunciation" aria-pressed={isSpeaking}><span aria-hidden="true">▶</span></button><div className={styles.quizChoices}>{options.map(i=><button type="button" key={i} disabled={!!feedback} onClick={()=>choose(i)} lang="ar" aria-label={"Choose "+NAMES[i]}>{GLYPHS[i]}</button>)}</div>{feedback&&<p role="status" className={styles.quizFeedback}>{feedback}</p>}{voiceError&&<small>{voiceError}</small>}</>}</section>;
}
