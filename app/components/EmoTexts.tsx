"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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

export function EmoTextKeyboard({onInsert,onABC,disabled=false}:{onInsert:(id:string)=>void;onABC?:()=>void;disabled?:boolean}) {
 const [open,setOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("All");
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{if(!open)return;const key=(e:globalThis.KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key)},[open]);
 const shown=useMemo(()=>EMOTEXTS.filter(item=>(category==="All"||category===item.category)&&(item.label+" "+item.art).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),[category,search]);
 return <>
  <button type="button" className={styles.toggle} disabled={disabled} aria-label="Switch to 1Muslim EmoTexts keyboard" aria-expanded={open} aria-controls="om-emotext-sheet" onClick={()=>{if(!open){(document.activeElement as HTMLElement|null)?.blur?.()}setOpen(v=>!v)}} title="1Muslim EmoTexts">✦<span>EmoTexts</span></button>
  {open&&mounted&&createPortal(<>
   <div className={styles.scrim} onClick={()=>setOpen(false)} aria-hidden="true"/>
   <section id="om-emotext-sheet" className={styles.panel} role="dialog" aria-modal="true" aria-label="1Muslim EmoTexts keyboard">
    <div className={styles.grabber} aria-hidden="true"/>
    <header className={styles.header}><div><strong>✦ 1Muslim <em>EmoTexts</em></strong><small>Mix transparent calligraphy and expressions with your words</small></div><button className={styles.close} type="button" onClick={()=>setOpen(false)} aria-label="Close EmoTexts">×</button></header>
    <input className={styles.search} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search EmoTexts…" aria-label="Search EmoTexts"/>
    <div className={styles.categories} role="group" aria-label="EmoText category">{["All","Dhikr","Dua","Arabic","Symbol","Reaction"].map(name=><button type="button" key={name} className={category===name?styles.active:""} onClick={()=>setCategory(name)} aria-pressed={category===name}>{name}</button>)}</div>
    <div className={styles.grid} role="group" aria-label="EmoText keys">{shown.map(item=><button type="button" key={item.id} className={styles.key} title={item.label} aria-label={"Insert "+item.label} onClick={()=>onInsert(item.id)}><EmoTextArt item={item}/></button>)}{!shown.length&&<p className={styles.empty}>No matching EmoTexts.</p>}</div>
    <footer className={styles.footer}><button type="button" onClick={()=>{setOpen(false);onABC?.()}} className={styles.abc}>⌨ ABC</button><span>First collection · 18 unique keys</span><button type="button" onClick={()=>setOpen(false)} className={styles.done}>Done ✓</button></footer>
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
  <EmoTextKeyboard onInsert={add} onABC={()=>{const el=editor.current;if(!el)return;el.focus();const range=document.createRange();range.selectNodeContents(el);range.collapse(false);const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range)}} disabled={disabled}/>
 </div>;
}
