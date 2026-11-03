"use client";
import {useRouter} from "next/navigation";
export default function PremiumPreviewPage(){
 const router=useRouter();
 const back=()=>{if(typeof window!=="undefined"&&window.history.length>1){router.back()}else{router.replace("/")}};
 return <main role="button" tabIndex={0} aria-label="Premium preview advertisement. Tap anywhere to return." onClick={back} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();back()}}} style={{position:"fixed",inset:0,overflow:"hidden",cursor:"pointer",background:"var(--theme-background,#10191e)",color:"var(--theme-text,#fff)",display:"grid",placeItems:"center",padding:20,textAlign:"center"}}>
 <section style={{width:"min(100%,900px)",minHeight:"min(75dvh,850px)",display:"grid",placeItems:"center",border:"1px solid color-mix(in srgb,var(--theme-secondary,currentColor) 45%,transparent)",borderRadius:26,background:"color-mix(in srgb,var(--theme-primary,currentColor) 8%,transparent)",backdropFilter:"blur(18px)",padding:"clamp(24px,5vw,65px)",boxSizing:"border-box"}}>
 <div><div style={{letterSpacing:4,fontSize:13,opacity:.7}}>1MUSLIM PREMIUM</div><h1 style={{fontSize:"clamp(34px,7vw,72px)",margin:"24px 0"}}>Your space. Your style.</h1><p style={{fontSize:"clamp(17px,2.5vw,26px)",opacity:.8}}>Premium preview coming soon.</p><p style={{opacity:.6,fontSize:13,marginTop:60}}>Advertisement image placeholder · Tap anywhere to return</p></div>
 </section></main>;
}
