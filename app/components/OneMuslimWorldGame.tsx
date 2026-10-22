"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import CosmicCatchGame from "./CosmicCatchGame";
import {eras,names,type Era} from "./world-game-data";
import styles from "./OneMuslimWorldGame.module.css";

type Suit="gold"|"silver"|"cosmic"|"diamond";
type Mode="lobby"|"worlds"|"quest";
type V3={x:number;y:number;z:number};
type Player={x:number;y:number;z:number;vy:number;yaw:number;flight:boolean;boost:boolean};
type Input={forward:number;strafe:number;up:boolean;down:boolean;boost:boolean};
const SUITS:Record<Suit,{primary:string;shine:string;trail:string}>={
 gold:{primary:"#bb8d37",shine:"#fff1a7",trail:"#f6ce66"},
 silver:{primary:"#849eac",shine:"#ffffff",trail:"#cce9f5"},
 cosmic:{primary:"#5547a7",shine:"#7bf1ef",trail:"#bca4ff"},
 diamond:{primary:"#9dbfd5",shine:"#ffffff",trail:"#a4eaff"}
};
const LIVE_Z=-18.3,PORTAL_Z=120,PORTAL_Y=12;
const limit=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
const distance=(a:V3,b:V3)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

export default function OneMuslimWorldGame(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const shell=useRef<HTMLDivElement>(null);
 const player=useRef<Player>({x:0,y:0,z:0,vy:0,yaw:0,flight:false,boost:false});
 const input=useRef<Input>({forward:0,strafe:0,up:false,down:false,boost:false});
 const keys=useRef<Set<string>>(new Set());
 const lookPointer=useRef<{id:number;x:number}|null>(null);
 const stickPointer=useRef<{id:number;x:number;y:number}|null>(null);
 const stick=useRef<HTMLDivElement>(null);
 const clock=useRef(0);
 const [mode,setMode]=useState<Mode>("lobby");
 const [suit,setSuit]=useState<Suit>("gold");
 const [flight,setFlight]=useState(false);
 const [nearPortal,setNearPortal]=useState(false);
 const [nearLive,setNearLive]=useState(false);
 const [distanceToPortal,setDistanceToPortal]=useState(120);
 const [reduced,setReduced]=useState(false);
 const [soundNotice,setSoundNotice]=useState(false);
 const [compass,setCompass]=useState(0);
 const suitRef=useRef(suit);
 useEffect(()=>{suitRef.current=suit},[suit]);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");setReduced(media.matches);const change=()=>setReduced(media.matches);media.addEventListener?.("change",change);return()=>media.removeEventListener?.("change",change)},[]);
 const toggleFlight=useCallback(()=>{const p=player.current;p.flight=!p.flight;p.vy=p.flight?2:0;setFlight(p.flight)},[]);
 const enterPortal=useCallback(()=>{const p=player.current;if(Math.hypot(p.x,p.z-PORTAL_Z)<16&&p.y>4)setMode("worlds")},[]);
 useEffect(()=>{
  if(mode!=="lobby")return;
  const down=(e:KeyboardEvent)=>{
   if(["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement)?.tagName))return;
   if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();
   const k=e.key.toLowerCase();if(k==="f"&&!e.repeat)toggleFlight();
   if(k==="e"&&!e.repeat)enterPortal();
   keys.current.add(k);
  };
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);keys.current.clear()};
 },[mode,toggleFlight,enterPortal]);
 useEffect(()=>{
  if(mode!=="lobby")return;
  const el=canvas.current,host=shell.current;if(!el||!host)return;
  const ctx=el.getContext("2d",{alpha:false});if(!ctx)return;
  let raf=0,alive=true,last=performance.now(),uiLast=0,w=0,h=0,dpr=1;
  const resize=()=>{
   const r=host.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);
   dpr=Math.min(window.devicePixelRatio||1,w<460?1.5:1.75);
   el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);el.style.width=w+"px";el.style.height=h+"px";
   ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  resize();const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;observer?.observe(host);window.addEventListener("resize",resize);
  const point=(p:V3,c:V3,yaw:number)=>{
   const dx=p.x-c.x,dz=p.z-c.z,depth=dx*Math.sin(yaw)+dz*Math.cos(yaw);
   if(depth<=0.18)return null;
   const side=dx*Math.cos(yaw)-dz*Math.sin(yaw),f=Math.min(w*1.05,h*1.22);
   return {x:w*.5+side*f/depth,y:h*.48-(p.y-c.y)*f/depth,depth,scale:f/depth};
  };
  const line=(a:V3,b:V3,c:V3,yaw:number,color:string,width=1)=>{
   const p=point(a,c,yaw),q=point(b,c,yaw);if(!p||!q)return;
   ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
  };
  const polygon=(verts:V3[],c:V3,yaw:number,fill:string,stroke?:string)=>{
   const pts=verts.map(p=>point(p,c,yaw));if(pts.some(p=>!p))return;
   ctx.beginPath();pts.forEach((p,i)=>{if(i===0)ctx.moveTo(p!.x,p!.y);else ctx.lineTo(p!.x,p!.y)});ctx.closePath();ctx.fillStyle=fill;ctx.fill();
   if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}
  };
  const label=(text:string,x:number,y:number,size:number,color:string,weight=700)=>{
   ctx.font=weight+" "+size+"px system-ui,sans-serif";ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(text,x,y);
  };
  const drawPortal=(c:V3,yaw:number,t:number)=>{
   const center={x:0,y:PORTAL_Y,z:PORTAL_Z},p=point(center,c,yaw);if(!p)return;
   const radius=point({x:7,y:PORTAL_Y,z:PORTAL_Z},c,yaw);if(!radius)return;
   const r=Math.abs(radius.x-p.x);if(r<1)return;
   ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.14+Math.abs(Math.cos(yaw))*.86);
   const glow=ctx.createRadialGradient(0,0,r*.4,0,0,r*2.2);glow.addColorStop(0,"rgba(72,255,212,.24)");glow.addColorStop(.65,"rgba(205,170,83,.16)");glow.addColorStop(1,"rgba(255,255,255,0)");
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*2.2,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="rgba(9,55,56,.64)";ctx.beginPath();ctx.ellipse(0,0,r*.86,r*1.55,0,0,Math.PI*2);ctx.fill();
   const portalGradient=ctx.createLinearGradient(-r,-r,r,r);portalGradient.addColorStop(0,"rgba(84,240,214,.72)");portalGradient.addColorStop(.45,"rgba(248,250,243,.96)");portalGradient.addColorStop(1,"rgba(241,193,89,.66)");
   ctx.fillStyle=portalGradient;ctx.beginPath();ctx.ellipse(0,0,r*.65,r*1.3,0,0,Math.PI*2);ctx.fill();
   for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r*(.88+i*.09),r*(1.58+i*.11),0,0,Math.PI*2);ctx.strokeStyle=i===0?"#f2d68b":"rgba(11,121,111,.44)";ctx.lineWidth=Math.max(1,r*.12/(i+1));ctx.stroke()}
   if(!reduced){for(let i=0;i<22;i++){const a=i*2.399+t*.18,rp=r*(1.08+.2*Math.sin(i*7+t));ctx.fillStyle=i%2?"#cfa451":"#6ccbb7";ctx.beginPath();ctx.arc(Math.cos(a)*rp,Math.sin(a)*rp*1.55,Math.max(1,r*.035),0,Math.PI*2);ctx.fill()}}
   ctx.restore();
   if(r>10){label("JUMP INTO",p.x,p.y-r*1.95,limit(r*.24,10,22),"#115f59",800);label("1MUSLIMGAMES",p.x,p.y-r*1.67,limit(r*.31,12,27),"#936c22",900)}
  };
  const drawLive=(c:V3,yaw,t:number)=>{
   const z=LIVE_Z,y=7.2,wide=8.3,high=4.9;
   const corners=[{x:-wide,y:y+high,z},{x:wide,y:y+high,z},{x:wide,y:y-high,z},{x:-wide,y:y-high,z}];
   const pts=corners.map(v=>point(v,c,yaw));if(pts.some(v=>!v))return;
   const xs=pts.map(v=>v!.x),ys=pts.map(v=>v!.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
   if(right<0||left>w||bottom<0||top>h)return;
   ctx.save();
   ctx.shadowColor="rgba(14,117,110,.35)";ctx.shadowBlur=26;
   polygon(corners,c,yaw,"rgba(209,249,242,.28)","rgba(25,134,116,.85)");ctx.shadowBlur=0;
   polygon([{x:-wide+.25,y:y+high-.25,z},{x:wide-.25,y:y+high-.25,z},{x:wide-.25,y:y-high+.25,z},{x:-wide+.25,y:y-high+.25,z}],c,yaw,"rgba(246,255,255,.30)");
   const mid=(left+right)/2,scale=limit((right-left)/16,0,3);
   if(scale>.4){
    label("1MUSLIM  ·  LIVE",mid,top+(bottom-top)*.20,limit(17*scale,9,24),"#086a5c",900);
    const pulse=reduced?1:.65+.35*Math.sin(t*2);
    ctx.fillStyle="rgba(15,129,110,"+pulse+")";ctx.beginPath();ctx.arc(mid,top+(bottom-top)*.42,limit(5*scale,3,10),0,Math.PI*2);ctx.fill();
    label("LOADING",mid,top+(bottom-top)*.59,limit(21*scale,10,29),"#165a55",800);
    label("Waiting for the next",mid,top+(bottom-top)*.72,limit(13*scale,8,19),"#2b716d",600);
    label("1Muslim Live",mid,top+(bottom-top)*.82,limit(15*scale,9,22),"#a27b33",800);
   }
   ctx.restore();
  };
  const drawAvatar=(c:V3,yaw,t:number)=>{
   const p=player.current,s=SUITS[suitRef.current],motion=Math.sin(t*11)*(p.flight?0.03:.09);
   const base=point({x:p.x,y:p.y+.15,z:p.z},c,yaw),head=point({x:p.x,y:p.y+2.4,z:p.z},c,yaw);
   if(!base||!head)return;
   const hh=limit(base.y-head.y,16,Math.max(35,h*.35)),cx=base.x,top=base.y-hh,unit=hh/6;
   ctx.save();
   const shadow=point({x:p.x,y:0,z:p.z},c,yaw);
   if(shadow){ctx.fillStyle="rgba(21,96,87,.12)";ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,unit*1.3,unit*.32,0,0,Math.PI*2);ctx.fill()}
   if(p.flight&&!reduced){for(let i=0;i<7;i++){const a=i*2.399+t*2;ctx.fillStyle=i%2?s.trail:s.shine;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(cx+Math.sin(a)*unit*1.5,base.y+Math.cos(a)*unit*.7+Math.sin(t*3+i)*8,limit(unit*.12,1,4),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
   ctx.shadowColor=s.trail;ctx.shadowBlur=p.flight?22:7;
   const limb=(x1:number,y1:number,x2:number,y2:number,width:number)=>{
    ctx.lineCap="round";ctx.strokeStyle="#244b4b";ctx.lineWidth=width+2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.strokeStyle=s.primary;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
   };
   const leaning=p.boost?unit*.55:0;
   limb(cx-unit*.4,top+unit*3.5,cx-unit*.55-leaning,base.y+motion*unit,unit*.68);
   limb(cx+unit*.4,top+unit*3.5,cx+unit*.55-leaning,base.y-motion*unit,unit*.68);
   limb(cx-unit*.95,top+unit*2.2,cx-unit*1.32-leaning,top+unit*3.85,unit*.56);
   limb(cx+unit*.95,top+unit*2.2,cx+unit*1.32-leaning,top+unit*3.85,unit*.56);
   const body=ctx.createLinearGradient(cx-unit,0,cx+unit,0);body.addColorStop(0,s.primary);body.addColorStop(.46,s.shine);body.addColorStop(1,s.primary);
   ctx.fillStyle=body;ctx.strokeStyle="#34655d";ctx.lineWidth=1.4;
   ctx.beginPath();ctx.moveTo(cx-unit*.9,top+unit*1.65);ctx.lineTo(cx+unit*.9,top+unit*1.65);ctx.lineTo(cx+unit*.72,top+unit*3.8);ctx.lineTo(cx-unit*.72,top+unit*3.8);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle=s.shine;ctx.beginPath();ctx.ellipse(cx,top+unit*.83,unit*.78,unit*.94,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=s.primary;ctx.lineWidth=unit*.25;ctx.stroke();
   ctx.fillStyle="rgba(12,64,67,.67)";ctx.beginPath();ctx.ellipse(cx,top+unit*.95,unit*.57,unit*.21,0,0,Math.PI*2);ctx.fill();
   ctx.restore();
  };
  const frame=(now:number)=>{
   if(!alive)return;const dt=limit((now-last)/1000,0,.045);last=now;clock.current+=dt;const t=clock.current,p=player.current,k=keys.current,inp=input.current;
   const forward=limit((k.has("w")||k.has("arrowup")?1:0)-(k.has("s")||k.has("arrowdown")?1:0)+inp.forward,-1,1);
   const strafe=limit((k.has("d")?1:0)-(k.has("a")?1:0)+inp.strafe,-1,1);
   const turn=(k.has("arrowright")?1:0)-(k.has("arrowleft")?1:0);
   p.yaw+=turn*dt*1.8;
   const norm=Math.max(1,Math.hypot(forward,strafe));
   const boosting=inp.boost||k.has("shift");p.boost=boosting&&(forward!==0||strafe!==0||p.flight);
   const speed=(p.flight?12:8)*(p.boost?2.25:1);
   p.x+=(Math.sin(p.yaw)*forward+Math.cos(p.yaw)*strafe)/norm*speed*dt;
   p.z+=(Math.cos(p.yaw)*forward-Math.sin(p.yaw)*strafe)/norm*speed*dt;
   if(p.flight){const rise=(inp.up||k.has(" ")?1:0)-(inp.down||k.has("control")?1:0);p.y=limit(p.y+rise*(p.boost?16:8)*dt,1,75);p.vy=0}
   else {if((inp.up||k.has(" "))&&p.y<=.03)p.vy=6.4;p.vy-=16*dt;p.y=Math.max(0,p.y+p.vy*dt);if(p.y===0)p.vy=0}
   p.x=limit(p.x,-200,200);p.z=limit(p.z,-160,190);
   const cam={x:p.x-Math.sin(p.yaw)*9,y:p.y+4.2,z:p.z-Math.cos(p.yaw)*9},yaw=p.yaw;
   const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#e5f8f6");sky.addColorStop(.44,"#f9ffff");sky.addColorStop(1,"#e0f1e9");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
   const halo=ctx.createRadialGradient(w*.77,h*.12,2,w*.77,h*.12,w*.63);halo.addColorStop(0,"rgba(255,233,169,.54)");halo.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
   // White ground fades into a pale horizon; geometry is projected relative to the moving third-person camera.
   const ground=[{x:-800,y:0,z:-800},{x:800,y:0,z:-800},{x:800,y:0,z:800},{x:-800,y:0,z:800}];
   ctx.fillStyle="#edf7f2";ctx.fillRect(0,h*.53,w,h*.47);
   const gx=Math.round(p.x/10)*10,gz=Math.round(p.z/10)*10;
   for(let j=-13;j<=19;j++){const z=gz+j*10;line({x:gx-200,y:.012,z},{x:gx+200,y:.012,z},cam,yaw,"rgba(28,131,118,.10)")}
   for(let j=-18;j<=18;j++){const x=gx+j*10;line({x,y:.012,z:gz-150},{x,y:.012,z:gz+230},cam,yaw,"rgba(28,131,118,.10)")}
   for(let i=0;i<36;i++){const x=Math.sin(i*12.9898)*64,z=Math.cos(i*8.287)*100;const q=point({x,y:.04,z},cam,yaw);if(q&&q.depth<115){ctx.fillStyle="rgba(206,172,93,.30)";ctx.beginPath();ctx.arc(q.x,q.y,limit(q.scale*.035,.5,3),0,Math.PI*2);ctx.fill()}}
   // Draw farthest landmark first. Both are anchored at fixed coordinates, not HUD elements.
   if(Math.abs(PORTAL_Z-cam.z)>Math.abs(LIVE_Z-cam.z)){drawPortal(cam,yaw,t);drawLive(cam,yaw,t)}else{drawLive(cam,yaw,t);drawPortal(cam,yaw,t)}
   drawAvatar(cam,yaw,t);
   if(now-uiLast>175){uiLast=now;const pd=Math.hypot(p.x,p.z-PORTAL_Z);setDistanceToPortal(Math.round(pd));setNearPortal(pd<16&&p.y>4);setNearLive(Math.hypot(p.x,p.z-LIVE_Z)<26);setCompass(Math.round(((p.yaw*180/Math.PI)%360+360)%360))}
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  return()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener("resize",resize)};
 },[mode,reduced]);
 const moveStick=(e:React.PointerEvent<HTMLDivElement>)=>{
  const r=stick.current?.getBoundingClientRect();if(!r)return;
  const dx=(e.clientX-(r.left+r.width/2))/(r.width*.34),dy=(e.clientY-(r.top+r.height/2))/(r.height*.34);
  const n=Math.max(1,Math.hypot(dx,dy));input.current.strafe=limit(dx/n,-1,1);input.current.forward=limit(-dy/n,-1,1);
 };
 const endStick=(e:React.PointerEvent<HTMLDivElement>)=>{if(stickPointer.current?.id!==e.pointerId)return;stickPointer.current=null;input.current.forward=0;input.current.strafe=0};
 const endLook=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(lookPointer.current?.id===e.pointerId)lookPointer.current=null};
 const reset=()=>{player.current={x:0,y:0,z:0,vy:0,yaw:0,flight:false,boost:false};setFlight(false);setMode("lobby")};
 return <section className={styles.root} aria-label="1Muslim Game shared world preview">
  {mode==="quest"?<><CosmicCatchGame/><button className={styles.questBack} type="button" onClick={()=>setMode("worlds")}>← Worlds</button></>:
  mode==="worlds"?<div className={styles.worlds}>
   <div className={styles.worldHead}><span className={styles.eyebrow}>✦ THE SIX UNIVERSES</span><h2>Choose your destination</h2><p>Explore the worlds as they become playable.</p></div>
   <div className={styles.worldGrid}>{eras.map((era:Era,i)=><div className={styles.worldCard} key={era}><span>{["🦕","🌊","🏛️","🏜️","🌍","🚀"][i]}</span><strong>{names[era]}</strong><small>World under construction</small></div>)}</div>
   <button className={styles.primary} type="button" onClick={()=>setMode("quest")}>✦ Play Arabic Letter Quest</button>
   <button className={styles.secondary} type="button" onClick={()=>setMode("lobby")}>← Return to lobby</button>
  </div>:
  <div className={styles.scene} ref={shell}>
   <canvas ref={canvas} className={styles.canvas} aria-label="Third-person white lobby. Use WASD to move, drag to look, F to fly, Shift to boost." onPointerDown={e=>{lookPointer.current={id:e.pointerId,x:e.clientX};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(lookPointer.current?.id!==e.pointerId)return;const dx=e.clientX-lookPointer.current.x;lookPointer.current.x=e.clientX;player.current.yaw+=limit(dx,-45,45)*.007}} onPointerUp={endLook} onPointerCancel={endLook}/>
   <div className={styles.topHud}><div className={styles.brand}><span className={styles.brandOrb}>✦</span><span><b>1MUSLIM</b><small>THE SHARED LOBBY · VISUAL PREVIEW</small></span></div><div className={styles.status}><i/> SOLO PREVIEW</div></div>
   <div className={styles.navHints}><span>← 1MUSLIM LIVE · 20 YDS</span><span>1MUSLIMGAMES →</span></div>
   <div className={styles.telemetry}><span>✦ {SUITS[suit].primary==="none"?"":suit.toUpperCase()} SUIT</span><span>{flight?"🕊 FLIGHT":"◈ GROUNDED"}</span><span>{distanceToPortal}m TO PORTAL</span></div>
   <div className={styles.suitPicker} aria-label="Preview avatar suit">{(["gold","silver","cosmic","diamond"] as Suit[]).map(v=><button key={v} type="button" className={suit===v?styles.selected:""} style={{"--suit":SUITS[v].primary} as React.CSSProperties} onClick={()=>setSuit(v)} title={v+" suit"} aria-label={v+" suit"} aria-pressed={suit===v}/>)}</div>
   {nearLive&&<div className={styles.liveHint}>📺 1Muslim Live · Waiting for the next broadcast</div>}
   {nearPortal&&<button className={styles.enter} type="button" onClick={()=>setMode("worlds")}>✦ ENTER 1MUSLIMGAMES</button>}
   <div className={styles.bottomHud}>
    <div className={styles.joystick} ref={stick} role="group" aria-label="Movement joystick" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);stickPointer.current={id:e.pointerId,x:e.clientX,y:e.clientY};moveStick(e)}} onPointerMove={e=>{if(stickPointer.current?.id===e.pointerId)moveStick(e)}} onPointerUp={endStick} onPointerCancel={endStick}><span className={styles.joyKnob}>✦</span></div>
    <div className={styles.actions}><button type="button" onPointerDown={()=>input.current.up=true} onPointerUp={()=>input.current.up=false} onPointerCancel={()=>input.current.up=false} aria-label="Jump or rise">↑<small>JUMP</small></button><button type="button" className={flight?styles.active:""} onClick={toggleFlight} aria-pressed={flight}>✧<small>{flight?"LAND":"FLY"}</small></button><button type="button" className={styles.boost} onPointerDown={()=>input.current.boost=true} onPointerUp={()=>input.current.boost=false} onPointerCancel={()=>input.current.boost=false}>⚡<small>BOOST</small></button><button type="button" onPointerDown={()=>input.current.down=true} onPointerUp={()=>input.current.down=false} onPointerCancel={()=>input.current.down=false}>↓<small>DOWN</small></button></div>
   </div>
   <div className={styles.instructions}>Drag to look · WASD move · F fly · Shift boost · Space rise <span>{compass}°</span></div>
  </div>}
 </section>;
}
