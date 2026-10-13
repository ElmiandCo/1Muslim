"use client";
import {useEffect,useState} from "react";
type Dhikr={id:string;label:string;arabic:string};
const phrases:Dhikr[]=[
{id:"subhan",label:"Subḥān Allāh",arabic:"سُبْحَانَ اللَّهِ"},
{id:"astaghfir",label:"Astaghfirullāh",arabic:"أَسْتَغْفِرُ اللَّهَ"},
{id:"alhamdulillah",label:"Alḥamdulillāh",arabic:"الْحَمْدُ لِلَّهِ"},
{id:"tawhid",label:"Lā ilāha illā Allāh",arabic:"لَا إِلَٰهَ إِلَّا اللَّهُ"},
{id:"takbir",label:"Allāhu Akbar",arabic:"اللَّهُ أَكْبَرُ"},
{id:"hawqala",label:"Lā ḥawla wa lā quwwata illā billāh",arabic:"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ"},
{id:"combined",label:"All Together · Rotation",arabic:"ذِكْرٌ مُتَنَوِّعٌ"},
{id:"bihamdihi",label:"Subḥān Allāhi wa biḥamdih",arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"}];
const KEY="1muslim:dhikr-studio:v1";
type CustomSupplication={id:string;label:string;arabic:string};
type Progress={counts:Record<string,number>;total:number;selected:string;custom:CustomSupplication[]};
const empty:Progress={counts:{},total:0,selected:"subhan",custom:[]};
const card:React.CSSProperties={border:"1px solid #d5c18550",borderRadius:15,background:"#ffffff0c",padding:12};
export default function DhikrStudio(){
 const [progress,setProgress]=useState<Progress>(empty);const [ready,setReady]=useState(false);
 const [creating,setCreating]=useState(false);const [customTitle,setCustomTitle]=useState("");const [customArabic,setCustomArabic]=useState("");
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(KEY)||"null");if(stored&&typeof stored.total==="number"&&stored.counts&&typeof stored.counts==="object"){setProgress({counts:stored.counts,total:Math.max(0,stored.total),selected:typeof stored.selected==="string"?stored.selected:"subhan",custom:Array.isArray(stored.custom)?stored.custom.filter((c:CustomSupplication)=>typeof c.id==="string"&&typeof c.label==="string").slice(0,30):[]})}else{const old=Number(localStorage.getItem("1muslim-dhikr-count")||0);if(Number.isFinite(old)&&old>0)setProgress({counts:{subhan:old},total:old,selected:"subhan",custom:[]})}}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(progress))}catch{}},[progress,ready]);
 const level=Math.floor(progress.total/100)+1,unlocked=level>=5;
 const allPhrases=[...phrases,...progress.custom];
 const selected=allPhrases.find(p=>p.id===progress.selected&& (p.id!=="bihamdihi"||unlocked))||phrases[0];
 const addCustom=()=>{const label=customTitle.trim().slice(0,100);if(!label||progress.custom.length>=30)return;const id="custom-"+Date.now();setProgress(prev=>({...prev,custom:[...prev.custom,{id,label,arabic:customArabic.trim().slice(0,300)}],selected:id}));setCustomTitle("");setCustomArabic("");setCreating(false)};
 const deleteCustom=(id:string)=>setProgress(prev=>({...prev,selected:prev.selected===id?"subhan":prev.selected,custom:prev.custom.filter(c=>c.id!==id)}));
 const rotation=phrases.slice(0,6);const rotationCount=progress.counts.combined||0;
 const current=selected.id==="combined"?rotation[rotationCount%rotation.length]:selected;
 const tap=()=>setProgress(prev=>{const active=prev.selected==="combined"?"combined":prev.selected;return {...prev,total:prev.total+1,counts:{...prev.counts,[active]:(prev.counts[active]||0)+1}}});
 const choose=(id:string)=>setProgress(prev=>({...prev,selected:id}));
 const milestone=Math.min(100,progress.total%100);
 return <div style={{display:"grid",gap:17}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><span style={{color:"#e7d59b",fontWeight:750}}>✦ DHIKR STUDIO</span><span style={{...card,fontSize:12}}>Level {level} · {progress.total} total</span></div>
 <div style={{height:6,borderRadius:9,background:"#ffffff20",overflow:"hidden"}}><div style={{height:"100%",width:milestone+"%",background:"linear-gradient(90deg,#7ec7a3,#f0d28c)",transition:"width .2s"}}/></div>
 <small style={{opacity:.76}}>{unlocked?"Level 5 reward unlocked!":(500-progress.total>0?Math.max(0,400-progress.total):0)+" recitations to unlock Level 5"} · 100 recitations per level</small>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:8}}>{allPhrases.map(p=><button key={p.id} type="button" disabled={p.id==="bihamdihi"&&!unlocked} onClick={()=>choose(p.id)} style={{...card,cursor:p.id==="bihamdihi"&&!unlocked?"not-allowed":"pointer",color:progress.selected===p.id?"#102c22":"#f4ecd6",background:progress.selected===p.id?"#e3d49f":"#ffffff0b",opacity:p.id==="bihamdihi"&&!unlocked?.53:1,textAlign:"left",fontSize:12,minHeight:54,fontWeight:650}}>{p.id==="bihamdihi"&&!unlocked?"🔒 ":""}{p.label}</button>)}</div>
 <div style={card}><button type="button" onClick={()=>setCreating(v=>!v)} style={{background:"transparent",border:"1px solid #d5c18577",borderRadius:11,padding:"10px 14px",color:"#e7d59b",fontWeight:750,cursor:"pointer"}}>＋ Make Your Own Supplication</button>{creating&&<div style={{display:"grid",gap:10,marginTop:12}}><label>Supplication or remembrance <input value={customTitle} onChange={e=>setCustomTitle(e.target.value)} maxLength={100} placeholder="e.g. Rabbi zidnī ʿilmā" style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:9}}/></label><label>Arabic (optional) <input dir="rtl" lang="ar" value={customArabic} onChange={e=>setCustomArabic(e.target.value)} maxLength={300} placeholder="رَبِّ زِدْنِي عِلْمًا" style={{width:"100%",boxSizing:"border-box",padding:12,borderRadius:9}}/></label><button type="button" onClick={addCustom} disabled={!customTitle.trim()||progress.custom.length>=30} style={{padding:12,border:0,borderRadius:10,background:"#e4d299",color:"#153d30",fontWeight:800}}>Save & Start Counting</button><small style={{opacity:.7}}>Personal supplications are user-created and not presented as authenticated Qur’an or hadith. Up to 30 saved on this device.</small></div>}{progress.custom.length>0&&<div style={{marginTop:12,display:"grid",gap:6}}>{progress.custom.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><span style={{fontSize:12}}>{c.label} · {progress.counts[c.id]||0}</span><button type="button" onClick={()=>deleteCustom(c.id)} aria-label={"Delete "+c.label} style={{background:"transparent",border:0,color:"#ebcba4",cursor:"pointer"}}>Remove</button></div>)}</div>}</div>
 <div style={{...card,textAlign:"center",padding:"28px 14px",background:"linear-gradient(140deg,#113e32,#0a211e)"}}>{current.arabic&&<div style={{fontSize:"clamp(25px,5vw,37px)",lineHeight:1.7,color:"#ebd9a5"}} lang="ar" dir="rtl">{current.arabic}</div>}<p style={{fontSize:15}}>{current.label}</p><div aria-live="polite" style={{fontSize:68,fontWeight:300,color:"#f0dda7"}}>{progress.counts[selected.id]||0}</div><button type="button" onClick={tap} style={{border:0,borderRadius:50,width:170,height:72,background:"linear-gradient(135deg,#e9d9a5,#a5d7bb)",color:"#153d30",fontSize:19,fontWeight:800,cursor:"pointer",boxShadow:"0 10px 30px #0005"}}>+ Dhikr</button><p style={{opacity:.7,fontSize:12}}>{selected.id==="combined"?"Rotates through all six phrases, one tap per phrase.":"Tap once for each recitation."}</p></div>
 <div style={card}><h3 style={{marginTop:0,color:"#e5d19a"}}>{unlocked?"🏅 Level 5 · Silver Dhikr Badge Unlocked":"🔒 Level 5 Reward"}</h3><p style={{marginBottom:8}}>Unlock <strong>Subḥān Allāhi wa biḥamdih</strong>, the <strong>Silver Dhikr Badge</strong> and <strong>Silver Avatar</strong> at Level 5.</p><p lang="ar" dir="rtl" style={{fontSize:24,color:"#e5d19a"}}>سُبْحَانَ اللَّهِ وَبِحَمْدِهِ</p><p style={{fontSize:13,lineHeight:1.6,opacity:.87}}>The Prophet ﷺ said that whoever says “Subḥān Allāhi wa biḥamdih” one hundred times in a day will have their sins forgiven, even if they are like the foam of the sea. <strong>Ṣaḥīḥ al-Bukhārī 6405.</strong></p>{unlocked&&<div style={{padding:12,borderRadius:12,background:"linear-gradient(115deg,#c2c7cd33,#eef2f633)",border:"1px solid #cbd0da88",color:"#e9ecf2"}}>✦ SILVER DHIKR · AVATAR REWARD EARNED<br/><small>Unlocked in Dhikr Studio on this device. Profile badge/avatar syncing is not connected yet.</small></div>}</div>
 <small style={{opacity:.66}}>Counts are saved on this device. Levels measure taps, not verified recitations. Combined mode has its own count.</small>
 </div>;
}
