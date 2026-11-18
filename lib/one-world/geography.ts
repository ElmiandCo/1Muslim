/** ONE WORLD geographic navigation foundation. No real-world ownership or XP writes. */
export type Biome="temperate"|"desert"|"tropical"|"tundra"|"coastal"|"mountain";
export type Resource="wood"|"stone"|"water"|"food"|"ore"|"fuel";
export type GeoLevel="world"|"country"|"state"|"region"|"plot";
export interface GeoNode {id:string;name:string;level:GeoLevel;parentId:string|null;biome?:Biome;resources?:Resource[]}
export const BIOME_RESOURCES:Record<Biome,readonly Resource[]>={
 temperate:["wood","water","food","stone"],desert:["stone","ore","fuel"],tropical:["wood","water","food"],tundra:["stone","ore"],coastal:["water","food","wood"],mountain:["stone","ore","water"]
};
export const WORLD:GeoNode={id:"earth",name:"Earth",level:"world",parentId:null};
export const SAMPLE_LOCATIONS:GeoNode[]=[
 WORLD,
 {id:"us",name:"United States",level:"country",parentId:"earth"},
 {id:"us-mn",name:"Minnesota",level:"state",parentId:"us"},
 {id:"us-mn-north",name:"Northern Lakes",level:"region",parentId:"us-mn",biome:"temperate",resources:["wood","water","food","stone"]},
 {id:"so",name:"Somalia",level:"country",parentId:"earth"},
 {id:"so-ban",name:"Banaadir",level:"state",parentId:"so"},
 {id:"so-ban-coast",name:"Coastal Plains",level:"region",parentId:"so-ban",biome:"coastal",resources:["water","food","wood"]},
 {id:"tr",name:"Türkiye",level:"country",parentId:"earth"},
 {id:"tr-ist",name:"Istanbul",level:"state",parentId:"tr"},
 {id:"tr-ist-bosphorus",name:"Bosphorus",level:"region",parentId:"tr-ist",biome:"coastal",resources:["water","food","wood"]}
];
export function childrenOf(parentId:string,nodes:readonly GeoNode[]=SAMPLE_LOCATIONS):GeoNode[]{return nodes.filter(n=>n.parentId===parentId)}
export function lineageOf(id:string,nodes:readonly GeoNode[]=SAMPLE_LOCATIONS):GeoNode[]{
 const byId=new Map(nodes.map(n=>[n.id,n]));const result:GeoNode[]=[];const visited=new Set<string>();let cursor:GeoNode|undefined=byId.get(id);
 while(cursor){if(visited.has(cursor.id))throw new Error("Geographic hierarchy contains a cycle");visited.add(cursor.id);result.unshift(cursor);cursor=cursor.parentId?byId.get(cursor.parentId):undefined}
 return result;
}
/** Stable deterministic plot IDs; IDs are never based on array position or a display name. */
export function plotId(regionId:string,x:number,y:number):string{
 if(!regionId||!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0)throw new Error("Invalid plot coordinates");
 return regionId+":"+x.toString(36)+":"+y.toString(36);
}
export function parsePlotId(id:string):{regionId:string;x:number;y:number}{
 const m=/^(.+):([0-9a-z]+):([0-9a-z]+)$/.exec(id);if(!m)throw new Error("Invalid plot ID");
 const x=parseInt(m[2],36),y=parseInt(m[3],36);if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y))throw new Error("Plot coordinate overflow");
 return {regionId:m[1],x,y};
}
export function neighbors(regionId:string,x:number,y:number):string[]{return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0).map(([a,b])=>plotId(regionId,a,b))}
export function tileBiome(regionId:string,x:number,y:number,base:Biome="temperate"):Biome{
 const choices:Biome[]=[base,"temperate","coastal","mountain","desert","tropical","tundra"];
 let hash=2166136261;for(const c of regionId+":"+x+":"+y){hash=Math.imul(hash^c.charCodeAt(0),16777619)}
 return choices[(hash>>>0)%choices.length];
}
/** Fetch only visible tile IDs; bounded memory even for 100,000+ players. */
export function visiblePlotIds(regionId:string,centerX:number,centerY:number,radius:number,maxTiles=625):string[]{
 if(!Number.isInteger(radius)||radius<0||maxTiles<1)throw new Error("Invalid viewport");
 const result:string[]=[];for(let y=Math.max(0,centerY-radius);y<=centerY+radius;y++)for(let x=Math.max(0,centerX-radius);x<=centerX+radius;x++){if(result.length>=maxTiles)return result;result.push(plotId(regionId,x,y))}return result;
}
/** Server should atomically assign unowned refuge plot before completing conquest. */
export interface RelocationPlan{playerId:string;lostPlotId:string;destinationPlotId:string;requiresServerCommit:true}
export function planRelocation(playerId:string,lostPlotId:string,unownedCandidateIds:readonly string[]):RelocationPlan{
 const destinationPlotId=unownedCandidateIds.find(id=>id!==lostPlotId);
 if(!playerId||!destinationPlotId)throw new Error("No verified refuge plot available");
 return {playerId,lostPlotId,destinationPlotId,requiresServerCommit:true};
}
