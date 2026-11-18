"use client";
import {useMemo,useState} from "react";
type Region={country:string;state:string;region:string;biome:string;resources:string[];seed:number};
const REGIONS:Region[]=[
 {country:"United States",state:"Minnesota",region:"Twin Cities",biome:"Temperate forest",resources:["Timber","Fresh water","Fertile soil"],seed:17},
 {country:"Somalia",state:"Banaadir",region:"Mogadishu",biome:"Coastal grassland",resources:["Fish","Stone","Grazing land"],seed:31},
 {country:"Türkiye",state:"Istanbul",region:"Marmara",biome:"Mixed woodland",resources:["Timber","Clay","Fresh water"],seed:47}
];
export default function GeographicNavigator(){
 const [level,setLevel]=useState<"world"|"country"|"state"|"region"|"plot">("world");
 const [region,setRegion]=useState(0);
 const [plot,setPlot]=useState(78);
 const active=REGIONS[region];
 const crumbs=useMemo(()=>[{name:"Earth",level:"world" as const},{name:active.country,level:"country" as const},{name:active.state,level:"state" as const},{name:active.region,level:"region" as const},{name:"Plot "+(plot+1),level:"plot" as const}], [active,plot]);
 const index=["world","country","state","region","plot"].indexOf(level);
 return <section aria-label="Geographic world navigator" className="owGeo" style={{padding:"12px 16px",border:"1px solid #6b836b",borderRadius:16,marginBottom:14,background:"rgba(12,36,29,.7)",color:"#f3f6ed"}}>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>{crumbs.slice(0,index+1).map(c=><button key={c.level} onClick={()=>setLevel(c.level)} style={{padding:"6px 9px",borderRadius:9}}>{c.name}</button>)}<span style={{opacity:.8}}>🌐 {level.toUpperCase()}</span></div>
 <p style={{margin:"10px 0"}}>{level==="world"?"Explore prototype regions. Select a country to zoom in.":level==="plot"?`Plot ${plot+1} · ${active.biome} · ${active.resources.join(", ")}`:`${active.region}, ${active.state} · ${active.biome} · ${active.resources.join(", ")}`}</p>
 {level==="world"?<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{REGIONS.map((r,i)=><button key={r.country} onClick={()=>{setRegion(i);setLevel("country");}}>{r.country}</button>)}</div>:level==="country"?<button onClick={()=>setLevel("state")}>Explore {active.state} →</button>:level==="state"?<button onClick={()=>setLevel("region")}>Explore {active.region} →</button>:level==="region"?<div><label htmlFor="ow-plot">View sample plot </label><select id="ow-plot" value={plot} onChange={e=>setPlot(Number(e.target.value))}>{Array.from({length:144},(_,i)=><option key={i} value={i}>Plot {i+1}</option>)}</select><button onClick={()=>setLevel("plot")}>Inspect plot →</button></div>:<button onClick={()=>setLevel("region")}>Back to region</button>}
 <small style={{display:"block",marginTop:9,opacity:.8}}>Geography is a sample navigation layer; ownership and XP remain server-disabled. The valley below is a separate visual sandbox.</small>
 </section>;
}
