"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import VerseStudio from "./VerseStudio";
import VerseRecorder from "./VerseRecorder";
import VerseDMShare from "./VerseDMShare";
import VerseEngagement from "./VerseEngagement";
import InlineAnnotations from "./InlineAnnotations";
import VerseMediaTips from "./VerseMediaTips";
import HudHudVision from "./HudHudVision";
import HudHudQuranText from "./HudHudQuranText";
import ElmiVerseMoment from "./ElmiVerseMoment";
import VersePostStudio from "./VersePostStudio";
type Chapter={id:number;name_simple:string;name_arabic:string;verses_count:number;translated_name?:{name:string}};
type QuranWord={id:number;text_uthmani?:string;char_type_name?:string;translation?:{text:string};transliteration?:{text:string}};
type Verse={id:number;verse_key:string;text_uthmani?:string;words?:QuranWord[];translations?:{text:string}[]};
const API="https://api.quran.com/api/v4";
const FALLBACK="https://api.alquran.cloud/v1";
const activeChapterCount=(chapters:Chapter[],id:number)=>chapters.find(c=>c.id===id)?.verses_count||0;
const strip=(s:string)=>s.replace(/<[^>]*>/g,"").replace(/&[^;]+;/g," ");
export default function QuranLessons(){
 const [chapters,setChapters]=useState<Chapter[]>([]),[chapter,setChapter]=useState(()=>{const params=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams();const n=Number(params.get("chapter")||params.get("verse")?.split(":")[0]||1);return Number.isInteger(n)&&n>=1&&n<=114?n:1}),[page,setPage]=useState(1),[verses,setVerses]=useState<Verse[]>([]),[total,setTotal]=useState(0),[search,setSearch]=useState(""),[busy,setBusy]=useState(true),[error,setError]=useState(""),[showTranslation,setShowTranslation]=useState(true);
 useEffect(()=>{let live=true;fetch(API+"/chapters?language=en").then(r=>{if(!r.ok)throw Error("Qur'an chapter service unavailable");return r.json()}).then(d=>{if(live)setChapters(d.chapters||[])}).catch(()=>{if(live)setError("Could not load chapters. Please try again.")});return()=>{live=false}},[]);
 useEffect(()=>{
  let live=true;
  setBusy(true);setError("");setVerses([]);
  const load=async()=>{
   const first=(page-1)*50;
   const normalize=(items:Verse[])=>items.map(v=>({...v,words:v.words?.filter(w=>w.char_type_name!=="end"&&!!w.text_uthmani)}));
   const local=async()=>{
    const response=await fetch("/quran-data/"+chapter+".json");
    if(!response.ok)throw Error("Local corpus not available");
    const all=await response.json() as {verse_key:string;arabic:string;english?:string}[];
    if(!Array.isArray(all)||!all.length)throw Error("Invalid local corpus");
    return {items:all.slice(first,first+50).map((v,i)=>({id:first+i+1,verse_key:v.verse_key,text_uthmani:v.arabic,translations:v.english?[{text:v.english}]:[]})) as Verse[],pages:Math.ceil(all.length/50)};
   };
   const primary=async()=>{
    const response=await fetch(API+"/verses/by_chapter/"+chapter+"?language=en&words=true&word_fields=text_uthmani&word_translation_language=en&fields=text_uthmani&translations=131&per_page=50&page="+page);
    if(!response.ok)throw Error("Primary source unavailable");
    const data=await response.json();
    const items:Verse[]=normalize(data.verses||[]);
    if(!items.length)throw Error("No verses returned");
    return {items,pages:data.pagination?.total_pages||1};
   };
   const backup=async()=>{
    const [arResponse,enResponse]=await Promise.all([fetch(FALLBACK+"/surah/"+chapter+"/quran-uthmani"),fetch(FALLBACK+"/surah/"+chapter+"/en.sahih")]);
    if(!arResponse.ok||!enResponse.ok)throw Error("Backup source unavailable");
    const [ar,en]=await Promise.all([arResponse.json(),enResponse.json()]);
    const arabic=ar?.data?.ayahs||[],english=en?.data?.ayahs||[];
    if(!arabic.length)throw Error("No backup verses");
    const translated=new Map<number,string>(english.map((a:{numberInSurah:number;text:string})=>[a.numberInSurah,a.text]));
    return {items:arabic.slice(first,first+50).map((a:{number:number;numberInSurah:number;text:string})=>({id:a.number,verse_key:chapter+":"+a.numberInSurah,text_uthmani:a.text,translations:[{text:translated.get(a.numberInSurah)||""}]})) as Verse[],pages:Math.ceil(arabic.length/50)};
   };
   try{
    let result:{items:Verse[];pages:number};
    try{result=await local()}catch{try{result=await primary()}catch{result=await backup()}}
    // Always supply full Arabic text: some primary API responses only contain word metadata.
    const missing=result.items.some(v=>!v.text_uthmani&&!v.words?.some(w=>w.text_uthmani)||!v.translations?.[0]?.text);
    if(missing){
     try{
      const fallback=await backup();
      const byKey=new Map(fallback.items.map(v=>[v.verse_key,v]));
      result.items=result.items.map(v=>{const other=byKey.get(v.verse_key);return {...v,text_uthmani:v.text_uthmani||other?.text_uthmani||"",translations:v.translations?.[0]?.text?v.translations:other?.translations||[]}})
     }catch{/* Keep primary verses visible when backup is temporarily unavailable. */}
    }
    if(live){setVerses(result.items);setTotal(result.pages)}
   }catch{if(live)setError("Could not load verses from either Qur'an source. Please retry.")}
   finally{if(live)setBusy(false)}
  };
  void load();
  return()=>{live=false};
 },[chapter,page]);
 const [shareVerse,setShareVerse]=useState<Verse|null>(null);
 const [hudhudMode,setHudhudMode]=useState(false);
 const [focusIndex,setFocusIndex]=useState(0);
 const [visited,setVisited]=useState<Record<string,boolean>>({});
 const verseArea=useRef<HTMLElement>(null);
 const pendingVerse=useRef<string|null>(null);
 const navigateVerse=(key:string)=>{const [ch,num]=key.split(":").map(Number);if(!Number.isInteger(ch)||ch<1||ch>114||!Number.isInteger(num)||num<1)return;pendingVerse.current=key;setChapter(ch);setPage(Math.ceil(num/50));};
 useEffect(()=>{if(busy||!verses.length||!pendingVerse.current)return;const target=pendingVerse.current;const index=verses.findIndex(v=>v.verse_key===target);if(index<0)return;pendingVerse.current=null;const id=window.setTimeout(()=>{verseArea.current?.querySelector<HTMLElement>('[data-verse-index="'+index+'"]')?.scrollIntoView({behavior:"smooth",block:"center"});setFocusIndex(index)},100);return()=>clearTimeout(id)},[busy,verses]);
 useEffect(()=>{setFocusIndex(0)},[chapter,page]);
 useEffect(()=>{const root=verseArea.current;if(!root||busy||!verses.length)return;const cards=Array.from(root.querySelectorAll<HTMLElement>("[data-verse-index]"));let frame=0;const track=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const anchor=Math.min(window.innerHeight*.4,310);let best=0,dist=Infinity;cards.forEach((el,i)=>{const box=el.getBoundingClientRect();const d=box.top<=anchor&&box.bottom>=anchor?0:Math.min(Math.abs(box.top-anchor),Math.abs(box.bottom-anchor));if(d<dist){dist=d;best=i}});setFocusIndex(best);const key=verses[best]?.verse_key;if(key)setVisited(v=>v[key]?v:{...v,[key]:true})})};track();window.addEventListener("scroll",track,{passive:true});window.addEventListener("resize",track);return()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",track);window.removeEventListener("resize",track)}},[busy,verses]);
 const jump=(index:number)=>{const card=verseArea.current?.querySelector<HTMLElement>('[data-verse-index="'+index+'"]');if(card){card.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});setFocusIndex(index)}else if(index<0&&page>1)setPage(p=>p-1);else if(index>=verses.length&&page<total)setPage(p=>p+1)};
 const versePosition=(page-1)*50+focusIndex+1;
 useEffect(()=>{try{localStorage.setItem("1muslim-quran-progress",JSON.stringify({chapter,verse:versePosition}))}catch{}},[chapter,versePosition]);
 const chapterCount=activeChapterCount(chapters,chapter);
 const chapterPercent=chapterCount?Math.min(100,Math.round(versePosition/chapterCount*100)):0;
 const previousTopics=verses.slice(Math.max(0,focusIndex-2),focusIndex);
 const filtered=useMemo(()=>chapters.filter(c=>String(c.id)===search.trim()||c.name_simple.toLowerCase().includes(search.toLowerCase())||c.name_arabic.includes(search)),[chapters,search]);
 const active=chapters.find(c=>c.id===chapter);
 return <main className={"omQuranPage "+(hudhudMode?"omHudhudExperience":"")}><SiteNav/><div className="omQuranShell"><header className="omQuranHero"><Link href="/elm-tent">← Elm Tent</Link><span>🏕️ ELM TENT · QUR'AN LESSONS</span><h1>Every verse. A doorway to learning.</h1><p>Browse 114 surahs, explore the Arabic and translation, and share an ayah with the community. Verse references always link back to the Qur'an.</p></header><div className="omQuranLayout"><aside className="omQuranSidebar"><label htmlFor="omSurahSearch">Find a surah</label><input id="omSurahSearch" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or number…"/><div className="omQuranChapters">{filtered.map(c=><button key={c.id} className={chapter===c.id?"active":""} onClick={()=>{setChapter(c.id);setPage(1)}}><b>{c.id}. {c.name_simple}</b><small>{c.verses_count} ayat</small></button>)}</div></aside><section className="omQuranVerses" ref={verseArea}><div className="omQuranTitle"><div><span>Surah {chapter}</span><h2>{active?.name_simple||"Qur'an"} <small lang="ar" dir="rtl">{active?.name_arabic}</small></h2></div><label><input type="checkbox" checked={showTranslation} onChange={e=>setShowTranslation(e.target.checked)}/> Translation</label></div><div className="omFocusTracker" aria-label="Live reading progress"><div className="omFocusTop"><span>✦ YOUR READING JOURNEY</span><strong>{chapterPercent}% of this surah</strong></div><div className="omFocusTrack" role="progressbar" aria-valuenow={versePosition} aria-valuemin={0} aria-valuemax={chapterCount||1} aria-label="Verses reached in current surah"><span style={{width:chapterPercent+"%"}}/></div><div className="omFocusTimeline">{previousTopics.map(v=><button key={v.verse_key} onClick={()=>jump(verses.findIndex(x=>x.verse_key===v.verse_key))}>↶ {v.verse_key}<small>Earlier verse</small></button>)}<div className="omFocusCurrent"><span>NOW READING</span><strong>{verses[focusIndex]?.verse_key||chapter+":1"}</strong><small>{versePosition} of {chapterCount||"…"} ayat · {Object.keys(visited).length} visited this session</small></div><div className="omFocusNav"><button onClick={()=>jump(focusIndex-1)} disabled={focusIndex===0&&page===1} aria-label="Previous verse">↑</button><button onClick={()=>jump(focusIndex+1)} disabled={focusIndex===verses.length-1&&page===total} aria-label="Next verse">↓</button></div></div></div><ElmiVerseMoment/><HudHudQuranText/><HudHudVision activeVerse={verses[focusIndex]?.verse_key||chapter+":"+versePosition} onNavigate={navigateVerse} onModeChange={setHudhudMode}/>{error&&<p role="alert">{error}</p>}{busy?<p>Loading verses…</p>:verses.map((v,i)=><article className={"omAyahCard omVerseTransition "+(focusIndex===i?"omAyahFocused":"")} data-verse-index={i} key={v.id}><div className="omAyahMeta"><strong>{v.verse_key}</strong><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">Study ↗</a></div><InlineAnnotations verse={v.verse_key} words={v.words} text={v.text_uthmani}/>{showTranslation&&<p className="omAyahEnglish">{strip(v.translations?.[0]?.text||"Translation not available.")}</p>}<div className="omAyahActions"><button onClick={()=>{const url="https://quran.com/"+v.verse_key;if(navigator.share)void navigator.share({title:"Qur'an "+v.verse_key,url}).catch(()=>{});else void navigator.clipboard.writeText(url)}}>↗ Share verse</button><a href={"https://quran.com/"+v.verse_key} target="_blank" rel="noopener noreferrer">📖 Read & listen</a></div><VerseRecorder verse={v.verse_key}/><VerseEngagement verse={v.verse_key} onShare={()=>setShareVerse(v)}/><div className="omVerseLearningGrid"><div className="omVerseLearningMain"><VerseStudio verse={v.verse_key}/><VerseDMShare verse={v.verse_key}/></div><VerseMediaTips verse={v.verse_key}/></div></article>)}<div className="omQuranPages"><button disabled={page<=1||busy} onClick={()=>setPage(p=>p-1)}>← Previous</button><span>Page {page} / {total||1}</span><button disabled={page>=total||busy} onClick={()=>setPage(p=>p+1)}>Next →</button></div></section></div>{shareVerse&&<VersePostStudio verse={shareVerse.verse_key} arabic={shareVerse.text_uthmani||shareVerse.words?.map(w=>w.text_uthmani||"").join(" ")||""} translation={shareVerse.translations?.[0]?.text||""} onClose={()=>setShareVerse(null)}/>}<p className="omQuranCredit">Arabic and English translation are requested from Quran.com API. English translation ID 131 is selected; verify translation attribution and licensing before public release. This is a verse browser, not AI-generated tafsir.</p></div><style jsx global>{`
