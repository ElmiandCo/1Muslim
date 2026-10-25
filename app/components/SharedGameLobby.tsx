"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import LiveHomePreview from "./LiveHomePreview";
import styles from "./SharedGameLobby.module.css";
import {drawJurassic,updateJurassicDinos,jurassicBlocked,jurassicTerrain,JURASSIC_LIMIT,hitJurassicApex} from "./JurassicScene";
import {FUTURE_BOUNDS,FUTURE_PORTAL,FUTURE_TOWERS,futureSkywayFloor,renderFutureWorld} from "./FutureCityScene";

type Suit="gold"|"silver"|"cosmic"|"diamond";
type Player={id:string;userId?:string;name?:string;world?:string;x:number;y:number;z:number;yaw:number;flying:boolean;boost:boolean;suit:Suit;seen:number};
type Live={id:string;room_name:string|null;title:string};
const SUITS:Suit[]=["gold","silver","cosmic","diamond"];
const WORLDS=["Jurassic","Time of Moses","Time of Jesus","Time of Muhammad ﷺ","Today","Future"];
// HudHud wayfinding: match the five districts rendered below; this is an informational map, not teleportation.
const EXPLORATION_BOUNDS={minX:-1900,maxX:1400,minZ:-1350,maxZ:1850} as const;
const MOON_BOUNDS={minX:-345,maxX:345,minZ:-345,maxZ:345} as const;
const CITY_WAYPOINTS=[
 {name:"Nile Quarter",description:"Pyramids",x:-720,z:180,color:"#e7c17c"},
 {name:"Courtyard City",description:"Courtyards",x:-420,z:850,color:"#d4bd78"},
 {name:"Skyline City",description:"High-rises",x:-1260,z:-170,color:"#8dd2ed"},
 {name:"Beach City",description:"Beach & boardwalk",x:-110,z:1580,color:"#e8d39c"},
 {name:"Grand Metro",description:"Metropolitan center",x:-1530,z:760,color:"#c9b4f5"}
] as const;
const mapX=(x:number)=>((x-EXPLORATION_BOUNDS.minX)/(EXPLORATION_BOUNDS.maxX-EXPLORATION_BOUNDS.minX))*320;
const mapY=(z:number)=>((z-EXPLORATION_BOUNDS.minZ)/(EXPLORATION_BOUNDS.maxZ-EXPLORATION_BOUNDS.minZ))*320;
const SUIT_COLORS:Record<Suit,[number,number,number]>={gold:[.99,.73,.23],silver:[.72,.83,.89],cosmic:[.53,.36,.94],diamond:[.62,.92,1]};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const terrain=(x:number,z:number)=>{const far=Math.max(0,Math.hypot(x,z)-250);const mountains=Math.pow(Math.max(0,Math.sin(x*.0037)*Math.cos(z*.0041)),3)*Math.min(135,far*.16);return .12*Math.sin(x*.11)*Math.cos(z*.09)+mountains;};
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
 const [hudVisible,setHudVisible]=useState(true); const hudTimer=useRef<ReturnType<typeof setTimeout>|null>(null); const wakeHud=useCallback(()=>{setHudVisible(true);if(hudTimer.current)clearTimeout(hudTimer.current);hudTimer.current=setTimeout(()=>setHudVisible(false),3000)},[]); useEffect(()=>{wakeHud();return()=>{if(hudTimer.current)clearTimeout(hudTimer.current)}},[wakeHud]);
 const gameRoot=useRef<HTMLElement>(null); const [gameFullscreen,setGameFullscreen]=useState(false);
 // The WebGL render loop mounts once, so read fullscreen through a live ref.
 const fullscreenRef=useRef(false);
 useEffect(()=>{fullscreenRef.current=gameFullscreen},[gameFullscreen]);
 const toggleGameFullscreen=useCallback(async()=>{const root=gameRoot.current;if(!root)return;if(gameFullscreen){if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});setGameFullscreen(false);return}setGameFullscreen(true);if(root.requestFullscreen)await root.requestFullscreen().catch(()=>{});},[gameFullscreen]);
 useEffect(()=>{const sync=()=>{if(!document.fullscreenElement)setGameFullscreen(false)};document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync)},[]);
 const councilCenterpiece=useRef<HTMLDivElement>(null); const councilArt=useRef<HTMLDivElement>(null); const councilProjection=useRef<HTMLDivElement>(null); const councilRoom=useRef<import("livekit-client").Room|null>(null); const councilVideo=useRef<HTMLVideoElement>(null); const [councilConnected,setCouncilConnected]=useState(false); const [councilSharing,setCouncilSharing]=useState(false);
 const labels=useRef<HTMLDivElement>(null),workerNotice=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),panel=useRef<HTMLDivElement>(null),portalLabel=useRef<HTMLDivElement>(null);
 const arrivals=useRef<Map<string,number>>(new Map());const keys=useRef<Record<string,boolean>>({}),peerRef=useRef<Map<string,Player>>(new Map()),suitRef=useRef<Suit>("gold");
 const local=useRef<Player>({id:"",x:0,y:terrain(0,0),z:0,yaw:Math.PI/2,flying:false,boost:false,suit:"gold",seen:0});
 const combatChannel=useRef<{send:(args:{type:"broadcast";event:string;payload:unknown})=>Promise<unknown>}|null>(null);
 const projectiles=useRef<Array<{id:string;owner:string;x:number;y:number;z:number;vx:number;vy?:number;vz:number;life:number;power:number}>>([]); const lookPitch=useRef(0); const shootingPoseUntil=useRef(0);
 const recentDamage=useRef<{kind:"animal"|"blaster";at:number}[]>([]); const animalContact=useRef<Map<number,number>>(new Map()); const knockdownUntil=useRef(0); const damagedStructures=useRef<Map<string,number>>(new Map()); const structureHits=useRef<Map<string,{count:number;until:number}>>(new Map()); const BREAK_REPAIR_MS=300000; const lastShot=useRef(0); const autoFireTimer=useRef<ReturnType<typeof setInterval>|null>(null); const autoFirePointer=useRef<number|null>(null); const [downed,setDowned]=useState(false);
 const [meetingSeat,setMeetingSeat]=useState<number|null>(null); const meetingCamera=useRef({angle:0.65,distance:23,height:11}); const [selectedCouncilPlayer,setSelectedCouncilPlayer]=useState<string|null>(null); const meetingSeatRef=useRef<number|null>(null); const [meetingGesture,setMeetingGesture]=useState<"rest"|"hand"|"lean">("rest"); const [councilMembers,setCouncilMembers]=useState<Record<string,{name:string;gesture:string;joined:number}>>({}); const [councilChat,setCouncilChat]=useState<Array<{id:string;sender:string;text:string}>>([]); const [councilDraft,setCouncilDraft]=useState(""); const [councilChatOpen,setCouncilChatOpen]=useState(false); const councilJoined=useRef(false); const meetingGestureRef=useRef<"rest"|"hand"|"lean">("rest"); const [combatShop,setCombatShop]=useState(false); const [nearMainStreetShop,setNearMainStreetShop]=useState(false); useEffect(()=>{const timer=setInterval(()=>{const p=local.current;setNearMainStreetShop(!jurassicWorldRef.current&&!futureWorldRef.current&&!propheticWorldRef.current&&Math.hypot(p.x-20,p.z+590)<35)},450);return()=>clearInterval(timer)},[]); const [storeTab,setStoreTab]=useState<"store"|"loadout">("store"); const [boostLevel,setBoostLevel]=useState(1);const [combatXp,setCombatXp]=useState(5000);const [weapon,setWeapon]=useState("pulse");const [shield,setShield]=useState(false);const [shieldLevel,setShieldLevel]=useState(1);const [blasterLevel,setBlasterLevel]=useState(1);const [gameSettingsOpen,setGameSettingsOpen]=useState(false); const [chatAutoVisible,setChatAutoVisible]=useState(false); const chatAutoTimer=useRef<ReturnType<typeof setTimeout>|null>(null); const [chatClosing,setChatClosing]=useState(false); const showIncomingChat=useCallback(()=>{setChatClosing(false);setChatAutoVisible(true);if(chatAutoTimer.current)clearTimeout(chatAutoTimer.current);chatAutoTimer.current=setTimeout(()=>{setChatClosing(true);chatAutoTimer.current=setTimeout(()=>{setChatAutoVisible(false);setChatClosing(false)},350)},3000)},[]); useEffect(()=>()=>{if(chatAutoTimer.current)clearTimeout(chatAutoTimer.current)},[]);
 const [prayerMenuOpen,setPrayerMenuOpen]=useState(false);
 const [prayerPosture,setPrayerPosture]=useState<"ruku"|"sujud"|"sitting"|null>(null);
 const nearNabawi=local.current.world==="Time of Muhammad ﷺ"&&Math.hypot(local.current.x,local.current.z+475)<125;
 const togglePrayerPosture=(pose:"ruku"|"sujud"|"sitting")=>setPrayerPosture(current=>current===pose?null:pose);
 const [ownedWeapons,setOwnedWeapons]=useState<string[]>(["pulse"]);
 const fireShot=()=>{if(propheticWorldRef.current&&Math.hypot(local.current.x,local.current.z+475)<125)return;const now=performance.now();if(now-lastShot.current<380||now<knockdownUntil.current)return;lastShot.current=now;shootingPoseUntil.current=now+450;const p=local.current;const power=weapon==="titan"?4:weapon==="nova"||blasterLevel>=2?2:1;const shot={id:p.id+"-"+Math.floor(now),owner:p.id,x:p.x+Math.sin(p.yaw)*.7+Math.cos(p.yaw)*.62,y:p.y+1.75,z:p.z+Math.cos(p.yaw)*.7-Math.sin(p.yaw)*.62,vx:Math.sin(p.yaw)*Math.cos(lookPitch.current)*(weapon==="titan"?165:weapon==="nova"?120:90),vy:Math.sin(lookPitch.current)*(weapon==="titan"?165:weapon==="nova"?120:90),vz:Math.cos(p.yaw)*Math.cos(lookPitch.current)*(weapon==="titan"?165:weapon==="nova"?120:90),life:1.7,power};projectiles.current.push(shot);void combatChannel.current?.send({type:"broadcast",event:"shot",payload:shot});};
 const stopAutoFire=()=>{if(autoFireTimer.current!==null){clearInterval(autoFireTimer.current);autoFireTimer.current=null;}autoFirePointer.current=null;};
 useEffect(()=>()=>{if(autoFireTimer.current!==null)clearInterval(autoFireTimer.current)},[]);
 const [worldMapOpen,setWorldMapOpen]=useState(false);
 const [mapPlayer,setMapPlayer]=useState({x:0,z:0});
 useEffect(()=>{if(!worldMapOpen)return;const sync=()=>setMapPlayer({x:local.current.x,z:local.current.z});sync();const timer=window.setInterval(sync,350);return()=>window.clearInterval(timer)},[worldMapOpen]);
 useEffect(()=>{if(!worldMapOpen)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setWorldMapOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[worldMapOpen]);
 const [lobbyChatOpen,setLobbyChatOpen]=useState(false);
 const [lobbyChatDraft,setLobbyChatDraft]=useState("");
 const [lobbyChatMessages,setLobbyChatMessages]=useState<Array<{id:string;sender:string;text:string;time:number;mine:boolean}>>([]); const [chatClock,setChatClock]=useState(()=>Date.now()); useEffect(()=>{const timer=window.setInterval(()=>{const now=Date.now();setChatClock(now);setLobbyChatMessages(messages=>messages.filter(message=>message.time>=now-15*60*1000))},15000);return()=>window.clearInterval(timer)},[]); const visibleLobbyComments=lobbyChatMessages.filter(message=>message.time>=chatClock-15*60*1000);
 const chatLastSent=useRef(0);
 const sendLobbyChat=()=>{const msg=lobbyChatDraft.trim().slice(0,300);if(!msg||!online||performance.now()-chatLastSent.current<650)return;chatLastSent.current=performance.now();const p=local.current;const payload={id:p.id+"-"+Date.now(),sender:(p.name||"Guest").slice(0,30),text:msg,time:Date.now()};setLobbyChatMessages(a=>[...a.filter(message=>message.time>=Date.now()-15*60*1000).slice(-149),{...payload,mine:true}]);setLobbyChatDraft("");void combatChannel.current?.send({type:"broadcast",event:"lobby-chat",payload});};
 const [nearbyPlayers,setNearbyPlayers]=useState<Array<{id:string;userId?:string;name:string;feet:number}>>([]);const [selectedNearbyPlayer,setSelectedNearbyPlayer]=useState<string|null>(null);
 useEffect(()=>{const sync=()=>{const now=performance.now();const players=Array.from(peerRef.current.values()).filter(p=>now-p.seen<12000&&(p.world||"Today")===(local.current.world||"Today")).map(p=>({id:p.id,userId:p.userId,name:p.name||"Explorer",feet:distance(local.current,p)*3.28084})).filter(p=>p.feet<=50).sort((a,b)=>a.feet-b.feet).slice(0,5);setNearbyPlayers(players);if(selectedNearbyPlayer&&!players.some(p=>p.id===selectedNearbyPlayer&&p.feet<=5))setSelectedNearbyPlayer(null)};sync();const timer=window.setInterval(sync,700);return()=>window.clearInterval(timer)},[selectedNearbyPlayer]);
 const [suit,setSuit]=useState<Suit>("gold"),[online,setOnline]=useState(false),[peerCount,setPeerCount]=useState(0); const [guestListOpen,setGuestListOpen]=useState(false); const [guestFilter,setGuestFilter]=useState<"here"|"all">("here"); const [lobbyGuests,setLobbyGuests]=useState<Array<{id:string;name:string;world:string;userId?:string}>>([]); const [voiceInvite,setVoiceInvite]=useState<{fromId:string;fromUserId:string;name:string}|null>(null); const [voiceRequestTo,setVoiceRequestTo]=useState<string|null>(null); const peerVoiceTarget=useRef<string|null>(null);
 const propheticWorldRef=useRef(false); const [propheticWorld,setPropheticWorld]=useState(false); const enterPropheticWorld=()=>{futureWorldRef.current=false;setFutureWorld(false);local.current.world="Time of Muhammad ﷺ";propheticWorldRef.current=true;setPropheticWorld(true);setPicker(false);meetingSeatRef.current=null;setMeetingSeat(null);const p=local.current;p.x=0;p.z=115;p.y=1;p.yaw=Math.PI;p.flying=false;p.boost=false;setHint("Makkah circa 610 CE · Interpretive historical reconstruction");}; const exitPropheticWorld=()=>{propheticWorldRef.current=false;setPropheticWorld(false);local.current.world="Today";const p=local.current;p.x=0;p.z=0;p.y=terrain(0,0);p.yaw=Math.PI/2;p.flying=false;setHint("Returned to the main Games lobby.");};
 // Future is a selectable universe in this shared WebGL lobby, not a separate game.
 const jurassicWorldRef=useRef(false); const [jurassicWorld,setJurassicWorld]=useState(false);
 const enterJurassicWorld=()=>{futureWorldRef.current=false;setFutureWorld(false);propheticWorldRef.current=false;setPropheticWorld(false);jurassicWorldRef.current=true;setJurassicWorld(true);local.current.world="Jurassic";setPicker(false);setWorldMapOpen(false);const p=local.current;p.x=0;p.z=0;p.y=jurassicTerrain(0,0)+2;p.flying=false;p.boost=false;setHint("Jurassic World · Explore the prehistoric wilderness");};
 const exitJurassicWorld=()=>{jurassicWorldRef.current=false;setJurassicWorld(false);local.current.world="Today";const p=local.current;p.x=0;p.z=0;p.y=terrain(0,0);p.flying=false;setHint("Returned to the main Games lobby.");};
 const futureWorldRef=useRef(false);
 const [futureWorld,setFutureWorld]=useState(false);
 const enterFutureWorld=()=>{
  propheticWorldRef.current=false;setPropheticWorld(false);
  futureWorldRef.current=true;setFutureWorld(true);setPicker(false);setWorldMapOpen(false);
  meetingSeatRef.current=null;setMeetingSeat(null);
  plane.current.active=false;ship.current.active=false;moonModeRef.current={landed:false,walking:false};
  const p=local.current;p.world="Future";p.x=0;p.z=22;p.y=0;p.yaw=Math.PI;p.flying=false;p.boost=false;
  boostEnabled.current=false;setBoostActive(false);setFlying(false);setNearVehicle(null);
  setHint("🌌 Future City · Explore neon towers, hover traffic and skyways. Fly or boost to the elevated decks. Return via the cyan portal.");
 };
 const exitFutureWorld=()=>{
  futureWorldRef.current=false;setFutureWorld(false);setPicker(false);
  const p=local.current;p.world="Today";p.x=0;p.z=0;p.y=terrain(0,0);p.yaw=Math.PI/2;p.flying=false;p.boost=false;
  boostEnabled.current=false;setBoostActive(false);setFlying(false);
  setHint("↩ Returned from Future City to the shared 1Muslim Games lobby.");
 };
 const [live,setLive]=useState<Live|null>(null),[liveError,setLiveError]=useState(false),[picker,setPicker]=useState(false),[worldMessage,setWorldMessage]=useState("");
 const [error,setError]=useState(""),[hint,setHint]=useState("Explore the market road toward the portal; sky villages float beyond the city.");
 const [showInfo,setShowInfo]=useState(true);

 const plane=useRef({active:false,speed:0}); const ship=useRef({active:false,boostUntil:0,x:155,y:145,z:-27,inSpace:false,launchedAt:0,heading:Math.PI/2}); const moonModeRef=useRef({landed:false,walking:false});const [moonLanded,setMoonLanded]=useState(false);const [moonWalk,setMoonWalk]=useState(false);const [moonArrivalPrompt,setMoonArrivalPrompt]=useState(false); const [eva,setEva]=useState(false); const [shipOn,setShipOn]=useState(false); const [flightPhase,setFlightPhase]=useState("EARTH"); const [shipSettings,setShipSettings]=useState(false); const [missionControl,setMissionControl]=useState(false); const [missionMessage,setMissionMessage]=useState("");
 // The info timeout must read missionMessage only after its state declaration.
 useEffect(()=>{setShowInfo(true);const t=window.setTimeout(()=>setShowInfo(false),3000);return()=>window.clearTimeout(t)},[hint,missionMessage]); const evaFall=useRef({active:false,speed:0}); const [nearVehicle,setNearVehicle]=useState<"plane"|"car"|"helicopter"|"ship"|null>(null); const [shipMedia,setShipMedia]=useState(false); const [shipCamera,setShipCamera]=useState(false); const shipRoom=useRef<import("livekit-client").Room|null>(null); const [shipConnected,setShipConnected]=useState(false); const [shipCaptain,setShipCaptain]=useState(false); const [shipMuted,setShipMuted]=useState(false); const [shipPassengers,setShipPassengers]=useState(0); const [remoteShipMedia,setRemoteShipMedia]=useState(false); const shipRemoteVideo=useRef<HTMLVideoElement>(null); const shipVideo=useRef<HTMLVideoElement>(null); const shipStream=useRef<MediaStream|null>(null); const [piloting,setPiloting]=useState(false); const spaceEdgeSince=useRef<number|null>(null);const [spaceEdgeWarning,setSpaceEdgeWarning]=useState(false); const [flying,setFlying]=useState(false); const [boostActive,setBoostActive]=useState(false); const boostUntil=useRef(0); const boostEnabled=useRef(false); const [workerMessage,setWorkerMessage]=useState(false); const [showFlyTutorial,setShowFlyTutorial]=useState(false); const voiceRoom=useRef<import("livekit-client").Room|null>(null); const voiceTracks=useRef<Map<string,HTMLAudioElement>>(new Map()); const [audioMode,setAudioMode]=useState<"off"|"proximity"|"all">("off"); const [voiceOn,setVoiceOn]=useState(false); const [proximityMicEnabled,setProximityMicEnabled]=useState(false); const [proximitySpeaking,setProximitySpeaking]=useState(false); const [audioRoomLocked,setAudioRoomLocked]=useState(false);
 useEffect(()=>{try{localStorage.setItem("1muslim:game-audio-room-active",audioRoomLocked&&voiceOn?"1":"0");window.dispatchEvent(new Event("1muslim:game-audio-room-change"))}catch{}return()=>{try{localStorage.setItem("1muslim:game-audio-room-active","0");window.dispatchEvent(new Event("1muslim:game-audio-room-change"))}catch{}}},[audioRoomLocked,voiceOn]); const [voiceBusy,setVoiceBusy]=useState(false); const [speakerEnabled,setSpeakerEnabled]=useState(true); const [micPermissionError,setMicPermissionError]=useState(""); const [voicePreference,setVoicePreference]=useState(false); useEffect(()=>{try{setVoicePreference(localStorage.getItem("1muslim:game-voice-opt-in")==="1")}catch{}},[]); const gesture=useRef({lastTap:0,downAt:0,hold:false}); const [crashed,setCrashed]=useState(false); const flightPose=useRef({takeoff:0,landing:0}); const [emote,setEmote]=useState<"none"|"wave"|"pose"|"celebrate"|"hand">("none"); const emoteUntil=useRef(0);
 const [stickPosition,setStickPosition]=useState({x:0,y:0});
 const stickPointer=useRef<number|null>(null);
 const analogMovement=useRef({x:0,y:0});
 const moveStick=(e:React.PointerEvent<HTMLDivElement>)=>{if(stickPointer.current!==e.pointerId)return;const b=e.currentTarget.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(e.clientX-(b.left+b.width/2))/(b.width*.36)));const y=Math.max(-1,Math.min(1,(e.clientY-(b.top+b.height/2))/(b.height*.36)));const length=Math.hypot(x,y);const nx=length>1?x/length:x,ny=length>1?y/length:y;setStickPosition({x:nx,y:ny});analogMovement.current={x:nx,y:ny};keys.current.w=ny<-.22;keys.current.s=ny>.22;keys.current.a=nx<-.22;keys.current.d=nx>.22;};
 const releaseStick=(e:React.PointerEvent<HTMLDivElement>)=>{if(stickPointer.current!==e.pointerId)return;stickPointer.current=null;analogMovement.current={x:0,y:0};setStickPosition({x:0,y:0});for(const k of ["w","a","s","d"])keys.current[k]=false;try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}};
 const setKey=(k:string,on:boolean)=>{keys.current[k]=on};
 const activateBoost=()=>{boostEnabled.current=!boostEnabled.current;setBoostActive(boostEnabled.current)};
 const leaveShipAudio=async()=>{const room=shipRoom.current;shipRoom.current=null;setShipConnected(false);setShipCaptain(false);setShipPassengers(0);setRemoteShipMedia(false);shipStream.current?.getTracks().forEach(t=>t.stop());shipStream.current=null;setShipMedia(false);if(room)await room.disconnect();};
 const joinCouncilMedia=async()=>{if(councilRoom.current)return;try{const res=await fetch("/api/game-voice/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"council"})});const info=await res.json();if(!res.ok)throw Error(info.error||"Meeting unavailable");const {Room,RoomEvent,Track}=await import("livekit-client");const room=new Room({adaptiveStream:true,dynacast:true});const attach=(track:import("livekit-client").RemoteTrack)=>{if(track.kind===Track.Kind.Video&&councilVideo.current){track.attach(councilVideo.current);setCouncilSharing(true)}};room.on(RoomEvent.TrackSubscribed,(track,pub)=>{if(pub.source===Track.Source.ScreenShare)attach(track)});room.on(RoomEvent.TrackUnsubscribed,(track,pub)=>{if(pub.source===Track.Source.ScreenShare){track.detach();setCouncilSharing(false)}});room.on(RoomEvent.Disconnected,()=>{setCouncilConnected(false);setCouncilSharing(false);councilRoom.current=null});await room.connect(info.url,info.token);councilRoom.current=room;setCouncilConnected(true);for(const p of room.remoteParticipants.values())for(const pub of p.trackPublications.values())if(pub.source===Track.Source.ScreenShare&&pub.track)attach(pub.track as import("livekit-client").RemoteTrack)}catch(e){setHint(e instanceof Error?e.message:"Meeting connection failed")}};
 const shareCouncilScreen=async()=>{try{if(!councilRoom.current)await joinCouncilMedia();const room=councilRoom.current;if(!room)return;await room.localParticipant.setScreenShareEnabled(true);const pub=Array.from(room.localParticipant.trackPublications.values()).find(p=>p.source==="screen_share");if(pub?.track&&councilVideo.current){pub.track.attach(councilVideo.current);setCouncilSharing(true)}}catch(e){setHint(e instanceof Error?e.message:"Screen sharing unavailable")}};
 const stopCouncilScreen=async()=>{await councilRoom.current?.localParticipant.setScreenShareEnabled(false);setCouncilSharing(false)};
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
 const landOnMoon=()=>{moonModeRef.current={landed:true,walking:true};ship.current.active=false;ship.current.inSpace=false;setShipOn(false);setMoonArrivalPrompt(false);setMoonLanded(true);setMoonWalk(true);setEva(false);const p=local.current;p.x=0;p.z=15;p.y=0;p.flying=false;setFlying(false);setHint("🌕 Moon landing complete. Explore the settlement and rooftop observatory.");};
 const declineMoonWalk=()=>{setMoonArrivalPrompt(false);setHint("🌕 Remaining aboard. Open the landing invitation when ready.");};
 const exitShip=()=>{moonModeRef.current={landed:false,walking:false};setMoonLanded(false);setMoonWalk(false);setMoonArrivalPrompt(false);void leaveShipAudio();setEva(false);ship.current.inSpace=false;ship.current.active=false;setShipOn(false);ship.current.boostUntil=0;setShipMedia(false);shipStream.current?.getTracks().forEach(t=>t.stop());shipStream.current=null;setShipCamera(false);const p=local.current;p.x=155;p.z=-27;p.y=4;p.flying=false;setFlying(false);setHint("Returned to the spaceport.");};
 const leaveShipInSpace=()=>{if(!ship.current.active)return;ship.current.inSpace=true;setShipOn(false);setEva(true);evaFall.current={active:false,speed:0};const p=local.current;p.x=ship.current.x;p.y=ship.current.y;p.z=ship.current.z+13;p.flying=true;setFlying(true);setHint("SPACEWALK · WASD drift · SPACE rise · C descend · return within 22m of shuttle to reboard.");};
 const reboardShip=()=>{const p=local.current;if(!eva||Math.hypot(p.x-ship.current.x,p.y-ship.current.y,p.z-ship.current.z)>24)return;ship.current.inSpace=true;setEva(false);setShipOn(true);p.x=ship.current.x;p.y=ship.current.y;p.z=ship.current.z;p.flying=true;setHint("Back aboard. Pilot controls restored.");};
 const boardShip=()=>{moonModeRef.current={landed:false,walking:false};setMoonLanded(false);setMoonWalk(false);setMoonArrivalPrompt(false);void joinShipAudio();const p=local.current;if(Math.hypot(p.x-155,p.z+27)>23||p.y>20){setHint("Approach the spaceport to board the ship.");return;}plane.current.active=false;setPiloting(false);ship.current.inSpace=true;ship.current.x=155;ship.current.y=8;ship.current.z=-27;ship.current.launchedAt=performance.now();ship.current.heading=Math.PI/2;ship.current.active=true;setFlightPhase("LAUNCH");setMissionControl(false);setShipOn(true);p.x=155;p.y=145;p.z=-27;p.yaw=Math.PI/2;p.flying=true;setFlying(true);setHint("Mission launch · Earth to Moon in 20 seconds.");};
 const startShipMedia=async(kind:"camera"|"screen")=>{try{shipStream.current?.getTracks().forEach(t=>t.stop());const stream=kind==="camera"?await navigator.mediaDevices.getUserMedia({video:true,audio:false}):await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});shipStream.current=stream;if(shipRoom.current){if(kind==="camera"){await shipRoom.current.localParticipant.setCameraEnabled(true);}else{await shipRoom.current.localParticipant.setScreenShareEnabled(true);}}setShipMedia(true);setShipCamera(kind==="camera");if(shipVideo.current){shipVideo.current.srcObject=stream;void shipVideo.current.play().catch(()=>{});}stream.getVideoTracks()[0]?.addEventListener("ended",()=>{setShipMedia(false);setShipCamera(false);shipStream.current=null;});}catch{setHint("Camera or screen sharing permission was not granted.");}};
 const togglePlane=()=>{const p=local.current;if(plane.current.active){plane.current.active=false;plane.current.speed=0;setPiloting(false);p.flying=false;setFlying(false);setHint("You exited the aircraft.");return;}if(Math.hypot(p.x-110,p.z+345)>19||p.y>8){setHint("Approach the aircraft at the airport runway to board.");return;}plane.current.active=true;plane.current.speed=0;p.x=110;p.z=-345;p.y=3;p.yaw=Math.PI/2;p.flying=true;setFlying(true);setPiloting(true);setHint("Aircraft boarded! W/▲ accelerate, S/▼ brake, A/D steer, SPACE climb, C descend, E exit.");};
 const toggleFly=useCallback(()=>{if(moonModeRef.current.walking){setHint("🌕 Lunar exploration uses walking and low-gravity jumps.");return;}const p=local.current;p.flying=!p.flying;setFlying(p.flying);if(p.flying){flightPose.current.takeoff=performance.now();p.y=Math.max(p.y,terrain(p.x,p.z)+1.3)}else flightPose.current.landing=performance.now()},[]);
 useEffect(()=>{try{const stored=localStorage.getItem("1muslim-game-suit");const s=validSuit(stored);suitRef.current=s;local.current.suit=s;setSuit(s)}catch{}},[]);
 useEffect(()=>{try{if(localStorage.getItem("1muslim-fly-gesture-seen-v1"))return;localStorage.setItem("1muslim-fly-gesture-seen-v1","1")}catch{}setShowFlyTutorial(true);const timer=window.setTimeout(()=>setShowFlyTutorial(false),3600);return()=>window.clearTimeout(timer)},[]);
 const changeSuit=(s:Suit)=>{setSuit(s);suitRef.current=s;local.current.suit=s;try{localStorage.setItem("1muslim-game-suit",s)}catch{}};
 useEffect(()=>{
  const db=createClient();let active=true;
  const refresh=async()=>{try{const {data,error}=await db.from("live_streams").select("id,title,room_name").eq("status","live").eq("visibility","public").gte("last_heartbeat_at",new Date(Date.now()-45000).toISOString()).order("viewer_count",{ascending:false}).limit(1);if(!active)return;setLiveError(!!error);setLive(!error&&data?.length?{id:data[0].id,title:data[0].title||"1Muslim Live",room_name:data[0].room_name}:null)}catch{if(active){setLiveError(true);setLive(null)}}};
 void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh()},15000);return()=>{active=false;clearInterval(timer)};
 },[]);
 useEffect(()=>{
  const db=createClient();const id=typeof crypto!=="undefined"&&"randomUUID"in crypto?crypto.randomUUID():String(Date.now())+Math.random();
  local.current.id=id;void db.auth.getUser().then(({data})=>{if(active){local.current.userId=data.user?.id;local.current.name=String(data.user?.user_metadata?.full_name||data.user?.user_metadata?.username||"Explorer").slice(0,30);if(channel.state==="joined")void channel.track({id,suit:suitRef.current,name:local.current.name,world:local.current.world||"Today",userId:local.current.userId})}});let active=true;const channel=db.channel("1muslim-shared-game-lobby-v1",{config:{presence:{key:id},broadcast:{self:false}}});
  combatChannel.current=channel;
  const sync=()=>{if(!active)return;const present=new Set<string>();const guests=new Map<string,{id:string;name:string;world:string;userId?:string}>();for(const values of Object.values(channel.presenceState()))for(const entry of values as Array<{id?:string;suit?:string;name?:string;world?:string;userId?:string}>){if(typeof entry.id==="string"&&entry.id!==id){present.add(entry.id);guests.set(entry.id,{id:entry.id,name:typeof entry.name==="string"&&entry.name.trim()&&entry.name!=="Explorer"?entry.name.trim().slice(0,30):"Guest",world:typeof entry.world==="string"?entry.world:"Today",userId:typeof entry.userId==="string"?entry.userId:undefined})}};for(const k of peerRef.current.keys())if(!present.has(k))peerRef.current.delete(k);setPeerCount(present.size);setLobbyGuests([...guests.values()])};
  channel.on("broadcast",{event:"voice-invite"},({payload})=>{const p=payload as {fromId?:string;fromUserId?:string;toId?:string;name?:string};if(!active||p?.toId!==id||typeof p.fromId!=="string"||typeof p.fromUserId!=="string"||!local.current.userId||p.fromUserId===local.current.userId)return;setVoiceInvite({fromId:p.fromId,fromUserId:p.fromUserId,name:typeof p.name==="string"?p.name.slice(0,30):"Guest"})});
  channel.on("broadcast",{event:"voice-reply"},({payload})=>{const p=payload as {toId?:string;fromUserId?:string;accepted?:boolean};if(!active||p?.toId!==id)return;setVoiceRequestTo(null);if(p.accepted&&typeof p.fromUserId==="string"){peerVoiceTarget.current=p.fromUserId;setHint("Voice invitation accepted. Tap the top microphone to connect.")}else setHint("Voice request declined.")});
  channel.on("broadcast",{event:"council-state"},({payload})=>{const p=payload as {id?:string;name?:string;gesture?:string;joined?:boolean};if(!active||!p||typeof p.id!=="string"||p.id===id||p.id.length>120)return;setCouncilMembers(old=>{const next={...old};if(p.joined===false)delete next[p.id!];else next[p.id!]={name:String(p.name||"Guest").slice(0,30),gesture:["rest","hand","lean"].includes(String(p.gesture))?String(p.gesture):"rest",joined:next[p.id!]?.joined||Date.now()};return next});});
  channel.on("broadcast",{event:"council-chat"},({payload})=>{const p=payload as {id?:string;sender?:string;text?:string};if(!active||typeof p?.id!=="string"||typeof p.text!=="string"||typeof p.sender!=="string")return;const msg=p.text.trim().slice(0,300);if(!msg)return;setCouncilChat(old=>old.some(m=>m.id===p.id)?old:[...old.slice(-99),{id:p.id,sender:p.sender!.slice(0,30),text:msg}]);});
  channel.on("broadcast",{event:"council-sync-request"},()=>{if(active&&meetingSeatRef.current!==null)void channel.send({type:"broadcast",event:"council-state",payload:{id,name:local.current.name||"Guest",gesture:meetingGestureRef.current,joined:true}})});
  channel.on("broadcast",{event:"lobby-chat"},({payload})=>{if(!active||!payload||typeof payload.id!=="string"||typeof payload.sender!=="string"||typeof payload.text!=="string")return;const msg=payload.text.trim().slice(0,300);if(!msg||msg.length>300||payload.id.length>120)return;const sender=payload.sender.slice(0,30);setLobbyChatMessages(a=>a.some(m=>m.id===payload.id)?a:[...a.filter(m=>m.time>=Date.now()-15*60*1000).slice(-149),{id:payload.id,sender,text:msg,time:Date.now(),mine:false}]);showIncomingChat();});
  channel.on("broadcast",{event:"structure-break"},({payload})=>{const data=payload as {id?:string;until?:number;hits?:number};if(!active||!data||typeof data.id!=="string"||!/^prop-([0-9]|[1-7][0-9])$/.test(data.id)||typeof data.until!=="number")return;const expiry=Math.min(Date.now()+300000,Math.max(Date.now(),data.until));const hits=Math.max(1,Math.min(5,Math.floor(data.hits??5)));structureHits.current.set(data.id,{count:hits,until:expiry});if(hits>=5)damagedStructures.current.set(data.id,expiry);});
   channel.on("broadcast",{event:"shot"},({payload})=>{const s=payload as {id?:string;owner?:string;x?:number;y?:number;z?:number;vx?:number;vy?:number;vz?:number;life?:number;power?:number};if(!s||typeof s.id!=="string"||typeof s.owner!=="string"||![s.x,s.y,s.z,s.vx,s.vz].every(v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<1000000))return;if(s.owner===local.current.id)return;projectiles.current.push({id:s.id,owner:s.owner,x:s.x!,y:s.y!,z:s.z!,vx:s.vx!,vy:typeof s.vy==="number"&&Number.isFinite(s.vy)?s.vy:0,vz:s.vz!,life:1.7,power:s.power===2?2:1});});
  channel.on("presence",{event:"sync"},sync).on("broadcast",{event:"move"},({payload})=>{if(!active||!payload||payload.id===id||typeof payload.id!=="string")return;const p=payload as Player;if(![p.x,p.y,p.z,p.yaw].every(v=>typeof v==="number"&&Number.isFinite(v)&&Math.abs(v)<10000))return;if(!peerRef.current.has(p.id))arrivals.current.set(p.id,performance.now());peerRef.current.set(p.id,{id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:!!p.flying,boost:!!p.boost,suit:validSuit(p.suit),world:typeof p.world==="string"?p.world:"Today",userId:typeof p.userId==="string"?p.userId:undefined,name:typeof p.name==="string"?p.name.slice(0,30):"Explorer",seen:performance.now()})});
  channel.subscribe(status=>{if(!active)return;setOnline(status==="SUBSCRIBED");if(status==="SUBSCRIBED")void channel.track({id,suit:suitRef.current,name:local.current.name,world:local.current.world||"Today"})});
  let lastPresenceWorld="";const send=setInterval(()=>{if(!active||channel.state!=="joined"||document.visibilityState!=="visible")return;const p=local.current;if((p.world||"Today")!==lastPresenceWorld){lastPresenceWorld=p.world||"Today";void channel.track({id,suit:suitRef.current,name:p.name||"Guest",world:lastPresenceWorld,userId:p.userId})}void channel.send({type:"broadcast",event:"move",payload:{id,x:p.x,y:p.y,z:p.z,yaw:p.yaw,flying:p.flying,boost:p.boost,userId:p.userId,name:p.name,suit:suitRef.current,world:p.world||"Today"}})},120);
  return()=>{active=false;combatChannel.current=null;clearInterval(send);void db.removeChannel(channel);peerRef.current.clear();arrivals.current.clear()};
 },[]);
 useEffect(()=>{
  const node=canvas.current;if(!node)return;
  let renderer:ReturnType<typeof makeRenderer>;
  try{renderer=makeRenderer(node)}catch(e){setError(e instanceof Error?e.message:"WebGL initialization failed");return}
  if(!renderer){setError("WebGL is unavailable on this device.");return}
  const {gl,draw}=renderer;let frame=0,prev=performance.now(),velocity=0,wasNear=false,crashUntil=0;
  let chaseCamera:[number,number,number]|null=null;
  const render=(now:number)=>{
   const dt=clamp((now-prev)/1000,0,.05);prev=now;
   const p=local.current,k=keys.current;
   // Recenter vertical look toward eye level only while the player is moving.
   // Pause recentering while actively dragging to aim, and ease without snapping.
   const walking=k.w||k.a||k.s||k.d;
   if(walking&&!drag.current&&Math.abs(lookPitch.current)>0.0005){
    const ease=1-Math.exp(-1.35*dt);
    lookPitch.current*=1-ease;
    if(Math.abs(lookPitch.current)<0.0005)lookPitch.current=0;
   }
   if(jurassicWorldRef.current){updateJurassicDinos(dt,now,p,()=>{p.x=0;p.z=0;p.y=jurassicTerrain(0,0)+2;p.flying=false;setHint("🦖 Dinosaur attack! Respawned in Jurassic World.");});for(const shot of projectiles.current){if(shot.life>0&&hitJurassicApex(now,shot.x,shot.z,shot.y)){shot.life=0;}}}
   if(meetingSeatRef.current!==null){const a=meetingSeatRef.current*Math.PI/6;p.x=-125+Math.cos(a)*15;p.z=-120+Math.sin(a)*15;p.y=45;p.yaw=a+Math.PI;p.flying=false;p.boost=false;}
   const damage=(kind:"animal"|"blaster")=>{if(meetingSeatRef.current!==null)return;recentDamage.current=recentDamage.current.filter(hit=>now-hit.at<=10000);recentDamage.current.push({kind,at:now});if(recentDamage.current.filter(hit=>hit.kind===kind).length>=3){recentDamage.current=[];p.x=0;p.z=0;p.y=terrain(0,0)+1;p.flying=false;p.boost=false;setDowned(false);knockdownUntil.current=now+2000;setHint(kind==="animal"?"🐾 Three animal attacks — respawned!":"💥 Three blaster hits — respawned!");}else setHint(`${kind==="animal"?"🐾 Animal attack":"💥 Blaster hit"} — ${recentDamage.current.filter(hit=>hit.kind===kind).length}/3 strikes in 10 seconds`);};
   for(const [id,until] of damagedStructures.current)if(Date.now()>=until)damagedStructures.current.delete(id);for(const [id,damage] of structureHits.current)if(Date.now()>=damage.until)structureHits.current.delete(id);
   for(const shot of projectiles.current){shot.x+=shot.vx*dt;shot.y+=(shot.vy??0)*dt;shot.z+=shot.vz*dt;shot.life-=dt;if(shot.owner!==p.id&&now>knockdownUntil.current&&Math.hypot(shot.x-p.x,shot.z-p.z)<1.3&&Math.abs(shot.y-(p.y+1.4))<2.2){shot.life=0;const incomingYaw=Math.atan2(-shot.vx,-shot.vz);const facingDifference=Math.atan2(Math.sin(incomingYaw-p.yaw),Math.cos(incomingYaw-p.yaw));const guarded=shield&&Math.abs(facingDifference)<=Math.PI*.3&&(shieldLevel>=2||shot.power<2);if(!guarded){damage("blaster");}else setHint("🛡️ Shield absorbed the shot.");}}
   projectiles.current=projectiles.current.filter(s=>s.life>0);
   // Deterministic dangerous wildlife, shared by all clients without per-frame networking.
   if(!jurassicWorldRef.current&&!futureWorldRef.current&&!propheticWorldRef.current&&!moonModeRef.current.landed&&!ship.current.active&&meetingSeatRef.current===null&&p.y<terrain(p.x,p.z)+3){for(let i=0;i<30;i++){const ax=Math.sin(i*83.17)*650,az=Math.cos(i*41.83)*650;if(Math.hypot(p.x-ax,p.z-az)>2.8||now-(animalContact.current.get(i)??0)<1200)continue;animalContact.current.set(i,now);damage("animal");break;}}

   if(downed&&now>=knockdownUntil.current)setDowned(false);
   for(const [identity,el] of voiceTracks.current){const peer=Array.from(peerRef.current.values()).find(other=>other.userId===identity&&now-other.seen<12000&&(other.world||"Today")===(p.world||"Today"));const feet=peer?distance(p,peer)*3.28084:Infinity;el.volume=audioRoomLocked?1:feet<=200?1:feet<=300?1-(feet-200)*.005:feet<=400?.5-(feet-300)*.005:0;}
   const stick=stickPointer.current!==null?analogMovement.current:null;
   const moving=now<knockdownUntil.current?0:stick?-stick.y:Number(!!(k.w||k.ArrowUp))-Number(!!(k.s||k.ArrowDown));
   const strafing=now<knockdownUntil.current?0:stick?-stick.x:Number(!!(k.a||k.ArrowLeft))-Number(!!(k.d||k.ArrowRight));
   const lunar=moonModeRef.current.walking;
   const mag=Math.max(1,Math.hypot(moving,strafing));const boosted=boostEnabled.current;const speed=ship.current.active||plane.current.active?0:eva?5.5:lunar?(boosted?11:4.8):p.flying?(boosted?49.5:16.5)*(p.y>85?1.5:1):(boosted?16.5:k.Shift?9:5.5);
   if(lunar)p.flying=false;
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
     if(elapsed>=9)setFlightPhase(elapsed<20?"DEEP SPACE":elapsed<40?"LUNAR APPROACH":"SOLAR WARNING");if(elapsed>=20&&!moonArrivalPrompt&&!moonLanded){setMoonArrivalPrompt(true);setFlightPhase("MOON ORBIT · LANDING READY");ship.current.active=false;setShipOn(true);setHint("🌕 Lunar landing available. Choose Yes or No.");}
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
   const travelBounds=lunar?MOON_BOUNDS:jurassicWorldRef.current?{minX:-JURASSIC_LIMIT,maxX:JURASSIC_LIMIT,minZ:-JURASSIC_LIMIT,maxZ:JURASSIC_LIMIT}:futureWorldRef.current?FUTURE_BOUNDS:propheticWorldRef.current?{minX:-700,maxX:700,minZ:-700,maxZ:700}:EXPLORATION_BOUNDS;
   const proposedX=eva?p.x+dx*speed*dt:clamp(p.x+dx*speed*dt,travelBounds.minX,travelBounds.maxX),proposedZ=eva?p.z+dz*speed*dt:clamp(p.z+dz*speed*dt,travelBounds.minZ,travelBounds.maxZ);
   // Physical collision volumes mirror the town, tunnels and distant showroom.
   // A player's feet are p.y; their body extends about 1.8 world units upward.
   const solids:{x:number;z:number;hx:number;hz:number;bottom:number;top:number}[]=[]; 
   if(propheticWorldRef.current){for(let i=0;i<84;i++){const col=i%12,row=Math.floor(i/12),x=(col-5.5)*42,z=(row-3)*53;if(Math.abs(x)<44&&Math.abs(z)<44)continue;const h=3.1;solids.push({x,z,hx:11,hz:13,bottom:-1,top:h});}}
   if(propheticWorldRef.current){for(let i=0;i<44;i++){const col=i%11,row=Math.floor(i/11),x=(col-5)*36,z=-380-row*40;if(Math.abs(x)<30)continue;solids.push({x,z,hx:11,hz:12,bottom:-1,top:3.5});}}
   if(!futureWorldRef.current&&!jurassicWorldRef.current){
   // Destructible plaza props are solid until hit; the same objects restore after five minutes.
   for(let i=0;i<80;i++){const x=12+(i%20)*5,z=(Math.floor(i/20)-1.5)*24;const id="prop-"+i;if(damagedStructures.current.has(id))continue;solids.push({x,z,hx:1.35,hz:1.35,bottom:0,top:2.7});}
   for(let i=0;i<80;i++){const x=12+(i%20)*5,z=(Math.floor(i/20)-1.5)*24;const id="prop-"+i;if(damagedStructures.current.has(id))continue;for(const shot of projectiles.current){if(shot.life<=0||Math.abs(shot.x-x)>1.6||Math.abs(shot.z-z)>1.6||shot.y>3.5)continue;shot.life=0;const until=Date.now()+BREAK_REPAIR_MS;const hits=Math.min(5,(structureHits.current.get(id)?.count??0)+(shot.power>=4?3:shot.power>=2?2:1));structureHits.current.set(id,{count:hits,until});if(hits>=5)damagedStructures.current.set(id,until);void combatChannel.current?.send({type:"broadcast",event:"structure-break",payload:{id,until,hits}});break;}}
 for(const z of [-49,49])solids.push({x:161,z,hx:29,hz:3,bottom:0,top:17});solids.push({x:189,z:0,hx:3,hz:52,bottom:0,top:17});for(const z of [-35,35])solids.push({x:133,z,hx:3,hz:15,bottom:0,top:17});
   for(let x=5;x<85;x+=14)for(const side of [-1,1]){
     const z=side*15,height=5+(Math.floor(x/14)%3)*2;
     solids.push({x,z,hx:3.7,hz:3.2,bottom:0,top:height+.9});
     solids.push({x:x+4,z:z-side*5,hx:1.35,hz:1.1,bottom:0,top:2});
   }
   for(let x=235;x<=285;x+=12)for(const side of [-1,1])solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:0,top:6.1});
   for(let x=1090;x<=1140;x+=12)for(const side of [-1,1])solids.push({x,z:side*5.5,hx:6.1,hz:.48,bottom:25,top:31.1});
   for(const x of [1155,1174,1190])for(const z of [-13,13])solids.push({x,z,hx:3.1,hz:1.8,bottom:25,top:27.6});
   // Satellite district buildings: mirror the actual rendered footprints, including ground-floor walls.
   for(let i=0;i<46;i++){const row=Math.floor(i/8),col=i%8,x=-90+col*27,z=-625-row*42,h=7+((i*13)%19);solids.push({x,z,hx:7,hz:8,bottom:terrain(x,z)-.5,top:h+.55});}
   // Outer avenue mountain walls and elevated ridges are physical rather than decorative.
   for(let n=0;n<25;n++){const z=-620-n*34;for(const side of [-1,1]){const x=side*(110+n*6),height=18+Math.abs(Math.sin(n*2.3))*37;solids.push({x,z,hx:26,hz:24,bottom:-1,top:height});}}
   // Trees, trunks and arena occupy real world volumes.
   for(let i=0;i<75;i++){const x=-180+(i*47)%365,z=-580-(i*31)%380;solids.push({x,z,hx:.45,hz:.45,bottom:0,top:4.6});}
   solids.push({x:180,z:-780,hx:48,hz:39,bottom:0,top:15});
   // Upper city tower volumes are solid above their open walk-through lobbies.
   for(let row=0;row<4;row++)for(let col=0;col<6;col++){
     const x=-120+col*37,z=-380-row*38,h=19+((row*7+col*11)%7)*12;
     solids.push({x,z,hx:11,hz:11.5,bottom:0,top:h+.8});
   }
   }
   // Block side penetration and reflect travel away from the struck surface.
   // Roofs remain solid landing surfaces, so players cannot fall through buildings.
   let struck=false,roof=-Infinity;
   for(const b of plane.current.active||ship.current.active||eva||lunar||meetingSeatRef.current!==null?[]:futureWorldRef.current?FUTURE_TOWERS.map(t=>({x:t.x,z:t.z,hx:t.width/2,hz:t.depth/2,bottom:-1,top:t.height})):propheticWorldRef.current?solids.slice(0,128):solids){
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
   else if(struck){ // Small, damped rebound rather than teleporting or sticking to a wall.
     p.x=clamp(p.x-dx*Math.min(.6,speed*dt*.45),travelBounds.minX,travelBounds.maxX);
     p.z=clamp(p.z-dz*Math.min(.6,speed*dt*.45),travelBounds.minZ,travelBounds.maxZ);
     crashUntil=now+260;setCrashed(true);
   }
   p.boost=boosted; 
   const cityRoof=p.z<=-365&&p.z>=-515&&p.x>=-132&&p.x<=75;
   const skyLanding=p.x>-163&&p.x<-87&&p.z>-158&&p.z<-82&&p.y>=43&&velocity<=0;const onRoad=p.x>=205&&p.x<=1200&&Math.abs(p.z)<7;const bridgeHeight=p.x<290?0:p.x<330?(p.x-290)*.625:25;const roadFloor=jurassicWorldRef.current?jurassicTerrain(p.x,p.z):futureWorldRef.current||propheticWorldRef.current?0:onRoad?bridgeHeight:terrain(p.x,p.z);const floor=Math.max(futureWorldRef.current?futureSkywayFloor(p.x,p.y,p.z):skyLanding?45:roadFloor,roof,roadFloor);
   if(!jurassicWorldRef.current&&!futureWorldRef.current&&!propheticWorldRef.current&&!lunar&&!eva&&!ship.current.inSpace&&p.x>330&&p.y<25-30.48){p.x=0;p.z=0;p.y=terrain(0,0);p.yaw=Math.PI/2;p.flying=false;velocity=0;boostUntil.current=0;setFlying(false);setHint("You fell 100 feet beneath the space bridge and respawned at the beginning.");}
   if(eva){p.flying=true;const fall=evaFall.current;const thrust=(k.Space||k.ascend?1:0)-(k.c?1:0);if(p.y<1300)fall.active=true;if(fall.active){fall.speed=clamp(fall.speed+20*dt-thrust*8*dt,0,145);p.y-=fall.speed*dt;if(p.y<=Math.max(terrain(p.x,p.z),0)+2){p.y=Math.max(terrain(p.x,p.z),0)+2;setEva(false);setFlying(false);ship.current.inSpace=false;fall.active=false;setHint("🌍 Atmospheric re-entry complete. You landed back on Earth.");}}else p.y+=thrust*5.5*dt;}else if(ship.current.active){p.flying=true;}else if(plane.current.active){
     const takeoff=plane.current.speed>24;
     const climb=takeoff&&!!(k.Space||k.ascend),descend=!!k.c;
     p.y=clamp(p.y+(climb?12:descend?-10:p.y>4?-.8:0)*dt,3,180);
     p.flying=true;
   }else if(lunar){
     // Moon gravity is approximately one sixth of the Earth game gravity.
     // Keep feet on the lunar terrain and allow a floaty jump without changing Earth physics.
     if((k.Space||k.ascend)&&p.y<=.07){velocity=4.6;k.Space=false;k.ascend=false;}
     velocity-=2.83*dt;
     p.y=Math.max(0,p.y+velocity*dt);
     if(p.y<=0&&velocity<0)velocity=0;
   }else if(p.flying){const ascend=!!(k.Space||k.ascend);const descend=!!k.c;velocity=clamp(velocity+(ascend?(p.y>85?19.5:13):descend?-19:-5)*dt,-22,p.y>85?10.5:7);p.y=clamp(p.y+velocity*dt,floor,170);if(p.y<=floor+.03){if(velocity< -11){crashUntil=now+1300;setCrashed(true)}p.y=floor;p.flying=false;setFlying(false);flightPose.current.landing=now;velocity=0}}
   else{if(crashUntil&&now>crashUntil){crashUntil=0;setCrashed(false)}velocity-=17*dt;if(k.Space&&p.y<=floor+.07){velocity=7.2;k.Space=false}p.y+=velocity*dt;if(p.y<floor){p.y=floor;velocity=0}}
   if(!lunar&&!ship.current.active&&!plane.current.active&&!eva&&p.flying&&p.y>=169.8){if(spaceEdgeSince.current===null){spaceEdgeSince.current=now;setSpaceEdgeWarning(true);setHint("⚠️ EDGE OF SPACE — return below the boundary within 2 seconds!");}else if(now-spaceEdgeSince.current>=2000){p.x=0;p.z=0;p.y=Math.max(terrain(0,0),0)+2;p.flying=false;velocity=0;boostUntil.current=0;spaceEdgeSince.current=null;setSpaceEdgeWarning(false);setFlying(false);setHint("🌍 Space boundary reached. Respawned safely.");}}else if(spaceEdgeSince.current!==null){spaceEdgeSince.current=null;setSpaceEdgeWarning(false);}
   const nearest=futureWorldRef.current||propheticWorldRef.current||lunar||ship.current.inSpace||plane.current.active?null:distance(p,{x:155,z:-27})<23?"ship":distance(p,{x:110,z:-345})<19?"plane":distance(p,{x:155,z:-27})<30?"helicopter":distance(p,{x:15,z:7.5})<13?"car":null;
   if(nearVehicle!==nearest)setNearVehicle(nearest);
   const nearWorker=!futureWorldRef.current&&!propheticWorldRef.current&&!lunar&&distance(p,{x:152,z:0})<5;if(nearWorker&&!workerNotice.current){workerNotice.current=true;setWorkerMessage(true)}if(!nearWorker)workerNotice.current=false;
   const near=!futureWorldRef.current&&!propheticWorldRef.current&&!lunar&&distance(p,{x:95,z:0})<5;if(near&&!wasNear)setPicker(true);wasNear=near;
   const w=node.clientWidth,h=node.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
   if(w>0&&h>0){const rw=Math.floor(w*dpr),rh=Math.floor(h*dpr);if(node.width!==rw||node.height!==rh){node.width=rw;node.height=rh;gl.viewport(0,0,rw,rh)}
    // Shared 6-hour world clock: four hours daylight, two hours night.
    const cycle=Date.now()%(6*60*60*1000),night=cycle>=4*60*60*1000;
    const dusk=clamp((cycle-3.75*60*60*1000)/(15*60*1000),0,1);
    const dawn=clamp((cycle-5.75*60*60*1000)/(15*60*1000),0,1);
    const darkness=night?1-dawn:dusk;
    const atmosphere=moonModeRef.current.landed?1:clamp((p.y-65)/105,0,1);
    if(jurassicWorldRef.current){gl.clearColor(.65,.82,.85,1);}else if(futureWorldRef.current){gl.clearColor(.014,.024,.09,1);}else if(propheticWorldRef.current){gl.clearColor(.58,.82,.98,1);}else{gl.clearColor(.91-darkness*.87-atmosphere*.9,.96-darkness*.92-atmosphere*.95,.97-darkness*.85-atmosphere*.95,1);}gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // Keep the camera the same distance behind the player on both axes.
    // Smooth normal movement and fullscreen zoom, but snap after teleportation.
    const followDistance=ship.current.active?33:plane.current.active?21:fullscreenRef.current?10:7;
    const followHeight=ship.current.active?15:plane.current.active?10:fullscreenRef.current?5:4;
    const targetCam:[number,number,number]=[p.x-Math.sin(p.yaw)*followDistance,p.y+followHeight-Math.sin(lookPitch.current)*followDistance*.7,p.z-Math.cos(p.yaw)*followDistance];
    const cameraGap=chaseCamera?Math.hypot(targetCam[0]-chaseCamera[0],targetCam[1]-chaseCamera[1],targetCam[2]-chaseCamera[2]):Infinity;
    if(!chaseCamera||cameraGap>80)chaseCamera=targetCam;
    else{const blend=1-Math.exp(-12*dt);for(let axis=0;axis<3;axis++)chaseCamera[axis]+=(targetCam[axis]-chaseCamera[axis])*blend;}
    const meetingView=meetingSeatRef.current!==null; const orbit=meetingCamera.current;const cam=meetingView?[ -125+Math.sin(orbit.angle)*orbit.distance,45+orbit.height,-120+Math.cos(orbit.angle)*orbit.distance ]:(chaseCamera??targetCam),at=meetingView?[-125,47.4,-120]:[p.x,p.y+1.3+Math.sin(lookPitch.current)*6,p.z];
    const vp=mul(perspective(Math.PI/3,w/h,.1,200000),lookAt(cam,at));
    if(jurassicWorldRef.current){drawJurassic((x,y,z,sx,sy,sz,color,alpha=1,angle=0)=>draw(vp,x,y,z,sx,sy,sz,color,alpha,angle),now,p.x,p.z);}else if(futureWorldRef.current){
      renderFutureWorld(vp,draw,p.x,p.z,now);
    }else if(propheticWorldRef.current){
      // A separate historically inspired Makkah environment, not the modern city geometry.
      for(let ix=-17;ix<=17;ix++)for(let iz=-17;iz<=17;iz++){const x=ix*46,z=iz*46;draw(vp,x,-.3,z,46,.6,46,[.61+.025*Math.sin(ix*2+iz),.48,.31]);}
      for(let i=0;i<100;i++){const a=i*2.399963,r=320+(i%9)*30,x=Math.cos(a)*r,z=Math.sin(a)*r,h=25+Math.abs(Math.sin(i*1.91))*65;draw(vp,x,h*.5,z,26,h,30,[.48,.38,.29]);draw(vp,x,h*.82,z,15,h*.36,18,[.58,.47,.36]);}
      // Kaaba: simple stone cuboid and dark drapery; no modern mosque expansion.
      draw(vp,0,5,0,13,10,11,[.065,.065,.067]);draw(vp,0,7.5,0,13.1,.65,11.1,[.72,.56,.24]);draw(vp,0,.12,0,58,.22,56,[.73,.64,.47]);
      // Historically interpretive Hijazi buildings with narrow, walkable lanes.
      for(let i=0;i<84;i++){const col=i%12,row=Math.floor(i/12),x=(col-5.5)*42,z=(row-3)*53;if(Math.abs(x)<44&&Math.abs(z)<44)continue;const h=3.1;draw(vp,x,h/2,z,22,h,26,[.65+(i%3)*.04,.52,.37]);draw(vp,x,h+.2,z,23,.45,27,[.47,.37,.28]);draw(vp,x,2,z+13.04,2.5,3,.18,[.26,.18,.13]);}
      // Desert caravan road toward the separate Madinah settlement (scaled game distance).
      for(let z=-680;z<=-35;z+=20){draw(vp,0,.03,z,13,.06,20,[.69,.54,.34]);for(const side of [-1,1])draw(vp,side*7,.06,z,.35,.12,19,[.44,.34,.22]);}
      for(let i=0;i<44;i++){const col=i%11,row=Math.floor(i/11),x=(col-5)*36,z=-380-row*40;if(Math.abs(x)<30)continue;draw(vp,x,1.75,z,22,3.5,24,[.66,.54,.4]);draw(vp,x,3.55,z,23,.3,25,[.46,.35,.27]);}
      // Madinah oasis with palms and low-rise buildings.
      for(let i=0;i<24;i++){const x=Math.sin(i*2.4)*150,z=-480+Math.cos(i*1.3)*125;draw(vp,x,3,z,.7,6,.7,[.39,.26,.15]);draw(vp,x,7,z,5,3,5,[.18,.4,.21]);}
      // Camel silhouettes in both settlements.
      for(let i=0;i<22;i++){const medina=i>=11,idx=i%11,x=(idx-5)*18+45,z=(medina?-475:135)+(idx%3)*13;draw(vp,x,1.65,z,4,2,1.8,[.55,.34,.2]);draw(vp,x-.5,3.1,z,1.4,1.5,1.5,[.57,.36,.21]);draw(vp,x+2,2.7,z,.75,2,.7,[.55,.34,.2]);for(const leg of [-1,1])draw(vp,x+leg*1.25,.55,z,.45,1.1,.5,[.4,.25,.15]);}
      // Historical-world wayfinding: The game uses a compressed travel scale; actual Makkah–Madinah distance is much greater than 20 miles.
      draw(vp,12,2.7,-195,8,5,.3,[.32,.24,.14]);draw(vp,12,5.6,-195,9,.4,.5,[.8,.65,.36]);
      // Jerusalem route is intentionally closed; modern trucks are an explicitly anachronistic game barrier.
      for(let i=0;i<3;i++){const x=290+i*9,z=85;draw(vp,x,1.4,z,6,2.8,3,[.88,.64,.22]);draw(vp,x+3.2,1,z,2.5,2,2.5,[.35,.42,.4]);for(const off of [-1.6,1.6])draw(vp,x+off,.45,z+1.6,1,.9,.5,[.13,.13,.13]);}
      // Visible moon, with an illustrative ten-second split every three minutes.
      const split=now%180000<10000;const moonX=p.x+180,moonY=p.y+165,moonZ=p.z-420;for(let j=-4;j<=4;j++)for(let k=-4;k<=4;k++){if(j*j+k*k>18)continue;const shift=split?(j<0?-6:6):0;draw(vp,moonX+j*3+shift,moonY+k*3,moonZ,3.1,3.1,2,[.89,.88,.79]);}
      for(let i=0;i<18;i++){const x=-200+(i%9)*48,z=190+Math.floor(i/9)*42;draw(vp,x,1.8,z,1.1,3.6,1.1,[.35,.23,.13]);draw(vp,x,3.8,z,4,.35,4,[.72,.58,.34]);}
    }else{
    // Procedural deep-space starfield: deterministic positions around the camera, no external assets.
    if(atmosphere>.05){for(let i=0;i<270;i++){const theta=(i*2.399963229728653)% (Math.PI*2),phi=Math.acos(1-2*((i*.61803398875)%1));const rr=4200;const sx=p.x+rr*Math.sin(phi)*Math.cos(theta),sy=p.y+rr*Math.cos(phi),sz=p.z+rr*Math.sin(phi)*Math.sin(theta);const twinkle=.6+.4*Math.sin(now*.0008+i*7.1);draw(vp,sx,sy,sz,2+i%3,2+i%3,2+i%3,[.7+twinkle*.25,.78+twinkle*.2,1],atmosphere);}}
    if(moonModeRef.current.landed){
      // Moon terrain, settlement and observatory: one world unit is approximately one meter.
      draw(vp,0,-1,0,720,2,720,[.35,.37,.42]);
      for(let i=0;i<75;i++){const x=Math.sin(i*19.19)*290,z=Math.cos(i*8.71)*290;draw(vp,x,.12,z,3+i%8,.3,3+i%8,[.24+i%3*.045,.26+i%3*.045,.31+i%3*.045]);}
      // Landed spacecraft, landing pads, settlement domes, satellite dishes and rovers.
      draw(vp,0,6,0,8,12,8,[.74,.78,.85]);draw(vp,0,.4,0,18,.7,18,[.76,.61,.24]);
      for(let i=0;i<3;i++){const x=-28+i*23,z=36+i%2*13;draw(vp,x,2,z,9,4,8,[.68,.72,.82]);draw(vp,x,4.2,z,7,.8,7,[.24,.38,.49]);}
      // Impact basins and crater rims: stark lunar geology rather than Earth streets.
      for(let i=0;i<36;i++){const x=Math.sin(i*2.71)*215,z=Math.cos(i*3.87)*215,r=3+i%8*1.5;draw(vp,x,-.12,z,r,.22,r,[.14,.15,.18]);for(let k=0;k<12;k++){const a=k*Math.PI/6;draw(vp,x+Math.cos(a)*r,.25,z+Math.sin(a)*r,1.3,.7,1.3,[.51,.52,.56]);}}
      for(let i=0;i<3;i++){const x=-42+i*24,z=-30;draw(vp,x,1.4,z,6,2,4,[.77,.72,.43]);for(const side of [-1,1])draw(vp,x+side*3.2,.65,z,1,1.3,4,[.12,.17,.23]);}
      for(let i=0;i<4;i++){const x=-48+i*26,z=65;draw(vp,x,6,z,.7,12,.7,[.65,.7,.78]);draw(vp,x,12,z,9,.55,9,[.82,.84,.92],.95,i*.3);}
      // 100 feet from the lander: a glass observatory with a broad rooftop deck.
      const ox=30,oz=0;
      draw(vp,ox,9,oz,23,18,23,[.26,.65,.82],.34);
      for(const sx of [-11,11])for(const sz of [-11,11])draw(vp,ox+sx,10,oz+sz,.65,20,.65,[.82,.73,.44]);
      draw(vp,ox,19,oz,28,1,28,[.16,.27,.38],.85);
      for(let i=0;i<12;i++){const angle=i*Math.PI/6;draw(vp,ox+Math.cos(angle)*9,19.7,oz+Math.sin(angle)*9,1.2,1.4,1.2,[.68,.71,.78]);}
      draw(vp,ox,20,oz,9,1.4,9,[.94,.72,.24]);draw(vp,ox,21,oz,6,.18,6,[1,.88,.48]);
      // Constellation-inspired stars and intermittent meteor trails above the moon.
      for(let i=0;i<210;i++){const theta=i*2.399963,phi=Math.acos(1-2*((i*.618034)%1)),radius=180+i%5*65;draw(vp,p.x+radius*Math.sin(phi)*Math.cos(theta),p.y+Math.abs(radius*Math.cos(phi))+55,p.z+radius*Math.sin(phi)*Math.sin(theta),.5+i%3,.5+i%3,.5+i%3,[.7,.84,1],.9);}
      for(let i=0;i<7;i++){const t=(now*.00013+i*.19)%1,angle=i*2.39996,rad=i<3?30:140;const x=p.x+Math.cos(angle)*rad+t*95,z=p.z+Math.sin(angle)*rad-t*70,y=90-t*85;draw(vp,x,Math.max(.6,y),z,1.2,1.2,7,[.74,.86,1],.75,angle);if(y<3)draw(vp,x,.3,z,2,.2,2,[.95,.49,.23],.8);}
    }
    if(ship.current.inSpace){const elapsed=(now-ship.current.launchedAt)/1000;const moonDist=Math.max(110,110000-elapsed*5500);const moonX=p.x+Math.sin(ship.current.heading)*moonDist,moonZ=p.z+Math.cos(ship.current.heading)*moonDist;draw(vp,moonX,p.y+420,moonZ,1800,1800,1800,[.73,.76,.8]);draw(vp,moonX-450,p.y+800,moonZ-950,350,70,350,[.52,.56,.62]);const sunDist=Math.max(1800,220000-elapsed*5500);draw(vp,p.x+Math.sin(ship.current.heading)*sunDist,p.y+1800,p.z+Math.cos(ship.current.heading)*sunDist,6200,6200,6200,[1,.78,.19]);if(elapsed<8){for(let i=0;i<14;i++){const off=i*48;draw(vp,p.x+Math.sin(ship.current.heading)*(130+off),p.y-40-off*.2,p.z+Math.cos(ship.current.heading)*(130+off),16,2,16,[1,.78,.22],.8);}}}
    if(eva&&p.y<1000){const fall=clamp((1000-p.y)/1000,0,1);if(fall>.1&&now%500<25)setHint("🌍 Earth gravity increasing. Brace for atmospheric entry.");}
    // Layered atmospheric cloud banks with parallax on ascent.
    if(atmosphere<.97){const opacity=(1-atmosphere)*.7;for(let i=0;i<56;i++){const cx=155+Math.sin(i*12.9898)*((i%9)*135+140),cz=-27+Math.cos(i*8.321)*((i%11)*150+120),cy=175+Math.sin(i*3.1)*48;for(let j=0;j<3;j++){draw(vp,cx+Math.sin(j*2.3+i)*45,cy+j*9,cz+Math.cos(j*3.7+i)*55,95-j*15,18+j*6,60+j*12,[.94,.97,1],opacity);}}}
    if(ship.current.active){for(let j=1;j<=6;j++){const d=j*1600;draw(vp,ship.current.x+Math.sin(ship.current.heading)*d,ship.current.y+90,ship.current.z+Math.cos(ship.current.heading)*d,24+j*3,75+j*8,24+j*3,[1,.82,.28],.9);}}
    if(ship.current.inSpace){const elapsed=(now-ship.current.launchedAt)/1000,md=Math.max(110,110000-elapsed*5500),mx=p.x+Math.sin(ship.current.heading)*md,mz=p.z+Math.cos(ship.current.heading)*md;for(let i=0;i<22;i++){const a=i*2.39996,rr=120+((i*71)%1150);draw(vp,mx+Math.cos(a)*rr,p.y+420+Math.sin(a*1.8)*rr,mz-500+Math.sin(a)*120,75+i%5*17,14,75+i%5*17,[.48,.51,.57]);}const sd=Math.max(1800,220000-elapsed*5500),sx=p.x+Math.sin(ship.current.heading)*sd,sz=p.z+Math.cos(ship.current.heading)*sd;for(let i=0;i<16;i++){const a=i*Math.PI/8;draw(vp,sx+Math.cos(a)*5200,p.y+1800+Math.sin(a)*5200,sz,1300,800,1300,[1,.58,.12],.48);}}
    for(const shot of projectiles.current){draw(vp,shot.x,shot.y,shot.z,.35,.35,.35,shot.power===2?[1,.35,.9]:[.18,1,.75]);draw(vp,shot.x-shot.vx*.014,shot.y,shot.z-shot.vz*.014,.17,.17,.17,[.8,1,.7],.55);}
    // Project the permanent BeltBoyz photo onto the table center in council view.
    const centerpiece=councilCenterpiece.current;
    if(centerpiece){const point=project(vp,[-125,46.3,-120],w,h);const nearCouncil=Math.hypot(p.x+125,p.y-46,p.z+120)<150;
      if(!lunar&&point?.visible&&(meetingView||nearCouncil)){const range=Math.hypot(cam[0]+125,cam[1]-46.3,cam[2]+120);const size=clamp(780/(range+1),24,220);centerpiece.style.display="block";centerpiece.style.width=size+"px";centerpiece.style.height=size+"px";centerpiece.style.left=(point.x-size/2)+"px";centerpiece.style.top=(point.y-size/2)+"px";}else centerpiece.style.display="none";
    }
    // Council mural on the opposite wall from the projector, perspective-scaled.
    const muralPoint=project(vp,[-125,52,-106.3],w,h);
    const mural=councilArt.current;
    if(mural){if(!lunar&&muralPoint?.visible&&distance(p,{x:-125,z:-120})<105){const size=clamp(1150/(Math.hypot(p.x+125,p.y-52,p.z+106)+1),55,370);mural.style.display="block";mural.style.width=size+"px";mural.style.height=size*.36+"px";mural.style.left=(muralPoint.x-size/2)+"px";mural.style.top=(muralPoint.y-size*.18)+"px";mural.style.fontSize=Math.max(8,size/20)+"px";}else mural.style.display="none";}
    // Anchor the projector UI to the in-world council wall; hide when off-screen.
    const screenPoint=project(vp,[-125,52,-133.1],w,h);
    const projector=councilProjection.current;
    if(projector){if(!lunar&&screenPoint?.visible&&distance(p,{x:-125,z:-120})<110){const size=clamp(650/(Math.hypot(p.x+125,p.y-52,p.z+133)+1),45,460);projector.style.display="block";projector.style.width=size+"px";projector.style.left=(screenPoint.x-size/2)+"px";projector.style.top=(screenPoint.y-size*9/32)+"px";}else projector.style.display="none";}
    if(!moonModeRef.current.landed){
    // Titan: extended Main Street, arterial branches and mountain-edge tunnel corridor.
    // Main Street weapon shop: a physical storefront with a glowing emerald sign.
    draw(vp,20,4,-590,13,8,11,[.12,.23,.26]);draw(vp,20,8.5,-590,15,1,13,[.78,.61,.22]);draw(vp,20,5,-583.9,10,2,.35,[.1,.95,.62]);draw(vp,20,1.7,-583.7,3,3,.4,[.08,.12,.16]);
    for(let n=0;n<58;n++){const z=-560-n*18;draw(vp,0,-.055,z,22,.12,18,[.19,.23,.27]);draw(vp,0,.015,z,.3,.025,5,[.96,.82,.45]);for(const side of [-1,1]){draw(vp,side*12,.01,z,2,.08,18,[.52,.55,.54]);if(n%3===0)draw(vp,side*17,.2,z,3,.4,3,[.28,.5,.23]);}if(n%9===0){for(let k=-9;k<=9;k++)draw(vp,k*18,-.07,z,18,.12,18,[.2,.24,.27]);}}
    for(let n=0;n<25;n++){const z=-620-n*34;for(const side of [-1,1]){const x=side*(110+n*6);const height=18+Math.abs(Math.sin(n*2.3))*37;draw(vp,x,height/2-1,z,52,height,48,[.36,.42,.4]);draw(vp,x,height*.77,z,28,height*.45,30,[.65,.68,.65]);}}
    for(let n=0;n<9;n++){const z=-890-n*12;for(const side of [-1,1])draw(vp,side*15,5,z,7,10,4,[.48,.52,.49]);draw(vp,0,10,z,38,2,6,[.51,.55,.51]);}
    // HudHud: populated satellite district, neighborhood park, basketball courts and arena.
    for(let i=0;i<46;i++){const row=Math.floor(i/8),col=i%8,x=-90+col*27,z=-625-row*42;const h=7+((i*13)%19);draw(vp,x,h/2,z,14,h,16,i%3===0?[.17,.36,.34]:[.57,.59,.53]);draw(vp,x,h+.3,z,15,.5,17,[.82,.7,.36]);for(let floor=2;floor<h;floor+=4)draw(vp,x,h-floor,z+8.1,9,.65,.1,[.92,.78,.42],.8);}
    for(let i=0;i<75;i++){const x=-180+(i*47)%365,z=-580-(i*31)%380;draw(vp,x,.15,z,2.5,.3,2.5,[.21,.56,.22]);draw(vp,x,2.3,z,.65,4.4,.65,[.35,.27,.17]);draw(vp,x,5.3,z,4.5,5,4.5,[.13,.42,.24]);}
    for(let court=0;court<2;court++){const x=65+court*43,z=-700;draw(vp,x,.07,z,30,.15,17,[.13,.48,.45]);draw(vp,x,.17,z,28,.025,.22,[.94,.89,.75]);for(const side of [-1,1]){draw(vp,x+side*13,3,z,.3,6,.3,[.84,.84,.83]);draw(vp,x+side*13,6,z,2.8,1.9,.2,[.92,.92,.89]);}}
    draw(vp,180,5,-780,96,10,78,[.23,.32,.39]);draw(vp,180,12,-780,83,5,66,[.76,.68,.38]);draw(vp,180,16,-780,67,3,48,[.17,.41,.36]);draw(vp,180,19,-780,48,.6,29,[.28,.48,.39]);
    // Elite: low-cost animated traffic, distant aircraft, walking citizens, cats and birds.
    const t=now*.001;
    for(let i=0;i<14;i++){const z=-560-((t*(5+i%3)*4+i*93)%1020),lane=i%2===0?-5:5;draw(vp,lane,.75,z,2.4,1.2,4.8,i%3===0?[.14,.65,.53]:[.73,.74,.78]);draw(vp,lane,1.5,z-.3,1.8,.7,2.6,[.19,.3,.36]);for(const sx of [-1,1])draw(vp,lane+sx*1.2,.35,z,.3,.7,2.4,[.08,.1,.13]);}
    for(let i=0;i<24;i++){const z=-590-(i*47)%780,x=(i%2===0?1:-1)*(17+i%4*3),stride=Math.sin(t*3+i)*.28;draw(vp,x,1.4,z+Math.sin(t*.7+i)*3,.8,2,.65,i%3===0?[.27,.64,.5]:[.67,.58,.42]);draw(vp,x,2.65,z+Math.sin(t*.7+i)*3,.7,.7,.7,[.68,.5,.36]);draw(vp,x-.3,.45+stride,z,.25,.85,.3,[.23,.24,.27]);draw(vp,x+.3,.45-stride,z,.25,.85,.3,[.23,.24,.27]);}
    for(let i=0;i<18;i++){const x=-115+(i*31)%255,z=-610-(i*53)%740;draw(vp,x+Math.sin(t+i)*1.2,.28,z,.85,.5,1.3,i%2?[.36,.35,.32]:[.81,.75,.63]);draw(vp,x+.4,.65,z-.45,.55,.55,.55,[.64,.6,.52]);}
    for(let i=0;i<25;i++){const x=-140+(i*37)%340,z=-580-(i*59)%820,y=12+(i%7)*3+Math.sin(t*2+i)*1.8;draw(vp,x+Math.sin(t+i)*8,y,z+Math.cos(t+i)*8,1.3,.12,.35,[.78,.82,.84]);draw(vp,x+Math.sin(t+i)*8,y+.3,z+Math.cos(t+i)*8,.2,.5,.25,[.88,.89,.9]);}
    for(let i=0;i<3;i++){const z=-700-((t*17+i*360)%1250),x=-180+i*180,y=60+i*17;draw(vp,x,y,z,4,1.5,13,[.84,.87,.91]);draw(vp,x,y,z,24,.2,2,[.68,.79,.85]);draw(vp,x,y+1.6,z+4,2,2,3,[.78,.85,.9]);}
    // Five explorable satellite districts: distances from spawn approximate 2–5 minutes at walking speed.
    // Keep them away from the eastern portal corridor and the existing northern forest.
    const districts=[
      {x:-720,z:180,kind:0}, // Nile: Egypt-inspired pyramids
      {x:-420,z:850,kind:1}, // Mecca-inspired courtyard district
      {x:-1260,z:-170,kind:2}, // dense New York / Chicago skyline
      {x:-110,z:1580,kind:3}, // beach city
      {x:-1530,z:760,kind:4} // largest distant metropolitan center
    ];
    for(let ci=0;ci<districts.length;ci++){
      const city=districts[ci],range=Math.hypot(p.x-city.x,p.z-city.z);
      if(range>650)continue; // cull geometry beyond view radius for mobile
      draw(vp,city.x,-.12,city.z,ci===4?340:220,.2,ci===4?340:220,[.44,.46,.43]);
      const count=ci===4?44:22;
      for(let i=0;i<count;i++){
        const col=i%8,row=Math.floor(i/8),x=city.x+(col-3.5)*35,z=city.z+(row-2)*41;
        const h=ci===0?5+(i%4)*3:ci===1?9+(i%5)*3:ci===3?7+(i%4)*4:16+(i*11)%76;
        const tint=ci===0?[.77,.62,.37]:ci===1?[.83,.79,.64]:ci===3?[.77,.84,.8]:[.35,.45,.53];
        draw(vp,x,h/2,z,19,h,22,tint);
        draw(vp,x,h+.15,z,20,.3,23,ci===1?[.78,.67,.31]:[.16,.34,.31]);
        if(ci===0&&i%6===0){for(let tier=0;tier<6;tier++)draw(vp,x,h+tier*2,z,23-tier*3,2,23-tier*3,[.78,.64,.36]);}
        if(i%5===0){draw(vp,x+12,2,z+9,.6,4,.6,[.38,.27,.19]);draw(vp,x+12,5,z+9,5,5,5,[.15,.43,.25]);}
      }
      if(ci===3){for(let j=0;j<14;j++)draw(vp,city.x-130+j*19,-.06,city.z+145,18,.12,110,[.87,.77,.55]);}
    }
    // Highway connections with lane markers. Segments are drawn only near the camera.
    for(const city of districts){
      const length=Math.hypot(city.x,city.z),segments=Math.ceil(length/24);
      for(let s=0;s<=segments;s++){
        const ratio=s/segments,x=city.x*ratio,z=city.z*ratio;
        if(Math.hypot(p.x-x,p.z-z)>330)continue;
        const angle=Math.atan2(-city.z,city.x);
        draw(vp,x,-.07,z,24, .14,25,[.19,.23,.27],1,angle);
        if(s%3===0)draw(vp,x,.018,z,2,.03,3,[.91,.79,.44],1,angle);
      }
    }
    // Glass skywalk to the beachward district, with a translucent deck and side rails.
    for(let s=0;s<50;s++){
      const x=-6-s*2.1,z=70+s*30;
      if(Math.hypot(p.x-x,p.z-z)>350)continue;
      draw(vp,x,13,z,10,.35,30,[.49,.79,.85],.42);
      for(const side of [-1,1])draw(vp,x+side*5,14.4,z,.22,2.8,30,[.68,.9,.95],.38);
      if(s%4===0)for(const side of [-1,1])draw(vp,x+side*3.3,13.9,z,2.8,1.3,5,[.85,.19,.16]);
    }
    // Great Lake between the skyscraper city and the beach: swim surface and animated dolphin pods.
    const lakeX=-790,lakeZ=720,lakeRX=350,lakeRZ=280;
    if(Math.hypot(p.x-lakeX,p.z-lakeZ)<850){
      draw(vp,lakeX,-.13,lakeZ,lakeRX*2,.12,lakeRZ*2,[.09,.43,.68],.73);
      for(let d=0;d<20;d++){
        const a=d*2.399+t*.35,r=24+(d%6)*31,x=lakeX+Math.cos(a)*r,z=lakeZ+Math.sin(a)*r;
        const leap=Math.max(0,Math.sin(t*1.7+d*1.7))*2.8;
        draw(vp,x,.15+leap,z,2.8,.85,1.1,[.43,.65,.74],.9,a);
        draw(vp,x-1.3,.25+leap,z,.8,1.5,.3,[.36,.57,.7],.9,a);
      }
    }
    // Rebuildable collision props: each blaster impact removes the solid volume for five minutes.
    for(let i=0;i<80;i++){const id="prop-"+i;if(damagedStructures.current.has(id))continue;const x=12+(i%20)*5,z=(Math.floor(i/20)-1.5)*24;const hits=structureHits.current.get(id)?.count??0;draw(vp,x,1.35,z,2.7,2.7,2.7,[Math.max(.12,.34+(i%3)*.09-hits*.045),Math.max(.12,.46-hits*.065),Math.max(.12,.38-hits*.045)]);if(hits>0)for(let crack=0;crack<hits;crack++)draw(vp,x-1.38+(crack%3)*.72,1.6+(crack%2)*.42,z+1.37,.09,.65,.04,[.08,.08,.09]);}
    // Terrain continuity pass: local, camera-culled tiles replace exposed white voids.
     // Deterministic biomes blend grassland, forest, desert, rocky highland and wetlands.
     // Existing roads, landmarks, bridges and portal geometry remain layered above the terrain.
     const terrainTile=36, terrainRadius=14;
     const tileX=Math.round(p.x/terrainTile),tileZ=Math.round(p.z/terrainTile);
     for(let gx=-terrainRadius;gx<=terrainRadius;gx++)for(let gz=-terrainRadius;gz<=terrainRadius;gz++){
       if(gx*gx+gz*gz>terrainRadius*terrainRadius)continue;
       const ix=tileX+gx,iz=tileZ+gz,x=ix*terrainTile,z=iz*terrainTile;
       const moisture=Math.sin(x*.0023)+Math.cos(z*.0027)+.42*Math.sin((x+z)*.005);
       const elevation=Math.sin(x*.0037)*Math.cos(z*.0041);
       const desert=moisture<-.65,rock=elevation>.65,wet=moisture>1.35;
       const shade=.92+.08*Math.sin(ix*17.13+iz*9.71);
       const tint=desert?[.67*shade,.52*shade,.29*shade]:rock?[.36*shade,.38*shade,.34*shade]:wet?[.18*shade,.37*shade,.29*shade]:[.23*shade,.43*shade,.21*shade];
       const groundY=terrain(x,z);draw(vp,x,groundY-.26,z,terrainTile+.2,.48,terrainTile+.2,tint);
       if(rock&&groundY>5){draw(vp,x,groundY*.5,z,terrainTile*.94,groundY,terrainTile*.94,[.34,.36,.34]);if((ix+iz)%7===0)for(let drop=0;drop<5;drop++)draw(vp,x+8,groundY-drop*3,z-8,1.3,3,2,[.35,.72,.93],.65);}
       if((ix*3+iz*11)%19===0&&!desert){const tx=x+8,tz=z-6;draw(vp,tx,groundY+1.2,tz,1,2.4,1,[.39,.26,.17]);draw(vp,tx,groundY+4,tz,5,4,5,[.13,.39,.19]);}

       if((ix*13+iz*7)%9===0&&!desert&&!rock){
         const tx=x+Math.sin(ix*5.7+iz)*10,tz=z+Math.cos(iz*3.9+ix)*10;
         draw(vp,tx,1.5,tz,.8,3,.8,[.32,.24,.15]);
         draw(vp,tx,4.2,tz,4,3.7,4,wet?[.13,.36,.2]:[.18,.43,.19]);
       }
       if(rock&&(ix+iz)%4===0)draw(vp,x,1,z,5,2.3,4,[.43,.44,.4]);
     }
     // Wildlife silhouettes: dangerous roaming animals can trigger the three-strike respawn.
     for(let i=0;i<30;i++){const ax=Math.sin(i*83.17)*650,az=Math.cos(i*41.83)*650;if(Math.hypot(ax-p.x,az-p.z)>320)continue;const ay=terrain(ax,az);draw(vp,ax,ay+1.2,az,3.3,2,1.5,[.43,.29,.17]);draw(vp,ax+1.8,ay+1.6,az,1.3,1.3,1.2,[.48,.32,.19]);for(const zOff of [-.5,.5])for(const xOff of [-1,1])draw(vp,ax+xOff,ay+.45,az+zOff,.45,.9,.45,[.32,.22,.15]);}
     // White reflective ground and long-runway guidance to the Games portal.
    draw(vp,0,-.35,0,420,.65,420,[.24,.43,.23]);
    for(let i=-200;i<=200;i+=10){draw(vp,i,.008,0,.025,.018,420,[.76,.88,.85]);draw(vp,0,.008,i,420,.018,.025,[.76,.88,.85])}
    for(let i=8;i<95;i+=7)draw(vp,i,.025,0,3,.025,1.2,[.89,.75,.42],.7);
    // Half-mile exploration route: outbound road, first tunnel, rising space bridge, second tunnel, white room.
    for(let x=200;x<=1200;x+=12){const y=x<290?0:x<330?(x-290)*.625:25;const isTunnel=(x>=235&&x<=285)||(x>=1090&&x<=1140);draw(vp,x,y-.22,0,12,.44,11,x>=330?[.46,.51,.64]:[.28,.36,.39]);draw(vp,x,y+.025,0,.25,.035,1.8,[.94,.83,.43]);if(x>=330&&x<1090){for(const side of [-1,1]){draw(vp,x,y+.65,side*5.2,12,.22,.2,[.62,.87,.98],.8);draw(vp,x,y+.7,side*5.2,.2,1.4,.25,[.73,.84,.94]);}draw(vp,x,y-12,0,12,.4,.25,[.22,.25,.4]);}if(isTunnel){for(const side of [-1,1])draw(vp,x,y+3,side*5.5,12,6,.7,[.75,.79,.87]);draw(vp,x,y+6,0,12,.6,12,[.81,.84,.91]);}}
    // Bright white destination chamber after the second tunnel.
    draw(vp,1170,24.5,0,60,1,48,[.34,.38,.35]);draw(vp,1170,34,-24,60,20,1,[.99,.99,1]);draw(vp,1170,34,24,60,20,1,[.99,.99,1]);draw(vp,1200,34,0,1,20,48,[.99,.99,1]);draw(vp,1170,44,0,60,1,48,[1,1,1]);for(let x=1146;x<1195;x+=10)draw(vp,x,25.1,0,.3,.1,40,[.81,.88,.95]);
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
    draw(vp,councilX,councilY-.4,councilZ,62,.8,52,[.18,.25,.32]);
     draw(vp,councilX,councilY+2.4,councilZ,24,.7,24,[.68,.51,.23]);draw(vp,councilX,councilY+1.2,councilZ,4,2,4,[.36,.28,.2]);
     for(let i=0;i<12;i++){const a=i*Math.PI/6,x=councilX+Math.cos(a)*15,z=councilZ+Math.sin(a)*15;draw(vp,x,councilY+.9,z,2.5,.45,2.5,[.16,.36,.32]);draw(vp,x+Math.cos(a)*1.1,councilY+2.1,z+Math.sin(a)*1.1,.5,2.8,2.5,[.17,.39,.36],1,-a);}

    draw(vp,councilX,councilY-.02,councilZ,59,.12,49,[.77,.65,.3]);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      draw(vp,councilX+sx*29,councilY+6,councilZ+sz*24,.65,12,.65,[.7,.85,.93],.72);
    }
    // Open-air council: no overhead roof.
    // Translucent glass walls allow the council to look out over the world.
    for(const side of [-1,1]){
      draw(vp,councilX+side*30,councilY+6,councilZ,.3,11,50,[.48,.8,.92],.24);
      draw(vp,councilX,councilY+6,councilZ+side*25,60,11,.3,[.48,.8,.92],.24);
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
    // High-rise entry courts: defined ground-level doors, canopies and accessible passages.
     // Visual doorways align with the existing open lobby and collision volume beginning at y=7.1.
     // Downtown towers: open lobby space below a supported upper structure.
    // Player can enter the lobby and land on rooftops by flying.
    const cityTowers:{x:number;z:number;w:number;d:number;h:number;type:number}[]=[];
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const x=-120+col*37,z=-380-row*38;
      const h=42+((row*7+col*11)%7)*16;
      const type=(row+col)%4;
      cityTowers.push({x,z,w:22,d:23,h,type});
      draw(vp,x,.12,z,30,.2,31,[.74,.75,.7]);
      // Four pillars instead of a solid ground floor: walk-in entrance.
      for(const ox of [-9,9])for(const oz of [-9.5,9.5])draw(vp,x+ox,3.4,z+oz,.9,6.8,.9,[.48,.55,.59]);
      draw(vp,x,7.1,z,22,.7,23,[.65,.72,.72]);
       // Front entrance with paired sliding glass leaves and a gold lintel.
       for(const side of [-1,1])draw(vp,x+side*2.4,2.7,z+11.3,2.1,5.2,.18,[.23,.49,.55],.32);
       draw(vp,x,5.7,z+11.3,7,.45,.65,[.83,.66,.32]);
       for(const side of [-1,1])draw(vp,x+side*4,3,z+11.4,.35,6,.35,[.67,.72,.69]);
       draw(vp,x,6.1,z+14,9,.28,5,[.69,.55,.28]);
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
    // Belt Boyz meeting hall remains open to the sky.
    for(let z=-140;z<=-96;z+=6){draw(vp,-125,56.3,z,10,.25,1,[.95,.8,.42],.95);draw(vp,-125,45.4,z,2,.08,1,[.15,.85,.61],.8);}
    // Meeting stage at the far end of the corridor.
    draw(vp,-125,46,-144,19,2,5,[.48,.31,.2]);draw(vp,-125,49,-147,18,5,.5,[.13,.56,.48]);
    for(let i=0;i<8;i++){const x=-134+(i%4)*6,z=-129+Math.floor(i/4)*9;draw(vp,x,46,z,2,2,2,[.63,.52,.32]);}
    // Monumental Masjid an-Nabawi-inspired landmark, facing the portal approach.
    // Wide forecourt and open central entrance; preserve respectful sacred architecture.
    const mx=163;
    draw(vp,mx,.08,0,78,.16,124,[.75,.73,.59]);
    for(const z of [-51,51]){draw(vp,mx,10,z,62,20,5,[.85,.83,.71]);draw(vp,mx,21,z,65,2,7,[.84,.68,.35]);}
    draw(vp,mx+29,10,0,6,20,106,[.85,.83,.72]);
    for(const z of [-51,-39,-27,-15,15,27,39,51]){if(Math.abs(z)<17)continue;draw(vp,mx-29,10,z,5,20,9,[.86,.83,.72]);draw(vp,mx-32,16,z,1,8,5,[.26,.5,.42]);}
    for(let x=142;x<=182;x+=13)for(let z=-34;z<=34;z+=17){draw(vp,x,18,z,9,2,11,[.88,.84,.69]);for(let level=0;level<4;level++)draw(vp,x,20+level*2,z,9-level*1.8,1.4,11-level*2.1,[.18+level*.045,.44+level*.03,.34+level*.025]);draw(vp,x,28,z,.4,3,.4,[.86,.69,.32]);}
    for(const x of [126,200])for(const z of [-57,57]){draw(vp,x,27,z,5,54,5,[.87,.85,.75]);for(const y of [13,28,43,55])draw(vp,x,y,z,9,1.4,9,[.82,.69,.36]);draw(vp,x,59,z,3,10,3,[.86,.86,.75]);draw(vp,x,65,z,5,1.5,5,[.82,.67,.32]);draw(vp,x,70,z,.55,10,.55,[.89,.73,.32]);}
    for(const z of [-44,44])draw(vp,119,.5,z,35,.7,1,[.79,.69,.45]);
    // Portal: glowing arch with a translucent doorway and depth.
    for(let i=0;i<17;i++){const a=i*Math.PI/16;draw(vp,95,2.8+Math.sin(a)*4.1,Math.cos(a)*4.1,.85,.85,.75,[.19,.79,.66],1,-a)}
    draw(vp,95,2.8,0,.2,6.3,7.1,[.23,.85,.76],.28);
    draw(vp,95,7.6,0,.4,.18,9,[.92,.75,.29]);
    // Floating Live glass screen and structural frame at 18.3m behind spawn.
    draw(vp,-18.3,4,0,.25,5.5,9,[.3,.8,.69],.5);
    draw(vp,-18.3,4,0,.15,4.7,8.2,[.12,.38,.38],.26);
    for(const z of [-4.6,4.6])draw(vp,-18.3,4,z,.35,5.7,.2,[.65,.94,.83]);
    for(const y of [1.2,6.8])draw(vp,-18.3,y,0,.35,.2,9.4,[.65,.94,.83]);
    }
    }
    // Avatar primitives: head, torso, arms, legs, glowing flight trails.
    const avatar=(a:Player)=>{const c=SUIT_COLORS[a.suit];const praying=a.id===p.id&&propheticWorldRef.current&&Math.hypot(a.x,a.z+475)<125?prayerPosture:null;if(praying){const cs=Math.cos(a.yaw),sn=Math.sin(a.yaw),forward=(d:number)=>({x:a.x+sn*d,z:a.z+cs*d});const body=praying==="ruku"?{y:1.18,h:.56,forward:.34}:praying==="sujud"?{y:.53,h:.42,forward:.65}:{y:.72,h:.8,forward:0};const at=forward(body.forward);draw(vp,at.x,a.y+body.y,at.z,.83,body.h,.52,c,1,a.yaw);const head=forward(praying==="sujud"?1.1:praying==="ruku"?.83:.04);draw(vp,head.x,a.y+(praying==="sujud"?.27:praying==="ruku"?1.2:1.45),head.z,.5,.5,.5,c,1,a.yaw);for(const side of [-1,1]){const ox=cs*side*.28,oz=-sn*side*.28;const knee=forward(praying==="sujud"?.05:praying==="ruku"?-.05:-.2);draw(vp,knee.x+ox,a.y+.27,knee.z+oz,.3,.54,.38,c,1,a.yaw);const hands=forward(praying==="sujud"?.93:praying==="ruku"?.73:.28);draw(vp,hands.x+cs*side*.47,a.y+(praying==="sujud"?.18:praying==="ruku"?.88:.73),hands.z-sn*side*.47,.23,.35,.26,c,1,a.yaw)}return;}const self=a.id===p.id;const launch=self&&a.flying?clamp((now-flightPose.current.takeoff)/900,0,1):1;const land=self&&!a.flying?clamp((now-flightPose.current.landing)/1350,0,1):1;const crouch=self&&now<knockdownUntil.current?1.25:self&&!a.flying&&land<.5?(1-land*2)*.65:0;const lean=a.flying?(.15+.65*launch):0;const ay=a.y-crouch+(a.flying?0:.1*Math.sin(now*.006));draw(vp,a.x,ay+1.35,a.z,.8,1.1,.44,c,1,a.yaw+lean*.12);draw(vp,a.x+Math.sin(a.yaw)*lean*.25,ay+2.16+(!a.flying&&land<.8?.18*(1-land):0),a.z+Math.cos(a.yaw)*lean*.25,.52,.52,.52,c,1,a.yaw);const cs=Math.cos(a.yaw),sn=Math.sin(a.yaw);
      for(const side of [-1,1]){const ox=cs*side*.61,oz=-sn*side*.61;const gesture=self&&now<emoteUntil.current?emote:"none";const firing=self&&now<shootingPoseUntil.current&&side===1;const lift=firing?0:a.flying?(.45+launch*.35):((gesture==="wave"||gesture==="hand")&&side===1?(gesture==="hand"?1.12:.65):gesture==="celebrate"?.65:gesture==="pose"&&side===1?.28:0);if(firing){draw(vp,a.x+ox+sn*.42,ay+1.75,a.z+oz+cs*.42,.27,.28,1.05,c,1,a.yaw);draw(vp,a.x+ox+sn*.83,ay+1.75,a.z+oz+cs*.83,.24,.25,.22,[.35,1,.76],1,a.yaw)}else draw(vp,a.x+ox+sn*lift*.3,ay+1.28+lift,a.z+oz+cs*lift*.3,.26,.94,.3,c,1,a.yaw);draw(vp,a.x+cs*side*.23,ay+.46,a.z-sn*side*.23,.31,.85,.35,c,1,a.yaw)}
      if(a.flying){for(let i=0;i<7;i++){const tail=i*.7+1;draw(vp,a.x-sn*tail,ay+.4-i*.12,a.z-cs*tail,.13+i*.065,.11+i*.04,.13+i*.065,[.66,.92,1],.6-i*.06)}draw(vp,a.x+sn*.6,ay+1.4,a.z+cs*.6,.48,.2,.32,c,1,a.yaw)}};
    avatar(p);
    const labelHost=labels.current;if(labelHost)labelHost.replaceChildren();
    for(const other of peerRef.current.values())if(now-other.seen<12000&&(other.world||"Today")===(p.world||"Today")){const age=now-(arrivals.current.get(other.id)??now);if(age<2600){const progress=clamp(age/2600,0,1),drop=(1-progress)*(1-progress)*9;avatar({...other,y:other.y+drop});for(let i=0;i<6;i++){const angle=i*Math.PI/3+now*.002;draw(vp,other.x+Math.cos(angle)*1.4,other.y+2.5+drop,other.z+Math.sin(angle)*1.4,.2,3,.2,[.12,.95,.68],.6)}}else avatar(other);const feet=distance(p,other)*3.28084;if(labelHost&&feet>=5&&feet<=50){const point=project(vp,[other.x,other.y+3,other.z],w,h);if(point?.visible){const tag=document.createElement("span");tag.textContent=(other.name||"Explorer")+(voiceTracks.current.has(other.userId||"")?" 🔊":"");tag.style.cssText="position:absolute;left:"+point.x+"px;top:"+point.y+"px;transform:translate(-50%,-100%);padding:4px 9px;border-radius:12px;background:#052c28df;color:#fff;font-size:12px;font-weight:800;white-space:nowrap;border:1px solid #9bd9bb;pointer-events:none";labelHost.appendChild(tag)}}}
    const projLive=project(vp,[-18.3,4,0],w,h),projPortal=project(vp,[95,9,0],w,h);
    const updateOverlay=(element:HTMLDivElement|null,proj:ReturnType<typeof project>,dist:number,max:number)=>{if(!element)return;const show=!!proj?.visible&&dist<max;element.style.display=show?"block":"none";if(show&&proj){element.style.left=proj.x+"px";element.style.top=proj.y+"px";element.style.transform="translate(-50%,-50%) scale("+clamp(15/(dist+3),.35,1.3)+")"}};
    if(lunar||futureWorldRef.current||propheticWorldRef.current){if(panel.current)panel.current.style.display="none";if(portalLabel.current)portalLabel.current.style.display="none";}
    else{updateOverlay(panel.current,projLive,distance(p,{x:-18.3,z:0}),75);updateOverlay(portalLabel.current,projPortal,distance(p,{x:95,z:0}),160);}
   }
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
 },[]);
 useEffect(()=>{
  const keyDown=(e:KeyboardEvent)=>{if(document.activeElement!==canvas.current)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(key==="e"&&!e.repeat){if(futureWorldRef.current&&distance(local.current,FUTURE_PORTAL)<9)exitFutureWorld();else if(ship.current.active)exitShip();else if(nearVehicle==="ship")boardShip();else if(nearVehicle==="plane")togglePlane();}else if(key==="f"&&!e.repeat)toggleFly();else if(key==="q"&&!e.repeat)fireShot();else if(key===" ")keys.current.Space=true;else keys.current[key]=true};
  const keyUp=(e:KeyboardEvent)=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys.current[key===" "?"Space":key]=false};
  window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);return()=>{window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp)};
 },[toggleFly,nearVehicle]);
 const stopVoice=useCallback(async()=>{peerVoiceTarget.current=null;const room=voiceRoom.current;voiceRoom.current=null;setVoiceOn(false);setAudioMode("off");setProximityMicEnabled(false);setProximitySpeaking(false);setAudioRoomLocked(false);for(const el of voiceTracks.current.values())el.remove();voiceTracks.current.clear();if(room)await room.disconnect()},[]);
 const startVoice=useCallback(async()=>{if(voiceBusy||voiceRoom.current)return;setVoiceBusy(true);try{
  const response=await fetch("/api/game-voice/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(peerVoiceTarget.current?{mode:"peer",peerId:peerVoiceTarget.current}:{})});const info=await response.json();
  if(!response.ok)throw new Error(info.error||"Voice unavailable");
  const {Room,RoomEvent,Track}=await import("livekit-client");const room=new Room({adaptiveStream:true,dynacast:true});
  room.on(RoomEvent.TrackSubscribed,(track,publication,participant)=>{if(track.kind!==Track.Kind.Audio)return;const el=track.attach() as HTMLAudioElement;el.autoplay=true;el.volume=1;el.style.display="none";document.body.appendChild(el);voiceTracks.current.set(participant.identity,el)});
  room.on(RoomEvent.TrackUnsubscribed,(track,publication,participant)=>{voiceTracks.current.get(participant.identity)?.remove();voiceTracks.current.delete(participant.identity)});
  room.on(RoomEvent.ParticipantDisconnected,p=>{voiceTracks.current.get(p.identity)?.remove();voiceTracks.current.delete(p.identity)});
  await room.connect(info.url,info.token);voiceRoom.current=room;await room.startAudio();await room.localParticipant.setMicrophoneEnabled(true);setMicPermissionError("");try{localStorage.setItem("1muslim:game-voice-opt-in","1")}catch{}setVoicePreference(true);setVoiceOn(true);setAudioMode("all");setProximityMicEnabled(true);peerVoiceTarget.current=null;
 }catch(e){const message=e instanceof Error?e.message:"Microphone could not start";setMicPermissionError(message);setHint("Microphone unavailable: "+message+". Check browser microphone permissions.");await stopVoice()}finally{setVoiceBusy(false)}},[voiceBusy,stopVoice]);
 useEffect(()=>{if(!voiceOn)return;const room=voiceRoom.current;if(!room)return;for(const el of voiceTracks.current.values()){el.muted=!speakerEnabled;if(speakerEnabled)void el.play().catch(()=>setHint("Tap the speaker button to enable game audio."));}},[voiceOn,speakerEnabled]);
 
 useEffect(()=>()=>{void shipRoom.current?.disconnect();void voiceRoom.current?.disconnect();for(const el of voiceTracks.current.values())el.remove();voiceTracks.current.clear()},[]);
 const drag=useRef<{x:number;y:number;id:number}|null>(null);
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{canvas.current?.focus();const g=gesture.current;const now=performance.now();if(local.current.flying){g.hold=true;keys.current.ascend=true}else if(local.current.y>(futureWorldRef.current?0:terrain(local.current.x,local.current.z))+.3){toggleFly();g.hold=true;keys.current.ascend=true}else if(now-g.lastTap<340){keys.current.Space=true;g.lastTap=0}else g.lastTap=now;g.downAt=now;drag.current={x:e.clientX,y:e.clientY,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!drag.current||drag.current.id!==e.pointerId)return;const delta=e.clientX-drag.current.x;const deltaY=e.clientY-drag.current.y;drag.current.x=e.clientX;drag.current.y=e.clientY;local.current.yaw-=delta*.008;lookPitch.current=clamp(lookPitch.current-deltaY*.005,-.55,.65)};
 return <section onPointerDown={wakeHud} ref={gameRoot} className={styles.root} style={gameFullscreen?{position:"fixed",inset:0,width:"100vw",height:"100dvh",zIndex:2147483647,borderRadius:0,margin:0}:undefined} aria-label="1Muslim shared 3D game lobby">
  {voiceInvite&&<div role="dialog" aria-modal="true" aria-label="Voice connection request" style={{position:"absolute",zIndex:65,top:"30%",left:"10%",width:"80%",borderRadius:18,padding:18,background:"rgba(4,38,34,.94)",color:"white",border:"1px solid #69e2af"}}><strong>🎙️ Voice request from {voiceInvite.name}</strong><p>Connect microphones in a private game voice room?</p><div style={{display:"flex",gap:10}}><button type="button" onClick={()=>{void combatChannel.current?.send({type:"broadcast",event:"voice-reply",payload:{toId:voiceInvite.fromId,fromUserId:local.current.userId,accepted:true}});peerVoiceTarget.current=voiceInvite.fromUserId;setVoiceInvite(null);setHint("Request accepted. Tap the top microphone to connect.")}}>Yes</button><button type="button" onClick={()=>{void combatChannel.current?.send({type:"broadcast",event:"voice-reply",payload:{toId:voiceInvite.fromId,accepted:false}});setVoiceInvite(null)}}>No</button></div></div>}
  {guestListOpen&&<aside aria-label="Players online" style={{position:"absolute",zIndex:45,top:"calc(max(8px,env(safe-area-inset-top)) + 54px)",left:8,width:"min(240px,calc(100% - 16px))",maxHeight:"min(300px,55dvh)",overflowY:"auto",border:"1px solid rgba(173,241,206,.38)",borderRadius:16,background:"rgba(6,36,37,.72)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",color:"#fff",padding:12,boxShadow:"0 12px 32px #0005"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><strong>👥 Players Online · {peerCount+1}</strong><button type="button" aria-label="Close player list" onClick={()=>setGuestListOpen(false)} style={{background:"transparent",color:"white",border:0,fontSize:20,cursor:"pointer"}}>×</button></div><div role="group" aria-label="Filter players by world" style={{display:"flex",gap:6,marginBottom:10}}>{(["here","all"] as const).map(filter=><button key={filter} type="button" aria-pressed={guestFilter===filter} onClick={()=>setGuestFilter(filter)} style={{flex:1,borderRadius:10,padding:"5px 8px",border:"1px solid #6eaf9a",background:guestFilter===filter?"#16785d":"#103e3b",color:"white"}}>{filter==="here"?"My World":"All Worlds"}</button>)}</div><div style={{display:"grid",gap:8,fontSize:13}}><span>🟢 {local.current.name&&local.current.name!=="Explorer"?local.current.name:"Guest"} (You) · {local.current.world||"Today"}</span>{lobbyGuests.filter(guest=>guestFilter==="all"||guest.world===(local.current.world||"Today")).map(guest=><span key={guest.id}>🟢 {guest.name} <small style={{opacity:.75}}>· {guest.world}</small>{guest.userId&&local.current.userId&&<button type="button" disabled={voiceRequestTo===guest.id} aria-label={"Request voice with "+guest.name} onClick={()=>{setVoiceRequestTo(guest.id);void combatChannel.current?.send({type:"broadcast",event:"voice-invite",payload:{fromId:local.current.id,fromUserId:local.current.userId,toId:guest.id,name:local.current.name||"Guest"}});window.setTimeout(()=>setVoiceRequestTo(v=>v===guest.id?null:v),30000)}} style={{marginLeft:8,border:0,borderRadius:8,background:"#165b4a",color:"white",padding:"3px 6px"}}>🎙️ {voiceRequestTo===guest.id?"Waiting":"Ask"}</button>}</span>)}</div></aside>}
  <div aria-label="Game lobby and voice toolbar" style={{position:"absolute",top:"max(8px,env(safe-area-inset-top))",left:8,right:8,zIndex:35,display:"flex",alignItems:"center",gap:6,pointerEvents:"none",maxWidth:"calc(100% - 16px)"}}>
    <button type="button" aria-label="Show players online" aria-expanded={guestListOpen} onClick={()=>setGuestListOpen(v=>!v)} style={{pointerEvents:"auto",display:"flex",alignItems:"center",gap:6,padding:"5px 8px",border:"1px solid rgba(228,213,169,.35)",borderRadius:22,background:"rgba(7,30,35,.46)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",color:"#fff",fontSize:11,minWidth:0,flex:"0 1 auto",cursor:"pointer"}}><span aria-hidden="true" style={{fontSize:18}}>👥</span><span style={{whiteSpace:"nowrap",lineHeight:1.2,textAlign:"left"}}><b>{peerCount+1} Online</b><br/><span style={{color:"#3de5a4"}}>1Muslim Games</span></span></button>
    <div style={{pointerEvents:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 8px",border:"1px solid rgba(177,211,226,.36)",borderRadius:22,background:"rgba(7,30,44,.44)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",color:"#fff",fontSize:11,minWidth:0,flex:"1 1 90px",maxWidth:220}}><span aria-hidden="true" style={{fontSize:18}}>🌐</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Lobby · Madinah Plaza</span></div>
    <div style={{display:"flex",gap:5,marginLeft:"auto",pointerEvents:"auto",flexShrink:0}}>
     <button type="button" disabled={voiceBusy} aria-label={voiceOn?"Mute microphone":"Turn on microphone"} aria-pressed={voiceOn} onClick={()=>{if(voiceOn){void stopVoice()}else{setSpeakerEnabled(true);void startVoice()}}} style={{width:39,height:39,borderRadius:"50%",border:"1px solid rgba(255,255,255,.52)",background:voiceOn?"rgba(0,171,98,.88)":"rgba(9,30,40,.5)",backdropFilter:"blur(16px)",color:"#fff",fontSize:19,boxShadow:voiceOn?"0 0 13px rgba(0,220,110,.48)":"none"}}>{voiceBusy?"…":voiceOn?"🎙️":"🎤"}</button>
     <button type="button" aria-label={speakerEnabled?"Mute other players":"Hear other players"} aria-pressed={speakerEnabled} onClick={()=>{setSpeakerEnabled(v=>!v);if(!speakerEnabled){void voiceRoom.current?.startAudio();for(const el of voiceTracks.current.values())void el.play().catch(()=>{})}}} style={{width:39,height:39,borderRadius:"50%",border:"1px solid rgba(255,255,255,.52)",background:speakerEnabled?"rgba(0,111,84,.65)":"rgba(9,30,40,.5)",backdropFilter:"blur(16px)",color:"#fff",fontSize:19}}>{speakerEnabled?"🔊":"🔇"}</button>
     <button type="button" aria-label="Open game chat" onClick={()=>{setChatAutoVisible(false);if(chatAutoTimer.current)clearTimeout(chatAutoTimer.current);setGameSettingsOpen(v=>!v)}} style={{width:39,height:39,borderRadius:"50%",border:"1px solid rgba(255,255,255,.52)",background:gameSettingsOpen?"rgba(0,161,105,.75)":"rgba(9,30,40,.5)",backdropFilter:"blur(16px)",color:"#fff",fontSize:19}}>💬</button>
    </div>
   </div>
  {!voiceOn&&!voiceBusy&&<button type="button" onClick={()=>{setSpeakerEnabled(true);void startVoice()}} aria-label="Enable game voice and request microphone permission" style={{position:"absolute",top:58,right:12,zIndex:35,border:"1px solid rgba(95,236,178,.7)",borderRadius:13,padding:"7px 11px",background:"rgba(3,45,39,.72)",backdropFilter:"blur(14px)",color:"#e7fff4",fontSize:12}}>🎙️ {voicePreference?"Reconnect voice":"Tap to enable voice"}</button>}
  {micPermissionError&&<div role="alert" style={{position:"absolute",top:62,right:12,zIndex:36,maxWidth:280,padding:10,borderRadius:12,background:"rgba(56,14,14,.92)",color:"#fff",fontSize:12}}>Mic blocked: {micPermissionError}. Allow microphone in browser settings. <button type="button" onClick={()=>setMicPermissionError("")} aria-label="Dismiss microphone warning">×</button></div>}
  <button type="button" onClick={()=>setGameSettingsOpen(v=>!v)} aria-label="Game settings" aria-expanded={gameSettingsOpen} style={{position:"absolute",top:"max(58px,calc(env(safe-area-inset-top) + 50px))",right:"max(12px,env(safe-area-inset-right))",zIndex:30,width:34,height:34,borderRadius:11,border:"1px solid rgba(226,204,142,.32)",background:"rgba(4,42,37,.32)",backdropFilter:"blur(10px)",color:"white",fontSize:18,cursor:"pointer"}}>⚙️</button>
  {(gameSettingsOpen||chatAutoVisible)&&<aside aria-label="Game quick settings and recent comments" style={{position:"absolute",right:10,top:"calc(max(12px,env(safe-area-inset-top)) + 48px)",zIndex:40,width:"min(290px,calc(100% - 20px))",height:"min(460px,65dvh)",opacity:chatClosing?0:1,transition:"opacity 350ms ease",padding:10,borderRadius:17,background:"rgba(4,36,40,.43)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(145,216,235,.38)",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.12)",display:"flex",flexDirection:"column",gap:6,pointerEvents:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,fontWeight:750}}><span>💬 Lobby Comments · Last 15 min</span><button type="button" onClick={()=>{setGameSettingsOpen(false);setChatAutoVisible(false);if(chatAutoTimer.current)clearTimeout(chatAutoTimer.current)}} aria-label="Close quick settings" style={{border:0,background:"transparent",color:"white",fontSize:20}}>×</button></div><div aria-label="Recent game chat" style={{flex:"3 1 0",minHeight:0,overflowY:"auto",display:"flex",flexDirection:"column",gap:5,padding:"4px 2px"}}>{visibleLobbyComments.length?visibleLobbyComments.map(m=><div key={m.id} style={{fontSize:12,padding:"7px 9px",borderRadius:10,background:"rgba(0,31,33,.25)",overflowWrap:"anywhere"}}><strong style={{color:"#e8d7a2"}}>{m.mine?"You":m.sender}: </strong>{m.text}</div>):<span style={{fontSize:11,opacity:.7}}>No lobby comments in the last 15 minutes</span>}</div><form onSubmit={e=>{e.preventDefault();sendLobbyChat()}} style={{display:"flex",gap:5,alignItems:"center",padding:"3px 0 6px",borderBottom:"1px solid rgba(191,234,223,.22)"}}><input aria-label="Write public game comment" placeholder={online?"Message everyone…":"Connecting to game chat…"} value={lobbyChatDraft} onChange={e=>setLobbyChatDraft(e.target.value)} maxLength={300} disabled={!online} onKeyDown={e=>e.stopPropagation()} style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:12,border:"1px solid rgba(145,216,235,.28)",background:"rgba(0,22,27,.3)",color:"white",fontSize:12,outlineOffset:2}}/><button type="submit" disabled={!online||!lobbyChatDraft.trim()} aria-label="Send public game comment" style={{borderRadius:11,padding:"8px 11px",border:"1px solid rgba(218,189,113,.42)",background:"rgba(12,108,85,.52)",color:"white",opacity:online&&lobbyChatDraft.trim()?1:.45}}>➤</button></form></aside>}

  <button type="button" aria-controls="game-world-settings-map" aria-expanded={worldMapOpen} aria-label={worldMapOpen?"Close world map":"Open world settings map"} onClick={()=>setWorldMapOpen(v=>!v)} style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:"max(12px,env(safe-area-inset-left))",zIndex:30,width:42,height:42,borderRadius:13,border:"1px solid rgba(191,234,223,.5)",background:"rgba(5,45,43,.55)",backdropFilter:"blur(15px)",color:"#fff",fontSize:22,cursor:"pointer"}}>{worldMapOpen?"✕":"🗺️"}</button>
  {worldMapOpen&&<aside id="game-world-settings-map" aria-label="World exploration map" style={{position:"absolute",top:"calc(max(12px,env(safe-area-inset-top)) + 50px)",left:"max(12px,env(safe-area-inset-left))",width:"min(340px,calc(100% - 24px))",maxHeight:"min(78dvh,680px)",overflowY:"auto",overscrollBehavior:"contain",zIndex:29,padding:14,borderRadius:20,border:"1px solid rgba(182,230,218,.45)",background:"linear-gradient(150deg,rgba(3,39,42,.68),rgba(8,45,58,.53))",boxShadow:"0 15px 55px rgba(0,0,0,.25)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",color:"#fff",touchAction:"pan-y"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8}}><strong style={{letterSpacing:".06em",fontSize:13}}>✦ WORLD EXPLORER</strong><span style={{fontSize:11,opacity:.8}}>Live position · 5 cities</span></div>
    <svg viewBox="0 0 320 320" role="img" aria-label="Map showing your current position, five cities, roads, lake, skywalk, arena and tunnels" style={{width:"100%",height:"auto",display:"block",borderRadius:14,background:"rgba(2,22,27,.38)",border:"1px solid rgba(193,228,222,.18)"}}>
      <defs><pattern id="game-world-map-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(190,240,230,.12)" strokeWidth="1"/></pattern></defs>
      <rect width="320" height="320" fill="url(#game-world-map-grid)"/>
      <ellipse cx={mapX(-790)} cy={mapY(720)} rx={350*320/(EXPLORATION_BOUNDS.maxX-EXPLORATION_BOUNDS.minX)} ry={280*320/(EXPLORATION_BOUNDS.maxZ-EXPLORATION_BOUNDS.minZ)} fill="rgba(41,159,219,.35)" stroke="rgba(119,211,255,.75)" strokeWidth="1.2"/>
      {CITY_WAYPOINTS.map(city=><line key={"road-"+city.name} x1={mapX(0)} y1={mapY(0)} x2={mapX(city.x)} y2={mapY(city.z)} stroke="rgba(240,216,150,.36)" strokeWidth="2" strokeDasharray="5 4"/>)}
      <line x1={mapX(-6)} y1={mapY(70)} x2={mapX(-110)} y2={mapY(1580)} stroke="#98ecf2" strokeWidth="3" strokeDasharray="3 3"><title>Glass skywalk to Beach City</title></line>
      <circle cx={mapX(180)} cy={mapY(-780)} r="5" fill="#e6a96a"><title>Sports arena</title></circle>
      <circle cx={mapX(0)} cy={mapY(-890)} r="5" fill="#c8c9cc"><title>Mountain tunnels</title></circle>
      {CITY_WAYPOINTS.map(city=><g key={city.name}><circle cx={mapX(city.x)} cy={mapY(city.z)} r="7" fill={city.color} stroke="#fff" strokeWidth="1.5"><title>{city.name} — {city.description}</title></circle><text x={mapX(city.x)} y={mapY(city.z)-11} fill="#fff" stroke="rgba(0,25,26,.85)" strokeWidth="2.5" paintOrder="stroke" textAnchor="middle" fontSize="10" fontWeight="700">{city.name}</text></g>)}
      <circle cx={mapX(0)} cy={mapY(0)} r="4" fill="#f8e0a1"><title>Home / spawn</title></circle>
      <circle cx={mapX(mapPlayer.x)} cy={mapY(mapPlayer.z)} r="10" fill="rgba(76,255,186,.18)" stroke="#63ffc5" strokeWidth="1.5"/>
      <circle cx={mapX(mapPlayer.x)} cy={mapY(mapPlayer.z)} r="4" fill="#63ffc5"><title>Your current position</title></circle>
      <text x="302" y="18" textAnchor="end" fill="#c6f3e7" fontSize="11">N ↑</text>
    </svg>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,marginTop:8,color:"#c6f3e7"}}><span>🟢 You · X {Math.round(mapPlayer.x)}, Z {Math.round(mapPlayer.z)}</span><span>Routes are approximate</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",marginTop:10,fontSize:11}}>{CITY_WAYPOINTS.map(city=><div key={city.name} style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><span aria-hidden="true" style={{background:city.color,width:9,height:9,borderRadius:"50%",flexShrink:0}}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{city.name} · {Math.round(Math.hypot(city.x-mapPlayer.x,city.z-mapPlayer.z))}m</span></div>)}</div>
    <p style={{fontSize:11,margin:"10px 0 0",color:"#d1e9e3",lineHeight:1.5}}>🏟 Arena · ⛰ Mountain tunnels · 🌊 Lake · ✧ Glass skywalk · 🏖 Beach. Explore on foot or fly; this map does not teleport players.</p>
  </aside>}
  {showFlyTutorial&&<div role="status" aria-live="polite" style={{position:"absolute",top:"18%",left:"50%",transform:"translateX(-50%)",width:"min(330px,calc(100% - 40px))",padding:"18px 22px",borderRadius:22,background:"rgba(5,29,28,.48)",backdropFilter:"blur(15px)",WebkitBackdropFilter:"blur(15px)",border:"1px solid rgba(223,207,138,.32)",boxShadow:"0 12px 35px rgba(0,0,0,.18)",color:"#fff",textAlign:"center",zIndex:28,pointerEvents:"none",animation:"fadeOut .55s ease 3.05s forwards"}}><div style={{fontSize:30,marginBottom:5}}>👆 👆 ✋ ✨</div><div style={{fontSize:22,fontWeight:850,letterSpacing:".02em",textShadow:"0 2px 9px rgba(0,0,0,.7)"}}>TAP · TAP · HOLD</div><div style={{fontSize:16,fontWeight:650,marginTop:6,textShadow:"0 2px 8px rgba(0,0,0,.75)"}}>Take off and fly! 🕊️</div></div>}
  <canvas ref={canvas} className={styles.canvas} tabIndex={0} aria-label="Third-person 3D world; click to control. WASD move, mouse drag look, Space jump or ascend, F fly, Shift boost, C descend." onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}} onPointerCancel={()=>{drag.current=null;keys.current.ascend=false;gesture.current.hold=false}}/>

  <div ref={councilCenterpiece} aria-label="BeltBoyz photo at the center of the council table" style={{display:"none",position:"absolute",zIndex:4,pointerEvents:"none",borderRadius:"50%",border:"4px solid #dfb85d",background:"rgba(9,30,31,.78)",boxShadow:"0 0 24px rgba(235,187,77,.85),inset 0 0 12px rgba(255,232,153,.45)",overflow:"hidden",transform:"scaleY(.65)",transformOrigin:"center"}}><img src="/assets/game/beltboyz/IMG_1454.jpeg" alt="BeltBoyz Council centerpiece" style={{display:"block",width:"100%",height:"100%",objectFit:"contain"}}/><div style={{position:"absolute",inset:0,borderRadius:"50%",background:"linear-gradient(130deg,rgba(255,255,255,.18),transparent 48%,rgba(8,255,196,.08))"}}/></div>
  <div aria-label="Belt Boyz Council graffiti and Islamic calligraphy" style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",overflow:"hidden"}}>
    <div ref={councilArt} style={{display:"none",position:"absolute",width:340,height:120,transformOrigin:"center",borderRadius:14,background:"linear-gradient(125deg,rgba(8,20,26,.94),rgba(9,48,45,.9))",border:"2px solid rgba(224,181,76,.85)",boxShadow:"0 0 30px rgba(15,201,162,.3)",overflow:"hidden",textAlign:"center",color:"#f6d17a",padding:"8px 12px"}}>
      <div style={{fontWeight:1000,fontSize:29,letterSpacing:3,transform:"rotate(-3deg)",fontStyle:"italic",textShadow:"3px 3px #008b74,-2px -1px #d59c37,0 0 12px #37dcb8"}}>BELT BOYZ</div>
      <div style={{fontSize:11,letterSpacing:5,color:"#a9f1d7"}}>THE COUNCIL</div>
      <div lang="ar" dir="rtl" style={{fontFamily:"serif",fontSize:25,lineHeight:1.5,color:"#ffe8a6",textShadow:"0 0 10px rgba(234,196,111,.5)"}}>ﷲ &nbsp; • &nbsp; الإسلام</div>
    </div>
  </div>
  <div ref={councilProjection} aria-label="Belt Boyz Council projector" style={{position:"absolute",display:"none",width:260,aspectRatio:"16 / 9",zIndex:3,pointerEvents:"none",border:"3px solid #c8ac60",borderRadius:5,background:"#061b22",overflow:"hidden",boxShadow:"0 0 20px rgba(75,225,217,.35)"}}><video ref={councilVideo} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"contain",display:councilSharing?"block":"none"}}/>{!councilSharing&&<div style={{height:"100%",display:"grid",placeContent:"center",textAlign:"center",color:"#bcefe8",fontSize:13}}><strong>BELT BOYZ COUNCIL</strong><small>PROJECTOR · Awaiting screen share</small></div>}</div>
  <div ref={labels} aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:4}}/>
  <div style={{position:"absolute",left:"50%",top:"48%",transform:"translate(-50%,-50%)",zIndex:6,color:"#f8e6a4",fontSize:26,pointerEvents:"none",textShadow:"0 0 12px #001b19"}}>⊕</div>
  {spaceEdgeWarning&&<div aria-live="assertive" style={{position:"absolute",inset:0,border:"5px solid rgba(255,43,52,.9)",boxShadow:"inset 0 0 45px rgba(255,0,35,.5)",pointerEvents:"none",zIndex:28,animation:"pulse 0.45s ease-in-out infinite alternate"}}><span style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",background:"rgba(70,0,10,.8)",padding:"8px 12px",borderRadius:10,color:"#fff",fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}>⚠️ SPACE LIMIT · 2 SEC TO DESCEND</span></div>}
  {nearbyPlayers.length>0&&<div aria-label="Nearby players" style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",zIndex:18,display:"flex",flexDirection:"column",gap:3,maxWidth:"min(210px,46vw)",pointerEvents:"auto"}}>{nearbyPlayers.map(p=><div key={p.id} style={{padding:"2px 6px",borderRadius:10,background:"rgba(4,37,40,.22)",border:"1px solid rgba(177,235,220,.14)",backdropFilter:"blur(8px)",color:"#fff",fontSize:11,textAlign:"center"}}><button type="button" onClick={()=>p.feet<=5&&setSelectedNearbyPlayer(v=>v===p.id?null:p.id)} aria-label={p.feet<=5?"Open "+p.name+" profile card":p.name+" is "+Math.round(p.feet)+" feet away"} style={{border:0,background:"transparent",color:"white",fontSize:11,cursor:p.feet<=5?"pointer":"default"}}>👤 {p.name} · {Math.round(p.feet)} ft</button>{p.feet<=5&&selectedNearbyPlayer===p.id&&<div style={{display:"flex",gap:5,justifyContent:"center",paddingTop:4}}><button type="button" disabled title="Follow integration pending">＋ Follow</button><button type="button" disabled title="Persistent direct-message integration pending">✉ DM</button></div>}</div>)}</div>}
  <div style={{position:"absolute",right:12,bottom:82,zIndex:12,display:"flex",flexDirection:"column-reverse",gap:6,alignItems:"flex-end"}}>
    
    <button type="button" onClick={()=>setShield(v=>!v)} aria-label={shield?"Disable defense shield":"Activate defense shield"} aria-pressed={shield} style={{borderRadius:"50%",width:42,height:42,background:shield?"rgba(36,148,255,.58)":"rgba(12,77,138,.30)",border:"1px solid rgba(141,214,255,.42)",color:"#e5f8ff",fontSize:21,backdropFilter:"blur(12px)"}}>🛡️</button>
    <button type="button" onClick={()=>{setEmote("hand");emoteUntil.current=performance.now()+5000;if(meetingSeatRef.current!==null)setMeetingGesture("hand");}} aria-label="Raise hand gesture" style={{borderRadius:"50%",width:46,height:46,background:"rgba(9,92,76,.30)",color:"#fff",border:"1px solid rgba(231,196,119,.48)",backdropFilter:"blur(12px)",fontSize:23}}>🙋</button>
    {(jurassicWorld||futureWorld||propheticWorld)&&<button type="button" title="Return to main lobby" aria-label="Return to main lobby" onClick={()=>{if(jurassicWorld)exitJurassicWorld();else if(futureWorld)exitFutureWorld();else if(propheticWorld)exitPropheticWorld()}} style={{width:46,height:46,borderRadius:"50%",display:"grid",placeItems:"center",background:"radial-gradient(circle at 35% 25%,rgba(66,198,169,.5),rgba(6,39,61,.87))",border:"1px solid rgba(138,236,212,.7)",boxShadow:"0 0 16px rgba(41,194,161,.23),inset 0 1px 5px #ffffff25",backdropFilter:"blur(14px)",cursor:"pointer"}}><span aria-hidden="true" style={{fontSize:25,filter:"drop-shadow(0 1px 3px #021f2b)"}}>🌍</span></button>}
    <button type="button" onClick={nearNabawi?()=>setPrayerMenuOpen(v=>!v):()=>{if(autoFirePointer.current===null)fireShot()}} onPointerDown={e=>{if(nearNabawi||e.button!==0)return;e.preventDefault();e.stopPropagation();stopAutoFire();autoFirePointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);fireShot();autoFireTimer.current=setInterval(fireShot,100)}} onPointerUp={stopAutoFire} onPointerCancel={stopAutoFire} onLostPointerCapture={stopAutoFire} onContextMenu={e=>e.preventDefault()} aria-label={nearNabawi?"Prayer positions":"Shoot; hold for automatic fire"} style={{borderRadius:40,width:46,height:46,background:"rgba(9,92,76,.30)",color:"#fff",fontWeight:900,border:"1px solid rgba(231,196,119,.48)",backdropFilter:"blur(12px)",fontSize:22}}>{nearNabawi?"🤲":<svg aria-hidden="true" width="31" height="31" viewBox="0 0 36 36" fill="none"><path d="M5 13.5 24 9l6 3-1 6-9 2-4 10-6-2 2-10-7-1z" fill="#1de5a3" stroke="#b5ffe1" strokeWidth="1.4" strokeLinejoin="round"/><path d="m7 14 19-3M14 18l7-1" stroke="#064b43" strokeWidth="2.4" strokeLinecap="round"/><path d="m29 14 4-1" stroke="#f8d777" strokeWidth="2.5" strokeLinecap="round"/></svg>}</button>
  </div>
  {nearNabawi&&prayerMenuOpen&&<div role="group" aria-label="Prayer positions" style={{position:"absolute",right:66,bottom:85,zIndex:32,display:"flex",flexDirection:"column",gap:7,padding:9,borderRadius:15,background:"rgba(4,40,30,.88)",border:"1px solid #bfa35d"}}>{([["ruku","Bow (Rukūʿ)"],["sujud","Prostrate (Sujūd)"],["sitting","Sit on knees"]] as const).map(([pose,label])=><button key={pose} type="button" aria-pressed={prayerPosture===pose} onClick={()=>togglePrayerPosture(pose)} style={{padding:"9px 12px",borderRadius:10,color:"#fff",border:"1px solid #bfa35d",background:prayerPosture===pose?"#197654":"rgba(255,255,255,.07)"}}>{label}</button>)}</div>}
   {downed&&<div style={{position:"absolute",left:"25%",right:"25%",top:"38%",zIndex:13,background:"#10362eea",border:"1px solid #edc16c",borderRadius:18,padding:18,textAlign:"center",color:"white"}}>💥 Knocked down — getting up…</div>}
  {meetingSeat===null&&Math.hypot(local.current.x+125,local.current.z+120)<48&&<button type="button" onClick={()=>{const seat=Array.from({length:12},(_,i)=>i).find(i=>!Array.from(peerRef.current.values()).some(o=>Math.hypot(o.x-(-125+Math.cos(i*Math.PI/6)*15),o.z-(-120+Math.sin(i*Math.PI/6)*15))<3));if(seat===undefined){setHint("All council seats are occupied.");return;}meetingSeatRef.current=seat;setMeetingSeat(seat);setBoostActive(false);setMeetingGesture("rest");meetingGestureRef.current="rest";setCouncilMembers(old=>({...old,[local.current.id]:{name:local.current.name||"You",gesture:"rest",joined:Date.now()}}));void combatChannel.current?.send({type:"broadcast",event:"council-state",payload:{id:local.current.id,name:local.current.name||"Guest",gesture:"rest",joined:true}});void combatChannel.current?.send({type:"broadcast",event:"council-sync-request",payload:{id:local.current.id}});}} style={{position:"absolute",top:102,left:"50%",transform:"translateX(-50%)",zIndex:30,background:"#064b3dcc",border:"1px solid #d7bd70",color:"white",padding:"10px 16px",borderRadius:22}}>🪑 Join BeltBoyz Meeting</button>}
  {meetingSeat!==null&&<div style={{position:"absolute",right:12,top:100,zIndex:42,display:"flex",gap:6,alignItems:"center",background:"rgba(4,35,34,.7)",border:"1px solid rgba(219,185,107,.55)",borderRadius:18,padding:7,backdropFilter:"blur(14px)"}}>{([["↶",()=>meetingCamera.current.angle-=.25],["↷",()=>meetingCamera.current.angle+=.25],["＋",()=>meetingCamera.current.distance=Math.max(12,meetingCamera.current.distance-3)],["－",()=>meetingCamera.current.distance=Math.min(54,meetingCamera.current.distance+3)]] as const).map(([label,action])=><button type="button" key={label} onClick={action} style={{width:34,height:34,borderRadius:10,color:"white",background:"#21584c"}}>{label}</button>)}</div>}
  {meetingSeat!==null&&<div style={{position:"absolute",left:12,right:12,top:148,zIndex:41,display:"flex",gap:5,overflowX:"auto",pointerEvents:"auto"}}>{[local.current,...Array.from(peerRef.current.values())].filter((a,i,all)=>all.findIndex(b=>b.id===a.id)===i&&Math.hypot(a.x+125,a.z+120)<25).map(a=><button type="button" key={a.id} onClick={()=>{setSelectedCouncilPlayer(a.name||a.id);meetingCamera.current.angle=Math.atan2(a.x+125,a.z+120)}} style={{borderRadius:14,padding:"7px 10px",background:selectedCouncilPlayer===(a.name||a.id)?"rgba(23,133,96,.92)":"rgba(5,35,37,.67)",border:"1px solid #a99863",color:"white",whiteSpace:"nowrap",backdropFilter:"blur(12px)"}}>👤 {a.name||"Guest"}</button>)}</div>}
  {meetingSeat!==null&&<div style={{position:"absolute",left:12,right:12,bottom:16,zIndex:40,padding:12,borderRadius:18,background:"rgba(4,35,34,.76)",backdropFilter:"blur(16px)",border:"1px solid rgba(219,185,107,.65)",color:"white"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}><strong>🏛️ BeltBoyz Council · Seat {meetingSeat+1}</strong><div style={{display:"flex",gap:5}}><button type="button" onClick={()=>void joinCouncilMedia()} style={{padding:7,background:"#286e5e",color:"white"}}>{councilConnected?"✓ Projector connected":"Connect projector"}</button><button type="button" onClick={()=>void (councilSharing?stopCouncilScreen():shareCouncilScreen())} style={{padding:7,background:"#286e5e",color:"white"}}>{councilSharing?"Stop share":"🖥️ Share screen"}</button></div><button type="button" onClick={()=>{void combatChannel.current?.send({type:"broadcast",event:"council-state",payload:{id:local.current.id,joined:false}});setCouncilMembers(old=>{const next={...old};delete next[local.current.id];return next});meetingSeatRef.current=null;setMeetingSeat(null);setMeetingGesture("rest");meetingGestureRef.current="rest";local.current.flying=false;local.current.boost=false;local.current.yaw=0;local.current.x=-125;local.current.z=-120+18;local.current.y=45;setFlying(false);setBoostActive(false);}} style={{background:"#285b52",color:"white",padding:"8px 12px",borderRadius:12}}>✕</button></div><div style={{display:"flex",gap:8,marginTop:10}}>{([["rest","🪑 Sit"],["hand","✋ Raise hand"],["lean","🙇 Lean forward"]] as const).map(([g,label])=><button key={g} type="button" onClick={()=>{setMeetingGesture(g);meetingGestureRef.current=g;setCouncilMembers(old=>({...old,[local.current.id]:{name:local.current.name||"You",gesture:g,joined:old[local.current.id]?.joined||Date.now()}}));void combatChannel.current?.send({type:"broadcast",event:"council-state",payload:{id:local.current.id,name:local.current.name||"Guest",gesture:g,joined:true}})}} style={{flex:1,background:meetingGesture===g?"#218367":"#214944",border:"1px solid #b4a06d",borderRadius:12,padding:"9px 4px",color:"white",fontSize:12}}>{label}</button>)}</div><div style={{marginTop:8,fontSize:12,opacity:.85}}>🎙️ {voiceOn?"Mic on":"Mic off"} · {meetingGesture==="hand"?"Hand raised":meetingGesture==="lean"?"Leaning toward table":"Seated"} · Movement, blasters and boost disabled</div></div>}
  {meetingSeat!==null&&<div style={{position:"absolute",top:200,left:12,right:12,zIndex:43,maxHeight:"32%",overflowY:"auto",border:"1px solid #a99863",borderRadius:14,padding:8,background:"rgba(4,35,34,.85)",color:"white",fontSize:12}}><strong>👥 Meeting participants ({Object.keys(councilMembers).length})</strong><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>{Object.entries(councilMembers).map(([key,p])=><span key={key} style={{padding:"5px 8px",border:"1px solid #5c9d8a",borderRadius:10}}>{p.gesture==="hand"?"✋":p.gesture==="lean"?"🙇":"🪑"} {p.name}{key===local.current.id?" (You)":""}</span>)}</div><button type="button" onClick={()=>setCouncilChatOpen(v=>!v)} style={{marginTop:8,padding:8,borderRadius:9,background:"#276c5b",color:"white"}}>💬 {councilChatOpen?"Hide":"Open"} meeting chat ({councilChat.length})</button>{councilChatOpen&&<div><div role="log" aria-label="Meeting messages" style={{maxHeight:120,overflowY:"auto",margin:"8px 0"}}>{councilChat.map(m=><p key={m.id} style={{margin:"4px 0"}}><b>{m.sender}: </b>{m.text}</p>)}</div><form onSubmit={e=>{e.preventDefault();const message=councilDraft.trim().slice(0,300);if(!message)return;const msg={id:local.current.id+"-"+Date.now(),sender:local.current.name||"You",text:message};setCouncilChat(old=>[...old.slice(-99),msg]);setCouncilDraft("");void combatChannel.current?.send({type:"broadcast",event:"council-chat",payload:msg});}} style={{display:"flex",gap:6}}><input aria-label="Meeting chat message" maxLength={300} value={councilDraft} onChange={e=>setCouncilDraft(e.target.value)} placeholder="Message everyone…" style={{minWidth:0,flex:1,padding:9,borderRadius:9,background:"#123c37",color:"white"}}/><button type="submit" style={{padding:"8px 12px",borderRadius:9,background:"#218367",color:"white"}}>Send</button></form></div>}</div>}
  {nearMainStreetShop&&!combatShop&&<button type="button" onClick={()=>{setStoreTab("store");setCombatShop(true)}} style={{position:"absolute",bottom:182,left:"50%",transform:"translateX(-50%)",zIndex:18,padding:"11px 18px",borderRadius:25,background:"rgba(5,50,44,.84)",border:"1px solid #d7c06e",color:"#fff",fontWeight:750,backdropFilter:"blur(12px)"}}>✦ Enter Main Street Blaster Shop</button>}
  {combatShop&&<div style={{position:"absolute",left:12,right:12,bottom:164,zIndex:14,maxWidth:370,margin:"auto",background:"linear-gradient(140deg,#052f2bef,#102536f2)",border:"1px solid #d6b76b",borderRadius:22,padding:16,color:"#fff",boxShadow:"0 15px 40px #0008"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>✦ 1Muslim Explorer Store</strong><button onClick={()=>setCombatShop(false)}>✕</button></div><div style={{display:"flex",gap:8,margin:"10px 0"}}><button type="button" onClick={()=>setStoreTab("store")} style={{flex:1,padding:8,borderRadius:10,background:storeTab==="store"?"#177b63":"#153d3a",color:"white"}}>🛍️ Store</button><button type="button" onClick={()=>setStoreTab("loadout")} style={{flex:1,padding:8,borderRadius:10,background:storeTab==="loadout"?"#177b63":"#153d3a",color:"white"}}>👤 Avatar & Gear</button></div><p style={{fontSize:12,color:"#f1d98b"}}>Demo XP: {combatXp.toLocaleString()} · Purchases saved for this session only</p>{storeTab==="loadout"&&<div style={{padding:"8px 0",color:"#a9ead8"}}>👤 Explorer Avatar · {local.current.suit.toUpperCase()} suit · Boost x{boostLevel}</div>}{storeTab==="store"&&<>{([{id:"pulse",name:"Emerald Pulse",cost:0},{id:"nova",name:"Nova Blaster · faster, shield piercing",cost:2500},{id:"titan",name:"Titan Cannon · 3× structure damage, 165 speed",cost:4500}] as const).map(item=><button key={item.id} onClick={()=>{if(!ownedWeapons.includes(item.id)){if(combatXp<item.cost)return;setCombatXp(x=>x-item.cost);setOwnedWeapons(a=>[...a,item.id]);}setWeapon(item.id);}} style={{display:"block",width:"100%",padding:10,marginBottom:8,borderRadius:12,background:weapon===item.id?"#247d66":"#113f3b",border:"1px solid #8cba9b",color:"white",textAlign:"left"}}>{item.name} · {ownedWeapons.includes(item.id)?weapon===item.id?"Equipped":"Owned":item.cost+" XP"}</button>)}<button onClick={()=>{if(shield){setShield(false);return;}if(combatXp>=1500){setCombatXp(x=>x-1500);setShield(true);}}} style={{width:"100%",padding:10,borderRadius:12,background:"#124c45",color:"white",border:"1px solid #c6a85d"}}>🛡️ {shield?"Shield ON (tap to disable)":"Defense Shield · 1500 XP"}</button><button type="button" onClick={()=>{const cost=boostLevel*1000;if(boostLevel>=10||combatXp<cost)return;setCombatXp(x=>x-cost);setBoostLevel(x=>x+1)}} style={{width:"100%",padding:10,marginTop:8,borderRadius:12,background:"#124c45",color:"white",border:"1px solid #c6a85d"}}>⚡ Booster x{boostLevel} → x{Math.min(10,boostLevel+1)} · {boostLevel>=10?"MAX":boostLevel*1000+" XP"}</button></>}</div>}
  {/* Compact in-game invitation cards: never open a full-screen chat panel. */}
  {showInfo&&workerMessage&&<div role="dialog" aria-label="Construction worker" style={{position:"absolute",left:"12%",right:"12%",bottom:"24%",zIndex:9,background:"#092f2deb",border:"1px solid #e8c56e",borderRadius:18,color:"white",padding:18,textAlign:"center"}}><strong>🚀 Space Station Worker</strong><p>Come back soon… we’re going to the Moon! 🌙</p><button onClick={()=>setWorkerMessage(false)} style={{padding:"8px 18px",borderRadius:12}}>See you soon!</button></div>}
  <div ref={panel} className={styles.liveScreen}><div className={styles.liveHeader}>◉ 1MUSLIM LIVE</div>{live?<><div className={styles.liveVideo}><LiveHomePreview roomName={live.room_name||live.id}/></div><a href={"/streaming/live/"+live.id} className={styles.watch}>Watch {live.title} ↗</a></>:<div className={styles.waiting}><span className={styles.spinner}>◌</span><strong>Loading — waiting for the next 1Muslim Live</strong><small>{liveError?"Live status temporarily unavailable":"Broadcast will appear when someone goes live"}</small></div>}</div>
  {!piloting&&nearVehicle==="plane"&&<button type="button" onClick={togglePlane} style={{position:"absolute",right:12,top:95,zIndex:9,padding:"11px 15px",borderRadius:12,background:"#0b5547",color:"white",border:"1px solid #d3ae54"}}>✈️ Board Plane (E)</button>}
  {!shipOn&&nearVehicle==="ship"&&<button type="button" onClick={boardShip} style={{position:"absolute",right:12,top:95,zIndex:9,padding:12,borderRadius:12,background:"#134e58",color:"#fff"}} aria-label="Board spaceship" title="Board spaceship">🚀</button>}
  
  {eva&&<div style={{position:"absolute",right:12,top:95,zIndex:10,padding:12,borderRadius:12,background:"#071824ed",color:"white"}}><strong>🧑‍🚀 SPACEWALK · ZERO GRAVITY</strong><div>WASD move · SPACE up · C down</div><button onClick={reboardShip} disabled={Math.hypot(local.current.x-ship.current.x,local.current.y-ship.current.y,local.current.z-ship.current.z)>24}>🚀 Re-enter ship</button></div>}
  {showInfo&&missionControl&&shipOn&&<button type="button" onClick={()=>setShowInfo(false)} aria-label="Dismiss mission message" style={{position:"absolute",left:"50%",top:15,transform:"translateX(-50%)",zIndex:12,padding:"9px 14px",borderRadius:14,background:"#053b36df",border:"1px solid #d6ba72",color:"#fff",fontSize:12,maxWidth:"80%",textAlign:"center",cursor:"pointer"}}>{missionMessage}</button>}  {moonArrivalPrompt&&<div role="dialog" aria-label="Moon landing invitation" style={{position:"absolute",left:"50%",top:"36%",transform:"translateX(-50%)",zIndex:35,width:"min(290px,85%)",background:"rgba(6,24,38,.86)",backdropFilter:"blur(18px)",border:"1px solid rgba(235,204,122,.7)",borderRadius:18,padding:18,textAlign:"center",color:"white"}}><strong>🌕 Arrived at the Moon</strong><p>Land and walk through the lunar settlement?</p><div style={{display:"flex",justifyContent:"center",gap:12}}><button type="button" onClick={landOnMoon}>Yes · Land</button><button type="button" onClick={declineMoonWalk}>No · Stay aboard</button></div></div>}
  {moonLanded&&!moonWalk&&<button type="button" onClick={landOnMoon} style={{position:"absolute",top:76,right:12,zIndex:18}}>🌕 Walk on Moon</button>}
  {moonLanded&&<button type="button" onClick={exitShip} style={{position:"absolute",bottom:180,right:12,zIndex:18,background:"rgba(5,37,46,.6)",color:"white",border:"1px solid #d6ba72",borderRadius:12,padding:8}} aria-label="Return to Earth" title="Return to Earth">🌍</button>}
  {piloting&&<div style={{position:"absolute",right:12,top:95,zIndex:9,background:"#102f36e8",color:"white",padding:12,borderRadius:12}}><strong>✈️ PILOT MODE</strong><div>▲ Throttle · ▼ Brake · ◀ ▶ Turn</div><div>SPACE Climb · C Descend</div><button type="button" onClick={togglePlane} style={{padding:9,marginTop:6}}>Exit aircraft (E)</button></div>}
  {showInfo&&crashed&&<div className={styles.toast} role="status">💥 Hard landing! Recovering…</div>}
  <div className={styles.controls}><div role="group" aria-label="Analog movement joystick" onTouchStartCapture={e=>e.stopPropagation()} onTouchMoveCapture={e=>{e.stopPropagation();if(e.cancelable)e.preventDefault()}} onPointerDown={e=>{e.preventDefault();e.stopPropagation();stickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveStick(e)}} onPointerMove={e=>{e.stopPropagation();moveStick(e)}} onPointerUp={e=>{e.stopPropagation();releaseStick(e)}} onPointerCancel={releaseStick} onLostPointerCapture={e=>{if(stickPointer.current===e.pointerId)releaseStick(e)}} style={{width:124,height:124,borderRadius:"50%",position:"relative",touchAction:"none",pointerEvents:"auto",background:"radial-gradient(circle,#1a60584d,#092c2a44)",border:"1px solid #b9e6d07a",boxShadow:"inset 0 0 24px #071d1c66",flexShrink:0}}><div style={{position:"absolute",inset:25,borderRadius:"50%",border:"1px solid #c5d6bc44",pointerEvents:"none"}}/>{(["▲", "◀", "▶", "▼"] as const).map((arrow,i)=><span key={arrow} aria-hidden="true" style={{position:"absolute",left:i===1?"14%":i===2?"86%":"50%",top:i===0?"14%":i===3?"86%":"50%",transform:"translate(-50%,-50%)",fontSize:15,fontWeight:800,color:"rgba(230,250,241,.85)",textShadow:"0 1px 4px rgba(0,0,0,.7)",pointerEvents:"none",userSelect:"none"}}>{arrow}</span>)}<div style={{position:"absolute",left:"50%",top:"50%",width:54,height:54,borderRadius:"50%",transform:`translate(calc(-50% + ${stickPosition.x*38}px),calc(-50% + ${stickPosition.y*38}px))`,background:"radial-gradient(circle at 30% 25%,#b7e6d5c9,#176e62dd)",border:"2px solid #d4c28b",boxShadow:"0 4px 15px #0008",pointerEvents:"none",transition:stickPointer.current===null?"transform .14s ease-out":"none"}}/></div><button type="button" aria-label={boostActive?"Disable unlimited boost":"Enable unlimited boost"} aria-pressed={boostActive} onClick={activateBoost} style={{pointerEvents:"auto",alignSelf:"flex-end",minWidth:50,minHeight:34,borderRadius:11,border:"1px solid rgba(255,226,138,.65)",background:boostActive?"linear-gradient(135deg,#ffd36a,#f69e32)":"linear-gradient(135deg,rgba(5,75,58,.92),rgba(13,135,105,.95))",color:boostActive?"#18382b":"#fff",fontWeight:800,fontSize:11,boxShadow:boostActive?"0 0 18px rgba(255,203,75,.55)":"0 4px 14px rgba(0,0,0,.25)",opacity:1}}>⚡ {boostActive?"3× ON":"BOOST"}</button></div>
  {error&&<div role="alert" className={styles.error}>{error}</div>}
  {picker&&<div className={styles.modal}><div className={styles.picker}><button className={styles.close} onClick={()=>setPicker(false)} aria-label="Close world selector">✕</button><h2>Choose Your Universe</h2><p>Explore the worlds of 1Muslim Games</p><div className={styles.worlds}>{WORLDS.map(w=><button key={w} onClick={()=>{if(w==="Jurassic")enterJurassicWorld();else if(w==="Time of Muhammad ﷺ")enterPropheticWorld();else if(w==="Future")enterFutureWorld();else{setWorldMessage(w+" is not yet connected to this lobby build.");setPicker(false)}}}>{w} <small>{w==="Jurassic"||w==="Future"||w==="Time of Muhammad ﷺ"?"Enter world":"Preview pending"}</small></button>)}</div></div></div>}
  {worldMessage&&<div className={styles.toast} role="status" onClick={()=>setWorldMessage("")}>{worldMessage} · Dismiss ✕</div>}
  <span className={styles.srOnly}>Shared presence is an experimental room and does not establish authenticated player identity. Suits are local preview choices.</span>
 </section>;
}
