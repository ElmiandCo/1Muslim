"use client";
import Link from "next/link";
import FeaturedYoutubeVideo from "../../components/FeaturedYoutubeVideo";
export default function VideoOfTheDayPage(){
 return <main style={{maxWidth:1100,margin:"0 auto",padding:"28px clamp(14px,4vw,32px) 90px",color:"var(--text,#f0fff4)"}}>
 <Link href="/" style={{color:"#b99c55",textDecoration:"none",fontWeight:700}}>← Back to Home</Link>
 <div style={{marginTop:18,padding:"clamp(15px,3vw,32px)",border:"1px solid #b99c5559",borderRadius:24,background:"var(--card,#101712)"}}>
 <div style={{fontSize:12,letterSpacing:2,color:"#b99c55",fontWeight:800,marginBottom:12}}>✦ 1MUSLIM · WATCH TOGETHER</div>
 <FeaturedYoutubeVideo />
 <div style={{marginTop:16,padding:"13px 16px",border:"1px solid #b99c5544",borderRadius:14,fontSize:13}}>💚 Add a timestamped reaction while watching. Your comment appears briefly over the video when other viewers reach the same moment. Reply to longer discussions below.</div>

 </div></main>
}
