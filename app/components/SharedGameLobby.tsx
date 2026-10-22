"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import LiveHomePreview from "./LiveHomePreview";
import styles from "./SharedGameLobby.module.css";

type Suit="gold"|"silver"|"cosmic"|"diamond";
type Player={id:string;x:number;y:number;z:number;yaw:number;flying:boolean;boost:boolean;suit:Suit;seen:number};
type Live={id:string;room_name:string|null;title:string};
const SUITS:Suit[]=["gold","silver","cosmic","diamond"];
const WORLDS=["Dinosaurs","Time of Moses","Time of Jesus","Time of Muhammad ﷺ","Today","Future"];
const SUIT_COLORS:Record<Suit,[number,number,number]>={gold:[.99,.73,.23],silver:[.72,.83,.89],cosmic:[.53,.36,.94],diamond:[.62,.92,1]};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const terrain=(x:number,z:number)=>.12*Math.sin(x*.11)*Math.cos(z*.09);
const distance=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);
type M=number[];
const mul=(a:M,b:M):M=>{const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o};
const translate=(x:number,y:number,z:number):M=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1];
const scale=(x:number,y:number,z:number):M=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
const rotateY=(a:number):M=>[Math.cos(a),0,-Math.sin(a),0,0,1,0,0,Math.sin(a),0,Math.cos(a),0,0,0,0,1];
const perspective=(fov:number,aspect:number,near:number,far:number):M=>{const f=1/Math.tan(fov/2);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]};
const lookAt=(eye:number[],at:number[]):M=>{let z=[eye[0]-at[0],eye[1]-at[1],eye[2]-at[2]];let l=Math.hypot(...z)||1;z=z.map(v=>v/l);let x=[z[2],0,-z[0]];l=Math.hypot(...x)||1;x=x.map(v=>v/l);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]};
const project=(m:M,p:number[],w:number,h:number)=>{const a=p[0],b=p[1],c=p[2];const d=m[3]*a+m[7]*b+m[11]*c+m[15];if(d<=.1)return null;const x=(m[0]*a+m[4]*b+m[8]*c+m[12])/d;const y=(m[1]*a+m[5]*b+m[9]*c+m[13])/d;return {x:(x+1)*w/2,y:(1-y)*h/2,visible:Math.abs(x)<1.3&&Math.abs(y)<1.3}};
const validSuit=(v:unknown):Suit=>typeof v==="string"&&SUITS.includes(v as Suit)?v as Suit:"gold";
function makeRenderer(canvas:HTMLCanvasElement){
 const gl=canvas.getContext("webgl",{alpha:false,antialias:true,powerPreference:"low-power"});
 if(!gl)return null;
 const vertex='attribute vec3 p;attribute vec3 n;uniform mat4 vp;uniform mat4 model;varying float light;void main(){vec3 normal=normalize((model*vec4(n,0.0)).xyz);light=0.68+0.32*max(0.0,dot(normal,normalize(vec3(0.35,1.0,0.5))));gl_Position=vp*model*vec4(p,1.0);}';
 const fragment='precision mediump float;uniform vec4 color;varying float light;void main(){gl_FragColor=vec4(color.rgb*light,color.a);}';
 const shader=(kind:number,src:string)=>{const s=gl.createShader(kind);if(!s)throw Error("WebGL shader");gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||"Shader compile");return s};
 const program=gl.createProgram();if(!program)return null;gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("WebGL link");gl.useProgram(program);
 const faces:[number[][],number[]][]=[
 [[[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1]],[1,0,0]],
 [[[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]],[-1,0,0]],
 [[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]],[0,1,0]],
 [[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]],[0,-1,0]],
 [[[1,-1,1],[-1,-1,1],[-1,1,1],[1,1,1]],[0,0,1]],
 [[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]],[0,0,-1]]
 ];
 const data:number[]=[];const idx:number[]=[];faces.forEach(([corners,n],f)=>{corners.forEach(c=>data.push(...c.map(v=>v*.5),...n));idx.push(f*4,f*4+1,f*4+2,f*4,f*4+2,f*4+3)});
 const vb=gl.createBuffer(),ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
 const ap=gl.getAttribLocation(program,"p"),an=gl.getAttribLocation(program,"n");gl.enableVertexAttribArray(ap);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(an,3,gl.FLOAT,false,24,12);
 const vpLoc=gl.getUniformLocation(program,"vp"),modelLoc=gl.getUniformLocation(program,"model"),colorLoc=gl.getUniformLocation(program,"color");
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const draw=(vp:M,x:number,y:number,z:number,sx:number,sy:number,sz:number,col:number[],alpha=1,angle=0)=>{const model=mul(mul(translate(x,y,z),rotateY(angle)),scale(sx,sy,sz));gl.uniformMatrix4fv(vpLoc,false,new Float32Array(vp));gl.uniformMatrix4fv(modelLoc,false,new Float32Array(model));gl.uniform4f(colorLoc,col[0],col[1],col[2],alpha);gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0)};
 return {gl,draw};
}
export default function SharedGameLobby(){
 const canvas=useRef<HTMLCanvasElement>(null),panel=useRef<HTMLDivElement>(null),portalLabel=useRef<HTMLDivElement>(null);
 const keys=useRef<Record<string,boolean>>({}),peerRef=useRef<Map<string,Player>>(new Map()),suitRef=useRef<Suit>("gold");
 const local=useRef<Player>({id:"",x:0,y:terrain(0,0),z:0,yaw:Math.PI/2,flying:false,boost:false,suit:"gold",seen:0});
 const [suit,setSuit]=useState<Suit>("gold"),[online,setOnline]=useState(false),[peerCount,setPeerCount]=useState(0);
 const [live,setLive]=useState<Live|null>(null),[liveError,setLiveError]=useState(false),[picker,setPicker]=useState(false),[worldMessage,setWorldMessage]=useState("");
 const [error,setError]=useState(""),[hint,setHint]=useState("Run toward the glowing portal, or turn around for 1Muslim Live.");
 const [flying,setFlying]=useState(false); const gesture=useRef({lastTap:0,downAt:0,hold:false}); const [crashed,setCrashed]=useState(false);
 const setKey=(k:string,on:boolean)=>{keys.current[k]=on};
 const toggleFly=useCallback(()=>{const p=local.current;p.flying=!p.flying;setFlying(p.flying);if(p.flying)p.y=Math.max(p.y,terrain(p.x,p.z)+1.3)},[]);
 useEffect(()=>{try{const stored=localStorage.getItem("1muslim-game-suit");const s=validSuit(stored);suitRef.current=s;local.current.suit=s;setSuit(s)}catch{}},[]);
 const changeSuit=(s:Suit)=>{setSuit(s);suitRef.current=s;local.current.suit=s;try{localStorage.setItem("1muslim-game-suit",s)}catch{}};
 useEffect(()=>{
  const db=createClient();let active=true;
  const refresh=async()=>{try{const {data,error}=await db.from("live_streams").select("id,title,room_name").eq("status","live").eq("visibility","public").gte("last_heartbeat_at",new Date(Date.now()-45000).toISOString()).order("viewer_count",{ascending:false}).limit(1);if(!active)return;setLiveError(!!error);setLive(!error&&data?.length?{id:data[0].id,title:data[0].title||"1Muslim Live",room_name:data[0].room_name}:null)}catch{if(active){setLiveError(true);setLive(null)}}};
 void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh()},15000);return()=>{active=false;clearInterval(timer)};
 },[]);
 useEffect(()=>{
  const db=createClient();const id=typeof crypto!=="undefined"&&"randomUUID"in crypto?crypto.randomUUID():String(Date.now())+Math.random();
  local.current.id=id;let active=true;const channel=db.channel("1muslim-shared-game-lobby-v1",{config:{presence:{key:id},broadcast:{self:false}}});
  const sync=()=>{if(!active)return;const present=new Set<string>();for(const values of Object.values(channel.presenceState()))for(const entry of values as Array<{id?:string;suit?:string}>){if(typeof entry.id==="string"&&entry.id!==id)present.add(entry.id)};for(const k of peerRef.current.keys())if(!present.has(k))peerRef.current.delete(k);setPeerCount(present.size)};
  channel.on("presence",{event:"sync"},sync).on("broadcast",{event:"move"},({payload})=>{if(!active||!payload||payload.id===id||typeof payload.id!=="string")return;const p=payload as Player;if(![p.x,p.y,p.z,p.yaw].every(v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<10000))return;peerRef.current.set(p.id,{id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:!!p.flying,boost:!!p.boost,suit:validSuit(p.suit),seen:performance.now()})});
  channel.subscribe(status=>{if(!active)return;setOnline(status==="SUBSCRIBED");if(status==="SUBSCRIBED")void channel.track({id,suit:suitRef.current})});
  const send=setInterval(()=>{if(!active||channel.state!=="joined"||document.visibilityState!=="visible")return;const p=local.current;void channel.send({type:"broadcast",event:"move",payload:{id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:p.flying,boost:p.boost,suit:suitRef.current}})},120);
  return()=>{active=false;clearInterval(send);void db.removeChannel(channel);peerRef.current.clear()};
 },[]);
 useEffect(()=>{
  const node=canvas.current;if(!node)return;
  let renderer:ReturnType<typeof makeRenderer>;
  try{renderer=makeRenderer(node)}catch(e){setError(e instanceof Error?e.message:"WebGL initialization failed");return}
  if(!renderer){setError("WebGL is unavailable on this device.");return}
  const {gl,draw}=renderer;let frame=0,prev=performance.now(),velocity=0,wasNear=false,crashUntil=0;
  const render=(now:number)=>{
   const dt=clamp((now-prev)/1000,0,.05);prev=now;
   const p=local.current,k=keys.current;
   const moving=Number(!!(k.w||k.ArrowUp))-Number(!!(k.s||k.ArrowDown));
   const strafing=Number(!!(k.d||k.ArrowRight))-Number(!!(k.a||k.ArrowLeft));
   const mag=Math.hypot(moving,strafing)||1;const speed=p.flying?16.5:(k.Shift?9:5.5);
   const dx=(Math.sin(p.yaw)*moving+Math.cos(p.yaw)*strafing)/mag;
   const dz=(Math.cos(p.yaw)*moving-Math.sin(p.yaw)*strafing)/mag;
   p.x=clamp(p.x+dx*speed*dt,-210,210);p.z=clamp(p.z+dz*speed*dt,-210,210);p.boost=!!k.Shift&&p.flying;
   const floor=terrain(p.x,p.z);
   if(p.flying){const ascend=!!(k.Space||k.ascend);const descend=!!k.c;velocity=clamp(velocity+(ascend?13:descend?-19:-5)*dt,-22,7);p.y=clamp(p.y+velocity*dt,floor,85);if(p.y<=floor+.03){if(velocity< -11){crashUntil=now+1300;setCrashed(true)}p.y=floor;p.flying=false;setFlying(false);velocity=0}}
   else{if(crashUntil&&now>crashUntil){crashUntil=0;setCrashed(false)}velocity-=17*dt;if(k.Space&&p.y<=floor+.07){velocity=7.2;k.Space=false}p.y+=velocity*dt;if(p.y<floor){p.y=floor;velocity=0}}
   const near=distance(p,{x:95,z:0})<5;if(near&&!wasNear)setPicker(true);wasNear=near;
   const w=node.clientWidth,h=node.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
   if(w>0&&h>0){const rw=Math.floor(w*dpr),rh=Math.floor(h*dpr);if(node.width!==rw||node.height!==rh){node.width=rw;node.height=rh;gl.viewport(0,0,rw,rh)}
    gl.clearColor(.91,.96,.97,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const cam=[p.x-Math.sin(p.yaw)*7,p.y+4.0,p.z-Math.cos(p.yaw)*7],at=[p.x,p.y+1.3,p.z];
    const vp=mul(perspective(Math.PI/3,w/h,.1,450),lookAt(cam,at));
    // White reflective ground and long-runway guidance to the Games portal.
    draw(vp,0,-.35,0,420,.65,420,[.89,.96,.95]);
    for(let i=-200;i<=200;i+=10){draw(vp,i,.008,0,.025,.018,420,[.76,.88,.85]);draw(vp,0,.008,i,420,.018,.025,[.76,.88,.85])}
    for(let i=8;i<95;i+=7)draw(vp,i,.025,0,3,.025,1.2,[.89,.75,.42],.7);
    // Portal: glowing arch with a translucent doorway and depth.
    for(let i=0;i<17;i++){const a=i*Math.PI/16;draw(vp,95,2.8+Math.sin(a)*4.1,Math.cos(a)*4.1,.85,.85,.75,[.19,.79,.66],1,-a)}
    draw(vp,95,2.8,0,.2,6.3,7.1,[.23,.85,.76],.28);
    draw(vp,95,7.6,0,.4,.18,9,[.92,.75,.29]);
    // Floating Live glass screen and structural frame at 18.3m behind spawn.
    draw(vp,-18.3,4,0,.25,5.5,9,[.3,.8,.69],.5);
    draw(vp,-18.3,4,0,.15,4.7,8.2,[.12,.38,.38],.26);
    for(const z of [-4.6,4.6])draw(vp,-18.3,4,z,.35,5.7,.2,[.65,.94,.83]);
    for(const y of [1.2,6.8])draw(vp,-18.3,y,0,.35,.2,9.4,[.65,.94,.83]);
    // Avatar primitives: head, torso, arms, legs, glowing flight trails.
    const avatar=(a:Player)=>{const c=SUIT_COLORS[a.suit];const ay=a.y+(a.flying?0:.1*Math.sin(now*.006));draw(vp,a.x,ay+1.35,a.z,.8,1.1,.44,c,1,a.yaw);draw(vp,a.x,ay+2.16,a.z,.52,.52,.52,c,1,a.yaw);const cs=Math.cos(a.yaw),sn=Math.sin(a.yaw);
      for(const side of [-1,1]){const ox=cs*side*.61,oz=-sn*side*.61;draw(vp,a.x+ox,ay+1.28,a.z+oz,.26,.94,.3,c,1,a.yaw);draw(vp,a.x+cs*side*.23,ay+.46,a.z-sn*side*.23,.31,.85,.35,c,1,a.yaw)}
      if(a.flying){for(let i=0;i<7;i++){const tail=i*.7+1;draw(vp,a.x-sn*tail,ay+.4-i*.12,a.z-cs*tail,.13+i*.065,.11+i*.04,.13+i*.065,[.66,.92,1],.6-i*.06)}draw(vp,a.x+sn*.6,ay+1.4,a.z+cs*.6,.48,.2,.32,c,1,a.yaw)}};
    avatar(p);
    for(const other of peerRef.current.values())if(now-other.seen<12000)avatar(other);
    const projLive=project(vp,[-18.3,4,0],w,h),projPortal=project(vp,[95,9,0],w,h);
    const updateOverlay=(element:HTMLDivElement|null,proj:ReturnType<typeof project>,dist:number,max:number)=>{if(!element)return;const show=!!proj?.visible&&dist<max;element.style.display=show?"block":"none";if(show&&proj){element.style.left=proj.x+"px";element.style.top=proj.y+"px";element.style.transform="translate(-50%,-50%) scale("+clamp(15/(dist+3),.35,1.3)+")"}};
    updateOverlay(panel.current,projLive,distance(p,{x:-18.3,z:0}),75);
    updateOverlay(portalLabel.current,projPortal,distance(p,{x:95,z:0}),160);
   }
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
 },[]);
 useEffect(()=>{
  const keyDown=(e:KeyboardEvent)=>{if(document.activeElement!==canvas.current)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(key==="f"&&!e.repeat)toggleFly();else if(key===" ")keys.current.Space=true;else keys.current[key]=true};
  const keyUp=(e:KeyboardEvent)=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys.current[key===" "?"Space":key]=false};
  window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);return()=>{window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp)};
 },[toggleFly]);
 const drag=useRef<{x:number;id:number}|null>(null);
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{canvas.current?.focus();const g=gesture.current;const now=performance.now();if(local.current.flying){g.hold=true;keys.current.ascend=true}else if(local.current.y>terrain(local.current.x,local.current.z)+.3){toggleFly();g.hold=true;keys.current.ascend=true}else if(now-g.lastTap<340){keys.current.Space=true;g.lastTap=0}else g.lastTap=now;g.downAt=now;drag.current={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;const delta=e.clientX-drag.current.x;drag.current.x=e.clientX;local.current.yaw+=delta*.008};
 return <section className={styles.root} aria-label="1Muslim shared 3D game lobby">
  <canvas ref={canvas} className={styles.canvas} tabIndex={0} aria-label="Third-person 3D world; click to control. WASD move, mouse drag look, Space jump or ascend, F fly, Shift boost, C descend." onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}} onPointerCancel={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}}/>
  <div className={styles.top}><span>✦ 1Muslim Lobby</span><span className={online?styles.connected:styles.offline}>{online?"● Shared room":"○ Connecting"} · {peerCount+1} visible</span></div>
  <div ref={panel} className={styles.liveScreen}><div className={styles.liveHeader}>◉ 1MUSLIM LIVE</div>{live?<><div className={styles.liveVideo}><LiveHomePreview roomName={live.room_name||live.id}/></div><a href={"/streaming/live/"+live.id} className={styles.watch}>Watch {live.title} ↗</a></>:<div className={styles.waiting}><span className={styles.spinner}>◌</span><strong>Loading — waiting for the next 1Muslim Live</strong><small>{liveError?"Live status temporarily unavailable":"Broadcast will appear when someone goes live"}</small></div>}</div>
  <div ref={portalLabel} className={styles.portalSign}>✦ JUMP INTO 1MUSLIMGAMES ✦</div>
  <div className={styles.bottom}><span>{hint}</span><label>SUIT <select aria-label="Preview avatar suit" value={suit} onChange={e=>changeSuit(validSuit(e.target.value))}>{SUITS.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label></div>
  {crashed&&<div className={styles.toast} role="status">💥 Hard landing! Recovering…</div>}
  <div className={styles.controls}><div className={styles.dpad}><button onPointerDown={()=>setKey("w",true)} onPointerUp={()=>setKey("w",false)} onPointerLeave={()=>setKey("w",false)}>▲</button><div><button onPointerDown={()=>setKey("a",true)} onPointerUp={()=>setKey("a",false)} onPointerLeave={()=>setKey("a",false)}>◀</button><button onPointerDown={()=>setKey("s",true)} onPointerUp={()=>setKey("s",false)} onPointerLeave={()=>setKey("s",false)}>▼</button><button onPointerDown={()=>setKey("d",true)} onPointerUp={()=>setKey("d",false)} onPointerLeave={()=>setKey("d",false)}>▶</button></div></div><div className={styles.actions}><span aria-live="polite">{flying?"FLYING · hold world to rise":"Double tap world to jump · tap airborne to fly"}</span></div></div>
  {error&&<div role="alert" className={styles.error}>{error}</div>}
  {picker&&<div className={styles.modal}><div className={styles.picker}><button className={styles.close} onClick={()=>setPicker(false)} aria-label="Close world selector">✕</button><h2>Choose Your Universe</h2><p>Explore the worlds of 1Muslim Games</p><div className={styles.worlds}>{WORLDS.map(w=><button key={w} onClick={()=>{setWorldMessage(w+" is not yet connected to this lobby build.");setPicker(false)}}>{w} <small>Preview pending</small></button>)}</div></div></div>}
  {worldMessage&&<div className={styles.toast} role="status" onClick={()=>setWorldMessage("")}>{worldMessage} · Dismiss ✕</div>}
  <span className={styles.srOnly}>Shared presence is an experimental room and does not establish authenticated player identity. Suits are local preview choices.</span>
 </section>;
}
