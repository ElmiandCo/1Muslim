"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./EmoTexts.module.css";

/** First release: only the first three rows of the approved EmoTexts design.
 * Quran book art is replaced by a standalone Arabic dhikr key. The Palestine
 * flag and its Arabic text are separate keys; the right-hand mosque is omitted.
 * No sticker has a baked-in tile/background: transparent typography and symbols.
 */
export type EmoTextEntry = {
 id: string; label: string; art: string; category: "Reaction" | "Dhikr" | "Dua" | "Arabic" | "Symbol";
 kind: "latin" | "arabic" | "symbol"; tone: "red" | "gold" | "white" | "green";
};
export const EMOTEXTS: readonly EmoTextEntry[] = [
 {id:"w",label:"W",art:"W",category:"Reaction",kind:"latin",tone:"red"},
 {id:"inshallah",label:"Inshallah",art:"Inshallah",category:"Dua",kind:"latin",tone:"white"},
 {id:"mashallah",label:"Mashallah",art:"MashaAllah",category:"Dhikr",kind:"latin",tone:"gold"},
 {id:"allahu-akbar",label:"Allahu Akbar",art:"Allahu Akbar",category:"Dhikr",kind:"latin",tone:"gold"},
 {id:"allah",label:"Allah (Arabic)",art:"اللَّه",category:"Arabic",kind:"arabic",tone:"gold"},
 {id:"salawat",label:"Sallallahu alayhi wa sallam",art:"صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",category:"Arabic",kind:"arabic",tone:"gold"},
 {id:"alhamdulillah",label:"Alhamdulillah",art:"Alhamdulillah",category:"Dhikr",kind:"latin",tone:"gold"},
 {id:"subhanallah",label:"SubhanAllah",art:"SubhanAllah",category:"Dhikr",kind:"latin",tone:"white"},
 {id:"astaghfirullah",label:"Astaghfirullah",art:"Astaghfirullah",category:"Dhikr",kind:"latin",tone:"white"},
 {id:"tawhid",label:"La ilaha illa Allah",art:"La ilaha illa Allah",category:"Dhikr",kind:"latin",tone:"white"},
 {id:"bismillah",label:"Bismillah",art:"Bismillah",category:"Dhikr",kind:"latin",tone:"gold"},
 {id:"alhamdulillah-ar",label:"Alhamdulillah (Arabic)",art:"الْحَمْدُ لِلَّهِ",category:"Arabic",kind:"arabic",tone:"gold"},
 {id:"crescent",label:"Crescent moon",art:"☾",category:"Symbol",kind:"symbol",tone:"gold"},
 {id:"kaaba",label:"Kaaba",art:"🕋",category:"Symbol",kind:"symbol",tone:"gold"},
 // Previously positioned under the Quran illustration: the text survives independently.
 {id:"subhanallah-ar",label:"SubhanAllah (Arabic)",art:"سُبْحَانَ اللَّهِ",category:"Arabic",kind:"arabic",tone:"gold"},
 {id:"green-dome",label:"Green dome",art:"🕌",category:"Symbol",kind:"symbol",tone:"green"},
 {id:"palestine-flag",label:"Palestine flag",art:"🇵🇸",category:"Symbol",kind:"symbol",tone:"white"},
 // The separate Arabic key formerly placed below the flag.
 {id:"tawhid-ar",label:"La ilaha illa Allah (Arabic)",art:"لَا إِلَٰهَ إِلَّا اللَّهُ",category:"Arabic",kind:"arabic",tone:"gold"}
];
const byId = new Map(EMOTEXTS.map(entry => [entry.id, entry]));
export const emotextToken = (id: string) => `[[et:${id}]]`;
const tokenPattern = /(\[\[et:[a-z0-9-]+\]\])/g;
const idFromToken = (token: string) => token.slice(5, -2);

export function EmoTextArt({item,small=false}:{item:EmoTextEntry;small?:boolean}) {
 return <span className={[styles.art,styles[item.kind],styles[item.tone],small?styles.small:""].filter(Boolean).join(" ")} lang={item.kind==="arabic"?"ar":undefined} dir={item.kind==="arabic"?"rtl":undefined}>{item.art}</span>;
}

