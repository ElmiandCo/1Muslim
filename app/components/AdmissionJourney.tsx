"use client";
type Props={stage:1|2|3;detail?:string;compact?:boolean};
const stages=[{title:"Account",subtitle:"Sign-in form · approval"},{title:"Shahada",subtitle:"Declaration · verification"},{title:"Admission",subtitle:"Entry · badge & XP"}] as const;
/** Visual journey only: stage 3 is not complete until onboarding saves successfully. */
export default function AdmissionJourney({stage,detail,compact=false}:Props){
 return <section className={"admissionJourney "+(compact?"admissionCompact":"")} aria-label="Your 1Muslim admission journey">
 <div className="admissionHeading"><strong>YOUR 1MUSLIM JOURNEY</strong><span>STEP {stage} OF 3</span></div>
 <div className="admissionStages">{stages.map((s,i)=><div key={s.title} className={"admissionStage "+(stage>i+1?"done":stage===i+1?"current":"upcoming")} aria-current={stage===i+1?"step":undefined}><span className="admissionDot">{stage>i+1?"✓":i+1}</span><strong>{s.title}</strong><small>{s.subtitle}</small></div>)}</div>
 <div className="admissionBar" role="progressbar" aria-label="Admission journey stage" aria-valuemin={0} aria-valuemax={3} aria-valuenow={stage-1}><span style={{width:`${(stage-1)/3*100}%`}}/></div>
 {detail&&<p className="admissionDetail">{detail}</p>}
 <style jsx>{`
 .admissionJourney{padding:12px 14px;border:1px solid #c7c88a6a;border-radius:17px;background:linear-gradient(130deg,#09251dd9,#05120eee);box-shadow:inset 0 1px #e2ebd41b,0 0 20px #b8d98717;color:#e8f1df}
 .admissionHeading{display:flex;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:.15em;color:#d5cb96}
 .admissionStages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 10px}
 .admissionStage{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;opacity:.46;min-width:0}
 .admissionStage.current,.admissionStage.done{opacity:1}
 .admissionDot{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;border:1px solid #a4c89d77;background:#0e3326;color:#e4d49b;font-size:12px}
 .current .admissionDot{box-shadow:0 0 17px #b9e6a477;border-color:#d9d194}
 .done .admissionDot{background:#2c6845}
 .admissionStage strong{font-size:11px}.admissionStage small{font-size:9px;line-height:1.3;color:#b9c8b6}
 .admissionBar{height:4px;background:#ffffff21;border-radius:10px;overflow:hidden}
 .admissionBar span{display:block;height:100%;background:linear-gradient(90deg,#58d992,#d8c58a);transition:width .5s ease}
 .admissionDetail{font-size:10px;line-height:1.4;color:#cbd9c5;margin:7px 0 0}
 .admissionCompact{padding:9px 11px}.admissionCompact .admissionStages{margin:8px 0}.admissionCompact .admissionStage small{font-size:8px}
 @media(prefers-reduced-motion:reduce){.admissionBar span{transition:none}}
 `}</style></section>
}