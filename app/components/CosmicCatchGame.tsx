"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import styles from "./CosmicCatchGame.module.css";

const W=360,H=500;
const LETTERS=[
 ["ا","Alif"],["ب","Baa"],["ت","Taa"],["ث","Thaa"],["ج","Jeem"],["ح","Haa"],["خ","Khaa"],
 ["د","Daal"],["ذ","Dhaal"],["ر","Raa"],["ز","Zaay"],["س","Seen"],["ش","Sheen"],["ص","Saad"],
 ["ض","Daad"],["ط","Taa (heavy)"],["ظ","Dhaa (heavy)"],["ع","Ayn"],["غ","Ghayn"],["ف","Faa"],
 ["ق","Qaaf"],["ك","Kaaf"],["ل","Laam"],["م","Meem"],["ن","Noon"],["ه","Haa"],["و","Waaw"],["ي","Yaa"]
] as const;
const STARTS=[0,6,12,18,24,28] as const;
const LEVEL_NAMES=["First Flight","Letter Orbit","Star Navigator","Nebula Challenge","Guardian Review"] as const;
const BOSS_REVIEW=[3,14,25] as const;
type Phase="ready"|"playing"|"paused"|"between"|"over"|"won";
type Orb={id:number;x:number;y:number;letter:number;radius:number;speed:number;boss:boolean};
type Shard={x:number;y:number;vx:number;vy:number;rotation:number;spin:number;life:number;color:string};
type Shot={x:number;y:number;life:number;correct:boolean};
type Game={
 running:boolean;paused:boolean;stage:number;progress:number;bossHits:number;score:number;mistakes:number;
 checkpointScore:number;checkpointMistakes:number;orbs:Orb[];shards:Shard[];shot:Shot|null;
 nextId:number;last:number;lastPaint:number;waveDelay:number
};
const newGame=():Game=>({
 running:false,paused:false,stage:0,progress:0,bossHits:0,score:0,mistakes:0,
 checkpointScore:0,checkpointMistakes:0,orbs:[],shards:[],shot:null,nextId:0,last:0,lastPaint:0,waveDelay:0
} as Game);
const goal=(g:Game)=>g.progress<LETTERS.length?g.progress:BOSS_REVIEW[Math.min(g.bossHits,BOSS_REVIEW.length-1)];
const shuffle=<T,>(array:T[]):T[]=>{for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array};
const makeWave=(g:Game)=>{
 if(!g.running||g.paused||g.orbs.length)return;
 const boss=g.progress===LETTERS.length;
 const count=g.stage===0?2:g.stage<3?3:4;
 const correct=goal(g);
 const similar:Record<number,number[]>={1:[2,3,4],2:[1,3],3:[1,2],4:[5,6],5:[4,6],6:[4,5],7:[8],8:[7],9:[10],10:[9],11:[12],12:[11],13:[14],14:[13],15:[16],16:[15],17:[18],18:[17],19:[20],20:[19],21:[22],22:[21],23:[24],24:[23],25:[5,6]};
 const distractors=shuffle(LETTERS.map((_,i)=>i).filter(i=>i!==correct));
 const pool=g.stage>=2?Array.from(new Set([...shuffle(similar[correct]||[]),...distractors])).slice(0,count-1):distractors.slice(0,count-1);
 const options=shuffle([correct,...pool]);
 const positions=count===2?[100,260]:count===3?[62,180,298]:[45,135,225,315];
 g.orbs=options.map((letter,i)=>({
  id:++g.nextId,x:positions[i],y:58,letter,
  radius:boss&&letter===correct?34:count===4?27:30,
  speed:44+g.stage*9+(boss?10:0),boss:boss&&letter===correct
 }));
};
export default function CosmicCatchGame(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const game=useRef<Game>(newGame());
 const audio=useRef<AudioContext|null>(null);
 const soundEnabled=useRef(false);
 const reducedRef=useRef(false);
 const [phase,setPhase]=useState<Phase>("ready");
 const [score,setScore]=useState(0),[misses,setMisses]=useState(0),[stage,setStage]=useState(0);
 const [progress,setProgress]=useState(0),[bossHits,setBossHits]=useState(0);
 const [orbs,setOrbs]=useState<Orb[]>([]);
 const [feedback,setFeedback]=useState("Find the named Arabic letter and tap its orb.");
 const [reduced,setReduced]=useState(false),[sound,setSound]=useState(false),[best,setBest]=useState(0);
 const [size,setSize]=useState({width:288,height:400});
 const [audioAvailable,setAudioAvailable]=useState(true);
 useEffect(()=>{
  setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  setAudioAvailable(typeof window.AudioContext!=="undefined");
  try{const value=Number(window.localStorage.getItem("1muslim-arabic-letter-quest-best"));if(Number.isFinite(value)&&value>0)setBest(value)}catch{}
  return()=>{if(audio.current){void audio.current.close().catch(()=>{});audio.current=null}}
 },[]);
 useEffect(()=>{reducedRef.current=reduced},[reduced]);
 useEffect(()=>{
  const element=stageRef.current;if(!element)return;
  const resize=()=>{const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;const scale=Math.min(width/W,height/H);setSize(prev=>{const next={width:Math.max(1,Math.floor(W*scale)),height:Math.max(1,Math.floor(H*scale))};return prev.width===next.width&&prev.height===next.height?prev:next})};
  resize();if(typeof ResizeObserver==="undefined"){window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize)}
  const observer=new ResizeObserver(resize);observer.observe(element);return()=>observer.disconnect()
 },[]);
 const tone=useCallback((correct:boolean)=>{
  if(!soundEnabled.current||!audio.current)return;
  const ctx=audio.current;
  if(ctx.state==="suspended")void ctx.resume().catch(()=>{});
  try{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
   osc.type=correct?"sine":"triangle";
   osc.frequency.setValueAtTime(correct?540:240,now);
   osc.frequency.exponentialRampToValueAtTime(correct?820:155,now+.14);
   gain.gain.setValueAtTime(.0001,now);
   gain.gain.exponentialRampToValueAtTime(.08,now+.018);
   gain.gain.exponentialRampToValueAtTime(.0001,now+.2);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.22)
  }catch{}
 },[]);
 const saveBest=useCallback((value:number)=>{
  setBest(previous=>{const updated=Math.max(previous,value);try{window.localStorage.setItem("1muslim-arabic-letter-quest-best",String(updated))}catch{}return updated})
 },[]);
 const beginLevel=(fresh:boolean)=>{
  const g=game.current;
  if(fresh){game.current=newGame()}
  const current=game.current;
  current.running=true;current.paused=false;current.last=0;current.lastPaint=0;
  current.orbs=[];current.shards=[];current.shot=null;current.waveDelay=0;
  current.progress=STARTS[current.stage];current.bossHits=0;
  current.score=current.checkpointScore;current.mistakes=current.checkpointMistakes;
  makeWave(current);
  setOrbs([...current.orbs]);setStage(current.stage);setProgress(current.progress);setBossHits(0);
  setScore(current.score);setMisses(current.mistakes);setPhase("playing");
  setFeedback("Read the Arabic letter and shoot its transliteration.");
 };
 const start=()=>{game.current=newGame();beginLevel(true)};
 const restartLevel=()=>{const g=game.current;if(g.stage<0||g.stage>4)return;beginLevel(false)};
 const togglePause=()=>{const g=game.current;if(!g.running)return;g.paused=!g.paused;g.last=0;setPhase(g.paused?"paused":"playing")};
 useEffect(()=>{
  const onVisibility=()=>{const g=game.current;if(document.hidden&&g.running&&!g.paused){g.paused=true;g.last=0;setPhase("paused")}};
  document.addEventListener("visibilitychange",onVisibility);
  return()=>document.removeEventListener("visibilitychange",onVisibility)
 },[]);
 const loseLife=(message:string)=>{
  const g=game.current;g.mistakes++;setMisses(g.mistakes);
  setFeedback(message+" · "+Math.max(0,5-g.mistakes)+" hearts left");
  if(g.mistakes>=5){g.running=false;g.orbs=[];setOrbs([]);setPhase("over");saveBest(g.score)}
 };
 const shootId=(id:number)=>{
  const g=game.current;if(!g.running||g.paused)return;
  const index=g.orbs.findIndex(o=>o.id===id);if(index<0)return;
  const orb=g.orbs.splice(index,1)[0];
  const correct=orb.letter===goal(g);
  g.shot={x:orb.x,y:orb.y,life:.2,correct};
  if(!reducedRef.current)for(let i=0;i<18;i++){
   const angle=i*Math.PI/9,velocity=75+Math.random()*90;
   g.shards.push({x:orb.x,y:orb.y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,
    rotation:angle,spin:(Math.random()-.5)*10,life:.55,color:correct?"#ffdf91":"#ff859c"})
  }
  tone(correct);
  if(correct){
   g.score+=100+(g.stage*20);setScore(g.score);
   if(g.progress===LETTERS.length){
    g.bossHits++;setBossHits(g.bossHits);
    if(g.bossHits===BOSS_REVIEW.length){
     g.running=false;g.orbs=[];setOrbs([]);setPhase("won");setFeedback("All 28 letters mastered! Guardian defeated.");saveBest(g.score);return
    }
    setFeedback("Guardian hit "+g.bossHits+"/3! Read the next Arabic letter")
   }else{
    const learned=LETTERS[g.progress];g.progress++;setProgress(g.progress);
    if(g.progress===STARTS[g.stage+1]&&g.stage<4){
     g.stage++;g.checkpointScore=g.score;g.checkpointMistakes=0;
     g.running=false;g.orbs=[];setOrbs([]);setStage(g.stage);setPhase("between");
     setFeedback("Level cleared! "+learned[0]+" · "+learned[1]);saveBest(g.score);return
    }
    if(g.progress===LETTERS.length)setFeedback("28 letters complete! Guardian review begins.");
    else setFeedback("Great! "+learned[0]+" · "+learned[1]+". Read the next letter.")
   }
   g.orbs=[];g.waveDelay=.45;
  }else{loseLife("That was "+LETTERS[orb.letter][1]+". Find "+LETTERS[goal(g)][1])}
  setOrbs([...g.orbs])
 };
 const shootPoint=(x:number,y:number)=>{
  const g=game.current;if(!g.running||g.paused)return;
  for(let i=g.orbs.length-1;i>=0;i--){const o=g.orbs[i];if(Math.hypot(o.x-x,o.y-y)<=o.radius+13){shootId(o.id);return}}
 };
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext("2d");if(!c||!ctx)return;
  let raf=0;const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#041325");bg.addColorStop(.53,"#18354a");bg.addColorStop(1,"#063b32");
  const frame=(now:number)=>{
   const g=game.current;
   const dt=g.last?Math.min((now-g.last)/1000,.05):0;g.last=now;
   if(g.running&&!g.paused){
    if(g.orbs.length===0){g.waveDelay-=dt;if(g.waveDelay<=0){makeWave(g);setOrbs([...g.orbs])}}
    for(const o of g.orbs)o.y+=o.speed*dt;
    const escaped=g.orbs.filter(o=>o.y>H+o.radius);
    if(escaped.length){
     g.orbs=g.orbs.filter(o=>o.y<=H+o.radius);
     setOrbs([...g.orbs]);
     if(escaped.some(o=>o.letter===goal(g)))loseLife("The target escaped");
     if(g.orbs.length===0)g.waveDelay=.35
    }
    if(!reducedRef.current){
     g.shards=g.shards.filter(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=100*dt;s.rotation+=s.spin*dt;s.life-=dt;return s.life>0});
     if(g.shot){g.shot.life-=dt;if(g.shot.life<=0)g.shot=null}
    }else{g.shards=[];g.shot=null}
   }
   if(now-g.lastPaint>=32||g.lastPaint===0){
    g.lastPaint=now;
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.save();
    for(let i=0;i<55;i++){const x=(i*137+29)%W,y=(i*91+13)%H;ctx.fillStyle=i%4?"rgba(226,250,246,.36)":"rgba(251,227,168,.65)";ctx.fillRect(x,y,i%6?1:2,i%6?1:2)}
    ctx.strokeStyle="rgba(104,218,194,.18)";ctx.lineWidth=1;
    for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(W/2,100);ctx.lineTo(i*W/10,H);ctx.stroke()}
    for(let i=0;i<9;i++){const y=110+i*i*5.8;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.restore();
    for(const o of g.orbs){
     const depth=Math.max(.75,Math.min(1.16,.76+o.y/H*.35));
     ctx.save();ctx.translate(o.x,o.y);ctx.scale(depth,depth);
     ctx.shadowColor=o.boss?"#ffd36a":"#6de4cd";ctx.shadowBlur=reducedRef.current?0:17;
     const fill=ctx.createRadialGradient(-11,-14,2,0,0,o.radius);
     fill.addColorStop(0,"#ffffff");fill.addColorStop(.16,o.boss?"#ffe5a5":"#b3fff0");
     fill.addColorStop(.5,o.boss?"#b88937":"#208b8b");fill.addColorStop(1,"#102239");
     ctx.fillStyle=fill;ctx.beginPath();ctx.arc(0,0,o.radius,0,Math.PI*2);ctx.fill();
     ctx.shadowBlur=0;ctx.strokeStyle=o.boss?"#fff0a5":"rgba(228,255,249,.7)";ctx.lineWidth=1.5;ctx.stroke();
     ctx.beginPath();ctx.ellipse(-o.radius*.3,-o.radius*.45,o.radius*.26,o.radius*.11,-.55,0,Math.PI*2);
     ctx.fillStyle="rgba(255,255,255,.5)";ctx.fill();
     ctx.fillStyle="#ffffff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold "+(LETTERS[o.letter][1].length>10? "11px":"15px")+" system-ui, sans-serif";
     ctx.fillText(LETTERS[o.letter][1],0,1,o.radius*1.82);
     if(o.boss){ctx.font="20px serif";ctx.fillText("♛",0,-o.radius-10)}
     ctx.restore()
    }
    if(g.shot&&!reducedRef.current){
     ctx.save();ctx.globalAlpha=Math.min(1,g.shot.life*5);ctx.strokeStyle=g.shot.correct?"#ffe3a5":"#ff8eaa";ctx.lineWidth=4;
     ctx.beginPath();ctx.moveTo(W/2,H);ctx.lineTo(g.shot.x,g.shot.y);ctx.stroke();ctx.restore()
    }
    for(const s of g.shards){
     ctx.save();ctx.globalAlpha=Math.max(0,s.life/.55);ctx.translate(s.x,s.y);ctx.rotate(s.rotation);
     ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,4);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.restore()
    }
   }
   raf=requestAnimationFrame(frame)
  };
  raf=requestAnimationFrame(frame);
  return()=>cancelAnimationFrame(raf)
 },[saveBest,tone]);
 const toggleSound=async()=>{
  if(soundEnabled.current){soundEnabled.current=false;setSound(false);if(audio.current)await audio.current.suspend().catch(()=>{});return}
  if(typeof window.AudioContext==="undefined")return;
  try{if(!audio.current)audio.current=new window.AudioContext();await audio.current.resume();soundEnabled.current=true;setSound(true)}catch{setFeedback("Audio unavailable; you can still play silently.")}
 };
 const active=phase==="playing"||phase==="paused";
 const targetIndex=goal(game.current);
 const boss=progress===LETTERS.length;
 return <section className={styles.root} aria-label="Arabic Letter Quest educational game" onKeyDown={e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
  if(/^[1-4]$/.test(e.key)&&active){const target=orbs[Number(e.key)-1];if(target){e.preventDefault();shootId(target.id)}}
 }}>
  <header className={styles.hud}>
   <span className={styles.brand}>✦ ARABIC LETTER QUEST <small>LEVEL {stage+1}/5 · {LEVEL_NAMES[stage]}</small></span>
   <span className={styles.stats}>⭐ {score} <span>♥ {Math.max(0,5-misses)}</span></span>
  </header>
  <div className={styles.lesson} aria-live="polite">
   <span>{boss?"👑 GUARDIAN "+Math.min(bossHits+1,3)+"/3":"LETTER "+Math.min(progress+1,28)+"/28"}</span>
   <strong lang="ar" dir="rtl">{LETTERS[targetIndex][0]}</strong>
   <span>SHOOT ITS TRANSLITERATION</span>
  </div>
  <div className={styles.stage} ref={stageRef}>
   <canvas ref={canvas} className={styles.canvas} width={W} height={H}
    style={{width:size.width,height:size.height}} tabIndex={0}
    aria-label={"Read the Arabic letter "+LETTERS[targetIndex][0]+". Shoot its transliteration by tapping an orb or using the numbered target buttons below."}
    onPointerDown={e=>{e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();shootPoint((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)}}
    onPointerMove={e=>{if(e.pointerType==="touch")e.stopPropagation()}}
   />
   {phase!=="playing"&&<div className={styles.overlay}>
    <span className={styles.planet} aria-hidden="true">{phase==="won"?"🏆":phase==="over"?"✧":"✦"}</span>
    <h2>{phase==="ready"?"LEARN THE ARABIC ALPHABET":phase==="between"?"LEVEL COMPLETE":phase==="paused"?"PAUSED":phase==="won"?"ALL 28 LETTERS MASTERED!":"MISSION ENDED"}</h2>
    <p>{phase==="ready"?"Read the Arabic letter above and shoot the bubble containing its transliteration. Clear five levels and defeat the Guardian review.":phase==="between"?"Next: Level "+(stage+1)+" · "+LEVEL_NAMES[stage]:phase==="paused"?"Your falling letters and timer are frozen.":phase==="won"?"You completed all five levels and the Guardian review!":"Five mistakes used. Restart this level to practice again."}</p>
    <button type="button" onClick={phase==="paused"?togglePause:phase==="between"?()=>beginLevel(false):phase==="ready"||phase==="won"?start:restartLevel}>
     {phase==="paused"?"▶ RESUME":phase==="between"?"▶ NEXT LEVEL":phase==="ready"?"▶ START LEARNING":phase==="won"?"↻ PLAY AGAIN":"↻ RETRY LEVEL"}
    </button>
    <small>Personal best · {best}</small>
   </div>}
  </div>
  <div className={styles.targetBar} aria-label="Accessible transliteration targets">
   <span className={styles.targetLabel}>Shoot:</span>
   {active&&orbs.length?orbs.map((o,i)=><button key={o.id} type="button" disabled={phase==="paused"}
     onClick={()=>shootId(o.id)} aria-label={"Shoot target "+(i+1)+", "+LETTERS[o.letter][1]}>
     <small>{i+1}</small> <span>{LETTERS[o.letter][1]}</span>
    </button>):<span className={styles.waiting}>{phase==="playing"?"New letters incoming…":"Start or resume to shoot"}</span>}
  </div>
  <footer className={styles.footer}>
   <span className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">{feedback}</span>
   <div className={styles.controls}>
    <button type="button" onClick={togglePause} disabled={!active}>{phase==="paused"?"▶ Resume":"Ⅱ Pause"}</button>
    <button type="button" onClick={restartLevel} disabled={phase==="ready"}>↻ Restart level</button>
    <button type="button" onClick={()=>setReduced(v=>!v)} aria-pressed={reduced}>{reduced?"Motion off":"Reduce motion"}</button>
    <button type="button" onClick={()=>{void toggleSound()}} aria-pressed={sound} disabled={!audioAvailable}>{sound?"🔊 Sound on":"🔇 Sound off"}</button>
   </div>
  </footer>
 </section>
}
