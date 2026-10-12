"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

type TriviaQuestion = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const QUESTIONS: TriviaQuestion[] = [
  { id:"prophet-first", question:"According to the Qur'an, who was the first human and prophet?", choices:["Nuh ﷺ","Adam ﷺ","Ibrahim ﷺ","Musa ﷺ"], answer:1, explanation:"Adam عليه السلام is the first human and the first prophet." },
  { id:"qiblah", question:"What direction do Muslims face during salah?", choices:["Jerusalem","Madinah","The Ka'bah in Makkah","Mount Sinai"], answer:2, explanation:"Muslims face the Ka'bah in Makkah during salah." },
  { id:"ramadan", question:"Which month contains the obligatory fast of Ramadan?", choices:["Sha'ban","Ramadan","Muharram","Dhu al-Hijjah"], answer:1, explanation:"The obligatory fast is observed throughout Ramadan." },
  { id:"first-revelation", question:"Where did the first revelation to Muhammad ﷺ begin?", choices:["Cave Hira","Masjid al-Aqsa","Madinah","Ta'if"], answer:0, explanation:"The first revelation began in the Cave of Hira near Makkah." },
  { id:"surah", question:"Which surah begins with 'Alhamdu lillahi Rabbil-'alamin'?", choices:["Al-Fatihah","Al-Ikhlas","Al-Kawthar","Al-Asr"], answer:0, explanation:"Surah Al-Fatihah opens with praise of Allah, Lord of the worlds." },
  { id:"hijrah", question:"The Hijrah of the Prophet ﷺ was from Makkah to which city?", choices:["Ta'if","Jerusalem","Madinah","Kufah"], answer:2, explanation:"The Prophet ﷺ migrated from Makkah to Madinah in 622 CE." },
  { id:"quran-night", question:"On which night did the Qur'an begin to be revealed?", choices:["Laylat al-Qadr","Day of Arafah","Ashura","Laylat al-Mi'raj"], answer:0, explanation:"The Qur'an describes its beginning of revelation as occurring on Laylat al-Qadr." },
  { id:"pillars", question:"How many pillars of Islam are traditionally taught?", choices:["3","4","5","6"], answer:2, explanation:"The five pillars are shahadah, salah, zakah, sawm, and hajj." }
];

function multiplierFor(streak: number) {
  if (streak >= 8) return 100;
  if (streak === 7) return 50;
  if (streak === 6) return 25;
  if (streak === 5) return 15;
  if (streak === 4) return 10;
  if (streak === 3) return 5;
  if (streak === 2) return 2;
  return 1;
}

