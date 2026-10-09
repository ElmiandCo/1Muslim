import Link from "next/link";
import SiteNav from "../components/SiteNav";

export default function YoutubeConnectPage() {
  return <main style={{minHeight:"100vh",background:"#080c0b",color:"#f0f5f1"}}>
    <SiteNav />
    <section style={{maxWidth:760,margin:"auto",padding:"80px 22px"}}>
      <span style={{fontSize:12,letterSpacing:2,color:"#9fb7a5"}}>1MUSLIM × YOUTUBE</span>
      <h1 style={{fontSize:"clamp(34px,6vw,64px)",margin:"18px 0"}}>Your YouTube community, connected.</h1>
      <p style={{lineHeight:1.8,color:"#b5c4b9"}}>Soon you'll be able to authorize your YouTube account to share your channel and discover your videos inside 1Muslim. Secure Google authorization and channel permissions are still being developed.</p>
      <div style={{padding:22,border:"1px solid #3b5746",borderRadius:20,margin:"28px 0",background:"#112018"}}>
        <strong>Connection not available yet</strong>
        <p style={{color:"#aebdb2",lineHeight:1.6}}>We won't ask for your Google password. When this launches, connecting will use Google's official authorization flow, and you'll be able to disconnect.</p>
      </div>
      <Link href="/" style={{color:"#d9f1db"}}>← Back to 1Muslim</Link>
    </section>
  </main>;
}
