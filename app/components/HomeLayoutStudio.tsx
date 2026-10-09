"use client";
import {useEffect,useRef,useState} from "react";
type Mode="center"|"rail";
type Item={id:string;mode:Mode;order:number;hidden:boolean;size:number};
const KEY="1muslim-home-layout-v1";
export default function HomeLayoutStudio(){
 const [editing,setEditing]=useState(false),[items,setItems]=useState<Item[]>([]);
 const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
 const active=useRef<string|null>(null);
 const [drag,setDrag]=useState<string|null>(null);
 const refs=useRef<Map<string,HTMLElement>>(new Map());
 useEffect(()=>{
  const main=document.querySelector<HTMLElement>("main.feed"),rail=document.querySelector<HTMLElement>(".rightRail");
  if(!main||!rail)return;
  const nodes=[...Array.from(main.children).filter((n):n is HTMLElement=>n instanceof HTMLElement&&n.tagName!=="FOOTER"),...Array.from(rail.children).filter((n):n is HTMLElement=>n instanceof HTMLElement&&n.classList.contains("railCard"))];
  let saved:Item[]=[];try{saved=JSON.parse(localStorage.getItem(KEY)||"[]") as Item[]}catch{}
  const next=nodes.map((node,i)=>{const id="home-"+i;refs.current.set(id,node);node.dataset.homeWidget=id;const old=saved.find(x=>x.id===id);return old||{id,mode:node.closest(".rightRail")?"rail" as Mode:"center" as Mode,order:i,hidden:false,size:1}});
  setItems(next);
  return()=>{nodes.forEach(n=>{delete n.dataset.homeWidget;n.style.removeProperty("order");n.style.removeProperty("display");n.style.removeProperty("transform");n.style.removeProperty("transform-origin")});refs.current.clear()};
 },[]);
 useEffect(()=>{if(!items.length)return;try{localStorage.setItem(KEY,JSON.stringify(items))}catch{};for(const it of items){const el=refs.current.get(it.id);if(!el)continue;el.style.order=String(it.order);el.style.display=it.hidden?"none":"";el.style.transform=it.size===1?"":`scale(${it.size})`;el.style.transformOrigin="top center";el.dataset.editing=editing?"true":"false"}},[items,editing]);
 useEffect(()=>{
  const main=document.querySelector<HTMLElement>("main.feed"),rail=document.querySelector<HTMLElement>(".rightRail");
  if(!main||!rail)return;
  const oldMain=main.style.display,oldRail=rail.style.display;
  main.style.display="flex";main.style.flexDirection="column";rail.style.display="flex";rail.style.flexDirection="column";
  const down=(e:PointerEvent)=>{const el=(e.target as Element).closest<HTMLElement>("[data-home-widget]");if(!el||editing||e.target instanceof HTMLInputElement||e.target instanceof HTMLButtonElement||e.target instanceof HTMLAnchorElement)return;hold.current=setTimeout(()=>{setEditing(true);navigator.vibrate?.(35)},650)};
  const cancel=()=>{if(hold.current)clearTimeout(hold.current)};
  main.addEventListener("pointerdown",down);rail.addEventListener("pointerdown",down);document.addEventListener("pointerup",cancel);document.addEventListener("pointermove",cancel);
  return()=>{main.style.display=oldMain;rail.style.display=oldRail;main.removeEventListener("pointerdown",down);rail.removeEventListener("pointerdown",down);document.removeEventListener("pointerup",cancel);document.removeEventListener("pointermove",cancel);cancel()};
 },[editing]);
 const update=(id:string,patch:Partial<Item>)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
 const move=(id:string,other:string)=>{if(id===other)return;setItems(prev=>{const a=prev.find(x=>x.id===id),b=prev.find(x=>x.id===other);if(!a||!b||a.mode!==b.mode)return prev;return prev.map(x=>x.id===id?{...x,order:b.order}:x.id===other?{...x,order:a.order}:x)})};
 return <><button className="home-studio-launch" onClick={()=>setEditing(v=>!v)}>{editing?"✓ Finish layout":"✦ Customize home"}</button>{editing&&<div className="home-studio-panel" role="region" aria-label="Home layout editor"><strong>✨ Elmi Light Layout Studio</strong><small>Hold a section to enter edit mode. Drag cards within their column, resize, or hide. Changes stay on this device.</small><div className="home-studio-scroll">{items.filter(x=>!x.hidden).sort((a,b)=>a.mode.localeCompare(b.mode)||a.order-b.order).map(it=><div key={it.id} className="home-studio-row" draggable onDragStart={()=>{active.current=it.id;setDrag(it.id)}} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(active.current)move(active.current,it.id);setDrag(null)}} onDragEnd={()=>{active.current=null;setDrag(null)}} style={{boxShadow:drag===it.id?"0 0 18px #62e9ff":undefined}}><span>⠿ {it.mode==="rail"?"▥ Right":"▣ Center"} · {refs.current.get(it.id)?.querySelector("h2,h3")?.textContent?.slice(0,23)||it.id}</span><div><button aria-label="Move up" onClick={()=>{const peers=items.filter(x=>x.mode===it.mode&&!x.hidden).sort((a,b)=>a.order-b.order),idx=peers.findIndex(x=>x.id===it.id);if(idx>0)move(it.id,peers[idx-1].id)}}>↑</button><button aria-label="Move down" onClick={()=>{const peers=items.filter(x=>x.mode===it.mode&&!x.hidden).sort((a,b)=>a.order-b.order),idx=peers.findIndex(x=>x.id===it.id);if(idx<peers.length-1)move(it.id,peers[idx+1].id)}}>↓</button><button aria-label="Shrink" onClick={()=>update(it.id,{size:Math.max(.7,+(it.size-.1).toFixed(1))})}>−</button><button aria-label="Grow" onClick={()=>update(it.id,{size:Math.min(1.2,+(it.size+.1).toFixed(1))})}>＋</button><button aria-label="Hide" onClick={()=>update(it.id,{hidden:true})}>◌</button></div></div>)}</div>{items.some(x=>x.hidden)&&<button onClick={()=>setItems(p=>p.map(x=>({...x,hidden:false})))}>Show hidden sections</button>}<button onClick={()=>{localStorage.removeItem(KEY);setItems(p=>p.map((x,i)=>({...x,order:i,hidden:false,size:1})))}}>Reset layout</button></div>}<style jsx>{`
.home-studio-launch{position:fixed;left:12px;bottom:80px;z-index:1200;border:1px solid #7ce9c6;background:#0c2639ed;color:#ddfff7;padding:11px 15px;border-radius:999px;box-shadow:0 0 20px #4ee8d766;font-weight:800}
.home-studio-panel{position:fixed;right:10px;top:12%;z-index:1201;width:min(370px,94vw);max-height:76vh;overflow:auto;background:#071b2af5;border:1px solid #72eaff;border-radius:18px;padding:14px;color:#fff;box-shadow:0 0 35px #6de6fa55}
.home-studio-panel strong,.home-studio-panel small{display:block;margin-bottom:10px}.home-studio-panel small{opacity:.8}.home-studio-scroll{max-height:48vh;overflow:auto}.home-studio-row{border:1px solid #4c9a9b88;padding:8px;margin:6px 0;border-radius:10px;cursor:grab}.home-studio-row span{display:block;font-size:12px}.home-studio-row div{display:flex;justify-content:flex-end;gap:4px}.home-studio-panel button{border:1px solid #87d6ce77;border-radius:7px;background:#14364a;color:white;padding:5px 8px;margin:2px}
`}</style></>
}
