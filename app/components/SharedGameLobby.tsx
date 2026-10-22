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
 const councilArt=useRef<HTMLDivElement>(null); const councilProjection=useRef<HTMLDivElement>(null); const [councilScreenUrl,setCouncilScreenUrl]=useState<string|null>(null);
 const labels=useRef<HTMLDivElement>(null),workerNotice=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),panel=useRef<HTMLDivElement>(null),portalLabel=useRef<HTMLDivElement>(null);
 const arrivals=useRef<Map<string,number>>(new Map());const keys=useRef<Record<string,boolean>>({}),peerRef=useRef<Map<string,Player>>(new Map()),suitRef=useRef<Suit>("gold");
 const local=useRef<Player>({id:"",x:0,y:terrain(0,0),z:0,yaw:Math.PI/2,flying:false,boost:false,suit:"gold",seen:0});
 const [suit,setSuit]=useState<Suit>("gold"),[online,setOnline]=useState(false),[peerCount,setPeerCount]=useState(0);
 const [live,setLive]=useState<Live|null>(null),[liveError,setLiveError]=useState(false),[picker,setPicker]=useState(false),[worldMessage,setWorldMessage]=useState("");
 const [error,setError]=useState(""),[hint,setHint]=useState("Explore the market road toward the portal; sky villages float beyond the city.");
 const plane=useRef({active:false,speed:0}); const ship=useRef({active:false,boostUntil:0,x:155,y:145,z:-27,inSpace:false,launchedAt:0,heading:Math.PI/2}); const [eva,setEva]=useState(false); const [shipOn,setShipOn]=useState(false); const [flightPhase,setFlightPhase]=useState("EARTH"); const [shipSettings,setShipSettings]=useState(false); const [missionControl,setMissionControl]=useState(false); const [missionMessage,setMissionMessage]=useState(""); const [nearVehicle,setNearVehicle]=useState<"plane"|"car"|"helicopter"|"ship"|null>(null); const [shipMedia,setShipMedia]=useState(false); const [shipCamera,setShipCamera]=useState(false); const shipRoom=useRef<import("livekit-client").Room|null>(null); const [shipConnected,setShipConnected]=useState(false); const [shipCaptain,setShipCaptain]=useState(false); const [shipMuted,setShipMuted]=useState(false); const [shipPassengers,setShipPassengers]=useState(0); const [remoteShipMedia,setRemoteShipMedia]=useState(false); const shipRemoteVideo=useRef<HTMLVideoElement>(null); const shipVideo=useRef<HTMLVideoElement>(null); const shipStream=useRef<MediaStream|null>(null); const [piloting,setPiloting]=useState(false); const [flying,setFlying]=useState(false); const [boostActive,setBoostActive]=useState(false); const boostUntil=useRef(0); const [workerMessage,setWorkerMessage]=useState(false); const voiceRoom=useRef<import("livekit-client").Room|null>(null); const voiceTracks=useRef<Map<string,HTMLAudioElement>>(new Map()); const [voiceOn,setVoiceOn]=useState(false); const [voiceBusy,setVoiceBusy]=useState(false); const gesture=useRef({lastTap:0,downAt:0,hold:false}); const [crashed,setCrashed]=useState(false); const flightPose=useRef({takeoff:0,landing:0}); const [emote,setEmote]=useState<"none"|"wave"|"pose"|"celebrate">("none"); const emoteUntil=useRef(0);
 const setKey=(k:string,on:boolean)=>{keys.current[k]=on};
 const activateBoost=()=>{if(!local.current.flying)return;boostUntil.current=performance.now()+5000;setBoostActive(true)};
 const leaveShipAudio=async()=>{const room=shipRoom.current;shipRoom.current=null;setShipConnected(false);setShipCaptain(false);setShipPassengers(0);setRemoteShipMedia(false);shipStream.current?.getTracks().forEach(t=>t.stop());shipStream.current=null;setShipMedia(false);if(room)await room.disconnect();};
 const joinShipAudio=async()=>{if(shipRoom.current)return;try{
  const response=await fetch("/api/game-voice/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"ship"})});
  const info=await response.json();if(!response.ok)throw new Error(info.error||"Ship room unavailable");
  const {Room,RoomEvent,Track}=await import("livekit-client");const room=new Room({adaptiveStream:true,dynacast:true});
  room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{
   if(track.kind===Track.Kind.Audio){const el=track.attach() as HTMLAudioElement;el.autoplay=true;document.body.appendChild(el);voiceTracks.current.set("ship-"+participant.identity,el);}
   if(track.kind===Track.Kind.Video){const el=shipRemoteVideo.current;if(el){track.attach(el);setRemoteShipMedia(true);}}
  });
  room.on(RoomEvent.TrackUnsubscribed,(track,publication,participant)=>{if(track.kind===Track.Kind.Audio){voiceTracks.current.get("ship-"+participant.identity)?.remove();voiceTracks.current.delete("ship-"+participant.identity);}if(track.kind===Track.Kind.Video){track.detach();setRemoteShipMedia(false);}});
  const count=()=>setShipPassengers(room.remoteParticipants.size+1);
  room.on(RoomEvent.ParticipantConnected,count);room.on(RoomEvent.ParticipantDisconnected,count);
  room.on(RoomEvent.Reconnected,()=>{count();setHint("Spaceship audio reconnected.");});
  room.on(RoomEvent.Disconnected,()=>{setShipConnected(false);setHint("Spaceship audio disconnected. Rejoin to restore.");});
  await room.connect(info.url,info.token);shipRoom.current=room;setShipCaptain(!!info.captain);setShipConnected(true);count();
  await room.localParticipant.setMicrophoneEnabled(true);setShipMuted(false);
  if(voiceRoom.current)await stopVoice();
 }catch(e){setHint(e instanceof Error?e.message:"Could not join spaceship audio");}};
 const toggleShipMic=async()=>{if(!shipRoom.current)return;await shipRoom.current.localParticipant.setMicrophoneEnabled(shipMuted);setShipMuted(!shipMuted);};
 const exitShip=()=>{void leaveShipAudio();setEva(false);ship.current.inSpace=false;ship.current.active=false;setShipOn(false);ship.current.boostUntil=0;setShipMedia(false);shipStream.current?.getTracks().forEach(t=>t.stop());shipStream.current=null;setShipCamera(false);const p=local.current;p.x=155;p.z=-27;p.y=4;p.flying=false;setFlying(false);setHint("Returned to the spaceport.");};
 const leaveShipInSpace=()=>{if(!ship.current.active)return;ship.current.inSpace=true;setShipOn(false);setEva(true);const p=local.current;p.x=ship.current.x;p.y=ship.current.y;p.z=ship.current.z+13;p.flying=true;setFlying(true);setHint("SPACEWALK · WASD drift · SPACE rise · C descend · return within 22m of shuttle to reboard.");};
 const reboardShip=()=>{const p=local.current;if(!eva||Math.hypot(p.x-ship.current.x,p.y-ship.current.y,p.z-ship.current.z)>24)return;ship.current.inSpace=true;setEva(false);setShipOn(true);p.x=ship.current.x;p.y=ship.current.y;p.z=ship.current.z;p.flying=true;setHint("Back aboard. Pilot controls restored.");};
 const boardShip=()=>{void joinShipAudio();const p=local.current;if(Math.hypot(p.x-155,p.z+27)>23||p.y>20){setHint("Approach the spaceport to board the ship.");return;}plane.current.active=false;setPiloting(false);ship.current.inSpace=true;ship.current.x=155;ship.current.y=8;ship.current.z=-27;ship.current.launchedAt=performance.now();ship.current.heading=Math.PI/2;ship.current.active=true;setFlightPhase("LAUNCH");setMissionControl(false);setShipOn(true);p.x=155;p.y=145;p.z=-27;p.yaw=Math.PI/2;p.flying=true;setFlying(true);setHint("Mission launch · Earth to Moon in 20 seconds.");};
 const startShipMedia=async(kind:"camera"|"screen")=>{try{shipStream.current?.getTracks().forEach(t=>t.stop());const stream=kind==="camera"?await navigator.mediaDevices.getUserMedia({video:true,audio:false}):await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});shipStream.current=stream;if(shipRoom.current){if(kind==="camera"){await shipRoom.current.localParticipant.setCameraEnabled(true);}else{await shipRoom.current.localParticipant.setScreenShareEnabled(true);}}setShipMedia(true);setShipCamera(kind==="camera");if(shipVideo.current){shipVideo.current.srcObject=stream;void shipVideo.current.play().catch(()=>{});}stream.getVideoTracks()[0]?.addEventListener("ended",()=>{setShipMedia(false);setShipCamera(false);shipStream.current=null;});}catch{setHint("Camera or screen sharing permission was not granted.");}};
 const togglePlane=()=>{const p=local.current;if(plane.current.active){plane.current.active=false;plane.current.speed=0;setPiloting(false);p.flying=false;setFlying(false);setHint("You exited the aircraft.");return;}if(Math.hypot(p.x-110,p.z+345)>19||p.y>8){setHint("Approach the aircraft at the airport runway to board.");return;}plane.current.active=true;plane.current.speed=0;p.x=110;p.z=-345;p.y=3;p.yaw=Math.PI/2;p.flying=true;setFlying(true);setPiloting(true);setHint("Aircraft boarded! W/▲ accelerate, S/▼ brake, A/D steer, SPACE climb, C descend, E exit.");};
 const toggleFly=useCallback(()=>{const p=local.current;p.flying=!p.flying;setFlying(p.flying);if(p.flying){flightPose.current.takeoff=performance.now();p.y=Math.max(p.y,terrain(p.x,p.z)+1.3)}else flightPose.current.landing=performance.now()},[]);
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
   const mag=Math.hypot(moving,strafing)||1;const boosted=p.flying&&now<boostUntil.current;const speed=ship.current.active||plane.current.active?0:eva?5.5:p.flying?(boosted?49.5:16.5):(k.Shift?9:5.5);
   if(ship.current.active){
     const elapsed=(performance.now()-ship.current.launchedAt)/1000;
     const flightSpeed=5.5*1000*(performance.now()<ship.current.boostUntil?2:1);
     const steering=(Number(!!(k.d||k.ArrowRight))-Number(!!(k.a||k.ArrowLeft)))*dt*.55;
     ship.current.heading+=steering;
     const climb=elapsed<7?Math.sin(Math.min(1,elapsed/7)*Math.PI/2)*210:0;
     ship.current.x+=Math.sin(ship.current.heading)*flightSpeed*dt;
     ship.current.z+=Math.cos(ship.current.heading)*flightSpeed*dt;
     ship.current.y+=climb*dt+(Number(!!k.Space)-Number(!!k.c))*flightSpeed*.18*dt;
     if(elapsed>7&&elapsed<9)setFlightPhase("LEAVING ATMOSPHERE");
     if(elapsed>=9)setFlightPhase(elapsed<20?"DEEP SPACE":elapsed<40?"LUNAR APPROACH":"SOLAR WARNING");
     if(elapsed>=40){setFlightPhase("SOLAR HEAT DANGER");setHint("☀️ Solar radiation warning. Turn away from the Sun!");}
     if(elapsed>=50){setFlightPhase("HEAT SHIELD FAILURE");ship.current.active=false;setShipOn(false);setEva(true);setHint("☀️ Solar heat destroyed the spacecraft.");}
     if(!eva){p.x=ship.current.x;p.y=ship.current.y;p.z=ship.current.z;p.yaw=ship.current.heading;}
     if(elapsed>=12&&!missionControl){setMissionControl(true);setMissionMessage("📡 HOUSTON: Can you hear us? Mission Control to 1Muslim spacecraft. You are clear to proceed.");}

   }
   if(plane.current.active){
     const throttle=Number(!!(k.w||k.ArrowUp)),brake=Number(!!(k.s||k.ArrowDown));
     plane.current.speed=clamp(plane.current.speed+(throttle*13-brake*22-(throttle?0:3))*dt,0,72);
     p.yaw+=(Number(!!(k.d||k.ArrowRight))-Number(!!(k.a||k.ArrowLeft)))*dt*(.5+plane.current.speed/95);
     p.x=clamp(p.x+Math.sin(p.yaw)*plane.current.speed*dt,-230,1300);
     p.z=clamp(p.z+Math.cos(p.yaw)*plane.current.speed*dt,-550,270);
   }
   const dx=(Math.sin(p.yaw)*moving+Math.cos(p.yaw)*strafing)/mag;
   const dz=(Math.cos(p.yaw)*moving-Math.sin(p.yaw)*strafing)/mag;
   const previousX=p.x,previousZ=p.z;
   const proposedX=eva?p.x+dx*speed*dt:clamp(p.x+dx*speed*dt,-230,1300),proposedZ=eva?p.z+dz*speed*dt:clamp(p.z+dz*speed*dt,-550,270);
   // Physical collision volumes mirror the town, tunnels and distant showroom.
   // A player's feet are p.y; their body extends about 1.8 world units upward.
   const solids:{x:number;z:number;hx:number;hz:number;bottom:number;top:number}[]=[];
   for(let x=5;x<85;x+=14)for(const side of [-1,1]){
     const z=side*15,height=5+(Math.floor(x/14)%3)*2;
     solids.push({x,z,hx:3.7,hz:3.2,bottom:0,top:height+.9});
     solids.push({x:x+4,z:z-side*5,hx:1.35,hz:1.1,bottom:0,top:2});
   }
   for(let x=235;x<=285;x+=12)for(const side of [-1,1])solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:0,top:6.1});
   for(let x=1090;x<=1140;x+=12)for(const side of [-1,1])solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:25,top:31.1});
   for(const x of [1155,1174,1190])for(const z of [-13,13])solids.push({x,z,hx:3.1,hz:1.8,bottom:25,top:27.6});
   // Upper city tower volumes are solid above their open walk-through lobbies.
   for(let row=0;row<4;row++)for(let col=0;col<6;col++){
     const x=-120+col*37,z=-380-row*38,h=19+((row*7+col*11)%7)*12;
     solids.push({x,z,hx:11,hz:11.5,bottom:7.1,top:h+.8});
   }
   // Block side penetration and reflect travel away from the struck surface.
   // Roofs remain solid landing surfaces, so players cannot fall through buildings.
   let struck=false,roof=-Infinity;
   for(const b of plane.current.active||ship.current.active||eva?[]:solids){
     const overlapsXZ=Math.abs(proposedX-b.x)<b.hx+.42&&Math.abs(proposedZ-b.z)<b.hz+.42;
     if(!overlapsXZ)continue;
     if(p.y>=b.top-.2&&p.y<=b.top+2.2){roof=Math.max(roof,b.top);continue;}
     if(p.y+1.75<=b.bottom||p.y>=b.top)continue;
     const overlapX=b.hx+.42-Math.abs(proposedX-b.x),overlapZ=b.hz+.42-Math.abs(proposedZ-b.z);
     if(overlapX<overlapZ){
       p.x=b.x+Math.sign(previousX-b.x||-dx||1)*(b.hx+.53);
       p.z=previousZ;
     }else{
       p.z=b.z+Math.sign(previousZ-b.z||-dz||1)*(b.hz+.53);
       p.x=previousX;
     }
     struck=true;break;
   }
   if(!struck&&!plane.current.active&&!ship.current.active){p.x=proposedX;p.z=proposedZ}
   else{ // Small, damped rebound rather than teleporting or sticking to a wall.
     p.x=clamp(p.x-dx*Math.min(.6,speed*dt*.45),-230,1300);
     p.z=clamp(p.z-dz*Math.min(.6,speed*dt*.45),-550,270);
     crashUntil=now+260;setCrashed(true);
   }
   p.boost=boosted; if(!boosted&&boostUntil.current){boostUntil.current=0;setBoostActive(false)}
   const cityRoof=p.z<=-365&&p.z>=-515&&p.x>=-132&&p.x<=75;
   const skyLanding=p.x>-163&&p.x<-87&&p.z>-158&&p.z<-82&&p.y>=43&&velocity<=0;const onRoad=p.x>=205&&p.x<=1200&&Math.abs(p.z)<7;const bridgeHeight=p.x<290?0:p.x<330?(p.x-290)*.625:25;const roadFloor=onRoad?bridgeHeight:(p.x>300?-100:terrain(p.x,p.z));const floor=Math.max(skyLanding?45:roadFloor,roof);
   if(p.x>330&&p.y<25-30.48){p.x=0;p.z=0;p.y=terrain(0,0);p.yaw=Math.PI/2;p.flying=false;velocity=0;boostUntil.current=0;setFlying(false);setBoostActive(false);setHint("You fell 100 feet beneath the space bridge and respawned at the beginning.");}
   if(eva){p.flying=true;p.y+=((k.Space||k.ascend?1:0)-(k.c?1:0))*5.5*dt;}else if(ship.current.active){p.flying=true;}else if(plane.current.active){
     const takeoff=plane.current.speed>24;
     const climb=takeoff&&!!(k.Space||k.ascend),descend=!!k.c;
     p.y=clamp(p.y+(climb?12:descend?-10:p.y>4?-.8:0)*dt,3,180);
     p.flying=true;
   }else if(p.flying){const ascend=!!(k.Space||k.ascend);const descend=!!k.c;velocity=clamp(velocity+(ascend?13:descend?-19:-5)*dt,-22,7);p.y=clamp(p.y+velocity*dt,floor,85);if(p.y<=floor+.03){if(velocity< -11){crashUntil=now+1300;setCrashed(true)}p.y=floor;p.flying=false;setFlying(false);flightPose.current.landing=now;velocity=0}}
   else{if(crashUntil&&now>crashUntil){crashUntil=0;setCrashed(false)}velocity-=17*dt;if(k.Space&&p.y<=floor+.07){velocity=7.2;k.Space=false}p.y+=velocity*dt;if(p.y<floor){p.y=floor;velocity=0}}
   const nearest=ship.current.inSpace||plane.current.active?null:distance(p,{x:155,z:-27})<23?"ship":distance(p,{x:110,z:-345})<19?"plane":distance(p,{x:155,z:-27})<30?"helicopter":distance(p,{x:15,z:7.5})<13?"car":null;
   if(nearVehicle!==nearest)setNearVehicle(nearest);
   const nearWorker=distance(p,{x:152,z:0})<5;if(nearWorker&&!workerNotice.current){workerNotice.current=true;setWorkerMessage(true)}if(!nearWorker)workerNotice.current=false;
   const near=distance(p,{x:95,z:0})<5;if(near&&!wasNear)setPicker(true);wasNear=near;
   const w=node.clientWidth,h=node.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
   if(w>0&&h>0){const rw=Math.floor(w*dpr),rh=Math.floor(h*dpr);if(node.width!==rw||node.height!==rh){node.width=rw;node.height=rh;gl.viewport(0,0,rw,rh)}
    // Shared 6-hour world clock: four hours daylight, two hours night.
    const cycle=Date.now()%(6*60*60*1000),night=cycle>=4*60*60*1000;
    const dusk=clamp((cycle-3.75*60*60*1000)/(15*60*1000),0,1);
    const dawn=clamp((cycle-5.75*60*60*1000)/(15*60*1000),0,1);
    const darkness=night?1-dawn:dusk;
    const atmosphere=clamp((p.y-80)/1200,0,1);
    gl.clearColor(.91-darkness*.87-atmosphere*.9,.96-darkness*.92-atmosphere*.95,.97-darkness*.85-atmosphere*.95,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const cam=[p.x-Math.sin(p.yaw)*(ship.current.active?33:plane.current.active?21:7),p.y+(ship.current.active?15:plane.current.active?10:4),p.z-Math.cos(p.yaw)*(ship.current.active?33:plane.current.active?21:7)],at=[p.x,p.y+1.3,p.z];
    const vp=mul(perspective(Math.PI/3,w/h,.1,200000),lookAt(cam,at));
    // Procedural deep-space starfield: deterministic positions around the camera, no external assets.
    if(atmosphere>.05){for(let i=0;i<270;i++){const theta=(i*2.399963229728653)% (Math.PI*2),phi=Math.acos(1-2*((i*.61803398875)%1));const rr=4200;const sx=p.x+rr*Math.sin(phi)*Math.cos(theta),sy=p.y+rr*Math.cos(phi),sz=p.z+rr*Math.sin(phi)*Math.sin(theta);const twinkle=.6+.4*Math.sin(now*.0008+i*7.1);draw(vp,sx,sy,sz,2+i%3,2+i%3,2+i%3,[.7+twinkle*.25,.78+twinkle*.2,1],atmosphere);}}
    if(ship.current.inSpace){const elapsed=(now-ship.current.launchedAt)/1000;const moonDist=Math.max(110,110000-elapsed*5500);const moonX=p.x+Math.sin(ship.current.heading)*moonDist,moonZ=p.z+Math.cos(ship.current.heading)*moonDist;draw(vp,moonX,p.y+420,moonZ,1800,1800,1800,[.73,.76,.8]);draw(vp,moonX-450,p.y+800,moonZ-950,350,70,350,[.52,.56,.62]);const sunDist=Math.max(1800,220000-elapsed*5500);draw(vp,p.x+Math.sin(ship.current.heading)*sunDist,p.y+1800,p.z+Math.cos(ship.current.heading)*sunDist,6200,6200,6200,[1,.78,.19]);if(elapsed<8){for(let i=0;i<14;i++){const off=i*48;draw(vp,p.x+Math.sin(ship.current.heading)*(130+off),p.y-40-off*.2,p.z+Math.cos(ship.current.heading)*(130+off),16,2,16,[1,.78,.22],.8);}}}
    if(eva&&p.y<1000){const fall=clamp((1000-p.y)/1000,0,1);if(fall>.1&&now%500<25)setHint("🌍 Earth gravity increasing. Brace for atmospheric entry.");}
    // Council mural on the opposite wall from the projector, perspective-scaled.
    const muralPoint=project(vp,[-125,52,-106.3],w,h);
    const mural=councilArt.current;
    if(mural){if(muralPoint?.visible&&distance(p,{x:-125,z:-120})<105){const size=clamp(1150/(Math.hypot(p.x+125,p.y-52,p.z+106)+1),55,370);mural.style.display="block";mural.style.width=size+"px";mural.style.height=size*.36+"px";mural.style.left=(muralPoint.x-size/2)+"px";mural.style.top=(muralPoint.y-size*.18)+"px";mural.style.fontSize=Math.max(8,size/20)+"px";}else mural.style.display="none";}
    // Anchor the projector UI to the in-world council wall; hide when off-screen.
    const screenPoint=project(vp,[-125,52,-133.1],w,h);
    const projector=councilProjection.current;
    if(projector){if(screenPoint?.visible&&distance(p,{x:-125,z:-120})<110){const size=clamp(650/(Math.hypot(p.x+125,p.y-52,p.z+133)+1),45,460);projector.style.display="block";projector.style.width=size+"px";projector.style.left=(screenPoint.x-size/2)+"px";projector.style.top=(screenPoint.y-size*9/32)+"px";}else projector.style.display="none";}
    // White reflective ground and long-runway guidance to the Games portal.
    draw(vp,0,-.35,0,420,.65,420,[.89,.96,.95]);
    for(let i=-200;i<=200;i+=10){draw(vp,i,.008,0,.025,.018,420,[.76,.88,.85]);draw(vp,0,.008,i,420,.018,.025,[.76,.88,.85])}
    for(let i=8;i<95;i+=7)draw(vp,i,.025,0,3,.025,1.2,[.89,.75,.42],.7);
    // Half-mile exploration route: outbound road, first tunnel, rising space bridge, second tunnel, white room.
    for(let x=200;x<=1200;x+=12){const y=x<290?0:x<330?(x-290)*.625:25;const isTunnel=(x>=235&&x<=285)||(x>=1090&&x<=1140);draw(vp,x,y-.22,0,12,.44,11,x>=330?[.46,.51,.64]:[.28,.36,.39]);draw(vp,x,y+.025,0,.25,.035,1.8,[.94,.83,.43]);if(x>=330&&x<1090){for(const side of [-1,1]){draw(vp,x,y+.65,side*5.2,12,.22,.2,[.62,.87,.98],.8);draw(vp,x,y+.7,side*5.2,.2,1.4,.25,[.73,.84,.94]);}draw(vp,x,y-12,0,12,.4,.25,[.22,.25,.4]);}if(isTunnel){for(const side of [-1,1])draw(vp,x,y+3,side*5.5,12,6,.7,[.75,.79,.87]);draw(vp,x,y+6,0,12,.6,12,[.81,.84,.91]);}}
    // Bright white destination chamber after the second tunnel.
    draw(vp,1170,24.5,0,60,1,48,[.98,.99,1]);draw(vp,1170,34,-24,60,20,1,[.99,.99,1]);draw(vp,1170,34,24,60,20,1,[.99,.99,1]);draw(vp,1200,34,0,1,20,48,[.99,.99,1]);draw(vp,1170,44,0,60,1,48,[1,1,1]);for(let x=1146;x<1195;x+=10)draw(vp,x,25.1,0,.3,.1,40,[.81,.88,.95]);
    // Exotic-car showroom at the far end of the bridge: Lamborghini, Audi R8 Spyder and Ferrari.
    // Stylized low-poly silhouettes are built from the same lightweight WebGL primitives.
    const showroomCars=[
      {x:1155,z:-13,body:[.98,.77,.12],type:"lamborghini"},
      {x:1174,z:-13,body:[.12,.68,.9],type:"audi-r8-spyder"},
      {x:1190,z:-13,body:[.88,.1,.13],type:"ferrari"},
      {x:1155,z:13,body:[.21,.9,.46],type:"lamborghini"},
      {x:1174,z:13,body:[.82,.83,.87],type:"audi-r8-spyder"},
      {x:1190,z:13,body:[.97,.22,.17],type:"ferrari"}
    ];
    for(const car of showroomCars){
      const {x,z,body,type}=car;
      draw(vp,x,25.15,z,11,.15,8,[.84,.88,.92]); // display plinth
      draw(vp,x,26.02,z,5.8,.8,2.65,body); // low sports-car chassis
      draw(vp,x+1.9,25.85,z,1.3,.3,2.5,[.11,.12,.16]); // nose intake
      draw(vp,x-2.5,26.15,z,.35,.3,2.55,[.14,.15,.18]); // rear diffuser
      for(const dx of [-1.8,1.8])for(const dz of [-1.3,1.3]){
        draw(vp,x+dx,25.57,z+dz,.88,1.05,.32,[.09,.1,.13]); // tires
        draw(vp,x+dx,25.57,z+dz*1.13,.4,.43,.12,[.7,.73,.77]); // rims
      }
      if(type==="lamborghini"){
        draw(vp,x-.4,26.76,z,2.5,.7,2.15,body);
        draw(vp,x+.28,27.08,z,1.3,.12,2.05,[.12,.2,.26],.85); // angular windshield
        draw(vp,x-2.4,26.67,z,1.05,.14,2.8,[.1,.12,.16]); // wing
      }else if(type==="audi-r8-spyder"){
        draw(vp,x-.35,26.58,z,2.3,.34,2.2,[.16,.18,.21]); // open cockpit
        draw(vp,x+.65,26.9,z,.14,.67,2.08,[.47,.75,.85],.72); // windshield
        draw(vp,x-1.1,26.55,z,1.3,.24,2.3,body); // rear deck
      }else{
        draw(vp,x-.5,26.67,z,2.9,.5,2.1,body);
        draw(vp,x+.25,26.94,z,1.2,.14,1.95,[.14,.21,.27],.85);
        draw(vp,x-2.1,26.65,z,.65,.15,2.45,[.12,.12,.14]); // rear aero
      }
      for(const dz of [-.9,.9])draw(vp,x+2.95,26.07,z+dz,.12,.18,.55,[1,.98,.8]); // headlamps
      draw(vp,x,25.24,z,7,.025,3.7,[.96,.98,1],.55); // reflective showroom stripe
    }
    // Belt Boyz Council: a suspended sky meeting room overlooking the city.
    // Kept separate from the portal system, with a visible approach deck.
    const councilX=-125,councilY=45,councilZ=-120;
    draw(vp,councilX,councilY-.4,councilZ,34,.8,30,[.18,.25,.32]);
    draw(vp,councilX,councilY-.02,councilZ,31,.12,27,[.77,.65,.3]);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      draw(vp,councilX+sx*15,councilY+6,councilZ+sz*13,.65,12,.65,[.7,.85,.93],.72);
    }
    draw(vp,councilX,councilY+12,councilZ,34,.55,30,[.18,.25,.34],.85);
    // Translucent glass walls allow the council to look out over the world.
    for(const side of [-1,1]){
      draw(vp,councilX+side*16,councilY+6,councilZ,.3,11,28,[.48,.8,.92],.24);
      draw(vp,councilX,councilY+6,councilZ+side*14,32,11,.3,[.48,.8,.92],.24);
    }
    // Council projector: wall-mounted 16:9 projection surface and ceiling projector.
    // The live video is composited as an accessible DOM overlay below, using the
    // same world-to-screen projection as player labels.
    draw(vp,councilX,councilY+7,councilZ-13.5,15,8.45,.3,[.035,.055,.075]);
    draw(vp,councilX,councilY+7,councilZ-13.29,14.4,7.85,.12,[.12,.28,.32],.9);
    draw(vp,councilX,councilY+11.8,councilZ-7,.9,.6,1.5,[.19,.21,.26]);
    draw(vp,councilX,councilY+10.9,councilZ-7,.2,1.8,.2,[.76,.69,.4]);
    // Central roundtable approximation with twelve council seats.
    draw(vp,councilX,councilY+1.35,councilZ,10,.55,8,[.69,.5,.2]);
    draw(vp,councilX,councilY+.75,councilZ,2,1.3,2,[.24,.28,.32]);
    for(let seat=0;seat<12;seat++){
      const a=seat*Math.PI/6;
      const sx=councilX+Math.cos(a)*7.5,sz=councilZ+Math.sin(a)*6.3;
      draw(vp,sx,councilY+.6,sz,1.8,1.1,1.8,[.14,.37,.35]);
      draw(vp,sx+Math.cos(a)*.65,councilY+1.35,sz+Math.sin(a)*.65,.45,1.7,1.7,[.18,.43,.39]);
    }
    // Gold landing platform and beacon identify the room from far below.
    draw(vp,councilX,councilY-.55,councilZ+19,13,.5,13,[.89,.71,.23]);
    draw(vp,councilX,councilY+15,councilZ,1.1,5,1.1,[.96,.79,.27]);
    // Eight parked four-seat city vehicles; seats and drive controls are a later gameplay phase.
    for(let i=0;i<8;i++){
      const x=10+i*11,z=(i%2===0?1:-1)*7.5;
      const colors=[[.14,.33,.84],[.92,.19,.22],[.88,.88,.9],[.12,.15,.19],[.16,.7,.52],[.94,.72,.22],[.5,.3,.78],[.65,.72,.79]];
      const col=colors[i];
      draw(vp,x,.85,z,5.4,1.1,2.5,col);
      draw(vp,x-.2,1.7,z,2.6,.85,2.15,col);
      draw(vp,x+.7,1.75,z,1.05,.68,2.18,[.21,.43,.55],.86);
      draw(vp,x-1.1,1.75,z,.8,.68,2.18,[.21,.43,.55],.86);
      for(const ox of [-1.7,1.7])for(const oz of [-1.25,1.25]){
        draw(vp,x+ox,.43,z+oz,.8,.8,.28,[.1,.11,.14]);
        draw(vp,x+ox,.43,z+oz*1.12,.36,.36,.08,[.8,.82,.84]);
      }
    }
    // Twelve-way golden road hub beyond the exotic-car showroom.
    draw(vp,1216,24.95,0,38,.32,38,[.94,.72,.22]);
    draw(vp,1216,25.16,0,16,.07,16,[1,.88,.44]);
    const portalColors:[[number,number,number],string][]=[
      [[.96,.16,.23],"Crimson"],[[.15,.65,1],"Azure"],[[.26,.93,.4],"Emerald"],
      [[.94,.35,.96],"Violet"],[[1,.72,.17],"Amber"],[[.18,.91,.91],"Cyan"],
      [[1,.43,.16],"Orange"],[[.55,.53,1],"Indigo"],[[1,.93,.95],"Pearl"],
      [[.28,.45,.96],"Cobalt"],[[.93,.25,.7],"Rose"],[[.65,.32,.93],"Purple"]
    ];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,ux=Math.cos(a),uz=Math.sin(a),ex=1216+ux*72,ez=uz*72;
      // Segment the radial road to avoid relying on a long rotated ground slab.
      for(let step=0;step<7;step++){
        const t=15+step*8;
        draw(vp,1216+ux*t,25.02,uz*t,9,.15,9,[.91,.7,.2],1,-a);
        draw(vp,1216+ux*t,25.13,uz*t,2,.04,2,[1,.9,.53],.9);
      }
      const col=portalColors[i][0];
      draw(vp,ex,28.4,ez,7,7,.9,col,.94,-a);
      draw(vp,ex,28.4,ez,4.7,5.8,1.05,[.04,.05,.12],.95,-a);
      draw(vp,ex,32.1,ez,8,.65,1.5,[.98,.83,.35],1,-a);
      draw(vp,ex,25.4,ez,9,.6,7,[.25,.23,.35]);
      // Door #2 is deliberately different: reserved for its unique destination.
      if(i===1)draw(vp,ex,29,ez,2.8,4.2,1.2,[.97,.97,1],.5,-a);
    }
    // Underground hangar and a raised helicopter silhouette by the space station.
    draw(vp,155,-5,-27,28,.6,26,[.24,.28,.34]);
    for(const side of [-1,1])draw(vp,155,-.5,-27+side*13,28,10,.8,[.38,.44,.52]);
    draw(vp,155,1.6,-27,11,2.2,3.5,[.13,.19,.24]); // helicopter cabin
    draw(vp,149,1.2,-27,9,.5,.65,[.15,.19,.22]); // tail
    draw(vp,155,3.3,-27,19,.12,.45,[.85,.87,.91]); // main rotor
    draw(vp,155,.15,-27,7,.25,5,[.94,.73,.25]); // lift deck
    // A visible lift entrance and split ground hatch.
    draw(vp,143,2,-27,4,4,4,[.18,.38,.47],.85);
    draw(vp,155,.04,-34,15,.15,8,[.47,.51,.55]);
    draw(vp,155,.04,-20,15,.15,8,[.47,.51,.55]);
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
    // Extended forest: a second broad grove, with varied canopy height and scale.
    // The Kaaba-inspired landmark is beyond the far side of the woodland.
    for(let i=0;i<110;i++){
      const x=-155+(i%22)*13.3,z=45+Math.floor(i/22)*23+(i%3)*3;
      const tall=3.5+((i*17)%11)*.85;
      const spread=1.5+(i%5)*.33;
      draw(vp,x,tall*.5,z,.65,tall,.65,[.35,.25,.17]);
      for(const layer of [0,1,2])draw(vp,x,tall+layer*1.35,z,spread*(2-layer*.38),3.5-layer*.55,spread*(2-layer*.38),[.09+.02*(i%4),.35+.035*(i%5),.18+.015*(i%3)]);
    }
    // Masjid al-Haram-inspired district, set beyond the forest. This is a
    // respectful approximate architectural reconstruction, not a surveyed map.
    const haramZ=184;
    draw(vp,0,.04,haramZ,118,.12,116,[.88,.86,.81]); // white marble precinct
    for(let ring=0;ring<3;ring++){
      const radius=24+ring*13;
      // Four arcades of colonnades, open toward the center for tawaf.
      for(let i=-5;i<=5;i++){
        const t=i*radius/6;
        for(const side of [-1,1]){
          draw(vp,t,3,haramZ+side*radius,.8,6,.8,[.91,.9,.83]);
          draw(vp,side*radius,3,haramZ+t,.8,6,.8,[.91,.9,.83]);
        }
      }
      for(const side of [-1,1]){
        draw(vp,0,6.3,haramZ+side*radius,radius*2+3,.7,2.5,[.87,.84,.72]);
        draw(vp,side*radius,6.3,haramZ,2.5,.7,radius*2+3,[.87,.84,.72]);
      }
    }
    // Kaaba centered in the open courtyard, black kiswah and gold belt.
    draw(vp,0,7,haramZ,14,14,14,[.045,.046,.055]);
    for(const side of [-1,1]){
      draw(vp,0,11.2,haramZ+side*7.05,14,.8,.13,[.87,.7,.3]);
      draw(vp,side*7.05,11.2,haramZ,.13,.8,14,[.87,.7,.3]);
    }
    draw(vp,0,14.1,haramZ,14,.25,14,[.15,.15,.17]);
    // Safa-Marwah inspired covered gallery to the east (simplified).
    draw(vp,57,2.5,haramZ,13,.3,91,[.93,.91,.84]);
    for(let z=haramZ-42;z<=haramZ+42;z+=12){
      for(const x of [52,62])draw(vp,x,5,z,.8,10,.8,[.9,.88,.79]);
    }
    draw(vp,57,10.3,haramZ,15,.8,94,[.82,.79,.68]);
    // Minarets frame the mosque, with luminous upper lanterns.
    for(const [x,z] of [[-51,133],[51,133],[-51,235],[51,235]]){
      draw(vp,x,17,z,3.2,34,3.2,[.87,.85,.75]);
      draw(vp,x,35,z,5,.8,5,[.8,.68,.42]);
      draw(vp,x,39,z,2.3,7,2.3,[.92,.9,.8]);
      draw(vp,x,43,z,3,.7,3,[.82,.68,.38]);
      draw(vp,x,47,z,.35,8,.35,[.84,.69,.29]);
    }
    // Abraj Al Bait / Makkah Clock Royal Tower-inspired skyline, southwest
    // of the mosque. The clock faces orient toward the sanctuary.
    const clockX=-90,clockZ=238;
    draw(vp,clockX,30,clockZ,26,60,22,[.38,.47,.46]);
    draw(vp,clockX,72,clockZ,19,26,17,[.3,.43,.43]);
    draw(vp,clockX,95,clockZ,15,20,14,[.31,.48,.46]);
    draw(vp,clockX,108,clockZ,19,14,17,[.23,.4,.39]);
    for(const side of [-1,1]){
      draw(vp,clockX,108,clockZ+side*8.65,12,11,.25,[.84,.77,.53]);
      draw(vp,clockX+side*9.65,108,clockZ,.25,11,12,[.84,.77,.53]);
    }
    // Clock hands and hour marks on the face visible from the courtyard.
    draw(vp,clockX,108,clockZ-8.83,.4,7,.3,[.13,.19,.2]);
    draw(vp,clockX+1.5,108,clockZ-8.86,3.2,.35,.3,[.13,.19,.2]);
    draw(vp,clockX,124,clockZ,9,15,9,[.28,.44,.38]);
    draw(vp,clockX,136,clockZ,4,10,4,[.73,.66,.38]);
    draw(vp,clockX,145,clockZ,.7,9,.7,[.92,.77,.34]);
    // Surrounding hotel blocks to give the clock tower a plausible city context.
    for(let i=0;i<8;i++){
      const x=-127+(i%4)*23,z=253+Math.floor(i/4)*23;
      if(Math.abs(x-clockX)<16&&z<266)continue;
      const h=24+(i%3)*12;
      draw(vp,x,h/2,z,17,h,17,[.58,.6,.55]);
      draw(vp,x,h+.5,z,19,1.1,19,[.72,.68,.52]);
    }
    // Open-access new city district: airport, playground, parking, restaurants,
    // hotels and high-rise downtown. Buildings use open ground-floor lobbies.
    const cityZ=-175;
    // Streets and sidewalks connect the district to the original town.
    draw(vp,95,.05,cityZ,290,.12,13,[.25,.3,.35]);
    draw(vp,95,.055,-90,13,.12,175,[.25,.3,.35]);
    for(let i=0;i<19;i++)draw(vp,-42+i*15,.13,cityZ,5,.025,.3,[.95,.81,.43]);
    // Airport runway, terminal with open arrivals hall and control tower.
    draw(vp,175,.06,-325,205,.16,32,[.19,.23,.29]);
    for(let i=0;i<12;i++)draw(vp,90+i*16,.17,-325,8,.04,.55,[.95,.94,.8]);
    draw(vp,180,.16,-288,102,.3,34,[.74,.77,.78]);
    for(const x of [132,152,172,192,212,232]){
      draw(vp,x,6,-305,.9,12,.9,[.5,.67,.71]);
      draw(vp,x,12.5,-305,1.5,.5,1.5,[.9,.76,.36]);
    }
    draw(vp,180,13,-288,100,.8,34,[.42,.54,.59]);
    draw(vp,243,20,-287,9,40,9,[.69,.72,.71]);
    draw(vp,243,42,-287,14,5,14,[.3,.53,.62]);
    // Active aircraft is drawn around the pilot in third-person view.
    if(plane.current.active){
      draw(vp,p.x,p.y,p.z,18,2.8,4,[.91,.94,.95],1,-p.yaw);
      draw(vp,p.x,p.y,p.z,5,.5,23,[.82,.89,.94],1,-p.yaw);
      draw(vp,p.x-7,p.y+2,p.z,5,4,.65,[.78,.84,.9],1,-p.yaw);
      draw(vp,p.x+5,p.y+.8,p.z,3,1.8,3,[.22,.45,.59],.9,-p.yaw);
    }
    // Futuristic twelve-seat space shuttle, visible at the spaceport and in flight.
    const shuttleX=ship.current.inSpace?ship.current.x:155,shuttleY=ship.current.inSpace?ship.current.y:10,shuttleZ=ship.current.inSpace?ship.current.z:-27;
    draw(vp,shuttleX,shuttleY,shuttleZ,23,5,11,[.63,.74,.81]);
    draw(vp,shuttleX+7,shuttleY+1,shuttleZ,9,4,8,[.18,.43,.58],.92);
    for(const side of [-1,1]){
      draw(vp,shuttleX-3,shuttleY-1,shuttleZ+side*8,12,1.2,11,[.24,.54,.59]);
      draw(vp,shuttleX-10,shuttleY,shuttleZ+side*3,4,4,3,[.21,.39,.51]);
    }
    draw(vp,shuttleX-12,shuttleY+3,shuttleZ,4,7,2,[.77,.68,.32]);
    // Moon is 120 seconds of travel at 450x walking speed; Sun at 360 seconds.
    const moonX=155+5.5*450*120,sunX=155+5.5*450*360;
    if(ship.current.active||eva){
      draw(vp,moonX,150,-27,8500,8500,8500,[.72,.74,.76]);
      draw(vp,sunX,160,-60000,18000,18000,18000,[1,.81,.33]);
    }
    // Parked aircraft silhouette and hangar.
    draw(vp,110,2,-345,23,3,4,[.9,.93,.93]);
    draw(vp,108,2,-345,7,.5,30,[.83,.88,.91]);
    draw(vp,99,4,-345,7,5,.8,[.83,.88,.91]);
    draw(vp,67,10,-295,40,20,30,[.47,.55,.58]);
    // Public parking with marked bays and low-poly cars.
    draw(vp,8,.07,-250,92,.14,60,[.23,.27,.29]);
    for(let row=0;row<3;row++)for(let col=0;col<8;col++){
      const x=-29+col*10,z=-271+row*19;
      draw(vp,x,.17,z-4,7,.03,.15,[.95,.92,.72]);
      draw(vp,x,.17,z+4,7,.03,.15,[.95,.92,.72]);
      if((col+row)%4!==0){
        const palette=[[.14,.35,.71],[.75,.2,.22],[.79,.8,.78],[.18,.2,.24]];
        draw(vp,x,.9,z,4.6,1.3,2.6,palette[(col+row)%4]);
        draw(vp,x-.3,1.75,z,2.4,.7,2.1,[.29,.45,.52]);
      }
    }
    // Playground with sandbox, climbing frames, swings and slides.
    draw(vp,-105,.05,-248,75,.15,70,[.35,.54,.32]);
    draw(vp,-120,.17,-248,25,.18,23,[.83,.69,.42]);
    for(const x of [-139,-133])draw(vp,x,3,-229,.5,6,.5,[.87,.29,.23]);
    draw(vp,-136,6,-229,9,.4,.5,[.9,.75,.31]);
    for(const x of [-139,-133])draw(vp,x,3,-229,.1,5,.1,[.75,.78,.81]);
    draw(vp,-136,1.3,-229,6,.3,1.5,[.17,.46,.78]);
    draw(vp,-96,3,-250,9,.7,7,[.88,.41,.26]);
    draw(vp,-90,1.6,-250,11,.35,3,[.28,.57,.87],1,-.4);
    for(let i=0;i<9;i++){
      const x=-130+(i%3)*22,z=-273+Math.floor(i/3)*22;
      draw(vp,x,1.3,z,.65,2.6,.65,[.43,.32,.21]);
      draw(vp,x,4.2,z,5,5,5,[.14,.48,.28]);
    }
    // Downtown towers: open lobby space below a supported upper structure.
    // Player can enter the lobby and land on rooftops by flying.
    const cityTowers:{x:number;z:number;w:number;d:number;h:number;type:number}[]=[];
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const x=-120+col*37,z=-380-row*38;
      const h=19+((row*7+col*11)%7)*12;
      const type=(row+col)%4;
      cityTowers.push({x,z,w:22,d:23,h,type});
      draw(vp,x,.12,z,30,.2,31,[.74,.75,.7]);
      // Four pillars instead of a solid ground floor: walk-in entrance.
      for(const ox of [-9,9])for(const oz of [-9.5,9.5])draw(vp,x+ox,3.4,z+oz,.9,6.8,.9,[.48,.55,.59]);
      draw(vp,x,7.1,z,22,.7,23,[.65,.72,.72]);
      const facade=type===0?[.26,.44,.54]:type===1?[.7,.59,.43]:type===2?[.39,.52,.47]:[.46,.47,.59];
      draw(vp,x,7.5+(h-7)/2,z,22,h-7,23,facade);
      for(let y=12;y<h;y+=6){
        for(const side of [-1,1])draw(vp,x,y,z+side*11.6,19,.65,.1,[.59,.79,.83],.78);
      }
      draw(vp,x,h+.4,z,24,.8,25,[.75,.68,.48]);
      // Rooftop terrace railings leave an open walkable top.
      for(const side of [-1,1]){
        draw(vp,x+side*11,h+1.7,z,.35,2.3,23,[.75,.78,.79],.7);
        draw(vp,x,h+1.7,z+side*11.5,22,2.3,.35,[.75,.78,.79],.7);
      }
      // Hotel blocks receive a gold canopy; restaurants a sidewalk patio.
      if(type===1)draw(vp,x,h+2.7,z,8,2,8,[.83,.67,.32]);
      if(type===2)for(let j=-1;j<=1;j++)draw(vp,x+j*5,1.2,z+14,3,.2,3,[.82,.62,.37]);
    }
    // Procedural pedestrians walk sidewalks, not player-controlled identities.
    for(let i=0;i<48;i++){
      const x=-140+(i%12)*27+Math.sin(now*.00035+i)*4;
      const z=-183-Math.floor(i/12)*39+Math.cos(now*.00045+i)*4;
      const shirt=i%3===0?[.15,.57,.47]:i%3===1?[.77,.65,.34]:[.35,.48,.75];
      draw(vp,x,1.45,z,.75,1.65,.65,shirt);
      draw(vp,x,2.62,z,.62,.65,.62,[.64,.49,.37]);
      draw(vp,x,.4,z,.6,.8,.6,[.23,.26,.28]);
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
    // Street lights switch on automatically during the two-hour night.
    if(darkness>.05)for(let x=8;x<=195;x+=17)for(const side of [-1,1]){
      const z=side*10;
      draw(vp,x,5.1,z,1.2,.25,1.2,[1,.91,.52],.45+.5*darkness);
      draw(vp,x,4.75,z,3.5,.12,3.5,[1,.83,.36],.12+.17*darkness);
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
    const avatar=(a:Player)=>{const c=SUIT_COLORS[a.suit];const self=a.id===p.id;const launch=self&&a.flying?clamp((now-flightPose.current.takeoff)/900,0,1):1;const land=self&&!a.flying?clamp((now-flightPose.current.landing)/1350,0,1):1;const crouch=self&&!a.flying&&land<.5?(1-land*2)*.65:0;const lean=a.flying?(.15+.65*launch):0;const ay=a.y-crouch+(a.flying?0:.1*Math.sin(now*.006));draw(vp,a.x,ay+1.35,a.z,.8,1.1,.44,c,1,a.yaw+lean*.12);draw(vp,a.x+Math.sin(a.yaw)*lean*.25,ay+2.16+(!a.flying&&land<.8?.18*(1-land):0),a.z+Math.cos(a.yaw)*lean*.25,.52,.52,.52,c,1,a.yaw);const cs=Math.cos(a.yaw),sn=Math.sin(a.yaw);
      for(const side of [-1,1]){const ox=cs*side*.61,oz=-sn*side*.61;const gesture=self&&now<emoteUntil.current?emote:"none";const lift=a.flying?(.45+launch*.35):(gesture==="wave"&&side===1?.65:gesture==="celebrate"?.65:gesture==="pose"&&side===1?.28:0);draw(vp,a.x+ox+sn*lift*.3,ay+1.28+lift,a.z+oz+cs*lift*.3,.26,.94,.3,c,1,a.yaw);draw(vp,a.x+cs*side*.23,ay+.46,a.z-sn*side*.23,.31,.85,.35,c,1,a.yaw)}
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
  const keyDown=(e:KeyboardEvent)=>{if(document.activeElement!==canvas.current)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(key==="e"&&!e.repeat){if(ship.current.active)exitShip();else if(nearVehicle==="ship")boardShip();else if(nearVehicle==="plane")togglePlane();}else if(key==="f"&&!e.repeat)toggleFly();else if(key===" ")keys.current.Space=true;else keys.current[key]=true};
  const keyUp=(e:KeyboardEvent)=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys.current[key===" "?"Space":key]=false};
  window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);return()=>{window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp)};
 },[toggleFly,nearVehicle]);
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
 useEffect(()=>()=>{void shipRoom.current?.disconnect();void voiceRoom.current?.disconnect();for(const el of voiceTracks.current.values())el.remove();voiceTracks.current.clear()},[]);
 const drag=useRef<{x:number;id:number}|null>(null);
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{canvas.current?.focus();const g=gesture.current;const now=performance.now();if(local.current.flying){g.hold=true;keys.current.ascend=true}else if(local.current.y>terrain(local.current.x,local.current.z)+.3){toggleFly();g.hold=true;keys.current.ascend=true}else if(now-g.lastTap<340){keys.current.Space=true;g.lastTap=0}else g.lastTap=now;g.downAt=now;drag.current={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;const delta=e.clientX-drag.current.x;drag.current.x=e.clientX;local.current.yaw-=delta*.008};
 return <section className={styles.root} aria-label="1Muslim shared 3D game lobby">
  <canvas ref={canvas} className={styles.canvas} tabIndex={0} aria-label="Third-person 3D world; click to control. WASD move, mouse drag look, Space jump or ascend, F fly, Shift boost, C descend." onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}} onPointerCancel={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}}/>

  <div aria-label="Belt Boyz Council graffiti and Islamic calligraphy" style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",overflow:"hidden"}}>
    <div ref={councilArt} style={{display:"none",position:"absolute",width:340,height:120,transformOrigin:"center",borderRadius:14,background:"linear-gradient(125deg,rgba(8,20,26,.94),rgba(9,48,45,.9))",border:"2px solid rgba(224,181,76,.85)",boxShadow:"0 0 30px rgba(15,201,162,.3)",overflow:"hidden",textAlign:"center",color:"#f6d17a",padding:"8px 12px"}}>
      <div style={{fontWeight:1000,fontSize:29,letterSpacing:3,transform:"rotate(-3deg)",fontStyle:"italic",textShadow:"3px 3px #008b74,-2px -1px #d59c37,0 0 12px #37dcb8"}}>BELT BOYZ</div>
      <div style={{fontSize:11,letterSpacing:5,color:"#a9f1d7"}}>THE COUNCIL</div>
      <div lang="ar" dir="rtl" style={{fontFamily:"serif",fontSize:25,lineHeight:1.5,color:"#ffe8a6",textShadow:"0 0 10px rgba(234,196,111,.5)"}}>ﷲ &nbsp; • &nbsp; الإسلام</div>
    </div>
  </div>
  <div ref={councilProjection} aria-label="Belt Boyz Council projector" style={{position:"absolute",display:"none",width:260,aspectRatio:"16 / 9",zIndex:3,pointerEvents:"none",border:"3px solid #c8ac60",borderRadius:5,background:"#061b22",overflow:"hidden",boxShadow:"0 0 20px rgba(75,225,217,.35)"}}>{councilScreenUrl?<video src={councilScreenUrl} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{height:"100%",display:"grid",placeContent:"center",textAlign:"center",color:"#bcefe8",fontSize:13}}><strong>BELT BOYZ COUNCIL</strong><small>PROJECTOR · Awaiting screen share</small></div>}</div>
  <div ref={labels} aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:4}}/>
  {workerMessage&&<div role="dialog" aria-label="Construction worker" style={{position:"absolute",left:"12%",right:"12%",bottom:"24%",zIndex:9,background:"#092f2deb",border:"1px solid #e8c56e",borderRadius:18,color:"white",padding:18,textAlign:"center"}}><strong>🚀 Space Station Worker</strong><p>Come back soon… we’re going to the Moon! 🌙</p><button onClick={()=>setWorkerMessage(false)} style={{padding:"8px 18px",borderRadius:12}}>See you soon!</button></div>}
  <div ref={panel} className={styles.liveScreen}><div className={styles.liveHeader}>◉ 1MUSLIM LIVE</div>{live?<><div className={styles.liveVideo}><LiveHomePreview roomName={live.room_name||live.id}/></div><a href={"/streaming/live/"+live.id} className={styles.watch}>Watch {live.title} ↗</a></>:<div className={styles.waiting}><span className={styles.spinner}>◌</span><strong>Loading — waiting for the next 1Muslim Live</strong><small>{liveError?"Live status temporarily unavailable":"Broadcast will appear when someone goes live"}</small></div>}</div>
  {!piloting&&nearVehicle==="plane"&&<button type="button" onClick={togglePlane} style={{position:"absolute",right:12,top:95,zIndex:9,padding:"11px 15px",borderRadius:12,background:"#0b5547",color:"white",border:"1px solid #d3ae54"}}>✈️ Board Plane (E)</button>}
  {!shipOn&&nearVehicle==="ship"&&<button type="button" onClick={boardShip} style={{position:"absolute",right:12,top:95,zIndex:9,padding:12,borderRadius:12,background:"#134e58",color:"#fff"}}>🚀 Board Spaceship · 12 seats</button>}
  {!shipOn&&nearVehicle==="car"&&<div style={{position:"absolute",right:12,top:95,zIndex:9,color:"#fff",background:"#163e3a",padding:10,borderRadius:10}}>🚗 Car nearby · driving coming soon</div>}
  {eva&&<div style={{position:"absolute",right:12,top:95,zIndex:10,padding:12,borderRadius:12,background:"#071824ed",color:"white"}}><strong>🧑‍🚀 SPACEWALK · ZERO GRAVITY</strong><div>WASD move · SPACE up · C down</div><button onClick={reboardShip} disabled={Math.hypot(local.current.x-ship.current.x,local.current.y-ship.current.y,local.current.z-ship.current.z)>24}>🚀 Re-enter ship</button></div>}
  {missionControl&&shipOn&&<div style={{position:"absolute",left:"50%",top:15,transform:"translateX(-50%)",zIndex:12,padding:"9px 14px",borderRadius:14,background:"#053b36df",border:"1px solid #d6ba72",color:"#fff",fontSize:12,maxWidth:"80%",textAlign:"center"}}>{missionMessage}</div>}{shipOn&&<div style={{position:"absolute",right:12,top:90,zIndex:10,width:"min(275px,65vw)",padding:14,borderRadius:22,color:"#f9f6e9",background:"linear-gradient(145deg,#052f2deF,#091f2eF2)",border:"1px solid #d9b869",boxShadow:"0 12px 36px #0009, inset 0 1px 0 #ffffff24",backdropFilter:"blur(20px)"}}><strong>🚀 SPACECRAFT · {shipCaptain?"CAPTAIN":"PASSENGER"}</strong><div>🎙️ {shipConnected?`Connected · ${shipPassengers}/12`:"Connecting / unavailable"}</div><button onClick={()=>void toggleShipMic()}>{shipMuted?"🎤 Unmute":"🔇 Mute"}</button><button onClick={()=>void joinShipAudio()}>Reconnect audio</button><div style={{fontSize:11,letterSpacing:2,color:"#e6c781",marginTop:8}}>✦ {flightPhase} · 1000× SPEED · MOON ~20s</div><div style={{fontSize:11,opacity:.85}}>✧ Follow the golden flight path · A/D steer · SPACE climb · C descend</div><div style={{fontSize:12,color:"#f8dc91",marginTop:5}}>➤ MOON · 20s &nbsp; ☀ SUN · 40s</div><button onClick={()=>setShipSettings(v=>!v)}>⚙️ Audio room settings</button>{shipSettings&&<div style={{border:"1px solid #a5cbb477",borderRadius:14,padding:10,background:"#043c3388"}}><div>🎙️ 1Muslim Flight Audio · {shipPassengers}/12</div><div>{shipConnected?"🟢 Connected":"🟡 Offline — tap Reconnect"}</div><div>{shipCaptain?"👨‍✈️ Captain":"🧑‍🚀 Passenger"} · private ship channel</div><small>Camera and screen sharing are optional.</small></div>}<button disabled={!shipCaptain} onClick={()=>ship.current.boostUntil=performance.now()+8000}>⚡ BOOST 2×</button><button onClick={()=>void startShipMedia("screen")}>Share screen</button><button onClick={()=>void startShipMedia("camera")}>Camera on</button><button onClick={()=>{shipStream.current?.getTracks().forEach(t=>t.stop());shipStream.current=null;void shipRoom.current?.localParticipant.setCameraEnabled(false);void shipRoom.current?.localParticipant.setScreenShareEnabled(false);setShipMedia(false);setShipCamera(false)}}>Media off</button><button onClick={leaveShipInSpace}>🧑‍🚀 Spacewalk · Exit ship</button><button onClick={exitShip}>Return to spaceport</button>{shipMedia&&<video ref={shipVideo} autoPlay playsInline muted style={{width:"100%",marginTop:8,borderRadius:8}}/>}<video ref={shipRemoteVideo} autoPlay playsInline style={{width:"100%",display:remoteShipMedia?"block":"none",marginTop:6}}/><small style={{display:"block"}}>Ship media room · screen/camera opt-in</small></div>}
  {piloting&&<div style={{position:"absolute",right:12,top:95,zIndex:9,background:"#102f36e8",color:"white",padding:12,borderRadius:12}}><strong>✈️ PILOT MODE</strong><div>▲ Throttle · ▼ Brake · ◀ ▶ Turn</div><div>SPACE Climb · C Descend</div><button type="button" onClick={togglePlane} style={{padding:9,marginTop:6}}>Exit aircraft (E)</button></div>}
  {crashed&&<div className={styles.toast} role="status">💥 Hard landing! Recovering…</div>}
  <div className={styles.controls}><div className={styles.dpad}><button onPointerDown={()=>setKey("w",true)} onPointerUp={()=>setKey("w",false)} onPointerLeave={()=>setKey("w",false)}>▲</button><div><button onPointerDown={()=>setKey("a",true)} onPointerUp={()=>setKey("a",false)} onPointerLeave={()=>setKey("a",false)}>◀</button><button onPointerDown={()=>setKey("s",true)} onPointerUp={()=>setKey("s",false)} onPointerLeave={()=>setKey("s",false)}>▼</button><button onPointerDown={()=>setKey("d",true)} onPointerUp={()=>setKey("d",false)} onPointerLeave={()=>setKey("d",false)}>▶</button></div></div><button type="button" aria-label={boostActive?"Flight boost active":"Boost flight speed three times for five seconds"} aria-pressed={boostActive} disabled={!flying} onClick={activateBoost} style={{pointerEvents:"auto",alignSelf:"flex-end",minWidth:66,minHeight:48,borderRadius:14,border:"1px solid rgba(255,226,138,.65)",background:boostActive?"linear-gradient(135deg,#ffd36a,#f69e32)":"linear-gradient(135deg,rgba(5,75,58,.92),rgba(13,135,105,.95))",color:boostActive?"#18382b":"#fff",fontWeight:800,fontSize:13,boxShadow:boostActive?"0 0 18px rgba(255,203,75,.55)":"0 4px 14px rgba(0,0,0,.25)",opacity:flying?1:.45}}>⚡ {boostActive?"3×":"BOOST"}</button></div>
  {error&&<div role="alert" className={styles.error}>{error}</div>}
  {picker&&<div className={styles.modal}><div className={styles.picker}><button className={styles.close} onClick={()=>setPicker(false)} aria-label="Close world selector">✕</button><h2>Choose Your Universe</h2><p>Explore the worlds of 1Muslim Games</p><div className={styles.worlds}>{WORLDS.map(w=><button key={w} onClick={()=>{setWorldMessage(w+" is not yet connected to this lobby build.");setPicker(false)}}>{w} <small>Preview pending</small></button>)}</div></div></div>}
  {worldMessage&&<div className={styles.toast} role="status" onClick={()=>setWorldMessage("")}>{worldMessage} · Dismiss ✕</div>}
  <span className={styles.srOnly}>Shared presence is an experimental room and does not establish authenticated player identity. Suits are local preview choices.</span>
 </section>;
}
