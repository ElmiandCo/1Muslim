/**
 * Game Bot A / Rome: local prototype of the arena lion's grounded movement and
 * five-hit combat. This module deliberately does NOT claim multiplayer authority.
 * The server must validate shot origin, timing, hit count and shield before
 * lion combat can be trusted between players.
 */
import {ROMAN_GRAND_ARENA} from "./RomanArenaScene";

export const ROMAN_LION_HITS_TO_DEFEAT=5;
export const ROMAN_LION_RESPAWN_MS=5*60*1000;
export const ROMAN_LION_PLAYER_BASE_SPEED=5.5;
export const ROMAN_LION_RUN_SPEED=ROMAN_LION_PLAYER_BASE_SPEED*4;
export const ROMAN_LION_LUNGE_SPEED=32;
const ATTACK_COOLDOWN_MS=1250;
const LUNGE_COOLDOWN_MS=2200;
const LUNGE_DURATION_MS=450;
const LION_HIT_RADIUS=2.5;
const LION_HIT_HEIGHT=1.6;

export type RomanLionState={
 x:number;z:number;heading:number;hits:number;alive:boolean;
 respawnAt:number;attackReadyAt:number;lungeReadyAt:number;lungeUntil:number;
};
export type RomanLionShot={
 id:string;owner:string;x:number;y:number;z:number;
 prevX?:number;prevY?:number;prevZ?:number;life:number;
};
export type RomanLionPlayer={id:string;x:number;y:number;z:number};
export type RomanLionEvents={hits:number;defeated:boolean;respawned:boolean;attacked:boolean};

export function createRomanLionState():RomanLionState{
 return {x:ROMAN_GRAND_ARENA.x,z:ROMAN_GRAND_ARENA.z,heading:0,hits:0,
  alive:true,respawnAt:0,attackReadyAt:0,lungeReadyAt:0,lungeUntil:0};
}

/** A swept projectile segment prevents fast blasters tunnelling through a lion. */
export function romanLionShotIntersects(shot:RomanLionShot,lion:RomanLionState):boolean{
 const ax=shot.prevX??shot.x,az=shot.prevZ??shot.z,ay=shot.prevY??shot.y;
 const dx=shot.x-ax,dz=shot.z-az;
 const lengthSq=dx*dx+dz*dz;
 const t=lengthSq>1e-8?Math.max(0,Math.min(1,((lion.x-ax)*dx+(lion.z-az)*dz)/lengthSq)):0;
 const hx=ax+dx*t,hz=az+dz*t,hy=ay+(shot.y-ay)*t;
 return Math.hypot(hx-lion.x,hz-lion.z)<=LION_HIT_RADIUS &&
  Math.abs(hy-LION_HIT_HEIGHT)<=2.2;
}

/**
 * Called once per game tick after shots move. Shots are consumed in-place.
 * Lion is ground-bound inside the arena's inner sand ellipse; no Y/flight state.
 * dt is seconds; now is performance.now() milliseconds.
 */
export function updateRomanLion(
 lion:RomanLionState,now:number,dt:number,player:RomanLionPlayer,
 shots:RomanLionShot[]
):RomanLionEvents{
 const events:RomanLionEvents={hits:0,defeated:false,respawned:false,attacked:false};
 if(!lion.alive){
  if(now<lion.respawnAt)return events;
  Object.assign(lion,createRomanLionState());
  events.respawned=true;
 }
 // Only locally fired projectiles count. This is a client-only preview:
 // authoritative multiplayer must reject spoofed shots on a server.
 for(const shot of shots){
  if(shot.life<=0||shot.owner!==player.id||!romanLionShotIntersects(shot,lion))continue;
  shot.life=0;lion.hits++;events.hits++;
  if(lion.hits>=ROMAN_LION_HITS_TO_DEFEAT){
   lion.alive=false;lion.respawnAt=now+ROMAN_LION_RESPAWN_MS;
   lion.lungeUntil=0;events.defeated=true;return events;
  }
 }
 const dx=player.x-lion.x,dz=player.z-lion.z;
 const playerDistance=Math.hypot(dx,dz);
 const nearArena=Math.hypot(player.x-ROMAN_GRAND_ARENA.x,player.z-ROMAN_GRAND_ARENA.z)<100;
 const chasing=nearArena&&playerDistance<85;
 // Patrol even with no players nearby, but keep all motion on the arena floor.
 const targetX=chasing?player.x:ROMAN_GRAND_ARENA.x+Math.cos(now*.00018)*18;
 const targetZ=chasing?player.z:ROMAN_GRAND_ARENA.z+Math.sin(now*.00018)*12;
 const tx=targetX-lion.x,tz=targetZ-lion.z,distance=Math.hypot(tx,tz);
 if(distance>.001){
  lion.heading=Math.atan2(tx,tz);
  if(chasing&&playerDistance<12&&now>=lion.lungeReadyAt){
   lion.lungeUntil=now+LUNGE_DURATION_MS;
   lion.lungeReadyAt=now+LUNGE_COOLDOWN_MS;
  }
  const speed=now<lion.lungeUntil?ROMAN_LION_LUNGE_SPEED:chasing?ROMAN_LION_RUN_SPEED:3.2;
  const step=Math.min(distance,speed*Math.max(0,Math.min(dt,.08)));
  lion.x+=tx/distance*step;lion.z+=tz/distance*step;
 }
 const {x:cx,z:cz,innerX,innerZ}=ROMAN_GRAND_ARENA;
 const rx=innerX-13,rz=innerZ-12;
 const nx=(lion.x-cx)/rx,nz=(lion.z-cz)/rz,r=Math.hypot(nx,nz);
 if(r>1){lion.x=cx+(lion.x-cx)/r;lion.z=cz+(lion.z-cz)/r;}
 // A flying player above the arena is never hit by a ground-only lion.
 if(chasing&&player.y<=4.5&&Math.hypot(player.x-lion.x,player.z-lion.z)<=3.5&&now>=lion.attackReadyAt){
  lion.attackReadyAt=now+ATTACK_COOLDOWN_MS;events.attacked=true;
 }
 return events;
}

export function romanLionLungeProgress(lion:RomanLionState,now:number):number{
 return lion.alive&&now<lion.lungeUntil
  ?Math.max(0,Math.min(1,1-(lion.lungeUntil-now)/LUNGE_DURATION_MS)):0;
}
