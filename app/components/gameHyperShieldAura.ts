/**
 * Living Worlds / Hyper Defense visual and sound layer.
 * Presentation only: never changes shield timing, cooldown, combat damage or peer state.
 * SharedGameLobby's existing monotonic shield helper remains authoritative locally.
 */
export type ShieldDraw=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number[],alpha?:number,yaw?:number)=>void;
export type ShieldPosition={x:number;y:number;z:number};
export type ShieldVisualOptions={fade:number;nowMs:number;distance:number;impactAgeMs?:number};

/**
 * Draw a translucent emerald spherical energy shell using the existing WebGL
 * cube batch primitive. No mesh allocations, textures or extra WebGL contexts.
 * Nearby avatars get 3 latitude rings and thin transparent panels; distant
 * peers get progressively cheaper silhouettes. The player's own shield is
 * always drawn in the near tier (caller passes distance=0).
 */
export function renderGameShieldAura(draw:ShieldDraw,pos:ShieldPosition,options:ShieldVisualOptions):number{
 const {fade,nowMs,distance}=options;
 if(!Number.isFinite(fade)||fade<=0||!Number.isFinite(nowMs)||!Number.isFinite(distance)||distance>78)return 0;
 const strength=Math.min(1,Math.max(0,fade));
 const near=distance<28,mid=distance<55;
 const count=near?12:mid?8:6;
 const layers=near?[-.77,0,.77]:mid?[-.7,.7]:[0];
 const pulse=.045*Math.sin(nowMs*.004);
 const impact=options.impactAgeMs??Infinity;
 const impactPulse=Number.isFinite(impact)&&impact>=0&&impact<420?.20*(1-impact/420):0;
 const spin=nowMs*.00018;
 const green=[.08,.98,.56],rim=[.38,1,.72];
 let draws=0;
 const emit=(x:number,y:number,z:number,sx:number,sy:number,sz:number,c:number[],a:number,angle=0)=>{
  draw(x,y,z,sx,sy,sz,c,Math.min(.68,Math.max(0,a*strength)),angle);draws++;
 };
 for(const h of layers){
  const ringRadius=(1.68+pulse+impactPulse)*Math.sqrt(Math.max(.08,1-(h/1.65)**2));
  for(let i=0;i<count;i++){
   const angle=i*Math.PI*2/count+spin;
   const x=pos.x+Math.cos(angle)*ringRadius,z=pos.z+Math.sin(angle)*ringRadius;
   emit(x,pos.y+1.43+h,z,.62,.095,.085,green,.30+impactPulse*.65,angle+Math.PI/2);
  }
 }
 if(near||mid){
  const panels=near?12:8;
  for(let i=0;i<panels;i++){
   const angle=i*Math.PI*2/panels+spin;
   const radius=1.62+pulse+impactPulse;
   // Soft transparent facets make the rings read as a protective sphere.
   emit(pos.x+Math.cos(angle)*radius,pos.y+1.43,pos.z+Math.sin(angle)*radius,.82,1.82,.065,green,.065+impactPulse*.18,angle+Math.PI/2);
  }
 }
 // Distinct polar glints communicate that this is a closed bubble, not a ring.
 emit(pos.x,pos.y+3.05+impactPulse,pos.z,.7,.09,.7,rim,.34);
 emit(pos.x,pos.y-.16-impactPulse,pos.z,.7,.09,.7,rim,.24);
 return draws;
}

let audioContext:AudioContext|null=null;
let lastImpactAt=-Infinity;
/** Sound is local-only, brief, and gracefully silent when WebAudio is blocked. */
export function playGameShieldAudio(kind:"activate"|"impact"):boolean{
 if(typeof window==="undefined"||typeof window.AudioContext!=="function"||document.hidden)return false;
 const now=performance.now();
 if(kind==="impact"&&now-lastImpactAt<180)return false;
 if(kind==="impact")lastImpactAt=now;
 try{
  const ctx=audioContext??new window.AudioContext();
  audioContext=ctx;
  if(ctx.state==="suspended")void ctx.resume().catch(()=>{});
  const start=ctx.currentTime;
  const notes=kind==="activate"?[392,523.25,784]:[210,147];
  notes.forEach((hz,i)=>{
   const oscillator=ctx.createOscillator(),volume=ctx.createGain();
   oscillator.type=kind==="activate"?"sine":"triangle";
   oscillator.frequency.setValueAtTime(hz,start+i*.075);
   oscillator.frequency.exponentialRampToValueAtTime(hz*(kind==="activate"?1.2:.72),start+i*.075+.14);
   const t=start+i*.075;
   volume.gain.setValueAtTime(.0001,t);
   volume.gain.exponentialRampToValueAtTime(kind==="activate"?.038:.024,t+.02);
   volume.gain.exponentialRampToValueAtTime(.0001,t+.20);
   oscillator.connect(volume);volume.connect(ctx.destination);
   oscillator.start(t);oscillator.stop(t+.22);
  });
  return true;
 }catch{return false}
}
