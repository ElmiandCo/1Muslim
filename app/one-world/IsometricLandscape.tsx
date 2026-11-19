"use client";
import {useCallback,useRef,useState} from "react";
import "./isometric-landscape.css";
import "./isometric-ambience.css";
type Kind="grass"|"forest"|"field"|"water"|"hill";
type Tile={id:number;kind:Kind;owned:boolean;building:string;road:boolean};
const WIDTH=12,HEIGHT=12,STEP_X=48,STEP_Y=25;
const glyph:Record<Kind,string>={grass:"🌿",forest:"🌳",field:"🌾",water:"💧",hill:"⛰️"};
const buildings=[["🛣️","Road"],["🏡","Cottage"],["🌻","Garden"],["🌾","Farm"],["🐎","Stable"],["🏫","School"]] as const;
// Exactly 15% (rounded to the nearest whole tile) of the 12x12 preview contains resources.
// Deterministic distribution avoids rerolling on every render.
const RESOURCE_COUNT=Math.round(WIDTH*HEIGHT*.15);
const resourceIds=new Set(Array.from({length:WIDTH*HEIGHT},(_,id)=>id).filter(id=>id!==78).sort((a,b)=>((a*73+19)%149)-((b*73+19)%149)).slice(0,RESOURCE_COUNT));
const initial:Tile[]=Array.from({length:WIDTH*HEIGHT},(_,id)=>{
 const x=id%WIDTH,y=Math.floor(id/WIDTH);
 const kind:Kind=!resourceIds.has(id)?"grass":((x*13+y*7)%19===0?"water":(x*3+y*11)%13===0?"hill":(x*7+y*3)%9===0?"forest":"field");
 return {id,kind,owned:id===78,building:id===78?"🏡":"",road:false};
});
// A road connects to each orthogonally adjacent road. A neighboring starter cottage
// also acts as a connection point, so the first road visibly joins the house.
const roadLinks=(id:number,tiles:Tile[])=>{
 const x=id%WIDTH,y=Math.floor(id/WIDTH);
 return [{id:id-1,valid:x>0,point:[24,13]},{id:id+1,valid:x<WIDTH-1,point:[72,39]},{id:id-WIDTH,valid:y>0,point:[72,13]},{id:id+WIDTH,valid:y<HEIGHT-1,point:[24,39]}]
  .filter(n=>n.valid&&(tiles[n.id].road||tiles[n.id].building==="🏡"))
  .map(n=>n.point);
};
type TouchPoint={x:number;y:number};
export default function IsometricLandscape(){
 const [night,setNight]=useState(false),[showMap,setShowMap]=useState(true);
 const [tiles,setTiles]=useState(initial),[selected,setSelected]=useState(78),[scale,setScale]=useState(1),[offset,setOffset]=useState({x:0,y:0}),[tool,setTool]=useState("🏡"),[notice,setNotice]=useState("Tap a plot to select it, or drag to explore.");
 const pointers=useRef(new Map<number,TouchPoint>()),gesture=useRef<{distance:number;scale:number;center:TouchPoint;offset:TouchPoint}|null>(null),dragged=useRef(false);
 const distance=(a:TouchPoint,b:TouchPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
 const clamp=(n:number)=>Math.min(2,Math.max(.65,n));
 const down=useCallback((e:React.PointerEvent<HTMLDivElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});dragged.current=false;if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];gesture.current={distance:distance(a,b),scale,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},offset};}},[scale,offset]);
 const move=useCallback((e:React.PointerEvent<HTMLDivElement>)=>{const old=pointers.current.get(e.pointerId);if(!old)return;const now={x:e.clientX,y:e.clientY};pointers.current.set(e.pointerId,now);if(pointers.current.size===2&&gesture.current){const [a,b]=[...pointers.current.values()];const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};setScale(clamp(gesture.current.scale*distance(a,b)/Math.max(1,gesture.current.distance)));setOffset({x:gesture.current.offset.x+center.x-gesture.current.center.x,y:gesture.current.offset.y+center.y-gesture.current.center.y});dragged.current=true;}else if(pointers.current.size===1){if(distance(old,now)>1){setOffset(v=>({x:v.x+now.x-old.x,y:v.y+now.y-old.y}));dragged.current=true;}}},[]);
 const up=useCallback((e:React.PointerEvent<HTMLDivElement>)=>{pointers.current.delete(e.pointerId);if(pointers.current.size<2)gesture.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);},[]);
 const pick=(id:number)=>{if(dragged.current)return;setSelected(id);setNotice("Plot "+(id+1)+" selected.");};
 const tile=tiles[selected],count=tiles.filter(t=>t.owned).length;
 const claim=()=>{if(tile.owned)return;const x=selected%WIDTH,y=Math.floor(selected/WIDTH);if(tile.kind==="water")return setNotice("Water cannot be claimed in this prototype.");if(!tiles.some(t=>t.owned&&Math.abs(t.id%WIDTH-x)+Math.abs(Math.floor(t.id/WIDTH)-y)===1))return setNotice("Claim a plot next to your land.");setTiles(v=>v.map(t=>t.id===selected?{...t,owned:true}:t));setNotice("Land claimed locally; server saving is not connected.");};
 const place=()=>{
 if(!tile.owned)return setNotice("Claim this land before building.");
 if(tool==="🛣️"){
  if(tile.building)return setNotice("Remove the building before laying a road.");
  const x=selected%WIDTH,y=Math.floor(selected/WIDTH);
  const connected=tiles.some(t=>t.owned&&(t.road||t.id===78)&&Math.abs(t.id%WIDTH-x)+Math.abs(Math.floor(t.id/WIDTH)-y)===1);
  if(!connected&&!tile.road)return setNotice("Roads must connect to your cottage or an existing road.");
  setTiles(v=>v.map(t=>t.id===selected?{...t,road:true}:t));
  return setNotice("Road connected! Claim neighboring land to extend it.");
 }
 if(tile.road)return setNotice("This plot is a road. Choose another plot for a building.");
 setTiles(v=>v.map(t=>t.id===selected?{...t,building:tool}:t));setNotice("Building placed in prototype. No XP charged.");
};
 return <section className="owIsoShell" aria-label="Isometric landscape prototype"><div className="owIsoTop"><div><strong>🏞 Your Valley</strong><small>{count} plots owned · {RESOURCE_COUNT} resource plots (15%)</small></div><div className="owIsoZoom"><button onClick={()=>setScale(v=>clamp(v-.15))} aria-label="Zoom out">−</button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(v=>clamp(v+.15))} aria-label="Zoom in">+</button><button onClick={()=>{setScale(1);setOffset({x:0,y:0});}} aria-label="Reset camera">⌖</button></div></div><div className={`owIsoViewport ${night?"owNight":""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><div className="owIsoScene" style={{transform:`translate3d(${offset.x}px,${offset.y}px,0) scale(${scale})`}}>{tiles.map(t=>{const x=t.id%WIDTH,y=Math.floor(t.id/WIDTH);return <button key={t.id} className={`owIsoTile ${t.kind} ${t.road?"road":""} ${t.owned?"owned":""} ${selected===t.id?"selected":""}`} style={{left:50+(x-y)*STEP_X,top:60+(x+y)*STEP_Y}} aria-label={`Plot ${t.id+1}, ${t.kind}, ${t.owned?"owned":"unclaimed"}`} aria-pressed={selected===t.id} onClick={()=>pick(t.id)}>{t.road?<svg className="owRoadArt" viewBox="0 0 96 52" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="owRoadClip"><path d="M48 0 L96 26 L48 52 L0 26 Z"/></clipPath></defs><g clipPath="url(#owRoadClip)">{(roadLinks(t.id,tiles).length?roadLinks(t.id,tiles):[[72,39]]).map(([px,py],i)=><g key={i}><path d={`M48 26 L${px} ${py}`} stroke="#6f7374" strokeWidth="31" strokeLinecap="square"/><path d={`M48 26 L${px} ${py}`} stroke="#92999a" strokeWidth="25" strokeLinecap="square"/><path d={`M48 26 L${px} ${py}`} stroke="#f8e9b7" strokeWidth="1.8" strokeDasharray="5 6" strokeLinecap="round"/></g>)}<circle cx="48" cy="26" r="12" fill="#92999a"/></g></svg>:<span>{t.building==="🏡"?"":t.building||(t.kind==="grass"?"":glyph[t.kind])}</span>}{t.owned&&<i>◆</i>}</button>})}{tiles.filter(t=>t.building==="🏡").map(t=>{const x=t.id%WIDTH,y=Math.floor(t.id/WIDTH);return <div key={`house-${t.id}`} className="owIsoHouse" style={{left:50+(x-y)*STEP_X,top:60+(x+y)*STEP_Y}} aria-hidden="true">🏡</div>})}</div><div className="owIsoHint">Drag to pan · Pinch to zoom · Tap to select</div><div className="owIsoSceneTools" onPointerDown={e=>e.stopPropagation()}><button onClick={()=>setNight(v=>!v)} aria-pressed={night} aria-label="Toggle day and night">{night?"☀️ Day":"🌙 Night"}</button><button onClick={()=>setShowMap(v=>!v)} aria-pressed={showMap} aria-label="Toggle minimap">🧭 Map</button></div>{showMap&&<div className="owIsoMini" aria-label="Terrain minimap" onPointerDown={e=>e.stopPropagation()}><div className="owIsoMiniGrid">{tiles.map(t=><button key={t.id} aria-label={`Locate plot ${t.id+1}`} title={`Plot ${t.id+1}`} onClick={()=>{setSelected(t.id);setOffset({x:-(t.id%WIDTH-6)*STEP_X*1.1,y:-(Math.floor(t.id/WIDTH)-6)*STEP_Y*1.5});setNotice(`Centered plot ${t.id+1}.`);}} className={`${t.kind} ${t.road?"road":""} ${t.owned?"owned":""} ${t.id===selected?"selected":""}`}/>)}</div><span>REGION · {WIDTH}×{HEIGHT}</span></div>}</div><div className="owIsoControls"><div><small>SELECTED PLOT</small><strong>#{selected+1} · {tile.kind}</strong><span>{tile.owned?"Your land":"Unclaimed land"}</span></div><div className="owIsoTools">{buildings.map(([emoji,name])=><button key={name} className={tool===emoji?"active":""} onClick={()=>setTool(emoji)} aria-pressed={tool===emoji}>{emoji}<span>{name}</span></button>)}</div><button className="owIsoAction" onClick={tile.owned?place:claim}>{tile.owned?(tool==="🛣️"?"Connect road":"Place building"):"Claim plot"}</button></div><p role="status" className="owIsoNotice">{notice}</p><p className="owIsoDisclaimer">Visual sandbox only. No XP, land ownership, or building changes are saved to your account.</p></section>;
}