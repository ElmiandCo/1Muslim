import {XP_LEVEL_MAX} from "../../lib/xpLevels";

export default function XPLevelsHelpPage(){
 return <main style={{minHeight:"100vh",padding:"clamp(24px,5vw,64px) 20px",background:"radial-gradient(circle at top,#165a45,#071b17 70%)",color:"#f4f4e9",fontFamily:"inherit"}}>
 <article style={{maxWidth:760,margin:"0 auto"}}><a href="/" style={{color:"#c6e9cf",textDecoration:"none"}}>← 1Muslim Home</a>
 <p style={{letterSpacing:3,color:"#a5d8ba",fontSize:12,marginTop:32}}>1MUSLIM · HELP</p><h1 style={{fontSize:"clamp(32px,6vw,52px)",margin:"8px 0"}}>XP & Levels</h1>
 <p style={{color:"#c8d9d0",lineHeight:1.7}}>Earn XP as you participate in 1Muslim. Your total XP determines your level. The ranges below are inclusive; Level 10 is the highest level, and XP can continue accumulating beyond one million.</p>
 <div style={{display:"grid",gap:12,marginTop:28}}>{XP_LEVEL_MAX.map((max,i)=>{const min=i===0?0:XP_LEVEL_MAX[i-1]+1;return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"17px 20px",border:"1px solid rgba(181,232,198,.25)",borderRadius:16,background:"rgba(255,255,255,.055)",boxShadow:"0 8px 22px rgba(0,0,0,.1)"}}><strong style={{fontSize:18}}>Level {i+1}</strong><span style={{color:"#d6eadc",textAlign:"right"}}>{min.toLocaleString()}–{max.toLocaleString()} XP</span></div>})}</div>
 <p style={{marginTop:28,color:"#a5c6b5",fontSize:13}}>Your level updates automatically as your XP total changes. This guide will be linked from the Help section.</p></article></main>
}
