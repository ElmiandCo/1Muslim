/**
 * ONE WORLD pure simulation core, not a payment or combat endpoint.
 * All mutations here are prototypes; server must authorize actor, lock rows,
 * and persist an idempotent ledger transaction before granting ownership.
 */
export type Resource = "food" | "wood" | "stone" | "knowledge" | "fuel";
export type Terrain = "meadow" | "forest" | "farmland" | "hills" | "river" | "desert";
export type Building = "home" | "garden" | "farm" | "stable" | "school" | "theater" | "library" | "lab" | "base" | "airport";
export type Unit = "horse" | "car" | "tank" | "jet";
export type Mode = "peaceful" | "conquest";
export type Tech = "settlement" | "agriculture" | "education" | "industry" | "aviation";
export interface Player { id:string; xp:number; mode:Mode; resources:Record<Resource,number>; tech:Tech[]; lastAttackedAt?:number; }
export interface Plot { id:string; ownerId:string|null; terrain:Terrain; x?:number; y?:number; regionId?:string; building?:Building; durability:number; }
export interface Entry { idempotencyKey:string; playerId:string; kind:"land"|"build"|"repair"; amount:number; plotId:string; timestamp:number; building?:Building; }
export interface World { players:Record<string,Player>; plots:Record<string,Plot>; ledger:Entry[]; }
export const BUILDINGS:Record<Building,{xp:number;tech:Tech;resources:Partial<Record<Resource,number>>}>={
 home:{xp:20,tech:"settlement",resources:{wood:3}},garden:{xp:12,tech:"settlement",resources:{wood:1}},
 farm:{xp:25,tech:"agriculture",resources:{wood:2}},stable:{xp:35,tech:"agriculture",resources:{wood:4,food:2}},
 school:{xp:45,tech:"education",resources:{wood:4,stone:3}},theater:{xp:55,tech:"education",resources:{wood:4,stone:5}},
 library:{xp:50,tech:"education",resources:{wood:5}},lab:{xp:90,tech:"industry",resources:{stone:8,knowledge:5}},
 base:{xp:120,tech:"industry",resources:{stone:12,fuel:3}},airport:{xp:200,tech:"aviation",resources:{stone:18,fuel:12}}
};
export const UNITS:Record<Unit,{tech:Tech;resources:Partial<Record<Resource,number>>}>={
 horse:{tech:"agriculture",resources:{food:3}},car:{tech:"industry",resources:{fuel:4,stone:2}},
 tank:{tech:"industry",resources:{fuel:8,stone:10}},jet:{tech:"aviation",resources:{fuel:16,stone:12}}
};
export const YIELDS:Record<Terrain,Partial<Record<Resource,number>>>={
 meadow:{food:1},forest:{wood:3},farmland:{food:4},hills:{stone:3},river:{food:2},desert:{fuel:2}
};
export type Action={kind:"land"|"build"|"repair";actorId:string;plotId:string;idempotencyKey:string;now:number;building?:Building};
export type Result={ok:true;world:World;entry:Entry;replayed?:boolean}|{ok:false;reason:string};
const fail=(reason:string):Result=>({ok:false,reason});
/** Pure atomic transition: caller must serialize and persist it transactionally. */
export function transact(world:World,action:Action):Result{
 const existing=world.ledger.find(e=>e.idempotencyKey===action.idempotencyKey);
 if(existing)return existing.playerId===action.actorId&&existing.kind===action.kind&&existing.plotId===action.plotId&&(existing.kind!=="build"||existing.building===action.building)
 ?{ok:true,world,entry:existing,replayed:true}:fail("idempotency key conflict");
 const player=world.players[action.actorId],plot=world.plots[action.plotId];
 if(!player||!plot||!action.idempotencyKey)return fail("invalid actor, plot or key");
 if(!Number.isSafeInteger(player.xp)||player.xp<0)return fail("invalid wallet");
 let cost=0;let resources:Partial<Record<Resource,number>>={};let nextPlot:Plot={...plot};
 if(action.kind==="land"){
  if(plot.ownerId)return fail("land already owned");
  // Fail closed until the authoritative server provides a regional plot grid.
  // Orthogonal neighbors only: diagonal and cross-region claims are forbidden.
  if(!Number.isSafeInteger(plot.x)||!Number.isSafeInteger(plot.y)||!plot.regionId)return fail("plot geometry unavailable");
  const adjacent=Object.values(world.plots).some(p=>p.ownerId===player.id&&p.regionId===plot.regionId&&Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&Math.abs(p.x!-plot.x!)+Math.abs(p.y!-plot.y!)===1);
  if(!adjacent)return fail("land must be adjacent to owned territory");
  cost=30;nextPlot.ownerId=player.id;nextPlot.durability=100;
 }else{
  if(plot.ownerId!==player.id)return fail("not plot owner");
  if(action.kind==="build"){
   if(!action.building||plot.building)return fail("invalid or occupied build slot");
   const spec=BUILDINGS[action.building];if(!spec||!player.tech.includes(spec.tech))return fail("technology locked");
   cost=spec.xp;resources=spec.resources;nextPlot.building=action.building;
  }else if(action.kind==="repair"){
   if(!plot.building||plot.durability>=100||plot.durability<0)return fail("nothing to repair");
   cost=Math.ceil((100-plot.durability)/5);nextPlot.durability=100;
  }else return fail("unknown action");
 }
 if(player.xp<cost)return fail("insufficient XP");
 for(const [r,n] of Object.entries(resources))if((player.resources[r as Resource]??0)<n)return fail("insufficient resources");
 const nextResources={...player.resources};
 for(const [r,n] of Object.entries(resources))nextResources[r as Resource]-=n;
 const entry:Entry={idempotencyKey:action.idempotencyKey,playerId:player.id,kind:action.kind,amount:-cost,plotId:plot.id,timestamp:action.now,...(action.kind==="build"?{building:action.building}: {})};
 return {ok:true,entry,world:{...world,players:{...world.players,[player.id]:{...player,xp:player.xp-cost,resources:nextResources}},plots:{...world.plots,[plot.id]:nextPlot},ledger:[...world.ledger,entry]}};
}
export function canAttack(attacker:Player,defender:Player,now:number,defenderLastRaidAt?:number){
 if(attacker.id===defender.id)return {allowed:false,reason:"self attack"};
 if(attacker.mode!=="conquest"||defender.mode!=="conquest")return {allowed:false,reason:"peaceful immunity"};
 if(defenderLastRaidAt!==undefined&&now-defenderLastRaidAt<600000)return {allowed:false,reason:"raid cooldown"};
 return {allowed:true,defenderFirst:defender.lastAttackedAt!==undefined&&now-defender.lastAttackedAt<86400000};
}
export function planRelocation(plots:Plot[],loserId:string){
 const lost=plots.filter(p=>p.ownerId===loserId).map(p=>p.id);
 return {ownerId:loserId,lostPlots:lost,requiresServerAllocation:true,requiresAtomicTransfer:true};
}
