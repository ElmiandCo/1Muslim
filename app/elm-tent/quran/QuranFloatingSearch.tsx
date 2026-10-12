"use client";
import {useEffect,useMemo,useState} from "react";
type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number};
type Match={verse_key:string;text?:string;highlighted?:string;translations?:{text?:string}[]};
const clean=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").trim();
export default function QuranFloatingSearch({chapters,onSelect}:{chapters:Chapter[];onSelect:(key:string)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(""),[results,setResults]=useState<Match[]>([]),[loading,setLoading]=useState(false),[failure,setFailure]=useState("");
 const normalized=query.trim();
 const chapterHits=useMemo(()=>normalized?chapters.filter(c=>String(c.id)===normalized||c.name_simple.toLowerCase().includes(normalized.toLowerCase())||c.name_arabic.includes(normalized)).slice(0,7):[],[chapters,normalized]);
 useEffect(()=>{if(!open||normalized.length<2){setResults([]);setLoading(false);return}const controller=new AbortController();const timer=window.setTimeout(async()=>{setLoading(true);setFailure("");try{const response=await fetch("https://api.quran.com/api/v4/search?q="+encodeURIComponent(normalized)+"&size=15&page=1&language=en",{signal:controller.signal});if(!response.ok)throw new Error("Search temporarily unavailable");const json=await response.json();setResults(Array.isArray(json?.search?.results)?json.search.results:[])}catch(e){if(!controller.signal.aborted){setFailure("Verse search is temporarily unavailable. Chapter and verse references still work.");setResults([])}}finally{if(!controller.signal.aborted)setLoading(false)}},350);return()=>{controller.abort();window.clearTimeout(timer)}},[open,normalized]);
 const choose=(key:string)=>{onSelect(key);setOpen(false);setQuery("")};
 const direct=/^([1-9]|[1-9][0-9]|1[01][0-4])\s*[:：]\s*([1-9][0-9]{0,2})$/.exec(normalized);
 const directKey=direct?direct[1]+":"+direct[2]:null;
 return <div className="omQuranSearchDock">
 <button type="button" className="omQuranSearchTrigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="omQuranSearchPanel">⌕ <span>Search the entire Qur'an</span><kbd>114 surahs</kbd></button>
 {open&&<div id="omQuranSearchPanel" className="omQuranSearchPanel" role="search">
 <div className="omQuranSearchInputRow"><span aria-hidden="true">⌕</span><input autoFocus aria-label="Search Qur'an" placeholder="Surah, Arabic word, English phrase, or 2:255…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={()=>setOpen(false)} aria-label="Close Quran search">✕</button></div>
 <div className="omQuranSearchResults" aria-live="polite">
 {!normalized&&<p>Find any surah, word, phrase or verse reference. Select a result to jump directly to the ayah.</p>}
 {directKey&&<button type="button" className="omQuranSearchHit" onClick={()=>choose(directKey)}><strong>↗ Go directly to {directKey}</strong><small>Open this verse in Quran Studio</small></button>}
 {chapterHits.map(c=><button key={c.id} type="button" className="omQuranSearchHit" onClick={()=>choose(c.id+":1")}><strong>{c.id}. {c.name_simple} · {c.name_arabic}</strong><small>{c.verses_count} verses · Open surah</small></button>)}
 {loading&&<p>Searching verses…</p>}{failure&&<p role="status">{failure}</p>}
 {results.map((v,i)=><button key={v.verse_key+"-"+i} type="button" className="omQuranSearchHit" onClick={()=>choose(v.verse_key)}><strong>Ayah {v.verse_key} ↗</strong><small dir="auto">{clean(v.highlighted||v.text||v.translations?.[0]?.text||"Open verse")}</small></button>)}
 {!loading&&!failure&&normalized.length>2&&!results.length&&!chapterHits.length&&!directKey&&<p>No matches yet. Try another spelling or a verse number.</p>}
 </div></div>}
 <style jsx>{`
 .omQuranSearchDock{position:relative;z-index:25;margin:10px 0 20px;width:100%}
 .omQuranSearchTrigger{display:flex;align-items:center;gap:12px;width:100%;padding:14px 18px;border:1px solid rgba(215,230,255,.34);border-radius:19px;background:linear-gradient(125deg,rgba(25,40,66,.89),rgba(14,34,48,.87));box-shadow:0 16px 36px #0005,inset 0 1px #ffffff29;color:#f3f7ff;font-weight:750;text-align:left;cursor:pointer;backdrop-filter:blur(22px)}
 .omQuranSearchTrigger span{flex:1}.omQuranSearchTrigger kbd{font:600 10px system-ui;color:#a9c3cf;white-space:nowrap}
 .omQuranSearchPanel{position:absolute;left:0;right:0;top:calc(100% + 8px);border:1px solid #ffffff4d;border-radius:20px;background:#101b2bf7;box-shadow:0 25px 80px #000b;backdrop-filter:blur(28px);overflow:hidden;color:white}
 .omQuranSearchInputRow{display:flex;gap:9px;align-items:center;padding:13px;border-bottom:1px solid #ffffff24}.omQuranSearchInputRow input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:white;font-size:14px}.omQuranSearchInputRow button{background:#ffffff16;color:white;border:0;border-radius:50%;width:30px;height:30px;cursor:pointer}
 .omQuranSearchResults{max-height:min(52dvh,420px);overflow:auto;padding:8px}.omQuranSearchResults p{padding:12px;color:#b9c8d4;font-size:12px}.omQuranSearchHit{width:100%;display:grid;gap:5px;padding:12px;border:0;border-radius:12px;background:transparent;color:#f6f8ff;text-align:left;cursor:pointer}.omQuranSearchHit:hover,.omQuranSearchHit:focus-visible{background:#ffffff18}.omQuranSearchHit small{color:#aabecb;line-height:1.5;max-height:4.5em;overflow:hidden}
 @media(max-width:600px){.omQuranSearchTrigger{padding:12px}.omQuranSearchTrigger kbd{display:none}.omQuranSearchPanel{position:fixed;top:12dvh;left:12px;right:12px;max-height:72dvh}}
 `}</style></div>
}
