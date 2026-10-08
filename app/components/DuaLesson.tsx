"use client";
import {useEffect,useState} from "react";

type Result={valid:boolean;feedback:string;checks:{praise:boolean;request:boolean;order:boolean};method:"ai"|"guided"};
export default function DuaLesson({onClose}:{onClose:()=>void}){
 const [tab,setTab]=useState<"Learn"|"Practice"|"Examples"|"Your Dua">("Learn");
 const [dua,setDua]=useState(""),[result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(false),[earned,setEarned]=useState(false);
 useEffect(()=>{try{setEarned(localStorage.getItem("1muslim-dua-practice-badge")==="earned")}catch{}},[]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey)},[onClose]);
 const check=async()=>{
  setLoading(true);setResult(null);
  try{
   const response=await fetch("/api/dua/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({dua})});
   const data=await response.json() as Result&{error?:string};
   if(!response.ok)throw new Error(data.error||"Unable to check right now.");
   setResult(data);
   if(data.valid){setEarned(true);try{localStorage.setItem("1muslim-dua-practice-badge","earned")}catch{}}
  }catch(e){setResult({valid:false,feedback:e instanceof Error?e.message:"Please try again.",checks:{praise:false,request:false,order:false},method:"guided"})}
  finally{setLoading(false)}
 };
 const tabs=["Learn","Practice","Examples","Your Dua"] as const;
 return <div className="duaBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="duaDialog" role="dialog" aria-modal="true" aria-label="Dua learning and badge challenge">
   <header className="duaHeader"><div className="duaSymbol">🤲</div><div><h2>Dua</h2><span>Supplication · A direct conversation with Allah</span></div><button className="duaClose" onClick={onClose} aria-label="Close">×</button></header>
   <nav className="duaTabs" aria-label="Dua lesson sections">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>
   <div className="duaContent">
    {tab==="Learn"&&<><h3>The Best Way to Make a Dua</h3><p>Follow this beautiful prophetic etiquette. Dua can be made sincerely in any language.</p><div className="duaLearningGrid"><div className="duaSteps">
      <div><b>1</b><span><strong>Praise Allah first</strong><small>Begin by glorifying Allah and mentioning His beautiful names.</small></span></div>
      <div><b>2</b><span><strong>Send blessings on the Prophet ﷺ</strong><small>Say salawat upon Muhammad ﷺ.</small></span></div>
      <div><b>3</b><span><strong>Ask Allah sincerely</strong><small>Ask for what is good with humility, hope and trust.</small></span></div>
    </div><aside className="duaVerse"><span>❝</span><p>“Call upon Me; I will respond to you.”</p><small>Qur’an 40:60</small></aside></div><button className="duaPrimary" onClick={()=>setTab("Practice")}>Practice your dua →</button></>}
    {tab==="Examples"&&<><h3>A simple example</h3><p>“Alhamdulillah, all praise belongs to Allah, the Most Merciful. Allahumma salli ‘ala Muhammad. O Allah, please forgive me, guide my heart, and protect my family. Ameen.”</p><p>These are examples to help you learn, not mandatory wording. Allah hears sincere supplication in every language.</p><button className="duaPrimary" onClick={()=>setTab("Practice")}>Write my own dua →</button></>}
    {(tab==="Practice"||tab==="Your Dua")&&<><h3>{tab==="Your Dua"?"Your Dua":"Practice Your Dua"}</h3><p>Write your own dua. For this learning badge, praise Allah before making your request. Salawat is encouraged, not required by this exercise.</p><label htmlFor="duaUserText">Your dua</label><textarea id="duaUserText" maxLength={1000} value={dua} onChange={e=>{setDua(e.target.value);setResult(null)}} placeholder="Alhamdulillah, all praise belongs to You, Allah. Please guide me..." rows={5}/><div className="duaCount">{dua.length}/1000</div><button className="duaPrimary" disabled={loading||dua.trim().length<20} onClick={check}>{loading?"Reviewing…":"Verify my Dua"}</button>{result&&<div className={result.valid?"duaFeedback valid":"duaFeedback"} role="status"><strong>{result.valid?"✓ Practice complete":"Keep practicing"}</strong><p>{result.feedback}</p><small>{result.method==="ai"?"AI-assisted learning feedback":"Guided phrase-based feedback"} · This is not a judgment of anyone’s faith or whether Allah accepts their dua.</small></div>}</>}
    <div className="duaBadge"><div className="duaBadgeArt">🤲</div><div><strong>{earned?"✦ Dua Badge Earned":"✦ Dua Badge"}</strong><p>{earned?"You completed the practice challenge on this device.":"Praise Allah first, then ask Him sincerely to complete the practice challenge."}</p><small>Local achievement · account badge syncing coming later</small></div></div>
   </div>
  </section>
  <style jsx>{`
   .duaBackdrop{position:fixed;inset:0;z-index:2500;background:#000c;display:grid;place-items:center;padding:14px;overflow:auto}
   .duaDialog{width:min(100%,780px);max-height:92dvh;overflow:auto;background:linear-gradient(145deg,#101a19,#080f0e);border:1px solid #45594d;border-radius:24px;color:#eff4ee;box-shadow:0 25px 90px #000d;font-family:inherit}
   .duaHeader{display:flex;align-items:center;gap:18px;padding:24px 28px 16px}.duaSymbol{display:grid;place-items:center;font-size:37px;width:78px;height:78px;border-radius:24px;background:linear-gradient(145deg,#735723,#1a2c21);border:1px solid #d9b46b}.duaHeader h2{font-size:32px;margin:0 0 4px}.duaHeader span{color:#aabcb5;font-size:13px}.duaClose{margin-left:auto;align-self:flex-start;background:transparent;border:1px solid #54625d;color:white;border-radius:50%;font-size:28px;width:42px;height:42px;cursor:pointer}
   .duaTabs{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #283c33;margin:0 24px}.duaTabs button{padding:13px 4px;color:#abb9b2;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer}.duaTabs button.active{color:#bce4af;border-bottom-color:#bce4af}
   .duaContent{padding:22px 28px 28px}.duaContent h3{font-size:23px;margin:0 0 8px}.duaContent p{color:#aebeb8;line-height:1.65}.duaLearningGrid{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;margin:22px 0}.duaSteps{display:grid;gap:20px}.duaSteps>div{display:flex;gap:12px;align-items:start}.duaSteps b{width:33px;height:33px;flex:0 0 33px;border-radius:50%;background:#a5d9a3;color:#09200d;display:grid;place-items:center}.duaSteps>div:nth-child(2) b{background:#aa9dff}.duaSteps>div:nth-child(3) b{background:#7cb9f8}.duaSteps strong{display:block}.duaSteps small{display:block;color:#9fafaa;line-height:1.6;margin-top:4px}.duaVerse{border:1px solid #625b43;background:#292b2233;border-radius:18px;padding:20px;text-align:center}.duaVerse>span{color:#dbbf86;font-size:35px}.duaVerse p{color:#f2e5c7}.duaVerse small{color:#aebeb8}.duaContent label{display:block;margin:15px 0 7px;font-weight:700}.duaContent textarea{width:100%;background:#081310;color:white;border:1px solid #52685b;border-radius:12px;padding:15px;font:inherit;resize:vertical}.duaCount{text-align:right;font-size:11px;color:#92a29a}.duaPrimary{width:100%;border:1px solid #5e8967;border-radius:12px;padding:13px;background:linear-gradient(90deg,#1d3a27,#294833);color:#c8f3db;font-weight:800;cursor:pointer;margin:12px 0}.duaPrimary:disabled{opacity:.5;cursor:wait}.duaFeedback{border:1px solid #9b7455;background:#2a1c16;padding:13px;border-radius:12px}.duaFeedback.valid{border-color:#5c966c;background:#13281a}.duaFeedback p{margin:5px 0}.duaFeedback small{color:#b0c2b5}.duaBadge{display:flex;gap:16px;align-items:center;border:1px solid #aa813d;background:linear-gradient(110deg,#392d19,#101813);border-radius:18px;padding:17px;margin-top:22px}.duaBadgeArt{font-size:38px}.duaBadge strong{color:#eac779;font-size:19px}.duaBadge p{margin:4px 0;font-size:13px}.duaBadge small{color:#b2b5a7}
   @media(max-width:560px){.duaDialog{max-height:94dvh}.duaHeader{padding:16px;gap:10px}.duaHeader h2{font-size:26px}.duaSymbol{width:55px;height:55px;font-size:27px}.duaTabs{margin:0 12px}.duaTabs button{font-size:12px}.duaContent{padding:18px}.duaLearningGrid{grid-template-columns:1fr}.duaVerse{padding:12px}}
  `}</style>
 </div>
}
