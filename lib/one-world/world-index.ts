/** ONE WORLD deterministic, bounded prototype geography. No database writes. */
export type Biome = "grassland"|"forest"|"wetland"|"desert"|"mountain"|"coast";
export type Resource = "food"|"timber"|"water"|"stone"|"ore"|"fuel";
export type GeoPath = {country:string;state:string;region:string};
export type Plot = {id:string;x:number;y:number;biome:Biome;resources:readonly Resource[]};
export type Ownership = {plotId:string;ownerId:string;avatarUrl?:string|null};
export const REGIONS = [
 {country:"US",state:"MN",region:"north-metro",label:"Minnesota · North Metro"},
 {country:"SO",state:"BN",region:"banaadir",label:"Somalia · Banaadir"},
 {country:"TR",state:"34",region:"istanbul",label:"Türkiye · Istanbul"},
] as const;
const RESOURCE_TABLE:Record<Biome,readonly Resource[]> = {
 grassland:["food","water"],forest:["timber","food"],wetland:["water","food"],
 desert:["stone","fuel"],mountain:["stone","ore"],coast:["water","food"]
};
const BIOMES:readonly Biome[]=["grassland","forest","wetland","desert","mountain","coast"];
function validatePart(value:string){if(!/^[a-zA-Z0-9_-]{1,40}$/.test(value))throw new Error("Invalid geography identifier");return value.toLowerCase();}
export function plotId(path:GeoPath,x:number,y:number):string{
 if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>1_000_000||Math.abs(y)>1_000_000)throw new Error("Invalid plot coordinate");
 return [validatePart(path.country),validatePart(path.state),validatePart(path.region),x,y].join(":");
}
export function parsePlotId(id:string):{path:GeoPath;x:number;y:number}{
 const parts=id.split(":");if(parts.length!==5)throw new Error("Invalid plot id");
 const [country,state,region,sx,sy]=parts;const x=Number(sx),y=Number(sy);
 if(!/^-?(0|[1-9]\d*)$/.test(sx)||!/^-?(0|[1-9]\d*)$/.test(sy))throw new Error("Invalid plot coordinate");
 const path={country:validatePart(country),state:validatePart(state),region:validatePart(region)};
 if(plotId(path,x,y)!==id.toLowerCase())throw new Error("Noncanonical plot id");
 return {path,x,y};
}
function hash(input:string):number{let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function generatePlot(path:GeoPath,x:number,y:number):Plot{
 const id=plotId(path,x,y);const biome=BIOMES[hash(id)%BIOMES.length];
 return {id,x,y,biome,resources:RESOURCE_TABLE[biome]};
}
/** Max 625 cells per viewport; never enumerate the entire global world. */
export function viewport(path:GeoPath,centerX:number,centerY:number,radius=8):Plot[]{
 if(!Number.isInteger(radius)||radius<0||radius>12)throw new Error("Viewport radius must be 0–12");
 if(!Number.isSafeInteger(centerX)||!Number.isSafeInteger(centerY))throw new Error("Invalid viewport center");
 const out:Plot[]=[];
 for(let y=centerY-radius;y<=centerY+radius;y++)for(let x=centerX-radius;x<=centerX+radius;x++)out.push(generatePlot(path,x,y));
 return out;
}
export function neighbors(id:string):string[]{const {path,x,y}=parsePlotId(id);return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].map(([a,b])=>plotId(path,a,b))}
export function ownershipBorders(owned:ReadonlySet<string>,id:string):{north:boolean;east:boolean;south:boolean;west:boolean}{
 const {path,x,y}=parsePlotId(id);
 return {north:!owned.has(plotId(path,x,y-1)),east:!owned.has(plotId(path,x+1,y)),south:!owned.has(plotId(path,x,y+1)),west:!owned.has(plotId(path,x-1,y))};
}
/** Returns a relocation proposal only. Server must authorize and commit atomically. */
export function planRelocation(lostPlotId:string,ownedIds:ReadonlySet<string>,reservedIds:ReadonlySet<string>):string|null{
 const {path,x,y}=parsePlotId(lostPlotId);
 for(let ring=1;ring<=32;ring++){
  for(let dy=-ring;dy<=ring;dy++)for(let dx=-ring;dx<=ring;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
   const id=plotId(path,x+dx,y+dy);
   if(!ownedIds.has(id)&&!reservedIds.has(id))return id;
  }
 }
 return null;
}