.omQuranPage{transition:background-color .7s ease,color .7s ease,filter .7s ease}.omQuranPage .omQuranHero,.omQuranPage .omQuranSidebar,.omQuranPage .omQuranVerses,.omQuranPage .omAyahCard,.omQuranPage .omFocusTracker{transition:background .7s ease,border-color .7s ease,box-shadow .7s ease,color .7s ease,transform .7s ease}.omQuranPage.omHudhudExperience{background:radial-gradient(ellipse at 85% 5%,#32205b55,transparent 45%),radial-gradient(ellipse at 8% 65%,#064f5550,transparent 55%),#090e23;color:#eeeaff;min-height:100vh}.omHudhudExperience .omQuranHero{background:linear-gradient(130deg,#251448,#122a50,#092c34)!important;border-color:#7655ba!important;color:#f3eaff!important}.omHudhudExperience .omQuranSidebar,.omHudhudExperience .omQuranVerses{background:linear-gradient(150deg,#15132d,#0a2236)!important;border-color:#6357a0!important;color:#eeeaff!important}.omHudhudExperience .omAyahCard{background:linear-gradient(145deg,#1b1635,#0b2536)!important;border-color:#6353a3!important;color:#f0eaff!important}.omHudhudExperience .omAyahCard.omAyahFocused{border-color:#50f3ae!important;box-shadow:0 0 0 1px #55e8b966,0 0 32px #33d7a42b,inset 0 0 24px #6e46b322!important}.omHudhudExperience .omFocusTracker{background:#211b40f0!important;border-color:#6fddbe!important;color:#efffff!important}.omHudhudExperience .omFocusTrack>span{background:linear-gradient(90deg,#745bff,#45eeb1)}.omHudhudExperience .omQuranTitle,.omHudhudExperience .omAyahMeta,.omHudhudExperience .omAyahEnglish{color:#f1edff!important}.omHudhudExperience .omQuranChapters button{color:#e9e8ff!important}.omHudhudExperience .omQuranChapters button.active{background:#493c8b!important;color:#fff!important}.omHudhudExperience .omQuranCredit{color:#bfc8db!important}@media(prefers-reduced-motion:reduce){.omQuranPage,.omQuranPage .omQuranHero,.omQuranPage .omQuranSidebar,.omQuranPage .omQuranVerses,.omQuranPage .omAyahCard,.omQuranPage .omFocusTracker{transition:none!important}}
.omFocusTracker{position:sticky;top:68px;z-index:12;margin:0 0 18px;padding:15px 17px;border-radius:17px;background:color-mix(in srgb,var(--panel) 92%,transparent);backdrop-filter:blur(22px);border:1px solid #c4a35b66;box-shadow:0 10px 30px #00000012}.omFocusTop{display:flex;justify-content:space-between;gap:8px;font-size:10px;letter-spacing:.09em;color:var(--muted)}.omFocusTop strong{color:#c4a35b}.omFocusTrack{height:5px;background:#bca76a33;border-radius:20px;overflow:hidden;margin:10px 0}.omFocusTrack>span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#bca76a,#6ea79c);transition:width .5s ease}.omFocusTimeline{display:flex;align-items:center;gap:8px}.omFocusTimeline>button{border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);padding:7px 9px;font-size:12px;cursor:pointer;display:grid;text-align:left}.omFocusTimeline>button small{font-size:9px;opacity:.6}.omFocusCurrent{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}.omFocusCurrent span{font-size:9px;letter-spacing:.12em;color:#c4a35b}.omFocusCurrent strong{font-size:19px}.omFocusCurrent small{font-size:10px;color:var(--muted);text-align:center}.omFocusNav{display:flex;gap:5px}.omFocusNav button{border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--text);padding:8px 11px;cursor:pointer}.omFocusNav button:disabled{opacity:.3}.omVerseTransition{scroll-margin-top:225px;transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease}.omAyahFocused{border-color:#c4a35b99;box-shadow:0 7px 25px #bba46d22}.omAyahFocused .omStudioToggle{animation:omStudioNudge .8s ease-out 1}@keyframes omStudioNudge{0%{transform:translateY(7px);opacity:.6}100%{transform:translateY(0);opacity:1}}@media(max-width:750px){.omFocusTracker{top:60px;padding:10px}.omFocusTimeline>button{padding:5px;font-size:10px}.omFocusCurrent small{font-size:9px}}@media(prefers-reduced-motion:reduce){.omVerseTransition,.omFocusTrack>span{transition:none}.omAyahFocused .omStudioToggle{animation:none}}.omVerseLearningGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,245px);gap:14px;align-items:start;margin-top:10px}.omVerseLearningMain{min-width:0}@media(max-width:900px){.omVerseLearningGrid{grid-template-columns:1fr}.omVerseTips{max-width:100%}}.omQuranPage{background:var(--bg);color:var(--text);min-height:100vh}.omQuranShell{max-width:1120px;margin:auto;padding:24px 18px 70px}.omQuranHero{padding:28px 0 36px}.omQuranHero>a{display:block;color:var(--accent);margin-bottom:25px}.omQuranHero>span,.omQuranTitle span{font-size:11px;letter-spacing:.14em;color:#b79d5e;font-weight:900}.omQuranHero h1{font-size:clamp(30px,5vw,53px);letter-spacing:-.045em;margin:10px 0}.omQuranHero p{max-width:640px;color:var(--muted);line-height:1.7}.omQuranLayout{display:grid;grid-template-columns:265px minmax(0,1fr);gap:26px}.omQuranSidebar{position:sticky;top:85px;align-self:start;background:var(--panel);padding:15px;border:1px solid var(--line);border-radius:19px}.omQuranSidebar label{display:block;font-size:12px;margin-bottom:8px}.omQuranSidebar input{width:100%;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--panel2);color:var(--text)}.omQuranChapters{max-height:65vh;overflow:auto;margin-top:10px}.omQuranChapters button{display:flex;justify-content:space-between;gap:8px;width:100%;padding:12px 9px;border:0;border-radius:10px;background:transparent;color:var(--text);text-align:left;cursor:pointer}.omQuranChapters button.active{background:#a6b96c33;box-shadow:inset 3px 0 #c4a35b}.omQuranChapters small{color:var(--muted);white-space:nowrap}.omQuranTitle{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:17px}.omQuranTitle h2{margin:5px 0;font-size:26px}.omQuranTitle h2 small{font-size:20px;margin-left:8px;color:#c6a763}.omQuranTitle label{font-size:12px}.omAyahCard{border:1px solid var(--line);background:var(--panel);border-radius:19px;padding:23px;margin-bottom:13px;transition:box-shadow .25s ease,transform .25s ease}.omAyahCard:hover{box-shadow:0 12px 36px #a8995330;transform:translateY(-2px)}.omAyahMeta,.omAyahActions{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.omAyahMeta strong{color:#c6a763}.omAyahMeta a,.omAyahActions a,.omAyahActions button{color:var(--text);text-decoration:none;font-size:12px}.omAyahArabic{font-family:serif;font-size:clamp(25px,3vw,35px);line-height:2.2;text-align:right;padding:12px 0}.omAyahEnglish{font-size:15px;line-height:1.85;color:var(--muted)}.omAyahActions{justify-content:flex-start;margin-top:18px}.omAyahActions a,.omAyahActions button,.omQuranPages button{border:1px solid #b99c5570;border-radius:999px;padding:10px 14px;background:var(--panel2);cursor:pointer}.omQuranPages{display:flex;justify-content:center;align-items:center;gap:18px;padding:18px}.omQuranPages button:disabled{opacity:.35}.omQuranCredit{font-size:11px;color:var(--muted);margin-top:30px}@media(max-width:750px){.omQuranLayout{grid-template-columns:1fr}.omQuranSidebar{position:static}.omQuranChapters{display:flex;gap:6px;overflow-x:auto;max-height:100px}.omQuranChapters button{min-width:150px}.omAyahCard{padding:16px}}
.omWordLine{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:8px 5px}.omWordWrap{position:relative;display:inline-flex}.omWord{position:relative;cursor:pointer;border:0;background:transparent;color:inherit;font:inherit;line-height:inherit;padding:0 3px;border-radius:9px;transition:background .2s,transform .2s}.omWord:hover,.omWord:focus-visible{background:#c4a35b26;transform:translateY(-2px);outline:2px solid #c4a35b66;outline-offset:2px}.omWordTooltip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translate(-50%,8px) scale(.96);width:max-content;max-width:min(250px,80vw);min-width:150px;white-space:normal;direction:ltr;text-align:center;display:flex;flex-direction:column;gap:5px;z-index:8;background:#142c25;color:#fff;padding:13px 15px;border:1px solid #d2b76e88;border-radius:15px;box-shadow:0 16px 35px #0006;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s;font:14px/1.5 system-ui}.omWordTooltip b{color:#e4c67e;font-size:13px}.omWordTooltip small{font-size:16px}.omWordTooltip em{font-size:10px;font-style:normal;color:#d7d9d2}.omWord:hover .omWordTooltip,.omWord:focus .omWordTooltip{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1)}.omVerseEnd{font-size:23px;color:#c6a763}.omAyahCard{overflow:visible}@media(prefers-reduced-motion:reduce){.omWord,.omWordTooltip{transition:none!important}.omWord:hover{transform:none}.omAyahCard{transition:none}.omAyahCard:hover{transform:none}}
/* Quran Studio: mobile-first, one-column editing canvas without desktop overflow */
.omQuranPage,.omQuranPage *{box-sizing:border-box}
.omQuranPage{width:100%;max-width:100%;overflow-x:clip}
.omQuranShell,.omQuranLayout,.omQuranVerses,.omAyahCard,.omVerseLearningGrid{min-width:0;max-width:100%}
.omQuranChapters{overscroll-behavior-inline:contain}
.omQuranPage .omInlineWords{min-height:unset;overflow-wrap:anywhere}
.omQuranPage .omInlineWords:empty{display:none}
.omQuranPage .omAyahEnglish{overflow-wrap:anywhere}
@media(max-width:750px){
 .omQuranShell{width:100%;padding:14px 12px calc(110px + env(safe-area-inset-bottom))}
 .omQuranHero{padding:14px 0 20px}.omQuranHero h1{font-size:clamp(25px,7vw,35px);line-height:1.15}
 .omQuranLayout{display:flex;flex-direction:column;gap:14px;width:100%}
 .omQuranSidebar{width:100%;padding:12px;position:relative;top:auto;overflow:hidden}
 .omQuranSidebar input{max-width:100%;min-width:0}
 .omQuranChapters{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;max-height:none;width:100%;padding-bottom:6px;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
 .omQuranChapters button{flex:0 0 148px;min-width:148px;max-width:148px;scroll-snap-align:start}
 .omQuranVerses{width:100%;overflow:visible}
 .omFocusTracker{position:relative;top:auto;z-index:1;width:100%;padding:12px;margin-bottom:12px}
 .omFocusTimeline{flex-wrap:wrap}.omFocusCurrent{min-width:125px}
 .omAyahCard{width:100%;padding:16px 13px;border-radius:16px;transform:none!important}
 .omQuranPage .omInlineWords{font-size:clamp(25px,7vw,34px);line-height:2.1;direction:rtl;max-width:100%}
 .omQuranPage .omInlineWord{max-width:100%;overflow-wrap:anywhere}
 .omVerseLearningGrid{display:flex;flex-direction:column;gap:10px}
 .omVerseLearningMain,.omVerseTips{width:100%;max-width:100%}
 .omQuranPages{gap:8px;flex-wrap:wrap}.omQuranPages button{padding:9px}
 .omVerseTransition{scroll-margin-top:85px}
}
`}</style></main>;
}