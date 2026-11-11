/**
 * Game Labs / World Bot 1: deterministic, engine-agnostic mission graph.
 * No game is mounted from this module. It is safe to import from server or client.
 * World coordinates are metres in a right-handed X/Z ground plane.
 */
export type DistrictId = "harbor" | "old-quarter" | "gardens" | "ridge";
export type QuestId = "arrival" | "missing-courier" | "road-to-ridge" | "dragon-awakening";
export type ObjectiveKind = "talk" | "reach" | "collect" | "drive" | "defend" | "boss";
export type Vec3 = readonly [number, number, number];
export interface District {
  readonly id: DistrictId;
  readonly name: string;
  readonly center: Vec3;
  readonly radiusMeters: number;
  readonly landmarks: readonly string[];
}
export interface QuestObjective {
  readonly id: string;
  readonly kind: ObjectiveKind;
  readonly description: string;
  readonly targetId: string;
  readonly targetPosition: Vec3;
  readonly radiusMeters: number;
}
export interface Quest {
  readonly id: QuestId;
  readonly title: string;
  readonly synopsis: string;
  readonly district: DistrictId;
  readonly requires: readonly QuestId[];
  readonly objectives: readonly QuestObjective[];
}
export const DISTRICTS: readonly District[] = [
  {id:"harbor",name:"Safina Harbor",center:[-260,0,-130],radiusMeters:280,landmarks:["ferry-terminal","harbor-market","repair-yard"]},
  {id:"old-quarter",name:"Lantern Quarter",center:[80,0,-50],radiusMeters:270,landmarks:["library","courtyard","market-street"]},
  {id:"gardens",name:"Gardens of Aman",center:[-50,0,260],radiusMeters:290,landmarks:["orchard","waterworks","community-hall"]},
  {id:"ridge",name:"Qamar Ridge",center:[380,0,310],radiusMeters:350,landmarks:["ridge-road","observatory","sealed-gate"]}
] as const;
export const QUESTS: readonly Quest[] = [
  {id:"arrival",title:"A City Worth Protecting",synopsis:"Meet the harbor keeper and learn the city before taking on danger.",district:"harbor",requires:[],objectives:[
    {id:"meet-keeper",kind:"talk",description:"Speak to Safiya at the ferry terminal",targetId:"npc-safiya",targetPosition:[-270,0,-140],radiusMeters:3},
    {id:"find-library",kind:"reach",description:"Find the Lantern Quarter library",targetId:"library",targetPosition:[70,0,-35],radiusMeters:8}
  ]},
  {id:"missing-courier",title:"The Missing Courier",synopsis:"Follow clues and protect a courier; no civilians may be harmed.",district:"old-quarter",requires:["arrival"],objectives:[
    {id:"speak-librarian",kind:"talk",description:"Ask Idris about the missing courier",targetId:"npc-idris",targetPosition:[72,0,-40],radiusMeters:3},
    {id:"recover-ledger",kind:"collect",description:"Recover the courier's ledger",targetId:"ledger",targetPosition:[145,0,-90],radiusMeters:3},
    {id:"protect-courier",kind:"defend",description:"Protect the courier from raiders",targetId:"courier-encounter",targetPosition:[175,0,-75],radiusMeters:20}
  ]},
  {id:"road-to-ridge",title:"The Ridge Road",synopsis:"Repair a vehicle and safely deliver medicine to the mountain settlement.",district:"gardens",requires:["missing-courier"],objectives:[
    {id:"repair-vehicle",kind:"talk",description:"Meet mechanic Nura",targetId:"npc-nura",targetPosition:[-220,0,-100],radiusMeters:3},
    {id:"deliver-supplies",kind:"drive",description:"Drive supplies to the ridge outpost",targetId:"ridge-outpost",targetPosition:[335,0,250],radiusMeters:15}
  ]},
  {id:"dragon-awakening",title:"Guardian of the Sealed Gate",synopsis:"Late-game confrontation with the original storm dragon, after protecting the city.",district:"ridge",requires:["road-to-ridge"],objectives:[
    {id:"reach-gate",kind:"reach",description:"Reach the sealed mountain gate",targetId:"sealed-gate",targetPosition:[470,0,410],radiusMeters:12},
    {id:"dragon-boss",kind:"boss",description:"Defeat the storm dragon without harming nearby villagers",targetId:"storm-dragon",targetPosition:[505,0,460],radiusMeters:35}
  ]}
] as const;
export interface MissionProgress {
  readonly completedQuests: readonly QuestId[];
  readonly activeQuest: QuestId | null;
  readonly completedObjectives: readonly string[];
}
export const INITIAL_MISSION_PROGRESS: MissionProgress = {completedQuests:[],activeQuest:null,completedObjectives:[]};
export function availableQuests(progress: MissionProgress): readonly Quest[] {
  const completed = new Set(progress.completedQuests);
  return QUESTS.filter(q=>!completed.has(q.id)&&q.requires.every(id=>completed.has(id)));
}
export function beginQuest(progress: MissionProgress, questId: QuestId): MissionProgress {
  if(progress.activeQuest)throw new Error("Finish the active quest first");
  if(!availableQuests(progress).some(q=>q.id===questId))throw new Error("Quest locked or already completed");
  return {...progress,activeQuest:questId,completedObjectives:[]};
}
export function completeObjective(progress: MissionProgress, objectiveId: string): MissionProgress {
  const quest=QUESTS.find(q=>q.id===progress.activeQuest);
  if(!quest)throw new Error("No active quest");
  const next=quest.objectives.find(o=>o.id===objectiveId);
  if(!next)throw new Error("Objective does not belong to active quest");
  const done=new Set(progress.completedObjectives);
  const firstIncomplete=quest.objectives.find(o=>!done.has(o.id));
  if(firstIncomplete?.id!==objectiveId)throw new Error("Objectives must be completed in order");
  done.add(objectiveId);
  if(done.size===quest.objectives.length)return {completedQuests:[...progress.completedQuests,quest.id],activeQuest:null,completedObjectives:[]};
  return {...progress,completedObjectives:[...done]};
}
export function validateWorldGraph(): string[] {
  const errors:string[]=[];
  const questIds=new Set(QUESTS.map(q=>q.id));
  const districtIds=new Set(DISTRICTS.map(d=>d.id));
  const seen=new Set<string>();
  for(const q of QUESTS){
    if(seen.has(q.id))errors.push("Duplicate quest "+q.id);
    seen.add(q.id);
    if(!districtIds.has(q.district))errors.push("Unknown district "+q.district);
    if(!q.objectives.length)errors.push("Empty quest "+q.id);
    for(const dep of q.requires)if(!questIds.has(dep))errors.push("Unknown prerequisite "+dep);
    for(const o of q.objectives)if(o.radiusMeters<=0||o.targetPosition.some(n=>!Number.isFinite(n)))errors.push("Invalid objective "+o.id);
  }
  const visit=(id:QuestId,stack:Set<QuestId>,done:Set<QuestId>)=>{
    if(stack.has(id)){errors.push("Quest cycle "+id);return}
    if(done.has(id))return;
    stack.add(id);
    QUESTS.find(q=>q.id===id)?.requires.forEach(dep=>visit(dep,stack,done));
    stack.delete(id);done.add(id);
  };
  const done=new Set<QuestId>();QUESTS.forEach(q=>visit(q.id,new Set(),done));
  return errors;
}
