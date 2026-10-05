import Link from "next/link";
import { createClient } from "../../../../utils/supabase/server";
import SiteNav from "../../../components/SiteNav";
import LiveKitViewer from "../../../../components/LiveKitViewer";
import LiveChat from "../../../../components/LiveChat";

export default async function LiveViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: stream } = await supabase
    .from("live_streams")
    .select("id, host_id, title, category, room_name, viewer_count, started_at")
    .eq("id", id)
    .eq("status", "live")
    .maybeSingle();

  return (
    <main style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>
      <SiteNav />
      <div style={{maxWidth:1100,margin:"0 auto",padding:"30px 18px 70px"}}>
        {!stream ? (
          <section style={{border:"1px solid #263029",borderRadius:20,padding:40,textAlign:"center"}}>
            <h1>This live has ended.</h1>
            <p style={{color:"#7e8982"}}>The recording may still be available in the creator's Live Recordings.</p>
            <Link href="/streaming" style={{color:"#d6e7b8"}}>Back to Streaming →</Link>
          </section>
        ) : (
          <>
            <div style={{marginBottom:16}}>
              <span style={{fontSize:10,letterSpacing:".15em",color:"#829b87",fontWeight:850}}>1MUSLIM LIVE</span>
              <h1 style={{fontSize:"clamp(30px,5vw,52px)",letterSpacing:"-.06em",margin:"8px 0"}}>{stream.title}</h1>
              <p style={{color:"#849087",margin:0}}>{stream.category} · Started {new Date(stream.started_at).toLocaleString()}</p>
            </div>
            <div style={{border:"1px solid #1b241f",borderRadius:22,overflow:"hidden",background:"#080d09"}}>
              <LiveKitViewer roomName={stream.room_name} />
              <div style={{padding:18,display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(320px,.65fr)",gap:16}}>
                <div><strong>🔴 Live now</strong><div style={{fontSize:11,color:"#7e8982",marginTop:5}}>Watch and participate in the conversation.</div><Link href="/streaming" style={{display:"inline-block",marginTop:12,color:"#cbd8ce",fontSize:12}}>← All streaming</Link></div>
                <LiveChat streamId={stream.id} hostId={stream.host_id} />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
