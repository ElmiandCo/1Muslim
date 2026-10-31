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
      <style>{`\n        .omLiveTheater{position:fixed;inset:0;width:100vw;height:100dvh;background:#000;overflow:hidden;z-index:1000;isolation:isolate}\n        .omLiveTheater>.omLiveImmersiveViewer{height:100%!important;aspect-ratio:auto!important}\n        .omLiveTheater video{height:100%!important;width:100%!important;object-fit:cover!important}
        .omLiveTheater .omLiveImmersiveViewer{height:100%!important;min-height:100%!important;aspect-ratio:auto!important}
        .omLiveTheater .omLiveVideoStage video{object-fit:cover!important}
        .omLiveTheater .omLiveVideoStage .omScreenVideo{object-fit:contain!important}
        .omLiveTheater .omViewerExit{top:calc(env(safe-area-inset-top) + 12px);z-index:30}\n        .omLiveTheaterInfo{position:absolute;top:calc(env(safe-area-inset-top) + 16px);left:70px;right:110px;display:flex;align-items:center;gap:8px;color:#fff;font-size:12px;text-shadow:0 1px 8px #000;pointer-events:none;z-index:20;white-space:nowrap;overflow:hidden}\n        .omLiveTheaterInfo strong{overflow:hidden;text-overflow:ellipsis}
        .omLiveTheaterAvatar{width:35px;height:35px;object-fit:cover;border-radius:50%;border:1px solid #91ffe2;flex:none}
        .omLiveTheaterIdentity{display:flex;flex-direction:column;gap:2px;min-width:0}.omLiveTheaterIdentity small{opacity:.8;overflow:hidden;text-overflow:ellipsis}
        .omLiveTheaterChat{mask-image:linear-gradient(to bottom,transparent 0%,black 18%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 18%)}\n        .omLiveTheaterBadge{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;background:#aa2039;flex:none}\n        .omLiveTheaterChat{position:absolute;bottom:calc(env(safe-area-inset-bottom) + 12px);left:12px;width:min(90vw,430px);height:min(42dvh,390px);z-index:21;pointer-events:auto}\n        .omLiveTheaterChat .liveChat{height:100%;background:transparent}\n        .omLiveTheaterGuests{position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom) + 38px);z-index:22;color:#fff}\n        .omLiveTheaterGuests summary{list-style:none;cursor:pointer;padding:10px 12px;border-radius:999px;background:#09221dbb;border:1px solid #a4e7d16b;backdrop-filter:blur(16px);font-size:12px}\n        .omLiveTheaterGuests summary::-webkit-details-marker{display:none}\n        .omLiveTheaterGuestPanel{position:absolute;bottom:48px;right:0;width:min(90vw,390px);max-height:45dvh;overflow:auto;border-radius:18px;background:#081a17ef;border:1px solid #a4e7d14d;padding:10px;backdrop-filter:blur(20px)}\n        @media(min-width:701px){.omLiveTheaterChat{height:280px;width:370px}.omLiveTheaterGuests{bottom:32px}}\n      `}</style>
      <style>{`
        @media(max-width:700px){
          .omLiveViewerFullscreen{width:100%!important;max-width:none!important;margin:0!important;padding:0 0 85px!important}
          .omLiveViewerFullscreen>div:first-child{padding:12px 16px!important;margin:0!important;background:#090812}
          .omLiveViewerFullscreen>div:nth-child(2){border:0!important;border-radius:0!important;overflow:visible!important}
          .omLiveViewerFullscreen video{max-height:calc(100dvh - 145px)!important;object-fit:contain!important}
        }
      `}</style>
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
  const { data: hostProfile } = isLive ? await supabase.from("profiles").select("username,display_name,avatar_url").eq("id",stream.host_id).maybeSingle() : { data: null };
  const hostName = hostProfile?.display_name || hostProfile?.username || "1Muslim Creator";
  const hostAvatar = hostProfile?.avatar_url;
  const videoUrl = recording ? supabase.storage.from("live-recordings").getPublicUrl(recording.video_path).data.publicUrl : null;
  const posterUrl = recording?.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(recording.thumbnail_path).data.publicUrl : null;

  return (
    <main style={{minHeight:"100vh",background:"var(--bg)",color:"var(--text)"}}>
      {!isLive && <><SiteNav /><FirstVisitGuide area="watch-live"/></>}
      <div className="omLiveViewerFullscreen" style={isLive?{maxWidth:"none",margin:0,padding:0}:{maxWidth:1100,margin:"0 auto",padding:"30px 18px 70px"}}>
        {!isLive && <div style={{marginBottom:16}}>
          <span style={{fontSize:10,letterSpacing:".15em",color:"#829b87",fontWeight:850}}>{isLive ? "1MUSLIM LIVE" : "1MUSLIM REPLAY"}</span>
          <h1 style={{fontSize:"clamp(30px,5vw,52px)",letterSpacing:"-.06em",margin:"8px 0"}}>{stream.title}</h1>
          <p style={{color:"#849087",margin:0}}>{stream.category} · {isLive ? "Started " + new Date(stream.started_at).toLocaleString() : "Ended " + new Date(effectiveEndedAt ?? recording?.created_at ?? stream.started_at).toLocaleString()}</p>{isLive && <div style={{marginTop:10,fontSize:11,color:"#b9c9bc"}}>{stream.visibility === "ashab" ? "🔒 Ashab Live · Companions only" : "🌐 Public Live · All 1Muslim users"}</div>}
        </div>}

        <div style={isLive?{border:0,borderRadius:0,background:"#000"}:{border:"1px solid #1b241f",borderRadius:22,overflow:"hidden",background:"#080d09"}}>
          {isLive ? (
            <section className="omLiveTheater" aria-label="Immersive live broadcast">
              <LiveKitViewer roomName={stream.room_name} streamId={stream.id} hostAvatar={hostAvatar} hostName={hostName} />
              <div className="omLiveTheaterInfo">
                {hostAvatar && <img src={hostAvatar} alt="" className="omLiveTheaterAvatar" />}
                <div className="omLiveTheaterIdentity"><strong>{hostName}</strong><small>{stream.title}</small></div>
                <span className="omLiveTheaterBadge">● LIVE</span>
              </div>
              <div className="omLiveTheaterChat"><LiveChat streamId={stream.id} hostId={stream.host_id} overlay /></div>
              <details className="omLiveTheaterGuests">
                <summary aria-label="Open guest controls">♧ Guests</summary>
                <div className="omLiveTheaterGuestPanel"><LiveGuestStudio streamId={stream.id} roomName={stream.room_name} hostId={stream.host_id}/></div>
              </details>
            </section>
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