/** Stored comments remain plain text. Recognized tokens render safely as inline transparent stickers. */
export function EmoTextContent({text}:{text:string}):ReactNode {
 return <>{text.split(tokenPattern).map((piece,index)=>{
  const item=piece.startsWith("[[et:")?byId.get(idFromToken(piece)):undefined;
  return item?<EmoTextArt key={index} item={item} small/>:<span key={index}>{piece}</span>;
 })}</>;
}

function readEditor(node:Node):string {
 if(node.nodeType===Node.TEXT_NODE)return node.textContent||"";
 if(!(node instanceof HTMLElement))return "";
 const id=node.dataset.emotextId;
 if(id&&byId.has(id))return emotextToken(id);
 if(node.tagName==="BR")return "\n";
 return Array.from(node.childNodes).map(readEditor).join("")+(node.tagName==="DIV"&&node.getAttribute("role")!=="textbox"?"\n":"");
}

function populateEditor(element:HTMLElement,value:string) {
 element.replaceChildren();
 for(const piece of value.split(tokenPattern)){
  if(!piece)continue;
  const item=piece.startsWith("[[et:")?byId.get(idFromToken(piece)):undefined;
  if(!item){element.appendChild(document.createTextNode(piece));continue;}
  const sticker=document.createElement("span");
  sticker.dataset.emotextId=item.id;
  sticker.contentEditable="false";
  sticker.className=[styles.art,styles[item.kind],styles[item.tone],styles.inEditor].join(" ");
  sticker.textContent=item.art;
  sticker.title=item.label;
  sticker.setAttribute("aria-label",item.label);
  if(item.kind==="arabic"){sticker.lang="ar";sticker.dir="rtl";}
  element.appendChild(sticker);
 }
}

/** A true bottom sheet: rise on open, drag its grab handle or header,
 * dismiss by throwing it down, tapping the embedded X, scrim, or Escape.
 * The key grid remains independently scrollable and won't trigger dismissal.
 */
