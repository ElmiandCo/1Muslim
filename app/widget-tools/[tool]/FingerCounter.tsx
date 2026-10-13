"use client";
import type {CSSProperties} from "react";
import styles from "./finger-counter.module.css";
type Props={count:number;onCount:()=>void;compact?:boolean};
const fingers=[{name:"Thumb",x:34,y:107,w:22,h:76,angle:-44},{name:"Index",x:67,y:65,w:19,h:94,angle:-9},{name:"Middle",x:94,y:48,w:19,h:109,angle:0},{name:"Ring",x:121,y:62,w:19,h:98,angle:9},{name:"Little",x:147,y:88,w:18,h:72,angle:19}];
function Hand({side,folded,active}:{side:"left"|"right";folded:number;active:boolean}){
 return <div className={[styles.handWrap,active?styles.active:""].join(" ")}><div className={styles.handLabel}>{side==="left"?"LEFT HAND":"RIGHT HAND"}</div>
 <svg viewBox="0 0 200 250" role="img" aria-label={side+" palm up with "+folded+" fingers folded"} className={styles.hand}>
 <defs><linearGradient id={"skin-"+side} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dfb998"/><stop offset=".55" stopColor="#c89578"/><stop offset="1" stopColor="#a8795f"/></linearGradient></defs>
 <g transform={side==="right"?"translate(200 0) scale(-1 1)":undefined}>
 <path d="M48 135 Q39 153 43 179 L54 227 Q98 246 150 226 L160 175 Q167 150 150 129 Q99 116 48 135Z" fill={"url(#skin-"+side+")"} stroke="#f0c6a1" strokeWidth="2.5"/>
 {fingers.map((f,i)=>{const bent=i<folded;return <g key={f.name} style={{transformOrigin:(f.x+f.w/2)+"px 155px",transform:bent?"translateY(45px) scaleY(.43) rotate("+(-f.angle*.25)+"deg)":"translateY(0) scaleY(1)",transition:"transform .33s cubic-bezier(.2,.8,.3,1)"}}><rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.w/2} transform={`rotate(${f.angle} ${f.x+f.w/2} 155)`} fill={"url(#skin-"+side+")"} stroke="#f0c6a1" strokeWidth="2"/><path d={`M${f.x+5} ${f.y+17} q5 -4 9 0`} stroke="#f2d2b9" strokeWidth="2" fill="none" opacity=".6"/></g>})}
 <path d="M64 175 Q102 157 144 177 M67 190 Q100 181 139 191" fill="none" stroke="#8f614d" strokeWidth="2.5" opacity=".5" strokeLinecap="round"/>
 </g></svg></div>
}
export default function FingerCounter({count,onCount,compact=false}:Props){
 // A 20-count visual circuit: left hand folds thumb-to-little (1–5),
 // opens little-to-thumb (6–10), then right hand repeats (11–20).
 // Subsequent circuits continue the count without resetting, up to 100 and beyond.
 const position=count%20;const leftActive=position<10;const step=position%10;
 const fold=step<=5?step:10-step;
 const leftFold=leftActive?fold:0,rightFold=leftActive?0:fold;
 const hundred=count%100;const round=Math.floor(hundred/20)+1;
 return <div className={[styles.counter,compact?styles.compact:""].join(" ")} style={{"--round-progress":hundred+"%"} as CSSProperties}>
 <div className={styles.top}><span>PALMS UP · FINGER COUNTING</span><strong>{hundred===0&&count>0?100:hundred} / 100</strong></div>
 <button type="button" className={styles.tapSurface} onClick={onCount} aria-label="Count one dhikr with finger animation">
 <div className={styles.hands}><Hand side="left" folded={leftFold} active={leftActive}/><Hand side="right" folded={rightFold} active={!leftActive}/></div>
 <div className={styles.tapHint}>TAP HANDS TO COUNT <span>✦</span></div>
 </button>
 <div className={styles.track}><div style={{width:hundred+"%"}}/></div>
 <small className={styles.status}>Circuit {round} of 5 · {leftActive?"Left":"Right"} palm · {step<5?"folding":"opening"} one finger at a time</small>
 </div>;
}
