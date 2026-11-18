/** ONE WORLD prototype simulation. Pure functions; never connect this to real XP balances. */
export type Terrain = "meadow"|"forest"|"farmland"|"hills"|"river";
export type Era = "settlement"|"agriculture"|"education"|"industry"|"aviation";
export type Building = "home"|"garden"|"farm"|"stable"|"school"|"library"|"theater"|"laboratory"|"base"|"airport";
export type Unit = "horse"|"car"|"tank"|"jet";
export type Mode = "peaceful"|"conquest";
export type Resource = "food"|"wood"|"stone"|"knowledge"|"fuel";
export type Inventory = Record<Resource,number>;
export type Plot = {id:string;terrain:Terrain;ownerId:string|null;building:Building|null;durability:number;maxDurability:number;protectedUntil:number};
export type Player = {id:string;mode:Mode;era:Era;walletXp:number;resources:Inventory;units:Partial<Record<Unit,number>>;lastAttackedAt:number|null};
export type LedgerEntry = {id:string;playerId:string;delta:number;reason:"land"|"building"|"repair";reference:string;createdAt:number};
export type Game = {players:Record<string,Player>;plots:Record<string,Plot>;ledger:LedgerEntry[];turn:number};
export type Result = {ok:true;game:Game;message:string}|{ok:false;game:Game;error:string};
export const COSTS:Record<Building,{xp:number;resources:Partial<Inventory>;era:Era;terrain?:Terrain[]}> = {
 home:{xp:10,resources:{wood:3},era:"settlement"},
 garden:{xp:8,resources:{wood:1},era:"settlement",terrain:["meadow","farmland"]},
 farm:{xp:15,resources:{wood:2},era:"agriculture",terrain:["meadow","farmland"]},
 stable:{xp:30,resources:{wood:5,food:4},era:"agriculture"},
 school:{xp:45,resources:{wood:6,stone:3},era:"education"},
 library:{xp:60,resources:{wood:5,stone:5},era:"education"},
 theater:{xp:70,resources:{wood:7,stone:6},era:"education"},
 laboratory:{xp:120,resources:{stone:10,knowledge:12},era:"industry"},
 base:{xp:150,resources:{stone:20,fuel:5},era:"industry"},
 airport:{xp:250,resources:{stone:25,fuel:15},era:"aviation"}
};
export const ERAS:Era[]=["settlement","agriculture","education","industry","aviation"];
export const UNIT_REQUIREMENTS:Record<Unit,{era:Era;building:Building;resources:Partial<Inventory>}> = {
 horse:{era:"agriculture",building:"stable",resources:{food:3}},
 car:{era:"industry",building:"laboratory",resources:{fuel:5}},
 tank:{era:"industry",building:"base",resources:{fuel:12,stone:8}},
 jet:{era:"aviation",building:"airport",resources:{fuel:20,knowledge:10}}
};
export const HARVEST:Record<Terrain,Partial<Inventory>>={
 meadow:{food:2},forest:{wood:3},farmland:{food:4},hills:{stone:3},river:{food:2}
};
export const RAID_COOLDOWN_MS=10*60*1000;
const fail=(game:Game,error:string):Result=>({ok:false,game,error});
const success=(game:Game,message:string):Result=>({ok:true,game,message});
const affordable=(p:Player,xp:number,items:Partial<Inventory>)=>p.walletXp>=xp&&Object.entries(items).every(([k,v])=>p.resources[k as Resource]>=(v??0));
const debit=(p:Player,xp:number,items:Partial<Inventory>):Player=>({...p,walletXp:p.walletXp-xp,resources:{...p.resources,...Object.fromEntries(Object.entries(items).map(([k,v])=>[k,p.resources[k as Resource]-(v??0)]))}});
const record=(game:Game,p:Player,delta:number,reason:LedgerEntry["reason"],reference:string,now:number):Game=>({...game,players:{...game.players,[p.id]:p},ledger:[...game.ledger,{id:`demo-${game.ledger.length+1}`,playerId:p.id,delta,reason,reference,createdAt:now}]});
export function purchaseLand(game:Game,playerId:string,plotId:string,adjacentIds:string[],now:number):Result {
 const p=game.players[playerId],plot=game.plots[plotId];if(!p||!plot)return fail(game,"Player or plot missing");
 if(plot.ownerId)return fail(game,"Land already owned");
 if(!adjacentIds.some(id=>game.plots[id]?.ownerId===playerId))return fail(game,"Land must touch owned territory");
 const xp=25;if(!affordable(p,xp,{}))return fail(game,"Insufficient XP");
 const updated=record(game,debit(p,xp,{}),-xp,"land",plotId,now);
 return success({...updated,plots:{...updated.plots,[plotId]:{...plot,ownerId:playerId}}},"Land acquired");
}
export function construct(game:Game,playerId:string,plotId:string,building:Building,now:number):Result {
 const p=game.players[playerId],plot=game.plots[plotId],cost=COSTS[building];if(!p||!plot)return fail(game,"Player or plot missing");
 if(plot.ownerId!==playerId)return fail(game,"Cannot build on another player's land");
 if(plot.building)return fail(game,"Plot occupied");
 if(ERAS.indexOf(p.era)<ERAS.indexOf(cost.era))return fail(game,"Technology not unlocked");
 if(cost.terrain&&!cost.terrain.includes(plot.terrain))return fail(game,"Terrain unsuitable");
 if(!affordable(p,cost.xp,cost.resources))return fail(game,"Insufficient resources or XP");
 const updated=record(game,debit(p,cost.xp,cost.resources),-cost.xp,"building",plotId+":"+building,now);
 return success({...updated,plots:{...updated.plots,[plotId]:{...plot,building,durability:100,maxDurability:100}}},"Building constructed");
}
export function repair(game:Game,playerId:string,plotId:string,now:number):Result {
 const p=game.players[playerId],plot=game.plots[plotId];if(!p||!plot)return fail(game,"Player or plot missing");
 if(plot.ownerId!==playerId||!plot.building)return fail(game,"Not your building");
 if(plot.durability>=plot.maxDurability)return fail(game,"Already fully repaired");
 const xp=Math.max(1,Math.ceil((plot.maxDurability-plot.durability)/10));if(!affordable(p,xp,{}))return fail(game,"Insufficient XP");
 const updated=record(game,debit(p,xp,{}),-xp,"repair",plotId,now);
 return success({...updated,plots:{...updated.plots,[plotId]:{...plot,durability:plot.maxDurability}}},"Building repaired");
}
export function harvest(game:Game,playerId:string):Game {
 const p=game.players[playerId];if(!p)return game;
 const gains:Inventory={food:0,wood:0,stone:0,knowledge:0,fuel:0};
 for(const plot of Object.values(game.plots)){if(plot.ownerId!==playerId)continue;for(const [key,n] of Object.entries(HARVEST[plot.terrain]))gains[key as Resource]+=n??0;if(plot.building==="farm")gains.food+=3;if(plot.building==="school"||plot.building==="library")gains.knowledge+=2;if(plot.building==="laboratory"){gains.knowledge+=4;gains.fuel+=1}}
 const resources={...p.resources};for(const key of Object.keys(gains) as Resource[])resources[key]+=gains[key];
 return {...game,players:{...game.players,[playerId]:{...p,resources}},turn:game.turn+1};
}
export function changeMode(game:Game,playerId:string,mode:Mode):Result {
 const p=game.players[playerId];if(!p)return fail(game,"Player missing");
 return success({...game,players:{...game.players,[playerId]:{...p,mode}}},mode==="peaceful"?"Protected: cannot attack or be attacked":"Conquest enabled");
}
export type BattleResult=Result&{defenderFirst?:boolean;damage?:number};
export function raid(game:Game,attackerId:string,defenderId:string,plotId:string,now:number,attackPower:number):BattleResult {
 const a=game.players[attackerId],d=game.players[defenderId],plot=game.plots[plotId];
 if(!a||!d||!plot||attackerId===defenderId)return fail(game,"Invalid battle");
 if(a.mode!=="conquest"||d.mode!=="conquest")return fail(game,"Peaceful players cannot participate in battles");
 if(plot.ownerId!==defenderId)return fail(game,"Target not owned by defender");
 if(now<plot.protectedUntil)return fail(game,"Raid cooldown active");
 if(!Number.isFinite(attackPower)||attackPower<=0)return fail(game,"Invalid attack power");
 const defenderFirst=d.lastAttackedAt!==null&&now-d.lastAttackedAt<24*60*60*1000;
 const defense=plot.building?35:15;
 const adjustedAttack=Math.max(0,attackPower-(defenderFirst?20:0));
 const damage=Math.min(plot.durability,Math.max(0,Math.floor(adjustedAttack-defense)));
 const conquered=adjustedAttack>=defense+plot.durability;
 const nextPlot={...plot,durability:conquered?Math.max(1,plot.maxDurability/4):plot.durability-damage,ownerId:conquered?attackerId:defenderId,protectedUntil:now+RAID_COOLDOWN_MS};
 const nextDefender={...d,lastAttackedAt:now};
 const nextGame={...game,players:{...game.players,[defenderId]:nextDefender},plots:{...game.plots,[plotId]:nextPlot}};
 return {...success(nextGame,conquered?"Territory conquered; displaced owner requires safe relocation":"Raid resolved"),defenderFirst,damage};
}
/** Production boundary: wallet operations require server-only atomic DB transactions, unique idempotency keys,
 * verified auth.uid, RLS and immutable ledger. This simulation must never be used as a payment authority. */