export function EmoTextKeyboard({onInsert,disabled=false}:{onInsert:(id:string)=>void;disabled?:boolean}) {
 const [open,setOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const [visible,setVisible]=useState(false);
 const [closing,setClosing]=useState(false);
 const [dragging,setDragging]=useState(false);
 const [dragY,setDragY]=useState(0);
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("All");
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 const gesture=useRef<{pointerId:number;startY:number;startTime:number}|null>(null);

 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!open)return;
  const frame=window.requestAnimationFrame(()=>setVisible(true));
  return()=>window.cancelAnimationFrame(frame);
 },[open]);
 useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current)},[]);

 const closeSheet=useCallback(()=>{
  if(!open||closing)return;
  gesture.current=null;
  setDragging(false);
  setClosing(true);
  setDragY(0);
  if(timeout.current)clearTimeout(timeout.current);
  timeout.current=window.setTimeout(()=>{
   setOpen(false);setVisible(false);setClosing(false);setDragY(0);
   timeout.current=null;
  },260);
 },[open,closing]);

 useEffect(()=>{
  if(!open)return;
  const onKey=(event:globalThis.KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();closeSheet();}};
  document.addEventListener("keydown",onKey);
  return()=>document.removeEventListener("keydown",onKey);
 },[open,closeSheet]);

 const startDrag=(event:ReactPointerEvent<HTMLElement>)=>{
  if(closing||(event.pointerType==="mouse"&&event.button!==0))return;
  // The X is an independent control, not part of the drag gesture.
  if((event.target as HTMLElement).closest("button,input,a"))return;
  gesture.current={pointerId:event.pointerId,startY:event.clientY,startTime:event.timeStamp};
  setDragging(true);
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const moveDrag=(event:ReactPointerEvent<HTMLElement>)=>{
  const current=gesture.current;
  if(!current||current.pointerId!==event.pointerId)return;
  setDragY(Math.min(window.innerHeight,Math.max(0,event.clientY-current.startY)));
 };
 const finishDrag=(event:ReactPointerEvent<HTMLElement>)=>{
  const current=gesture.current;
  if(!current||current.pointerId!==event.pointerId)return;
  gesture.current=null;
  const distance=Math.max(0,event.clientY-current.startY);
  const speed=distance/Math.max(1,event.timeStamp-current.startTime);
  if(distance>100||(distance>35&&speed>.7))closeSheet();
  else{setDragging(false);setDragY(0);}
 };
 const cancelDrag=()=>{
  gesture.current=null;
  setDragging(false);
  setDragY(0);
 };
 const shown=useMemo(()=>EMOTEXTS.filter(item=>(category==="All"||category===item.category)&&(item.label+" "+item.art).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),[category,search]);

 return <>
  <button type="button" className={styles.toggle} disabled={disabled} aria-label="Switch to 1Muslim EmoTexts keyboard" aria-expanded={open&&!closing} aria-controls="om-emotext-sheet" onClick={()=>{
   if(open){closeSheet();return;}
   (document.activeElement as HTMLElement|null)?.blur?.();
   setDragY(0);setDragging(false);setClosing(false);setVisible(false);setOpen(true);
  }} title="1Muslim EmoTexts">✦<span>EmoTexts</span></button>
  {open&&mounted&&createPortal(<>
   <div className={[styles.scrim,visible&&!closing?styles.scrimVisible:""].join(" ")} onClick={closeSheet} aria-hidden="true"/>
   <section id="om-emotext-sheet"
    className={[styles.panel,visible?styles.visible:"",dragging?styles.dragging:"",closing?styles.closing:""].filter(Boolean).join(" ")}
    style={{"--drag-y":dragY+"px"} as CSSProperties}
    role="dialog" aria-modal="true" aria-label="1Muslim EmoTexts keyboard">
    <div className={styles.dragHandle} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={cancelDrag} aria-label="Drag down to close EmoTexts">
     <span className={styles.grabber} aria-hidden="true"/>
    </div>
    <header className={styles.header} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={cancelDrag}>
     <div><strong>✦ 1Muslim <em>EmoTexts</em></strong><small>Mix transparent calligraphy and expressions with your words</small></div>
     <button className={styles.close} type="button" onClick={closeSheet} aria-label="Close EmoTexts" title="Close EmoTexts">×</button>
    </header>
    <input className={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search EmoTexts…" aria-label="Search EmoTexts"/>
    <div className={styles.categories} role="group" aria-label="EmoText category">{["All","Dhikr","Dua","Arabic","Symbol","Reaction"].map(name=><button type="button" key={name} className={category===name?styles.active:""} onClick={()=>setCategory(name)} aria-pressed={category===name}>{name}</button>)}</div>
    <div className={styles.grid} role="group" aria-label="EmoText keys">{shown.map(item=><button type="button" key={item.id} className={styles.key} title={item.label} aria-label={"Insert "+item.label} onClick={()=>onInsert(item.id)}><EmoTextArt item={item}/></button>)}{!shown.length&&<p className={styles.empty}>No matching EmoTexts.</p>}</div>
   </section>
  </>,document.body)}
 </>;
}

/** Editable rich text: users never see the token syntax, and text + stickers can mix. */
export function EmoTextComposer({value,onChange,maxLength=500,disabled=false,placeholder="Write a comment…",ariaLabel="Write a comment"}:{
 value:string;onChange:(value:string)=>void;maxLength?:number;disabled?:boolean;placeholder?:string;ariaLabel?:string;
}) {
 const editor=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=editor.current;
  if(!el||readEditor(el)===value)return;
  populateEditor(el,value);
 },[value]);
 const sync=()=>{
  if(!editor.current)return;
  const current=readEditor(editor.current);
  if(current.length>maxLength){populateEditor(editor.current,value);return;}
  onChange(current);
 };
 const add=(id:string)=>{
  const token=emotextToken(id);
  const spacer=value&&!/\s$/.test(value)?" ":"";
  const candidate=value+spacer+token;
  if(candidate.length<=maxLength)onChange(candidate);
 };
 const keydown=(e:KeyboardEvent<HTMLDivElement>)=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.closest("form")?.requestSubmit();}
 };
 const paste=(e:React.ClipboardEvent<HTMLDivElement>)=>{
  e.preventDefault();
  const text=e.clipboardData.getData("text/plain");
  const selection=window.getSelection();
  if(!selection?.rangeCount)return;
  const range=selection.getRangeAt(0);
  range.deleteContents();
  const inserted=document.createTextNode(text);
  range.insertNode(inserted);
  range.setStartAfter(inserted);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
  sync();
 };
 return <div className={styles.composer}>
  <div ref={editor} className={styles.editable} role="textbox" aria-label={ariaLabel} aria-multiline="true" aria-disabled={disabled} data-placeholder={placeholder} contentEditable={!disabled} suppressContentEditableWarning onInput={sync} onKeyDown={keydown} onPaste={paste}/>
  <EmoTextKeyboard onInsert={add} disabled={disabled}/>
 </div>;
}
