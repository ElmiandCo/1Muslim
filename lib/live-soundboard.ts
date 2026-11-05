"use client";
export type LiveSound="boom"|"crickets"|"laughter";
let context:AudioContext|null=null;
export function playLiveSound(sound:LiveSound){
 if(typeof window==="undefined")return;
 const ctx=context??(context=new AudioContext());void ctx.resume();
 const now=ctx.currentTime;
 const tone=(freq:number,start:number,duration:number,volume:number,kind:OscillatorType="sine",endFreq?:number)=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,start);if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+duration+.02);
 };
 if(sound==="boom"){tone(130,now,.8,.5,"sine",36);tone(70,now+.04,.65,.32,"triangle",30);}
 if(sound==="crickets"){for(let i=0;i<12;i++){const t=now+i*.15;tone(3600,t,.055,.035,"sine",4300);tone(4100,t+.065,.045,.025,"sine",3500);}}
 if(sound==="laughter"){for(let i=0;i<8;i++){const t=now+i*.17;tone(200+(i%3)*35,t,.12,.13,"sawtooth",140+(i%2)*20);tone(400+(i%2)*40,t+.02,.09,.06,"sine",260);}}
}
