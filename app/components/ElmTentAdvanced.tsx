"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import styles from "./ElmTentAlphabet.module.css";
const letters=[
["ا","Alif","ا","ـا","ـا"],["ب","Bā","بـ","ـبـ","ـب"],["ت","Tā","تـ","ـتـ","ـت"],["ث","Thā","ثـ","ـثـ","ـث"],["ج","Jīm","جـ","ـجـ","ـج"],["ح","Ḥā","حـ","ـحـ","ـح"],["خ","Khā","خـ","ـخـ","ـخ"],["د","Dāl","د","ـد","ـد"],["ذ","Dhāl","ذ","ـذ","ـذ"],["ر","Rā","ر","ـر","ـر"],["ز","Zāy","ز","ـز","ـز"],["س","Sīn","سـ","ـسـ","ـس"],["ش","Shīn","شـ","ـشـ","ـش"],["ص","Ṣād","صـ","ـصـ","ـص"],["ض","Ḍād","ضـ","ـضـ","ـض"],["ط","Ṭā","طـ","ـطـ","ـط"],["ظ","Ẓā","ظـ","ـظـ","ـظ"],["ع","ʿAyn","عـ","ـعـ","ـع"],["غ","Ghayn","غـ","ـغـ","ـغ"],["ف","Fā","فـ","ـفـ","ـف"],["ق","Qāf","قـ","ـقـ","ـق"],["ك","Kāf","كـ","ـكـ","ـك"],["ل","Lām","لـ","ـلـ","ـل"],["م","Mīm","مـ","ـمـ","ـم"],["ن","Nūn","نـ","ـنـ","ـن"],["ه","Hā","هـ","ـهـ","ـه"],["و","Wāw","و","ـو","ـو"],["ي","Yā","يـ","ـيـ","ـي"]
] as const;
const nonJoining=new Set(["ا","د","ذ","ر","ز","و"]);
const vowels=[["َ","Fatḥah","a"],["ِ","Kasrah","i"],["ُ","Ḍammah","u"]] as const;
const words=[["بَاب","Bāb","door"],["كِتَاب","Kitāb","book"],["قَلَم","Qalam","pen"],["مَسْجِد","Masjid","mosque"],["سَلَام","Salām","peace"],["بَيْت","Bayt","house"],["نُور","Nūr","light"],["عِلْم","ʿIlm","knowledge"],["قَمَر","Qamar","moon"],["شَمْس","Shams","sun"],["مَاء","Māʾ","water"],["وَلَد","Walad","boy"],["بِنْت","Bint","girl"],["جَبَل","Jabal","mountain"],["بَحْر","Baḥr","sea"],["يَد","Yad","hand"],["عَيْن","ʿAyn","eye"],["لَيْل","Layl","night"],["نَهَار","Nahār","daytime"],["رَحْمَة","Raḥmah","mercy"]] as const;
export default function ElmTentAdvanced({lesson,onComplete}:{lesson:4|5|6,onComplete?:(lesson:number)=>void}){
 const [index,setIndex]=useState(0),[seen,setSeen]=useState<number[]>([]),[audio,setAudio]=useState(""),[showParts,setShowParts]=useState(false),[review,setReview]=useState(false),[answer,setAnswer]=useState<number|null>(null);
 const total=lesson===4?28:lesson===5?84:words.length;
 const key="1muslim:elm-tent:advanced:"+lesson+":v1";
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem(key)||"[]");setSeen(Array.isArray(raw)?raw.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<total):[])}catch{setSeen([])}setIndex(0);setReview(false);setAnswer(null)},[key,total]);
 const item=lesson===4?letters[index]:lesson===5?letters[Math.floor(index/3)]:null;
 const vowel=lesson===5?vowels[index%3]:null;
 const glyph=lesson===4?item?.[0]:lesson===5?(item?.[0]??"")+(vowel?.[0]??""):words[index]?.[0];
 const label=lesson===4?item?.[1]:lesson===5?(item?.[1]??"")+" · "+(vowel?.[1]??""):(words[index]?.[1]??"")+" · "+(words[index]?.[2]??"");
 const speak=()=>{if(!("speechSynthesis" in window)){setAudio("Speech playback unavailable on this device.");return}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(glyph||"");u.lang="ar-SA";u.rate=.68;const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith("ar"));if(voice)u.voice=voice;setAudio(voice?"":"Device speech preview; Arabic pronunciation is not verified.");u.onerror=()=>setAudio("Audio unavailable. Try installing an Arabic voice.");window.speechSynthesis.speak(u)};
 const go=(n:number)=>{setIndex(Math.max(0,Math.min(total-1,n)));setShowParts(false);setReview(false);setAnswer(null)};
 const mark=()=>{const next=seen.includes(index)?seen:[...seen,index];setSeen(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}if(index<total-1)go(index+1);else if(next.length===total)setReview(true)};
 const complete=seen.length===total;
 const options=lesson===4?["Initial","Medial","Final","Isolated"]:lesson===5?["Fatḥah","Kasrah","Ḍammah"]:["door","book","pen","mosque"];
 const correct=lesson===4?3:lesson===5?index%3:0;
 const [rewardMessage,setRewardMessage]=useState("");
 const chooseAnswer=async(choice:number)=>{if(answer!==null)return;setAnswer(choice);if(choice!==correct)return;try{const {data,error}=await createClient().rpc("claim_elm_tent_answer_xp",{p_lesson:lesson,p_question:index,p_answer:choice});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(row?.awarded_points===150){setRewardMessage("+150 XP earned!");window.dispatchEvent(new Event("1muslim-xp-updated"))}else setRewardMessage("Correct! XP already claimed for this question.")}catch{setRewardMessage("Correct! Sign in to claim XP, or try again later.")}};
 return <section className={styles.vowelLesson} aria-label={`Lesson ${lesson}`}>
 <header className={styles.vowelHeader}><strong>✦ LESSON {lesson} · {lesson===4?"LETTER SHAPES":lesson===5?"VOWEL PRACTICE":"READING WORDS"}</strong><span>{seen.length} / {total}</span></header>
 <p className={styles.note}>{lesson===4?"Letters change form according to their position. Six letters (ا د ذ ر ز و) do not connect to the following letter.":lesson===5?"Practice each of the 28 letters with fatḥah, kasrah, and ḍammah.": "See letters join into meaningful Arabic words. Read from right to left."}</p>
 <div className={styles.progress} role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={seen.length}><span style={{width:seen.length/total*100+"%"}}/></div>
 <div className={styles.vowelStage} onTouchStart={e=>{(e.currentTarget as HTMLElement).dataset.start=String(e.touches[0].clientX)}} onTouchEnd={e=>{const start=Number((e.currentTarget as HTMLElement).dataset.start);const delta=e.changedTouches[0].clientX-start;if(Math.abs(delta)>65)go(index+(delta<0?1:-1))}}>
 <span className={styles.vowelPrompt}>{index+1} / {total} · Swipe to explore</span>
 <button className={styles.vowelCard} type="button" onClick={speak}><span lang="ar" dir="rtl">{glyph}</span><strong>{label}</strong></button>
 {lesson===4&&<div className={styles.elmForms}>{(["Isolated","Beginning","Middle","End"] as const).map((name,i)=><div key={name}><small>{name}</small><span lang="ar" dir="rtl">{item?.[i===0?0:i===1?2:i===2?3:4]}</span></div>)}</div>}
 {lesson===4&&nonJoining.has(item?.[0]||"")&&<p className={styles.note}>This letter cannot connect to the letter after it; the middle column shows its non-joining form.</p>}
 {lesson===5&&<div className={styles.elmForms}>{vowels.map(([mark,name,sound])=><button key={name} type="button" onClick={()=>go(Math.floor(index/3)*3+vowels.findIndex(v=>v[1]===name))}><small>{name} · {sound}</small><span lang="ar">{item?.[0]}{mark}</span></button>)}</div>}
 {lesson===6&&<><button type="button" className={styles.vowelDone} onClick={()=>setShowParts(v=>!v)}>{showParts?"Hide letters":"Separate letters ↔"}</button>{showParts&&<div className={styles.elmParts} lang="ar" dir="rtl">{Array.from((words[index]?.[0]??"").normalize("NFD").replace(/[\u064b-\u065f]/g,"")).map((c,i)=><span key={i}>{c}</span>)}</div>}</>}
 <div className={styles.vowelActions}><button type="button" className={styles.vowelPlay} onClick={()=>go(index-1)} aria-label="Previous">‹</button><button type="button" className={styles.vowelPlay} onClick={speak} aria-label="Play pronunciation">▶</button><button type="button" className={styles.vowelDone} onClick={mark}>✓ Done · Next</button><button type="button" className={styles.vowelPlay} onClick={()=>go(index+1)} aria-label="Next">›</button></div>
 </div>
 <div className={styles.elmJump}><label htmlFor={`elm-jump-${lesson}`}>Jump to item</label><select id={`elm-jump-${lesson}`} value={index} onChange={e=>go(Number(e.target.value))}>{Array.from({length:total},(_,i)=><option key={i} value={i}>{i+1} · {lesson===6?words[i]?.[1]??"":letters[lesson===5?Math.floor(i/3):i]?.[1]??""}</option>)}</select></div>
 {complete&&<div className={styles.vowelToast}><strong>✓ All {total} practiced!</strong><button type="button" onClick={()=>setReview(true)}>Check understanding →</button></div>}
 {review&&<div className={styles.vowelToast}><strong>{lesson===4?"Which form is the standalone form?":lesson===5?"Which vowel mark is shown?":"What is the English meaning of بَاب?"}</strong><div>{(lesson===6?["door","book","pen","mosque"]:options).map((o,i)=><button key={o} type="button" onClick={()=>void chooseAnswer(i)} aria-pressed={answer===i}>{o}</button>)}</div>{answer!==null&&<p>{answer===correct?"✓ Correct!":"Try again."}</p>}{rewardMessage&&<p role="status">{rewardMessage}</p>}{answer===correct&&<button type="button" onClick={()=>onComplete?.(lesson)}>Finish lesson →</button>}</div>}
 <p className={styles.disclaimer}>Audio uses your device’s speech engine; pronunciation is not verified by a native speaker.</p>
 </section>;
}
