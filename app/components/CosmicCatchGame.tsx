"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./CosmicCatchGame.module.css";
const W=360,H=500;
const letters=[["ا","Alif"],["ب","Baa"],["ت","Taa"],["ث","Thaa"],["ج","Jeem"],["ح","Haa"],["خ","Khaa"],["د","Daal"],["ذ","Dhaal"],["ر","Raa"],["ز","Zaay"],["س","Seen"],["ش","Sheen"],["ص","Saad"],["ض","Daad"],["ط","Taa (heavy)"],["ظ","Dhaa"],["ع","Ayn"],["غ","Ghayn"],["ف","Faa"],["ق","Qaaf"],["ك","Kaaf"],["ل","Laam"],["م","Meem"],["ن","Noon"],["ه","Haa"],["و","Waaw"],["ي","Yaa"]] as const;
type Target={x:number;y:number;letter:number;id:number};
type Spark={x:number;y:number;vx:number;vy:number;life:number};
export default function CosmicCatchGame(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const game=useRef({running:false,paused:false,targets:[] as Target[],sparks:[] as Spark[],score:0,misses:0,level:0,last:0,spawn:0,nextId:0});
 const [phase,setPhase]=useState<"ready"|"playing"|"paused"|"over">("ready");
 const [score,setScore]=useState(0),[misses,setMisses]=useState(0),[level,setLevel]=useState(0),[feedback,setFeedback]=useState("Tap the matching Arabic letter to shoot it!");
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)},[]);
 const reset=()=>{game.current={running:true,paused:false,targets:[],sparks:[],score:0,misses:0,level:0,last:0,spawn:0,nextId:0};setScore(0);setMisses(0);setLevel(0);setFeedback("Find "+letters[0][1]);setPhase("playing");canvas.current?.focus()};
 const togglePause=()=>{const g=game.current;if(!g.running)return;g.paused=!g.paused;g.last=0;setPhase(g.paused?"paused":"playing")};
 useEffect(()=>{const hide=()=>{if(document.hidden&&game.current.running&&!game.current.paused){game.current.paused=true;game.current.last=0;setPhase("paused")}};document.addEventListener("visibilitychange",hide);return()=>document.removeEventListener("visibilitychange",hide)},[]);
 useEffect(()=>{const c=canvas.current,ctx=c?.getContext("2d");if(!c||!ctx)return;let raf=0;const draw=(now:number)=>{
 const g=game.current,dt=g.last?Math.min((now-g.last)/1000,.035):0;g.last=now;
 if(g.running&&!g.paused){
 g.spawn+=dt;if(g.spawn>Math.max(.62,1.55-g.level*.035)){g.spawn=0;const correct=Math.random()<.5;let letter=correct?g.level:(g.level+1+Math.floor(Math.random()*6))%letters.length;g.targets.push({x:43+Math.random()*(W-86),y:-30,letter,id:++g.nextId})}
 for(const t of g.targets)t.y+=dt*(48+g.level*2);
 g.targets=g.targets.filter(t=>{if(t.y<H+30)return true;if(t.letter===g.level){g.misses++;setMisses(g.misses);setFeedback("Missed "+letters[g.level][0]+" · try again");if(g.misses>=5){g.running=false;setPhase("over")}}return false});
 }
 if(!reduced)g.sparks=g.sparks.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;return p.life>0});else g.sparks=[];
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#051a2a");bg.addColorStop(.55,"#102e46");bg.addColorStop(1,"#06261f");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.strokeStyle="rgba(133,241,204,.13)";for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(W/2,H*.22);ctx.lineTo(i*W/11,H);ctx.stroke()}for(let i=0;i<8;i++){let y=H*.23+i*i*5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.restore();
 for(const t of g.targets){const radius=30;ctx.save();ctx.translate(t.x,t.y);ctx.shadowColor=t.letter===g.level?"#f8d97c":"#67e4da";ctx.shadowBlur=reduced?0:22;const orb=ctx.createRadialGradient(-11,-13,2,0,0,radius);orb.addColorStop(0,"#faffff");orb.addColorStop(.2,t.letter===g.level?"#e4b85e":"#5ccabf");orb.addColorStop(1,"#102a3d");ctx.fillStyle=orb;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=1.5;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 38px serif";ctx.fillText(letters[t.letter][0],0,1);ctx.restore()}
 for(const p of g.sparks){ctx.globalAlpha=Math.max(0,p.life/.55);ctx.fillStyle="#ffe4a3";ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1;
 raf=requestAnimationFrame(draw)};raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf)},[reduced]);
 const shoot=(x:number,y:number)=>{const g=game.current;if(!g.running||g.paused)return;let index=-1;for(let i=g.targets.length-1;i>=0;i--){const t=g.targets[i];if(Math.hypot(t.x-x,t.y-y)<38){index=i;break}}if(index<0)return;const t=g.targets.splice(index,1)[0];if(!reduced)for(let i=0;i<16;i++){const a=i*Math.PI/8;g.sparks.push({x:t.x,y:t.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,life:.55})}if(t.letter===g.level){g.score+=100;setScore(g.score);const next=(g.level+1)%letters.length;g.level=next;setLevel(next);setFeedback("Excellent! "+letters[t.letter][0]+" · "+letters[t.letter][1]);g.targets=[]}else{g.misses++;setMisses(g.misses);setFeedback("Try again: find "+letters[g.level][0]);if(g.misses>=5){g.running=false;setPhase("over")}}};
 return <section className={styles.root} aria-label="Arabic alphabet arcade"><header className={styles.hud}><span className={styles.brand}>✦ ARABIC LETTER QUEST <small>3D ARCADE</small></span><span className={styles.stats}>⭐ {score} <span>♥ {Math.max(0,5-misses)}</span></span></header>
 <div className={styles.stage}><canvas ref={canvas} className={styles.canvas} width={W} height={H} tabIndex={0} aria-label={`Shoot the Arabic letter ${letters[level][0]}, ${letters[level][1]}. Tap a floating letter or use keyboard keys 1 through 9 to select visible targets.`} onPointerDown={e=>{e.stopPropagation();e.preventDefault();const r=e.currentTarget.getBoundingClientRect();shoot((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)}} onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key===" "){e.preventDefault();togglePause()}const n=Number(e.key);if(n>=1&&n<=9){const t=game.current.targets[n-1];if(t)shoot(t.x,t.y)}}}/>
 {phase!=="playing"&&<div className={styles.overlay}><span className={styles.planet}>✦</span><h2>{phase==="ready"?"ARABIC LETTER QUEST":phase==="paused"?"PAUSED":"MISSION COMPLETE"}</h2><p>{phase==="ready"?"Find the requested Arabic letter and tap to shoot its floating 3D orb. Learn all 28 letters!":phase==="over"?"Score: "+score+" · Practice again!":"Take your time — your progress is safe."}</p><button type="button" onClick={phase==="paused"?togglePause:reset}>{phase==="paused"?"▶ RESUME":phase==="over"?"↻ RESTART":"▶ START LEARNING"}</button></div>}</div>
 <footer className={styles.footer} style={{flexWrap:"wrap",gap:8}}><span aria-live="polite">Find: <strong lang="ar" style={{fontSize:26}}>{letters[level][0]}</strong> {letters[level][1]} · {level+1}/28</span><span aria-live="polite">{feedback}</span><button type="button" onClick={togglePause} disabled={phase==="ready"||phase==="over"}>{phase==="paused"?"Resume":"Pause"}</button><button type="button" onClick={reset}>Restart</button><button type="button" onClick={()=>setReduced(v=>!v)} aria-pressed={reduced}>{reduced?"Effects off":"Reduce effects"}</button></footer></section>
}
