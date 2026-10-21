"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./CosmicCatchGame.module.css";
type Item={x:number;y:number;danger:boolean};
const W=360,H=500;
export default function CosmicCatchGame(){
 const ref=useRef<HTMLCanvasElement>(null);
 const game=useRef({playing:false,x:180,items:[] as Item[],score:0,lives:3,last:0,spawn:0});
 const keys=useRef({left:false,right:false});
 const [phase,setPhase]=useState<"ready"|"playing"|"over">("ready");
 const [score,setScore]=useState(0),[lives,setLives]=useState(3),[best,setBest]=useState(0);
 const [reduce,setReduce]=useState(false);
 useEffect(()=>{try{setBest(Number(localStorage.getItem("1muslim-game-best")||0))}catch{}setReduce(matchMedia("(prefers-reduced-motion: reduce)").matches)},[]);
 const start=()=>{game.current={playing:true,x:180,items:[],score:0,lives:3,last:0,spawn:0};setScore(0);setLives(3);setPhase("playing");ref.current?.focus()};
 useEffect(()=>{
  const c=ref.current,ctx=c?.getContext("2d");if(!c||!ctx)return;
  let raf=0;const draw=(now:number)=>{
   const g=game.current,dt=g.last?Math.min((now-g.last)/1000,.04):0;g.last=now;
   if(g.playing){
    g.x=Math.max(24,Math.min(W-24,g.x+(Number(keys.current.right)-Number(keys.current.left))*280*dt));
    g.spawn+=dt;if(g.spawn>.48){g.spawn=0;g.items.push({x:24+Math.random()*(W-48),y:-18,danger:Math.random()<.32})}
    g.items=g.items.filter(o=>{o.y+=dt*(160+g.score*.08);if(Math.hypot(o.x-g.x,o.y-(H-60))<29){if(o.danger){g.lives--;setLives(g.lives);if(g.lives<=0){g.playing=false;setPhase("over");setBest(b=>{const n=Math.max(b,g.score);try{localStorage.setItem("1muslim-game-best",String(n))}catch{}return n})}}else{g.score+=10;setScore(g.score)}return false}return o.y<H+20});
   }
   const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#061331");bg.addColorStop(.6,"#233469");bg.addColorStop(1,"#071c28");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
   for(let i=0;i<65;i++){ctx.fillStyle="rgba(227,251,255,.6)";ctx.fillRect((i*73+19)%W,(i*113+31)%H,i%7?1:2,i%7?1:2)}
   for(const o of g.items){ctx.shadowBlur=17;ctx.shadowColor=o.danger?"#ff639e":"#ffe2a0";ctx.fillStyle=o.danger?"#ff7a9e":"#ffe9a3";ctx.beginPath();ctx.arc(o.x,o.y,o.danger?15:11,0,Math.PI*2);ctx.fill()}
   ctx.shadowColor="#78ffe3";ctx.shadowBlur=reduce?0:23;ctx.fillStyle="#adfff1";ctx.beginPath();ctx.moveTo(g.x,H-86);ctx.lineTo(g.x+23,H-41);ctx.lineTo(g.x,H-52);ctx.lineTo(g.x-23,H-41);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
   raf=requestAnimationFrame(draw);
  };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
 },[reduce]);
 const move=(x:number)=>{const r=ref.current?.getBoundingClientRect();if(r)game.current.x=Math.max(24,Math.min(W-24,(x-r.left)*W/r.width))};
 return <section className={styles.root} aria-label="Cosmic Catch game"><header className={styles.hud}><span className={styles.brand}>✦ COSMIC CATCH <small>GAME LAB</small></span><span className={styles.stats}>⭐ {score} <span>♥ {lives}</span></span></header><div className={styles.stage}><canvas ref={ref} className={styles.canvas} width={W} height={H} tabIndex={0} aria-label="Move left or right to catch stars and dodge meteors" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);move(e.clientX)}} onPointerMove={e=>{if(e.buttons||e.pointerType==="touch"){e.stopPropagation();move(e.clientX)}}} onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();e.stopPropagation();keys.current[e.key==="ArrowLeft"?"left":"right"]=true}}} onKeyUp={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight")keys.current[e.key==="ArrowLeft"?"left":"right"]=false}} onBlur={()=>{keys.current={left:false,right:false}}}/>{phase!=="playing"&&<div className={styles.overlay}><span className={styles.planet}>✦</span><h2>{phase==="over"?"MISSION COMPLETE":"CATCH THE STARS"}</h2><p>{phase==="over"?"Score: "+score+". Ready for another flight?":"Drag your ship to collect golden stars and dodge pink meteors."}</p><button type="button" onClick={start}>{phase==="over"?"↻ PLAY AGAIN":"▶ LAUNCH MISSION"}</button><small>Personal best · {best}</small></div>}</div><footer className={styles.footer}><span>☝ Drag · ← → keys</span><button type="button" onClick={()=>setReduce(v=>!v)} aria-pressed={reduce}>{reduce?"Effects off":"Reduce effects"}</button></footer></section>;
}
