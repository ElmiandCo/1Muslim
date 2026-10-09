import Link from "next/link";
import FirstVisitGuide from "../../../components/FirstVisitGuide";
import { createClient } from "../../../../utils/supabase/server";
import SiteNav from "../../../components/SiteNav";
import LiveKitViewer from "../../../../components/LiveKitViewer";
import LiveGuestStudio from "../../../../components/LiveGuestStudio";
import LiveChat from "../../../../components/LiveChat";
import RecordingComments from "../../../../components/RecordingComments";
import SaveRecording from "../../../components/SaveRecording";
import DeleteRecordingButton from "../../../components/DeleteRecordingButton";

export default async function LiveViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: stream } = await supabase
    .from("live_streams")
    .select("id, host_id, title, category, room_name, viewer_count, started_at, ended_at, status, recording_id, thumbnail_path, aspect_ratio, visibility, last_heartbeat_at, scheduled_end_at")
    .eq("id", id)
    .maybeSingle();

  if (!stream) return (
    <main style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>
      <SiteNav /><FirstVisitGuide area="watch-live"/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"70px 18px"}}>
        <section style={{border:"1px solid #263029",borderRadius:20,padding:40,textAlign:"center"}}>
          <h1>Live not found</h1>
          <p style={{color:"#7e8982"}}>This Live is no longer available.</p>
          <Link href="/streaming" style={{color:"#d6e7b8"}}>Back to Streaming →</Link>
        </section>
      </div>
    </main>
  );

  const heartbeatFresh = !stream.last_heartbeat_at || (Date.now() - new Date(stream.last_heartbeat_at).getTime() < 75_000);
  const scheduleStillActive = !stream.scheduled_end_at || new Date(stream.scheduled_end_at).getTime() > Date.now();
  const isLive = stream.status === "live" && heartbeatFresh && scheduleStillActive;
  const effectiveEndedAt = stream.ended_at ?? (stream.scheduled_end_at && new Date(stream.scheduled_end_at).getTime() <= Date.now() ? stream.scheduled_end_at : stream.last_heartbeat_at);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminRow } = user ? await supabase.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle() : { data: null };
  const mayViewRecording = Boolean(adminRow) || Boolean(user && user.id === stream.host_id);
  const { data: recording } = !isLive && mayViewRecording && stream.recording_id
    ? await supabase.from("live_recordings").select("id,title,category,video_path,mime_type,duration_seconds,views,likes,comments_count,created_at,thumbnail_path,visibility").eq("id", stream.recording_id).maybeSingle()
    : { data: null };
  const videoUrl = recording ? supabase.storage.from("live-recordings").getPublicUrl(recording.video_path).data.publicUrl : null;
  const posterUrl = recording?.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(recording.thumbnail_path).data.publicUrl : null;

  return (
    <main style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>
      <SiteNav /><FirstVisitGuide area="watch-live"/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"30px 18px 70px"}}>
        <div style={{marginBottom:16}}>
          <span style={{fontSize:10,letterSpacing:".15em",color:"#829b87",fontWeight:850}}>{isLive ? "1MUSLIM LIVE" : "1MUSLIM REPLAY"}</span>
          <h1 style={{fontSize:"clamp(30px,5vw,52px)",letterSpacing:"-.06em",margin:"8px 0"}}>{stream.title}</h1>
          <p style={{color:"#849087",margin:0}}>{stream.category} · {isLive ? "Started " + new Date(stream.started_at).toLocaleString() : "Ended " + new Date(effectiveEndedAt ?? recording?.created_at ?? stream.started_at).toLocaleString()}</p>{isLive && <div style={{marginTop:10,fontSize:11,color:"#b9c9bc"}}>{stream.visibility === "ashab" ? "🔒 Ashab Live · Companions only" : "🌐 Public Live · All 1Muslim users"}</div>}
        </div>

        <div style={{border:"1px solid #1b241f",borderRadius:22,overflow:"hidden",background:"#080d09"}}>
          {isLive ? (
            <>
              <LiveKitViewer roomName={stream.room_name} streamId={stream.id} />
              <div style={{padding:"0 18px 18px"}}><LiveGuestStudio streamId={stream.id} roomName={stream.room_name} hostId={stream.host_id}/></div>
              <div style={{padding:18,display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(320px,.65fr)",gap:16}}>
                <div><strong>🔴 Live now</strong><div style={{fontSize:11,color:"#7e8982",marginTop:5}}>Watch and participate in the conversation.</div><div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:12}}><Link href="/streaming" style={{color:"#cbd8ce",fontSize:12}}>← All streaming</Link><Link href={"/profile/"+stream.host_id} style={{color:"#d6e7b8",fontSize:12}}>Host profile</Link><Link href={"/messages?to="+stream.host_id} style={{color:"#d6e7b8",fontSize:12}}>💬 Message host</Link></div></div>
                <LiveChat streamId={stream.id} hostId={stream.host_id} />
              </div>
            </>
          ) : !mayViewRecording ? (
            <section style={{padding:40,textAlign:"center"}}><h2>🔒 Recording restricted</h2><p style={{color:"#a6b3a9"}}>Only 1Muslim administrators can access past livestream recordings. Live broadcasts remain available while they are on air.</p><Link href="/streaming" style={{color:"#d6e7b8"}}>Back to Streaming →</Link></section>
          ) : recording && videoUrl ? (
            <>
              <div style={{background:"#000",aspectRatio:stream.aspect_ratio === "9:16" ? "9/16" : stream.aspect_ratio === "1:1" ? "1/1" : "16/9",maxHeight:"78vh",margin:"0 auto"}}>
                <video src={videoUrl} poster={posterUrl ?? undefined} controls playsInline preload="metadata" style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}} />
              </div>
              <div style={{padding:18}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                  <div><strong>▶ Recorded Live</strong><div style={{fontSize:11,color:"#7e8982",marginTop:5}}>This Live has ended. Watch the full session and join the conversation below.</div>{effectiveEndedAt && <div style={{fontSize:10,color:"#9eaa9f",marginTop:7}}>Ended {new Date(effectiveEndedAt).toLocaleString()}</div>}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><SaveRecording recordingId={recording.id} />{mayViewRecording && <DeleteRecordingButton recordingId={recording.id} title={recording.title} />}<Link href="/streaming" style={{color:"#cbd8ce",fontSize:12}}>← All streaming</Link></div>
                </div>
                <div style={{marginTop:18}}><RecordingComments recordingId={recording.id} /></div>
              </div>
            </>
          ) : (
            <section style={{padding:40,textAlign:"center"}}><h2>Recording unavailable</h2><p style={{color:"#7e8982"}}>The Live ended, but its recording is not attached yet.</p><Link href="/streaming" style={{color:"#d6e7b8"}}>Back to Streaming →</Link></section>
          )}
        </div>
      </div>
    </main>
  );
}
