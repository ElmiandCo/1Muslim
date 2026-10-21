"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import styles from "./CosmicCatchGame.module.css";

const W=360,H=500;
const LETTERS=[
 ["ا","Alif"],["ب","Baa"],["ت","Taa"],["ث","Thaa"],["ج","Jeem"],["ح","Haa"],["خ","Khaa"],
 ["د","Daal"],["ذ","Dhaal"],["ر","Raa"],["ز","Zaay"],["س","Seen"],["ش","Sheen"],["ص","Saad"],
 ["ض","Daad"],["ط","Taa (heavy)"],["ظ","Dhaa (heavy)"],["ع","Ayn"],["غ","Ghayn"],["ف","Faa"],
 ["ق","Qaaf"],["ك","Kaaf"],["ل","Laam"],["م","Meem"],["ن","Noon"],["ه","Haa (soft)"],["و","Waaw"],["ي","Yaa"]
] as const;
const STARTS=[0,9,19,28] as const;
const LEVEL_NAMES=["Easy · Flight School","Medium · Star Routes","Challenging · Nebula Run"] as const;
const BOSS_REVIEW=[3,14,25] as const;
type Phase="ready"|"playing"|"paused"|"between"|"over"|"won";
type Orb={id:number;x:number;y:number;letter:number;radius:number;speed:number;boss:boolean};
type Shard={x:number;y:number;vx:number;vy:number;rotation:number;spin:number;life:number;color:string};
type Shot={x:number;y:number;life:number;correct:boolean};
type Game={
 running:boolean;paused:boolean;stage:number;progress:number;bossHits:number;score:number;mistakes:number;
 checkpointScore:number;checkpointMistakes:number;orbs:Orb[];shards:Shard[];shot:Shot|null;
 nextId:number;last:number;lastPaint:number;waveDelay:number;shipX:number;shipY:number;targetId:number|null;waveClock:number;travel:number
};
const newGame=():Game=>({
 running:false,paused:false,stage:0,progress:0,bossHits:0,score:0,mistakes:0,
 checkpointScore:0,checkpointMistakes:0,orbs:[],shards:[],shot:null,nextId:0,last:0,lastPaint:0,waveDelay:0,shipX:W/2,shipY:H-50,targetId:null,waveClock:0,travel:0
} as Game);
const goal=(g:Game)=>g.progress<LETTERS.length?g.progress:BOSS_REVIEW[Math.min(g.bossHits,BOSS_REVIEW.length-1)];
const shuffle=<T,>(array:T[]):T[]=>{for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array};
const makeWave=(g:Game)=>{
 if(!g.running||g.paused||g.orbs.length)return;
 const boss=g.progress===LETTERS.length;
 const count=g.stage===0?2:g.stage===1?3:4;
 const correct=goal(g);
 const similar:Record<number,number[]>={1:[2,3,4],2:[1,3],3:[1,2],4:[5,6],5:[4,6],6:[4,5],7:[8],8:[7],9:[10],10:[9],11:[12],12:[11],13:[14],14:[13],15:[16],16:[15],17:[18],18:[17],19:[20],20:[19],21:[22],22:[21],23:[24],24:[23],25:[5,6]};
 const distractors=shuffle(LETTERS.map((_,i)=>i).filter(i=>i!==correct));
 const pool=g.stage>=2?Array.from(new Set([...shuffle(similar[correct]||[]),...distractors])).slice(0,count-1):distractors.slice(0,count-1);
 const options=shuffle([correct,...pool]);
 g.waveClock=0;
 const positions=count===2?[100,260]:count===3?[62,180,298]:[45,135,225,315];
 g.orbs=options.map((letter,i)=>({
  id:++g.nextId,x:positions[i],y:122+(i%2)*38,letter,
  radius:boss&&letter===correct?34:count===4?27:30,
  speed:83+g.stage*32+(boss?10:0),boss:boss&&letter===correct
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
 const [feedback,setFeedback]=useState("Read the Arabic letter, then fly your ship through the matching transliteration.");
 const impactRef=useRef<(id:number)=>void>(()=>{});
 const loseLifeRef=useRef<(message:string)=>void>(()=>{});
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
  current.shipX=W/2;current.shipY=H-50;current.targetId=null;current.waveClock=0;
  current.progress=STARTS[current.stage];current.bossHits=0;
  current.score=current.checkpointScore;current.mistakes=current.checkpointMistakes;
  makeWave(current);
  setOrbs([...current.orbs]);setStage(current.stage);setProgress(current.progress);setBossHits(0);
  setScore(current.score);setMisses(current.mistakes);setPhase("playing");
  setFeedback("Read the Arabic letter, then steer into its transliteration bubble.");
 };
 const start=()=>{game.current=newGame();beginLevel(true)};
 useEffect(()=>{const g=game.current;if(!g.running&&g.progress===0&&g.score===0){game.current=newGame();const current=game.current;current.running=true;current.paused=false;current.last=0;makeWave(current);setOrbs([...current.orbs]);setPhase("playing");setFeedback("Steer through the correct transliteration bubble to learn the Arabic letters.")}},[]);
 const restartLevel=()=>{const g=game.current;if(g.stage<0||g.stage>2)return;beginLevel(false)};
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
 loseLifeRef.current=loseLife;
 const shootId=(id:number)=>{
  const g=game.current;if(!g.running||g.paused)return;
  const index=g.orbs.findIndex(o=>o.id===id);if(index<0)return;
  const orb=g.orbs.splice(index,1)[0];
  g.targetId=null;
  const correct=orb.letter===goal(g);
  const impactX=W/2+(orb.x-W/2)*Math.max(.32,Math.min(1.18,.20+orb.y/H));
  g.shot={x:impactX,y:orb.y,life:.2,correct};
  if(!reducedRef.current)for(let i=0;i<18;i++){
   const angle=i*Math.PI/9,velocity=75+Math.random()*90;
   g.shards.push({x:impactX,y:orb.y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,
    rotation:angle,spin:(Math.random()-.5)*10,life:.55,color:correct?"#ffdf91":"#ff859c"})
  }
  tone(correct);
  if(correct){
   g.score+=100;setScore(g.score);
   if(g.progress===LETTERS.length){
    g.bossHits++;setBossHits(g.bossHits);
    if(g.bossHits===BOSS_REVIEW.length){
     g.running=false;g.orbs=[];setOrbs([]);setPhase("won");setFeedback("All 28 letters mastered! Guardian defeated.");saveBest(g.score);return
    }
    setFeedback("Guardian hit "+g.bossHits+"/3! Read the next Arabic letter")
   }else{
    const learned=LETTERS[g.progress];g.progress++;setProgress(g.progress);
    if(g.progress===STARTS[g.stage+1]&&g.stage<2){
     g.stage++;g.checkpointScore=g.score;g.checkpointMistakes=0;
     g.running=false;g.orbs=[];setOrbs([]);setStage(g.stage);setPhase("between");
     setFeedback("Level cleared! "+learned[0]+" · "+learned[1]);saveBest(g.score);return
    }
    if(g.progress===LETTERS.length)setFeedback("28 letters complete! Guardian review begins.");
    else setFeedback("Great! "+learned[0]+" · "+learned[1]+". Read the next letter.")
   }
   g.orbs=[];g.waveDelay=.45;
  }else{loseLife("That was "+LETTERS[orb.letter][1]+". Read the Arabic prompt and try again")}
  setOrbs([...g.orbs])
 };
 impactRef.current=shootId;
 const flyToId=(id:number)=>{const g=game.current;if(!g.running||g.paused)return;if(g.orbs.some(o=>o.id===id))g.targetId=id};
 const shootPoint=(x:number,y:number)=>{
  const g=game.current;if(!g.running||g.paused)return;
  for(let i=g.orbs.length-1;i>=0;i--){const o=g.orbs[i];if(Math.hypot(W/2+(o.x-W/2)*Math.max(.32,Math.min(1.18,.20+o.y/H))-x,o.y-y)<=o.radius*Math.max(.32,Math.min(1.18,.20+o.y/H))+16){flyToId(o.id);return}}
 };
 useEffect(()=>{
  const c=canvas.current,ctx=c?.getContext("2d");if(!c||!ctx)return;
  let raf=0;const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#041325");bg.addColorStop(.53,"#18354a");bg.addColorStop(1,"#063b32");
  const frame=(now:number)=>{
   const g=game.current;
   const dt=g.last?Math.min((now-g.last)/1000,.05):0;g.last=now;
   if(g.running&&!g.paused){
    g.travel+=dt*(1+g.stage*.5);
    if(g.orbs.length===0){g.waveDelay-=dt;if(g.waveDelay<=0){makeWave(g);setOrbs([...g.orbs])}}
    // The player flies to the letters: the orbs hold their place in 3D space.
    // Tap or a numbered key locks the ship onto a bubble; arrow keys steer manually.
    if(g.orbs.length){
     g.waveClock+=dt;
     const target=g.orbs.find(o=>o.id===g.targetId);
     if(target){
      const projectedX=W/2+(target.x-W/2)*Math.max(.32,Math.min(1.18,.20+target.y/H));
      const dx=projectedX-g.shipX,dy=target.y-g.shipY,distance=Math.hypot(dx,dy);
      const step=(225+g.stage*22)*dt;
      if(distance>0){g.shipX+=dx/distance*Math.min(step,distance);g.shipY+=dy/distance*Math.min(step,distance)}
     }else g.targetId=null;
     const collision=g.orbs.find(o=>{const depth=Math.max(.32,Math.min(1.18,.20+o.y/H));return Math.hypot(W/2+(o.x-W/2)*depth-g.shipX,o.y-g.shipY)<o.radius*depth+12});
     if(collision)impactRef.current(collision.id);
     else if(g.waveClock>(g.stage===0?20:g.stage===1?17:g.stage===2?14:g.stage===3?12:10)){
      g.orbs=[];g.targetId=null;g.shipX=W/2;g.shipY=H-50;g.waveDelay=.5;
      setOrbs([]);loseLifeRef.current("Time ran out");
     }
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
    for(let i=0;i<55;i++){const x=(i*137+29)%W,y=((i*91+13)+(reducedRef.current?0:g.travel*(17+i%5*8)))%H;ctx.fillStyle=i%4?"rgba(226,250,246,.36)":"rgba(251,227,168,.65)";ctx.fillRect(x,y,i%6?1:2,i%6?1:2)}
    ctx.strokeStyle="rgba(104,218,194,.18)";ctx.lineWidth=1;
    for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(W/2+(g.shipX-W/2)*.08,100);ctx.lineTo(i*W/10-(g.shipX-W/2)*.2,H);ctx.stroke()}
    for(let i=0;i<9;i++){const y=110+((i*i*5.8+(reducedRef.current?0:g.travel*22))%390);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.restore();
    for(const o of g.orbs){
     const depth=Math.max(.32,Math.min(1.18,.20+o.y/H));
     ctx.save();ctx.translate(W/2+(o.x-W/2)*depth,o.y);ctx.scale(depth,depth);
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
    // The moving ship is the player, not a fixed cannon at the bottom.
    ctx.save();ctx.translate(g.shipX,g.shipY);
    const heading=g.targetId!==null?g.orbs.find(o=>o.id===g.targetId):null;
    if(heading)ctx.rotate(Math.atan2(heading.y-g.shipY,heading.x-g.shipX)+Math.PI/2);
    ctx.shadowColor="#55f8df";ctx.shadowBlur=reducedRef.current?0:18;
    ctx.fillStyle="#d9fff4";ctx.strokeStyle="#d7c080";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(13,15);ctx.lineTo(0,9);ctx.lineTo(-13,15);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle="#22bfae";ctx.beginPath();ctx.ellipse(0,-2,5,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffcd70";ctx.beginPath();ctx.moveTo(-5,15);ctx.lineTo(0,23+(reducedRef.current?0:Math.sin(now/110)*3));ctx.lineTo(5,15);ctx.fill();ctx.restore();
    if(g.shot&&!reducedRef.current){
     ctx.save();ctx.globalAlpha=Math.min(1,g.shot.life*5);ctx.strokeStyle=g.shot.correct?"#ffe3a5":"#ff8eaa";ctx.lineWidth=4;
     ctx.beginPath();ctx.arc(g.shot.x,g.shot.y,32*(1-g.shot.life/.2),0,Math.PI*2);ctx.stroke();ctx.restore()
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
  if(/^[1-4]$/.test(e.key)&&active){const target=orbs[Number(e.key)-1];if(target){e.preventDefault();flyToId(target.id)}}
  if(active&&phase==="playing"&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();const g=game.current;g.targetId=null;g.shipX=Math.max(16,Math.min(W-16,g.shipX+(e.key==="ArrowRight"?28:e.key==="ArrowLeft"?-28:0)));g.shipY=Math.max(45,Math.min(H-25,g.shipY+(e.key==="ArrowDown"?28:e.key==="ArrowUp"?-28:0))) }
 }}>
  <header className={styles.hud}>
   <span className={styles.brand}>✦ ARABIC LETTER QUEST <small>LEVEL {stage+1}/3 · {LEVEL_NAMES[stage]}</small></span>
   <span className={styles.stats}>⭐ {score} <span>♥ {Math.max(0,5-misses)}</span></span>
  </header>
  <div className={styles.lesson} aria-live="polite">
   <span>{boss?"👑 GUARDIAN "+Math.min(bossHits+1,3)+"/3":"LETTER "+Math.min(progress+1,28)+"/28"}</span>
   <strong lang="ar" dir="rtl">{LETTERS[targetIndex][0]}</strong>
   <span>FLY THROUGH THE RIGHT TRANSLITERATION</span>
  </div>
  <div className={styles.stage} ref={stageRef}>
   <canvas ref={canvas} className={styles.canvas} width={W} height={H}
    style={{width:size.width,height:size.height}} tabIndex={0}
    aria-label={"Read Arabic letter "+LETTERS[targetIndex][0]+". Tap a transliteration bubble to fly through it, or steer with arrow keys. Number keys 1 through 4 select bubbles."}
    onPointerDown={e=>{e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();shootPoint((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)}}
    onPointerMove={e=>{if(e.pointerType==="touch")e.stopPropagation();if(e.buttons===1&&phase==="playing"){const r=e.currentTarget.getBoundingClientRect();const g=game.current;g.targetId=null;g.shipX=Math.max(16,Math.min(W-16,(e.clientX-r.left)*W/r.width));g.shipY=Math.max(45,Math.min(H-25,(e.clientY-r.top)*H/r.height))}}}
   />
   {phase!=="playing"&&phase!=="ready"&&<div className={styles.overlay}>
    <span className={styles.planet} aria-hidden="true">{phase==="won"?"🏆":phase==="over"?"✧":"✦"}</span>
    <h2>{phase==="paused"?"LEARN THE ARABIC ALPHABET":phase==="between"?"LEVEL COMPLETE":phase==="paused"?"PAUSED":phase==="won"?"ALL 28 LETTERS MASTERED!":"MISSION ENDED"}</h2>
    <p>{phase==="paused"?"Read the Arabic letter above, then steer your ship through the bubble with its transliteration. Tap to fly, drag to steer, or use the arrow keys. Clear three levels and the Guardian.":phase==="between"?"Next: Level "+(stage+1)+" · "+LEVEL_NAMES[stage]:phase==="paused"?"Your spacecraft and game timer are paused.":phase==="won"?"You completed all three levels and the Guardian review!":"Five mistakes used. Restart this level to practice again."}</p>
    <button type="button" onClick={phase==="paused"?togglePause:phase==="between"?()=>beginLevel(false):phase==="won"?start:restartLevel}>
     {phase==="paused"?"▶ RESUME":phase==="between"?"▶ NEXT LEVEL":phase==="paused"?"▶ START LEARNING":phase==="won"?"↻ PLAY AGAIN":"↻ RETRY LEVEL"}
    </button>
    <small>Personal best · {best}</small>
   </div>}
  </div>
  <div className={styles.targetBar} aria-label="Accessible flight lanes">
   <span className={styles.targetLabel}>Fly to:</span>
   {active&&orbs.length?orbs.map((o,i)=><button key={o.id} type="button" disabled={phase==="paused"}
     onClick={()=>flyToId(o.id)} aria-label={"Fly to target "+(i+1)+", "+LETTERS[o.letter][1]}>
     <small>{i+1}</small> <span>{LETTERS[o.letter][1]}</span>
    </button>):<span className={styles.waiting}>{phase==="playing"?"New letters incoming…":"Start or resume flight"}</span>}
  </div>
  <footer className={styles.footer}>
   <span className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">{feedback}</span>
   <div className={styles.controls}>
    <button type="button" onClick={togglePause} disabled={!active}>{phase==="paused"?"▶ Resume":"Ⅱ Pause"}</button>
    <button type="button" onClick={restartLevel} disabled={phase==="ready"}>↻ Restart level</button>
   </div>
  </footer>
 </section>
}
