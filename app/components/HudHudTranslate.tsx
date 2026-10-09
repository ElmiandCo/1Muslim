"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Lang="en"|"ar";
const KEY="1muslim-language";
const labels:Record<Lang,string>={en:"English",ar:"العربية"};
const dictionary:Record<string,string>={
 "Home":"الرئيسية","Learn":"تعلّم","Explore":"استكشف","Community":"المجتمع","Messages":"الرسائل","Profile":"الملف الشخصي","Settings":"الإعدادات","Rewards":"المكافآت","Stories":"القصص","Go Live":"ابدأ البث","Live Now":"مباشر الآن","Watch Live Now":"شاهد البث الآن","Sign In":"تسجيل الدخول","Sign Up":"إنشاء حساب","Log In":"تسجيل الدخول","Log Out":"تسجيل الخروج","Save":"حفظ","Cancel":"إلغاء","Close":"إغلاق","Next":"التالي","Back":"رجوع","Share":"مشاركة","Like":"إعجاب","Comment":"تعليق","Comments":"التعليقات","Qur'an Studio":"استوديو القرآن","Quran Studio":"استوديو القرآن","Continue Reading":"تابع القراءة","Read & listen":"اقرأ واستمع","Read":"اقرأ","Listen":"استمع","Translate with HudHud":"ترجم مع هدهد","HudHud":"هدهد","HudHud Voice":"صوت هدهد","Talk with HudHud":"تحدث مع هدهد","Meet HudHud":"تعرّف على هدهد","Enable voice":"تفعيل الصوت","Voice ON":"الصوت مفعّل","Stop":"إيقاف","Ask":"اسأل","Rabbit Hole":"رحلة الاستكشاف","Journeys":"الرحلات","Notes":"الملاحظات","Compare":"قارن","Insights":"رؤى","Verse":"آية","Verses":"آيات","Search":"بحث","Search surahs":"ابحث في السور","Reading Progress":"تقدم القراءة","Translation":"الترجمة","English":"الإنجليزية","Arabic":"العربية","Both":"كلاهما","Watch. Learn. Reflect. Together.":"شاهد. تعلّم. تأمّل. معًا.","Start where you are.":"ابدأ من حيث أنت."
};
const shouldSkip=(node:Text)=>{const el=node.parentElement;if(!el)return true;return !!el.closest("[data-no-translate],[lang='ar'],[dir='rtl'],script,style,noscript,textarea,input,select,option,code,pre,svg,[contenteditable='true'],[data-quran-arabic]")};
const isArabic=(s:string)=>/[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/.test(s);
export default function HudHudTranslate(){
 const [lang,setLang]=useState<Lang>("en"),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const originals=useRef(new WeakMap<Text,string>()),tracked=useRef(new Set<Text>()),cache=useRef(new Map<string,string>());
 const generation=useRef(0),langRef=useRef<Lang>("en"),muting=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{try{const stored=localStorage.getItem(KEY);if(stored==="ar")setLang("ar")}catch{}},[]);
 const collect=useCallback(()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n:Node|null;while((n=walker.nextNode())){const t=n as Text;if(shouldSkip(t)||!t.textContent?.trim())continue;if(!originals.current.has(t)){originals.current.set(t,t.textContent);tracked.current.add(t)}}},[]);
 useEffect(()=>{
  let observer:MutationObserver|undefined;let disposed=false;
  const apply=async()=>{
   const id=++generation.current;langRef.current=lang;setNotice("");setBusy(lang==="ar");
   try{localStorage.setItem(KEY,lang)}catch{}
   document.documentElement.lang=lang;
   // Keep page layout LTR: only localized UI elements should opt into RTL. Arabic Qur'an is already RTL.
   document.documentElement.dir="ltr";
   observer?.disconnect();muting.current=true;
   // Restore original text before collecting new React-rendered content.
   for(const node of tracked.current){if(!node.isConnected){tracked.current.delete(node);continue}const original=originals.current.get(node);if(original!==undefined&&!shouldSkip(node)&&node.textContent!==original)node.textContent=original}
   collect();
   muting.current=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
   if(lang==="en"){setBusy(false);return}
   const nodes=[...tracked.current].filter(n=>n.isConnected&&!shouldSkip(n));
   const unique=[...new Set(nodes.map(n=>originals.current.get(n)||"").filter(s=>s.trim()&&!isArabic(s)&&/[a-zA-Z]/.test(s)))];
   const missing=unique.filter(s=>!cache.current.has(s)&&!dictionary[s.trim()]);
   try{
    for(let i=0;i<missing.length;i+=30){
     if(disposed||id!==generation.current)return;
     const batch=missing.slice(i,i+30);
     const res=await fetch("/api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({texts:batch,target:"ar"})});
     if(!res.ok)throw Error("provider unavailable");
     const data:unknown=await res.json();
     if(!data||typeof data!=="object"||!("translations" in data)||!Array.isArray(data.translations)||data.translations.length!==batch.length||data.translations.some((v:unknown)=>typeof v!=="string"))throw Error("invalid response");
     batch.forEach((source,j)=>cache.current.set(source,data.translations[j]));
    }
   }catch{if(!disposed&&id===generation.current)setNotice("Some text could not be translated. Configure the translation provider for full coverage.");}
   if(disposed||id!==generation.current)return;
   observer?.disconnect();muting.current=true;
   for(const node of nodes){if(!node.isConnected||shouldSkip(node))continue;const original=originals.current.get(node)||"";const leading=original.match(/^\s*/)?.[0]||"";const trailing=original.match(/\s*$/)?.[0]||"";const value=dictionary[original.trim()]||cache.current.get(original);if(value)node.textContent=leading+value+trailing}
   muting.current=false;observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
   setBusy(false);
  };
  const schedule=()=>{if(muting.current||timer.current)return;timer.current=setTimeout(()=>{timer.current=null;void apply()},650)};
  observer=new MutationObserver(schedule);void apply();
  return()=>{disposed=true;generation.current++;if(timer.current)clearTimeout(timer.current);observer?.disconnect()};
 },[lang,collect]);
 return <div className="hudhud-translator" data-no-translate="true" aria-live="polite">
  <img className={busy?"hudhud-translator-bird translating":"hudhud-translator-bird"} src="/assets/hudhud-logo.PNG" alt="HudHud" onError={e=>{e.currentTarget.style.display="none"}}/>
  <label htmlFor="hudhud-language">🌐 <span>{lang==="ar"?"لغة الموقع":"Translate with HudHud"}</span></label>
  <select id="hudhud-language" value={lang} onChange={e=>setLang(e.target.value as Lang)} aria-label="Website language">{(Object.keys(labels) as Lang[]).map(l=><option key={l} value={l}>{labels[l]}</option>)}</select>
  {busy&&<span className="hudhud-shine" role="status">جارٍ الترجمة…</span>}
  {!busy&&notice&&<span className="hudhud-translate-status" role="status">{notice}</span>}
 </div>;
}
