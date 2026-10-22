"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import LiveHomePreview from "./LiveHomePreview";
import styles from "./SharedGameLobby.module.css";

type Suit="gold"|"silver"|"cosmic"|"diamond";
type Player={id:string;userId?:string;name?:string;x:number;y:number;z:number;yaw:number;flying:boolean;boost:boolean;suit:Suit;seen:number};
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
 const labels=useRef<HTMLDivElement>(null),workerNotice=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),panel=useRef<HTMLDivElement>(null),portalLabel=useRef<HTMLDivElement>(null);
 const arrivals=useRef<Map<string,number>>(new Map());const keys=useRef<Record<string,boolean>>({}),peerRef=useRef<Map<string,Player>>(new Map()),suitRef=useRef<Suit>("gold");
 const local=useRef<Player>({id:"",x:0,y:terrain(0,0),z:0,yaw:Math.PI/2,flying:false,boost:false,suit:"gold",seen:0});
 const [suit,setSuit]=useState<Suit>("gold"),[online,setOnline]=useState(false),[peerCount,setPeerCount]=useState(0);
 const [live,setLive]=useState<Live|null>(null),[liveError,setLiveError]=useState(false),[picker,setPicker]=useState(false),[worldMessage,setWorldMessage]=useState("");
 const [error,setError]=useState(""),[hint,setHint]=useState("Explore the market road toward the portal; sky villages float beyond the city.");
 const [flying,setFlying]=useState(false); const [workerMessage,setWorkerMessage]=useState(false); const voiceRoom=useRef<import("livekit-client").Room|null>(null); const voiceTracks=useRef<Map<string,HTMLAudioElement>>(new Map()); const [voiceOn,setVoiceOn]=useState(false); const [voiceBusy,setVoiceBusy]=useState(false); const gesture=useRef({lastTap:0,downAt:0,hold:false}); const [crashed,setCrashed]=useState(false);
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
  local.current.id=id;void db.auth.getUser().then(({data})=>{if(active)local.current.userId=data.user?.id;local.current.name=String(data.user?.user_metadata?.full_name||data.user?.user_metadata?.username||"Explorer").slice(0,30)});let active=true;const channel=db.channel("1muslim-shared-game-lobby-v1",{config:{presence:{key:id},broadcast:{self:false}}});
  const sync=()=>{if(!active)return;const present=new Set<string>();for(const values of Object.values(channel.presenceState()))for(const entry of values as Array<{id?:string;suit?:string}>){if(typeof entry.id==="string"&&entry.id!==id)present.add(entry.id)};for(const k of peerRef.current.keys())if(!present.has(k))peerRef.current.delete(k);setPeerCount(present.size)};
  channel.on("presence",{event:"sync"},sync).on("broadcast",{event:"move"},({payload})=>{if(!active||!payload||payload.id===id||typeof payload.id!=="string")return;const p=payload as Player;if(![p.x,p.y,p.z,p.yaw].every(v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<10000))return;if(!peerRef.current.has(p.id))arrivals.current.set(p.id,performance.now());peerRef.current.set(p.id,{id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:!!p.flying,boost:!!p.boost,suit:validSuit(p.suit),userId:typeof p.userId==="string"?p.userId:undefined,name:typeof p.name==="string"?p.name.slice(0,30):"Explorer",seen:performance.now()})});
  channel.subscribe(status=>{if(!active)return;setOnline(status==="SUBSCRIBED");if(status==="SUBSCRIBED")void channel.track({id,suit:suitRef.current})});
  const send=setInterval(()=>{if(!active||channel.state!=="joined"||document.visibilityState!=="visible")return;const p=local.current;void channel.send({type:"broadcast",event:"move",payload:{id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:p.flying,boost:p.boost,userId:p.userId,name:p.name,suit:suitRef.current}})},120);
  return()=>{active=false;clearInterval(send);void db.removeChannel(channel);peerRef.current.clear();arrivals.current.clear()};
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
   for(const [identity,el] of voiceTracks.current){const peer=Array.from(peerRef.current.values()).find(other=>other.userId===identity&&now-other.seen<12000);const feet=peer?distance(p,peer)*3.28084:Infinity;el.volume=feet<=20?1:feet<=30?1-(feet-20)*.05:feet<=40?.5-(feet-30)*.05:0;}
   const moving=Number(!!(k.w||k.ArrowUp))-Number(!!(k.s||k.ArrowDown));
   const strafing=Number(!!(k.a||k.ArrowLeft))-Number(!!(k.d||k.ArrowRight));
   const mag=Math.hypot(moving,strafing)||1;const speed=p.flying?16.5:(k.Shift?9:5.5);
   const dx=(Math.sin(p.yaw)*moving+Math.cos(p.yaw)*strafing)/mag;
   const dz=(Math.cos(p.yaw)*moving-Math.sin(p.yaw)*strafing)/mag;
   p.x=clamp(p.x+dx*speed*dt,-210,210);p.z=clamp(p.z+dz*speed*dt,-210,210);p.boost=!!k.Shift&&p.flying;
   const skyLanding=p.x>-163&&p.x<-87&&p.z>-158&&p.z<-82&&p.y>=43&&velocity<=0;const floor=skyLanding?45:terrain(p.x,p.z);
   if(p.flying){const ascend=!!(k.Space||k.ascend);const descend=!!k.c;velocity=clamp(velocity+(ascend?13:descend?-19:-5)*dt,-22,7);p.y=clamp(p.y+velocity*dt,floor,85);if(p.y<=floor+.03){if(velocity< -11){crashUntil=now+1300;setCrashed(true)}p.y=floor;p.flying=false;setFlying(false);velocity=0}}
   else{if(crashUntil&&now>crashUntil){crashUntil=0;setCrashed(false)}velocity-=17*dt;if(k.Space&&p.y<=floor+.07){velocity=7.2;k.Space=false}p.y+=velocity*dt;if(p.y<floor){p.y=floor;velocity=0}}
   const nearWorker=distance(p,{x:152,z:0})<5;if(nearWorker&&!workerNotice.current){workerNotice.current=true;setWorkerMessage(true)}if(!nearWorker)workerNotice.current=false;
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
    // Procedural town foundations: roads, market arcades, greenery and inhabited blocks.
    draw(vp,37,.035,0,110,.08,8,[.32,.39,.41]);
    for(let x=5;x<85;x+=14){draw(vp,x,.045,0,.28,.09,8,[.93,.76,.39]);for(const side of [-1,1]){
      const z=side*15;draw(vp,x,.09,z,10,.2,10,[.78,.83,.79]);
      const height=5+(Math.floor(x/14)%3)*2;
      draw(vp,x,height/2+.2,z,7,height,6,side===1?[.84,.9,.83]:[.88,.83,.73]);
      draw(vp,x,height+.55,z,8,.7,7,[.22,.52,.43]);
      draw(vp,x,1.5,z-side*3.1,2,2.6,.18,[.32,.58,.54]);
      for(let level=2;level<height;level+=2.3)for(const off of [-2,0,2])draw(vp,x+off,level,z-side*3.08,.7,.9,.12,[.42,.74,.82],.85);
      draw(vp,x+4,.8,z-side*5,2,1.6,1.4,[.87,.67,.36]); // market stall
      draw(vp,x+4,1.85,z-side*5,2.5,.28,2,[.24,.65,.5]); // awning
    }}
    // Avenues branching toward future neighborhoods.
    for(const x of [16,44,72])draw(vp,x,.055,0,6,.08,88,[.4,.48,.47]);
    // Trees and gardens along the roads.
    for(let i=0;i<34;i++){const x=-5+(i%17)*6,z=(i%2?1:-1)*(9+(Math.floor(i/17)*28));
      draw(vp,x,1.2,z,.45,2.4,.45,[.43,.31,.22]);
      for(const a of [-1,0,1])draw(vp,x+a*.9,3.1+Math.abs(a)*.3,z,.95,2,1.9,[.2,.56+(i%3)*.05,.34]);
    }
    // Distant cloud mountains and smaller sky villages (visual landmarks).
    for(let i=0;i<5;i++){const x=22+i*36,z=i%2?85:-85,y=22+(i%3)*8;
      draw(vp,x,y,z,23,8,19,[.86,.94,.97],.82);
      draw(vp,x,y+5,z,16,7,14,[.93,.97,1],.75);
      draw(vp,x,y+10,z,13,2,12,[.43,.62,.54]);
      for(let j=0;j<4;j++){const bx=x+(j-1.5)*3;draw(vp,bx,y+13,z+(j%2)*3,2.5,5,3,[.89,.83,.67]);draw(vp,bx,y+16,z+(j%2)*3,3,.8,3.4,[.2,.63,.52]);}
    }
    // Moving cloud banks, birds and ground animals; deterministic motion shared across clients.
    for(let i=0;i<12;i++){const cx=((i*37+now*.0008*(i%3+1)+220)%420)-210,cz=(i*59)%170-85,cy=29+(i%4)*7;
      draw(vp,cx,cy,cz,9,2.5,4,[.99,.99,1],.45);draw(vp,cx+4,cy+1,cz,5,3,4,[.99,.99,1],.4);
    }
    for(let i=0;i<15;i++){const bx=20+i*6+Math.sin(now*.0007+i)*5,bz=(i%2?1:-1)*(14+i*2),by=9+(i%4)*3+Math.sin(now*.002+i);
      draw(vp,bx,by,bz,.55,.15,.35,[.3,.37,.4]);draw(vp,bx-.5,by+Math.sin(now*.012+i)*.3,bz,.8,.1,.25,[.34,.39,.43]);draw(vp,bx+.5,by+Math.sin(now*.012+i)*.3,bz,.8,.1,.25,[.34,.39,.43]);
    }
    for(let i=0;i<9;i++){const ax=9+i*9+Math.sin(now*.0006+i)*2,az=(i%2?1:-1)*9;
      draw(vp,ax,.75,az,1.2,1,.55,[.68,.58,.43]);draw(vp,ax+.65,1.15,az,.55,.55,.48,[.72,.62,.47]);
      for(const q of [-.35,.35])draw(vp,ax+q,.24,az,.18,.5,.18,[.47,.4,.3]);
    }
    // Green-bordered arrival zone: luminous perimeter and vertical corner beacons.
    for(let i=-9;i<=9;i+=1.5){for(const edge of [-9,9]){draw(vp,i,.13,edge,1.4,.13,.22,[.11,.98,.47],.95);draw(vp,edge,.13,i,.22,.13,1.4,[.11,.98,.47],.95);}}
    for(const x of [-9,9])for(const z of [-9,9])draw(vp,x,1.4,z,.3,2.8,.3,[.16,.96,.48],.5+.3*Math.sin(now*.003));
    // Distinct destination signage: this town is MuslimVille; the launch district is Moonport.
    draw(vp,12,3,-10,.5,6,.5,[.77,.65,.3]);draw(vp,12,6.3,-10,10,1.6,.35,[.08,.43,.33]);
    draw(vp,145,3,-9,.5,6,.5,[.77,.65,.3]);draw(vp,145,6.3,-9,9,1.6,.35,[.13,.33,.48]);
    // Enchanted route: glowing stepping stones and gold/emerald wayfinding to the lunar construction site.
    draw(vp,125,.065,0,62,.09,6,[.14,.29,.31]);
    for(let x=98;x<159;x+=2.4){const pulse=.65+.2*Math.sin(now*.002+x);
      draw(vp,x,.14,0,1.25,.1,1.6,[.16,.79,.67],pulse);
      for(const z of [-3.3,3.3])draw(vp,x,.13,z,.2,.15,.2,[.96,.78,.35],pulse);
    }
    // Launch platform, scaffold frames and unfinished rocket silhouette.
    draw(vp,160,.55,0,22,1.1,20,[.32,.42,.45]);
    draw(vp,165,13,0,5,25,5,[.81,.87,.88]);
    draw(vp,165,27,0,3,5,3,[.87,.74,.39]);
    for(const z of [-6,6])for(const x of [156,174]){draw(vp,x,12,z,.5,24,.5,[.92,.73,.32]);for(let h=4;h<24;h+=5)draw(vp,x,h,z,5,.35,.35,[.55,.74,.76]);}
    for(let h=4;h<24;h+=5)draw(vp,156,h,0,.4,.35,12,[.75,.83,.83]);
    // Construction workers and slow animated activity near the launch pad.
    for(let i=0;i<4;i++){const wx=150+i*5,wz=(i%2?1:-1)*6,wy=.2+Math.abs(Math.sin(now*.001+i))*.08;
      draw(vp,wx,wy+1.2,wz,.75,1.1,.5,[.91,.65,.19]);draw(vp,wx,wy+2,wz,.55,.55,.55,[.62,.49,.38]);
      draw(vp,wx,wy+2.4,wz,.75,.2,.7,[.98,.8,.22]);
      for(const side of [-1,1])draw(vp,wx+side*.2,wy+.42,wz,.22,.8,.26,[.24,.36,.43]);
    }
    // Deep jungle edge and natural grassy track, with staggered trunks and canopy.
    draw(vp,-38,.06,65,82,.12,70,[.13,.29,.16]);
    draw(vp,-38,.14,65,65,.12,3.4,[.36,.34,.21]);
    for(let i=0;i<48;i++){const jx=-76+(i%12)*6.4,jz=33+Math.floor(i/12)*19+(i%3)*3;
      if(Math.abs(jz-65)<5)continue;
      const height=6+(i%5)*1.4;
      draw(vp,jx,height/2,jz,.8,height,.8,[.29,.22,.14]);
      for(const off of [-2,0,2])draw(vp,jx+off,height,jz,5,4,5,[.07,.22+(i%3)*.03,.13],.96);
    }
    // Street upgrades: walkable sidewalk slabs, curbs, painted crossings and streetlamps.
    for(let i=0;i<22;i++){const x=2+i*4;for(const side of [-1,1]){const z=side*6.8;
      draw(vp,x,.16,z,3.95,.25,3,[.72,.75,.73]);draw(vp,x,.27,side*5.2,3.95,.25,.25,[.93,.9,.77]);
      if(i%3===0){draw(vp,x,2.2,side*8.4,.22,4.4,.22,[.22,.35,.34]);draw(vp,x,4.45,side*8.4,1.1,.3,.7,[.98,.87,.58],.8);}
    }}
    for(const x of [14,42,70])for(let z=-4;z<=4;z+=1.5)draw(vp,x,.11,z,2.1,.04,.8,[.97,.95,.85]);
    // Dense tufts of grass with varied heights; avoid paved road and sidewalks.
    for(let i=0;i<320;i++){const x=((i*53)%370)-185,z=((i*97)%360)-180;if(Math.abs(z)<10&&x>-10&&x<100)continue;
      const h=.18+(i%7)*.09;draw(vp,x,h/2+.02,z,.13,h,.12,[.15+(i%4)*.025,.38+(i%5)*.04,.15]);}
    // Shallow reflective rain puddles: translucent surfaces with small ripple rings.
    for(let i=0;i<18;i++){const x=8+(i*13)%85,z=(i%2?1:-1)*(4.1+(i%3)*1.8);const ripple=.45+.08*Math.sin(now*.003+i);
      draw(vp,x,.13,z,1.1,.018,.7,[.37,.66,.72],.53);
      draw(vp,x,.145,z,.4+ripple,.012,.28+ripple*.3,[.79,.92,.94],.25);
    }
    // Meandering river and grassy embankments outside the market district.
    for(let i=0;i<56;i++){const x=-95+i*4,z=-43+Math.sin(i*.24)*9;
      draw(vp,x,.075,z,4.3,.08,9,[.14,.48,.62],.85);
      draw(vp,x,.12,z+5.5,4.4,.18,1.2,[.27,.53,.27]);
      draw(vp,x,.12,z-5.5,4.4,.18,1.2,[.27,.53,.27]);
      if(i%4===0)draw(vp,x,.13,z,2.2,.02,2,[.7,.88,.92],.12+.08*Math.sin(now*.002+i));
    }
    // Footbridge with safety rails connecting the town to the river gardens.
    draw(vp,8,.65,-43,5,1.2,17,[.54,.39,.25]);
    for(const z of [-51,-35])draw(vp,8,1.65,z,5,.18,.22,[.78,.61,.34]);
    // More distinctive civic architecture: columns, glass atrium and tiered roof.
    draw(vp,56,5,29,19,10,14,[.77,.84,.81]);
    draw(vp,56,10.5,29,21,1,16,[.17,.56,.48]);
    draw(vp,56,12,29,15,2,10,[.76,.88,.88],.82);
    for(let i=0;i<7;i++){const x=48+i*2.6;draw(vp,x,3,21.8,.65,6,.65,[.91,.86,.69]);}
    for(let level=2;level<9;level+=2)for(let j=0;j<5;j++)draw(vp,48+j*4,level,36.15,2.5,1.2,.13,[.36,.67,.73],.78);
    // THE BLESSED CHAMBERS — the floating sky city and home of the Belt Boyz Meeting Hall.\n    // Skyborne city: a distant, fully reachable floating district above the cloud layer.
    // The central platform sits at y=45, matching the landing collision surface.
    draw(vp,-125,43,-120,76,4,76,[.24,.45,.44]);
    draw(vp,-125,45.05,-120,72,.16,72,[.76,.84,.77]);
    for(const edge of [-161,-89]){draw(vp,edge,46,-120,.5,2,73,[.18,.86,.64],.65);draw(vp,-125,46,edge,73,2,.5,[.18,.86,.64],.65);}
    // Cloud shelves under the island and luminous sky gardens.
    for(let i=0;i<18;i++){const a=i*Math.PI/9,r=30+(i%3)*7;draw(vp,-125+Math.cos(a)*r,40+(i%4)*1.5,-120+Math.sin(a)*r,12,3,9,[.91,.96,.98],.52);}
    for(let i=0;i<12;i++){const x=-155+(i%4)*19,z=-149+Math.floor(i/4)*22;
      if(x>-142&&x<-105&&z>-143&&z<-104)continue;
      const ht=10+(i%4)*5;draw(vp,x,45+ht/2,z,10,ht,10,[.38+(i%3)*.08,.67,.73],.84);
      draw(vp,x,45+ht+.4,z,11,.8,11,[.86,.72,.37]);
      for(let y=49;y<45+ht-2;y+=4)draw(vp,x, y,z+5.15,7,2,.15,[.91,.95,.72],.8);
    }
    // Emerald-and-gold landmark above the sky-city entrance.\n    draw(vp,-125,62,-143,22,3,.65,[.11,.52,.39]);\n    for(const x of [-135,-115])draw(vp,x,61,-143,.5,4,.6,[.94,.77,.32]);\n    // Belt Boyz Meeting hall: an accessible open-front entrance and a long, illuminated interior.
    draw(vp,-125,45.2,-119,30,.3,52,[.19,.29,.33]);
    for(const side of [-1,1]){const x=-125+side*15;draw(vp,x,51,-119,1,12,52,[.25,.43,.43]);for(let z=-143;z<=-96;z+=8)draw(vp,x-side*.9,51,z,.65,11,.65,[.86,.72,.4]);}
    draw(vp,-125,57,-119,32,1,54,[.17,.38,.39],.86);
    for(let z=-140;z<=-96;z+=6){draw(vp,-125,56.3,z,10,.25,1,[.95,.8,.42],.95);draw(vp,-125,45.4,z,2,.08,1,[.15,.85,.61],.8);}
    // Meeting stage at the far end of the corridor.
    draw(vp,-125,46,-144,19,2,5,[.48,.31,.2]);draw(vp,-125,49,-147,18,5,.5,[.13,.56,.48]);
    for(let i=0;i<8;i++){const x=-134+(i%4)*6,z=-129+Math.floor(i/4)*9;draw(vp,x,46,z,2,2,2,[.63,.52,.32]);}
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
    const labelHost=labels.current;if(labelHost)labelHost.replaceChildren();
    for(const other of peerRef.current.values())if(now-other.seen<12000){const age=now-(arrivals.current.get(other.id)??now);if(age<2600){const progress=clamp(age/2600,0,1),drop=(1-progress)*(1-progress)*9;avatar({...other,y:other.y+drop});for(let i=0;i<6;i++){const angle=i*Math.PI/3+now*.002;draw(vp,other.x+Math.cos(angle)*1.4,other.y+2.5+drop,other.z+Math.sin(angle)*1.4,.2,3,.2,[.12,.95,.68],.6)}}else avatar(other);const feet=distance(p,other)*3.28084;if(labelHost&&feet>=5&&feet<=50){const point=project(vp,[other.x,other.y+3,other.z],w,h);if(point?.visible){const tag=document.createElement("span");tag.textContent=other.name||"Explorer";tag.style.cssText="position:absolute;left:"+point.x+"px;top:"+point.y+"px;transform:translate(-50%,-100%);padding:4px 9px;border-radius:12px;background:#052c28df;color:#fff;font-size:12px;font-weight:800;white-space:nowrap;border:1px solid #9bd9bb;pointer-events:none";labelHost.appendChild(tag)}}}
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
 const stopVoice=useCallback(async()=>{const room=voiceRoom.current;voiceRoom.current=null;setVoiceOn(false);for(const el of voiceTracks.current.values())el.remove();voiceTracks.current.clear();if(room)await room.disconnect()},[]);
 const startVoice=useCallback(async()=>{if(voiceBusy||voiceRoom.current)return;setVoiceBusy(true);try{
  const response=await fetch("/api/game-voice/token",{method:"POST"});const info=await response.json();
  if(!response.ok)throw new Error(info.error||"Voice unavailable");
  const {Room,RoomEvent,Track}=await import("livekit-client");const room=new Room({adaptiveStream:true,dynacast:true});
  room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{if(track.kind!==Track.Kind.Audio)return;const el=track.attach() as HTMLAudioElement;el.autoplay=true;el.volume=0;el.style.display="none";document.body.appendChild(el);voiceTracks.current.set(participant.identity,el)});
  room.on(RoomEvent.TrackUnsubscribed,(track,publication,participant)=>{voiceTracks.current.get(participant.identity)?.remove();voiceTracks.current.delete(participant.identity)});
  room.on(RoomEvent.ParticipantDisconnected,p=>{voiceTracks.current.get(p.identity)?.remove();voiceTracks.current.delete(p.identity)});
  await room.connect(info.url,info.token);voiceRoom.current=room;await room.localParticipant.setMicrophoneEnabled(true);setVoiceOn(true);
 }catch(e){setHint(e instanceof Error?e.message:"Microphone could not start");await stopVoice()}finally{setVoiceBusy(false)}},[voiceBusy,stopVoice]);
 useEffect(()=>()=>{void voiceRoom.current?.disconnect();for(const el of voiceTracks.current.values())el.remove();voiceTracks.current.clear()},[]);
 const drag=useRef<{x:number;id:number}|null>(null);
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{canvas.current?.focus();const g=gesture.current;const now=performance.now();if(local.current.flying){g.hold=true;keys.current.ascend=true}else if(local.current.y>terrain(local.current.x,local.current.z)+.3){toggleFly();g.hold=true;keys.current.ascend=true}else if(now-g.lastTap<340){keys.current.Space=true;g.lastTap=0}else g.lastTap=now;g.downAt=now;drag.current={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;const delta=e.clientX-drag.current.x;drag.current.x=e.clientX;local.current.yaw-=delta*.008};
 return <section className={styles.root} aria-label="1Muslim shared 3D game lobby">
  <canvas ref={canvas} className={styles.canvas} tabIndex={0} aria-label="Third-person 3D world; click to control. WASD move, mouse drag look, Space jump or ascend, F fly, Shift boost, C descend." onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}} onPointerCancel={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}}/>
  <div className={styles.top}><span>✦ 1Muslim Lobby</span><span className={online?styles.connected:styles.offline}>{online?"● Shared room":"○ Connecting"} · {peerCount+1} visible</span></div>
  <div aria-hidden="true" style={{position:"absolute",right:12,top:90,zIndex:5,color:"#ffe7a0",fontWeight:900,textShadow:"0 2px 8px #002d25"}}>☁ THE BLESSED CHAMBERS · SKY CITY</div>\n  <div aria-hidden="true" style={{position:"absolute",left:12,top:90,zIndex:5,color:"#b9f9cc",fontWeight:900,textShadow:"0 2px 8px #002d25"}}>✦ MUSLIMVILLE · SPAWN ZONE</div>
  <div ref={labels} aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:4}}/>
  {workerMessage&&<div role="dialog" aria-label="Construction worker" style={{position:"absolute",left:"12%",right:"12%",bottom:"24%",zIndex:9,background:"#092f2deb",border:"1px solid #e8c56e",borderRadius:18,color:"white",padding:18,textAlign:"center"}}><strong>🚀 Space Station Worker</strong><p>Come back soon… we’re going to the Moon! 🌙</p><button onClick={()=>setWorkerMessage(false)} style={{padding:"8px 18px",borderRadius:12}}>See you soon!</button></div>}
  <div ref={panel} className={styles.liveScreen}><div className={styles.liveHeader}>◉ 1MUSLIM LIVE</div>{live?<><div className={styles.liveVideo}><LiveHomePreview roomName={live.room_name||live.id}/></div><a href={"/streaming/live/"+live.id} className={styles.watch}>Watch {live.title} ↗</a></>:<div className={styles.waiting}><span className={styles.spinner}>◌</span><strong>Loading — waiting for the next 1Muslim Live</strong><small>{liveError?"Live status temporarily unavailable":"Broadcast will appear when someone goes live"}</small></div>}</div>
  <div ref={portalLabel} className={styles.portalSign}>✦ JUMP INTO 1MUSLIMGAMES ✦</div>
  <button type="button" onClick={()=>void (voiceOn?stopVoice():startVoice())} disabled={voiceBusy} style={{position:"absolute",right:12,top:52,zIndex:8,border:"1px solid #a7cfc7",borderRadius:24,padding:"8px 12px",background:"#efffffea",color:"#073b31",fontWeight:800,fontSize:12}}>{voiceBusy?"Connecting…":voiceOn?"🎙️ Proximity voice ON · Turn off":"🎙️ Enable proximity voice"}</button>
  <div className={styles.bottom}><span>{hint}</span><label>SUIT <select aria-label="Preview avatar suit" value={suit} onChange={e=>changeSuit(validSuit(e.target.value))}>{SUITS.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label></div>
  {crashed&&<div className={styles.toast} role="status">💥 Hard landing! Recovering…</div>}
  <div className={styles.controls}><div className={styles.dpad}><button onPointerDown={()=>setKey("w",true)} onPointerUp={()=>setKey("w",false)} onPointerLeave={()=>setKey("w",false)}>▲</button><div><button onPointerDown={()=>setKey("a",true)} onPointerUp={()=>setKey("a",false)} onPointerLeave={()=>setKey("a",false)}>◀</button><button onPointerDown={()=>setKey("s",true)} onPointerUp={()=>setKey("s",false)} onPointerLeave={()=>setKey("s",false)}>▼</button><button onPointerDown={()=>setKey("d",true)} onPointerUp={()=>setKey("d",false)} onPointerLeave={()=>setKey("d",false)}>▶</button></div></div><div className={styles.actions}><span aria-live="polite">{flying?"FLYING · hold world to rise":"Double tap world to jump · tap airborne to fly"}</span></div></div>
  {error&&<div role="alert" className={styles.error}>{error}</div>}
  {picker&&<div className={styles.modal}><div className={styles.picker}><button className={styles.close} onClick={()=>setPicker(false)} aria-label="Close world selector">✕</button><h2>Choose Your Universe</h2><p>Explore the worlds of 1Muslim Games</p><div className={styles.worlds}>{WORLDS.map(w=><button key={w} onClick={()=>{setWorldMessage(w+" is not yet connected to this lobby build.");setPicker(false)}}>{w} <small>Preview pending</small></button>)}</div></div></div>}
  {worldMessage&&<div className={styles.toast} role="status" onClick={()=>setWorldMessage("")}>{worldMessage} · Dismiss ✕</div>}
  <span className={styles.srOnly}>Shared presence is an experimental room and does not establish authenticated player identity. Suits are local preview choices.</span>
 </section>;
}
