"use client";
import {useEffect,useState} from "react";
import styles from "./ElmTentAlphabet.module.css";
const LETTERS=[["ا","Alif"],["ب","Bā"],["ت","Tā"],["ث","Thā"],["ج","Jīm"],["ح","Ḥā"],["خ","Khā"],["د","Dāl"],["ذ","Dhāl"],["ر","Rā"],["ز","Zāy"],["س","Sīn"],["ش","Shīn"],["ص","Ṣād"],["ض","Ḍād"],["ط","Ṭā"],["ظ","Ẓā"],["ع","ʿAyn"],["غ","Ghayn"],["ف","Fā"],["ق","Qāf"],["ك","Kāf"],["ل","Lām"],["م","Mīm"],["ن","Nūn"],["ه","Hā"],["و","Wāw"],["ي","Yā"]];
const VOWELS=[{label:"A · Fatḥah",mark:"َ",sound:"a"},{label:"I · Kasrah",mark:"ِ",sound:"i"},{label:"U · Ḍammah",mark:"ُ",sound:"u"}];
const KEY="1muslim:elm-tent:lesson-three:v1";
export default function ElmTentVowels({onNext}:{onNext?:()=>void}){
 const [category,setCategory]=useState(0),[index,setIndex]=useState(0),[done,setDone]=useState<string[]>([]),[heard,setHeard]=useState(false),[milestone,setMilestone]=useState(false);
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(KEY)||"{}");setCategory(Math.max(0,Math.min(3,raw.category||0)));setIndex(Math.max(0,Math.min(83,raw.index||0)));setDone(Array.isArray(raw.done)?raw.done:[])}catch{}},[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify({category,index,done}))},[category,index,done]);
 const vowel=category===3?index%3:category,letter=category===3?Math.floor(index/3):index;
 const glyph=LETTERS[letter]?.[0]||"ب",mark=VOWELS[vowel].mark,unit=glyph+mark,key=category+":"+index;
 const max=category===3?84:28;
 const speak=()=>{if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(unit);utterance.lang="ar-SA";utterance.rate=.66;const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("ar"));if(voice)utterance.voice=voice;window.speechSynthesis.speak(utterance);setHeard(true)};
 const advance=()=>{const next=done.includes(key)?done:[...done,key];setDone(next);setHeard(false);if(index===max-1){if(category<3){setCategory(category+1);setIndex(0);setMilestone(true)}else setMilestone(true)}else{setIndex(index+1);if(next.length>=3)setMilestone(true)}};
 useEffect(()=>{const handler=()=>{if(!heard)speak();else advance()};window.addEventListener("1muslim:elm-tent-hudhud",handler);return()=>window.removeEventListener("1muslim:elm-tent-hudhud",handler)});
 const count=done.filter(k=>k.startsWith(category+":")).length;
 return <section className={styles.vowelLesson} aria-label="Lesson 3 Arabic vowels"><header><strong>✦ LESSON 3 · ARABIC VOWELS</strong><span>{count} / {max}</span></header><div className={styles.vowelTabs}>{VOWELS.map((v,i)=><button key={v.sound} aria-pressed={category===i} onClick={()=>{setCategory(i);setIndex(0);setHeard(false)}}>{v.label}</button>)}<button aria-pressed={category===3} onClick={()=>{setCategory(3);setIndex(0);setHeard(false)}}>Ba · Bi · Bu</button></div><div className={styles.progress} role="progressbar" aria-label="Vowel practice progress" aria-valuenow={count} aria-valuemin={0} aria-valuemax={max}><span style={{width:count/max*100+"%"}}/></div><button className={styles.vowelCard} onClick={speak} aria-label={"Hear "+unit}><span lang="ar">{unit}</span><strong>{LETTERS[letter]?.[1]} · {VOWELS[vowel].label}</strong><small>Tap to hear · HudHud to advance</small></button><div className={styles.vowelActions}><button onClick={speak}>◖)) Hear sound</button><button onClick={advance}>✓ Practiced · Next →</button></div>{milestone&&<div className={styles.vowelToast}><strong>✦ Ready for the next stage?</strong><button onClick={()=>setMilestone(false)}>Keep studying</button><button onClick={()=>{setMilestone(false);if(category<3){setCategory(category+1);setIndex(0)}else onNext?.()}}>Next stage →</button></div>}</section>;
}
