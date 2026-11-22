"use client";
import {useEffect,useMemo,useState} from "react";
import styles from "./QuranHarakatLens.module.css";

type WordDetail={
 text_uthmani?:string;
 char_type_name?:string;
 translation?:{text:string};
 transliteration?:{text:string};
};
type Props={
 verseKey:string;
 text:string;
 words?:WordDetail[];
 highlights?:number[];
 underlines?:number[];
 arabicClassName:string;
 onPlayVerse:()=>void;
};
type MarkKind="fatha"|"kasra"|"damma"|"sukun"|"shadda"|"daggerAlif"|"fathatan"|"kasratan"|"dammatan";
type MarkInfo={symbol:string;label:string;sound:string;description:string;example:string};
const MARK_INFO:Record<MarkKind,MarkInfo>={
 fatha:{symbol:"◌َ",label:"Fatḥah",sound:"a",description:"A short ‘a’ vowel after the consonant.",example:"بَ · ba"},
 kasra:{symbol:"◌ِ",label:"Kasrah",sound:"i",description:"A short ‘i’ vowel after the consonant.",example:"بِ · bi"},
 damma:{symbol:"◌ُ",label:"Ḍammah",sound:"u",description:"A short ‘u’ vowel after the consonant.",example:"بُ · bu"},
 sukun:{symbol:"◌ْ",label:"Sukūn",sound:"no vowel",description:"The consonant has no following short vowel.",example:"بْ · b"},
 shadda:{symbol:"◌ّ",label:"Shaddah",sound:"double",description:"The consonant is doubled; another vowel sign may appear with it.",example:"بَّ · bba"},
 daggerAlif:{symbol:"◌ٰ",label:"Small alif",sound:"long ā",description:"The superscript alif marks a long ā sound in Qur’anic script. Exact recitation follows the word and its context.",example:"هَٰذَا · hādhā"},
 fathatan:{symbol:"◌ً",label:"Fatḥatayn",sound:"-an",description:"A double fatḥah (tanwīn). Its sound can change when pausing or applying recitation rules.",example:"ـً · an"},
 kasratan:{symbol:"◌ٍ",label:"Kasratayn",sound:"-in",description:"A double kasrah (tanwīn). Its sound can change when pausing or applying recitation rules.",example:"ـٍ · in"},
 dammatan:{symbol:"◌ٌ",label:"Ḍammatayn",sound:"-un",description:"A double ḍammah (tanwīn). Its sound can change when pausing or applying recitation rules.",example:"ـٌ · un"}
};
const KIND_BY_CHAR:Record<string,MarkKind>={
 "\u064e":"fatha","\u0650":"kasra","\u064f":"damma","\u0652":"sukun",
 "\u0651":"shadda","\u06e1":"sukun","\u0670":"daggerAlif","\u064b":"fathatan","\u064d":"kasratan","\u064c":"dammatan"
};
const teachingOrder:MarkKind[]=["fatha","kasra","damma","sukun","shadda","daggerAlif","fathatan","kasratan","dammatan"];
const grouping=/[\u064b-\u065f\u0670\u06d6-\u06ed]/;
function clusters(word:string){
 const parts:string[]=[];
 for(const character of Array.from(word)){
  if(grouping.test(character)&&parts.length)parts[parts.length-1]+=character;
  else parts.push(character);
 }
 return parts;
}
function available(word:string){
 const found=new Set<MarkKind>();
 for(const char of Array.from(word)){
  if(KIND_BY_CHAR[char])found.add(KIND_BY_CHAR[char]);
 }
 return teachingOrder.filter(kind=>found.has(kind));
}
function normalized(word:string){
 return word.normalize("NFD").replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g,"").replace(/[\u06e5\u06e6]/g,"").trim();
}
export default function QuranHarakatLens({verseKey,text,words,highlights=[],underlines=[],arabicClassName,onPlayVerse}:Props){
 const [enabled,setEnabled]=useState(false),[selected,setSelected]=useState<{verseKey:string;index:number}|null>(null),[mark,setMark]=useState<MarkKind|null>(null);
 const tokens=useMemo(()=>text.trim().split(/\s+/).filter(Boolean),[text]);
 const selectedIndex=selected?.verseKey===verseKey?selected.index:null;
 const current=selectedIndex!==null?tokens[selectedIndex]||"":null;
 const present=useMemo(()=>available(current||""),[current]);
 const activeMark=mark&&present.includes(mark)?mark:present[0]||null;
 const info=activeMark?MARK_INFO[activeMark]:null;
 // Word metadata is optional and supplied by the verse API; never align a translation by guessed index.
 const wordEntries=words?.filter(w=>w.char_type_name==="word"&&w.text_uthmani)||[];
 const wordDetail=selectedIndex!==null&&wordEntries.length===tokens.length&&normalized(wordEntries[selectedIndex]?.text_uthmani||"")===normalized(current||"")?wordEntries[selectedIndex]:null;
 useEffect(()=>{setSelected(null);setMark(null)},[verseKey]);
 const chooseWord=(index:number)=>{
  setSelected({verseKey,index});
  setMark(available(tokens[index]||"")[0]||null);
 };
 return <>
  <p lang="ar" dir="rtl" className={arabicClassName} data-harakat-reader={enabled?"enabled":"off"}>{tokens.map((word,i)=>{
   const originalClass="omQuranAnnotatedWord "+(highlights.includes(i)?"omQuranWordGlow ":"")+(underlines.includes(i)?"omQuranWordUnderline":"");
   return enabled?<span key={i} className={styles.wordSlot}><button type="button" lang="ar" dir="rtl" className={originalClass+" "+styles.wordButton+(selectedIndex===i?" "+styles.wordSelected:"")} aria-label={"Study vowel marks in "+word} aria-pressed={selectedIndex===i} onClick={()=>chooseWord(i)}>{word}</button>{" "}</span>:<span key={i} className={originalClass}>{word}{" "}</span>;
  })}</p>
  <div className={styles.controls}>
   <button type="button" aria-expanded={enabled} className={styles.microToggle+(enabled?" "+styles.microActive:"")} onClick={()=>{setEnabled(v=>!v);setSelected(null);setMark(null);}} title="Study Arabic vowel marks while reading"><span aria-hidden="true" lang="ar">◌َ</span><span>{enabled?"Sound Lens on":"Learn vowel signs"}</span><span aria-hidden="true">{enabled?"×":"↗"}</span></button>
   {enabled&&selectedIndex===null&&<span className={styles.hint}>Tap any Arabic word to zoom into its sounds.</span>}
  </div>
  {enabled&&current!==null&&selectedIndex!==null&&<section className={styles.card} aria-label={"Arabic vowel marks in word "+(selectedIndex+1)}>
   <div className={styles.cardHeader}><div><small>WORD {selectedIndex+1} · QUR'AN {verseKey}</small><strong>Inside the word</strong></div><button type="button" className={styles.close} onClick={()=>setSelected(null)} aria-label="Close vowel lesson">×</button></div>
   <div className={styles.magnify} lang="ar" dir="rtl" aria-label={"Enlarged original word "+current}>
    {clusters(current).map((cluster,i)=><span key={i} className={activeMark&&Array.from(cluster).some(char=>KIND_BY_CHAR[char]===activeMark)?styles.focusCluster:""}>{cluster}</span>)}
   </div>
   {wordDetail&&(wordDetail.translation?.text||wordDetail.transliteration?.text)&&<div className={styles.wordMeaning}>{wordDetail.transliteration?.text&&<span>{wordDetail.transliteration.text.replace(/<[^>]*>/g,"")}</span>}{wordDetail.translation?.text&&<strong>{wordDetail.translation.text.replace(/<[^>]*>/g,"")}</strong>}</div>}
   {present.length?<div className={styles.markList} role="group" aria-label="Vowel signs present in this word">{present.map(kind=><button key={kind} type="button" aria-pressed={activeMark===kind} className={activeMark===kind?styles.markChosen:""} onClick={()=>setMark(kind)}><span lang="ar">{MARK_INFO[kind].symbol}</span>{MARK_INFO[kind].label}</button>)}</div>:<p className={styles.noMarks}>No basic short-vowel signs identified here. Try another word.</p>}
   {info&&<div className={styles.explanation} aria-live="polite"><span className={styles.lessonSound}>{info.sound}</span><span><strong>{info.label}</strong><small>{info.description}</small></span><b lang="ar">{info.example}</b></div>}
   <div className={styles.cardFooter}><small>Original Qur'an script is unchanged. Examples teach letter sounds, not this verse's full pronunciation.</small><button type="button" onClick={onPlayVerse}>▶ Hear verse</button></div>
  </section>}
 </>;
}