export default function ReconnectTrivia({
  mode = "reconnect",
  eventKey = "waiting",
}: {
  mode?: "reconnect" | "waiting";
  eventKey?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [streak, setStreak] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [review, setReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; points: number; multiplier: number } | null>(null);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("1muslim-trivia-streak") || "0");
      setStreak(Number.isFinite(saved) ? Math.max(0, Math.min(100, saved)) : 0);
    } catch {}
  }, []);

  useEffect(() => {
    if(timerRef.current)clearTimeout(timerRef.current);
    let mastered:string[]=[];
    try{mastered=JSON.parse(localStorage.getItem("1muslim-trivia-mastered-v1")||"[]")}catch{}
    const fresh=QUESTIONS.filter(q=>!mastered.includes(q.id));
    // Occasional spaced memory checks only after every question has been learned.
    const revisit=fresh.length===0&&Math.random()<0.15;
    const pool=fresh.length?fresh:revisit?QUESTIONS:[];
    const next=pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
    setQuestion(next);setReview(Boolean(next&&mastered.includes(next.id)));
    setSelected(null);setResult(null);setDismissed(false);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current)};
  }, [eventKey]);

  const answer = async (choice: number) => {
    if (!question || selected !== null || dismissed) return;
    setSelected(choice);
    const correct = choice === question.answer;
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    try {
      localStorage.setItem("1muslim-trivia-streak", String(nextStreak));
    } catch {}

    if (!correct) {
      setResult({ correct:false, points:0, multiplier:1 });
      timerRef.current=setTimeout(()=>setDismissed(true),1400);
      return;
    }
    try{const key="1muslim-trivia-mastered-v1";const mastered:string[]=JSON.parse(localStorage.getItem(key)||"[]");localStorage.setItem(key,JSON.stringify(Array.from(new Set([...mastered,question.id]))))}catch{}

    const actionKey = `trivia:mastery:${question.id}`;
    const { data } = await supabase.rpc("award_trivia_xp", {
      p_action_key: actionKey,
      p_page_key: mode === "reconnect" ? "live_reconnect" : "live_waiting",
      p_base_points: 1000,
      p_streak: nextStreak,
    });
    const row = Array.isArray(data) ? data[0] : data;
    setResult({
      correct:true,
      points:Number(row?.awarded_points || 0),
      multiplier:Number(row?.multiplier || multiplierFor(nextStreak)),
    });
    timerRef.current=setTimeout(()=>setDismissed(true),1700);
  };

  if (!question) return null;

  return (
    <div className={"omTriviaCollapse"+(dismissed?" omTriviaDismissed":"")} style={{position:"absolute",left:"50%",bottom:18,transform:"translateX(-50%)",width:"min(430px,calc(100% - 28px))",zIndex:12,overflow:"hidden",maxHeight:dismissed?0:650,opacity:dismissed?0:1,transition:"max-height .55s cubic-bezier(.22,1,.36,1),opacity .35s ease,filter .4s ease",filter:dismissed?"blur(7px)":"none",pointerEvents:dismissed?"none":"auto"}}>
      <div style={{border:"1px solid rgba(214,231,184,.24)",borderRadius:20,background:"rgba(5,9,6,.86)",backdropFilter:"blur(18px)",boxShadow:"0 18px 60px rgba(0,0,0,.4)",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:8}}>
          <span style={{fontSize:9,letterSpacing:".14em",fontWeight:900,color:"#9db98d"}}>1MUSLIM QUICK TRIVIA</span>
          <span style={{fontSize:10,fontWeight:900,color:streak ? "#d6e7b8" : "#8e9991"}}>🔥 STREAK ×{multiplierFor(streak || 1)}</span>
        </div>
        {review&&<div style={{fontSize:11,color:"#bcd8ef",marginBottom:6}}>🧠 You got this right before — just keeping your memory sharp!</div>}<strong style={{display:"block",fontSize:15,lineHeight:1.35}}>{question.question}</strong>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:12}}>
          {question.choices.map((choice,index) => {
            const picked = selected === index;
            const right = selected !== null && index === question.answer;
            return <button key={choice} type="button" onClick={() => void answer(index)} disabled={selected !== null}
              style={{textAlign:"left",border:"1px solid "+(right?"#88a86f":picked?"#6d4d4d":"#263128"),background:right?"rgba(112,155,83,.18)":picked?"rgba(120,55,55,.18)":"rgba(15,23,17,.8)",color:"#eef4ee",borderRadius:11,padding:"10px 11px",fontSize:11,cursor:selected===null?"pointer":"default"}}>
              {String.fromCharCode(65+index)}) {choice}
            </button>;
          })}
        </div>
        {result ? <div style={{marginTop:10,fontSize:10,lineHeight:1.5,color:result.correct?"#d6e7b8":"#d2aaa7"}}>
          {result.correct ? <>✅ Correct! <strong>+{result.points} XP</strong> · Streak ×{result.multiplier}</> : <>Not quite. Streak reset. {question.explanation}</>}
          {result.correct && <span style={{display:"block",color:"#849087",marginTop:3}}>{review?"You remembered it! ": ""}{question.explanation}</span>}
        </div> : null}
        {mode === "reconnect" ? <div style={{marginTop:8,fontSize:9,color:"#69766e"}}>Your answer never delays the broadcast. When the Live is ready, we cut straight back to it.</div> : null}
      </div>
    </div>
  );
}
