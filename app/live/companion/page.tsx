"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Room,Track} from "livekit-client";
import {createClient} from "../../../utils/supabase/client";
type Stream={id:string;title:string;room_name:string};
export default function CompanionPage(){
 const [streams,setStreams]=useState<Stream[]>([]),[status,setStatus]=useState("Finding your Live…"),[selected,setSelected]=useState(""),[sharing,setSharing]=useState(false);
 const roomRef=useRef<Room|null>(null),trackRef=useRef<MediaStreamTrack|null>(null);
 const stop=useCallback(()=>{trackRef.current?.stop();trackRef.current=null;roomRef.current?.disconnect();roomRef.current=null;setSharing(false)},[]);
 useEffect(()=>{let alive=true;const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!alive)return;if(!user){setStatus("Sign in with the same account as your phone.");return}const {data,error}=await db.from("live_streams").select("id,title,room_name").eq("host_id",user.id).eq("status","live").order("started_at",{ascending:false}).limit(10);if(!alive)return;setStreams(data||[]);setSelected(old=>old||(data?.[0]?.id||""));setStatus(error?"Could not load your Live sessions.":data?.length?"Choose your active broadcast.":"No active Live found. Start Live on your phone first.")};void load();const t=setInterval(()=>void load(),12000);return()=>{alive=false;clearInterval(t);stop()}},[stop]);
 const share=async()=>{const target=streams.find(s=>s.id===selected);if(!target)return;setStatus("Connecting screen only…");
 let room:Room|null=null,display:MediaStream|null=null;
 try{
  if(!navigator.mediaDevices?.getDisplayMedia)throw Error("Screen sharing is unavailable in this browser. Use a desktop browser.");
  display=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  const res=await fetch("/api/livekit/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:target.room_name,role:"companion"})});
  const data=await res.json();if(!res.ok)throw Error(data.error||"Could not join your Live.");
  room=new Room({adaptiveStream:true,dynacast:true});await room.connect(data.url,data.token);
  const video=display.getVideoTracks()[0];if(!video)throw Error("No screen was selected.");
  await room.localParticipant.publishTrack(video,{source:Track.Source.ScreenShare});
  trackRef.current=video;roomRef.current=room;setSharing(true);setStatus("Screen connected. Your phone remains the primary host.");
  video.addEventListener("ended",()=>stop(),{once:true});
 }catch(e){room?.disconnect();display?.getTracks().forEach(t=>t.stop());setStatus(e instanceof Error?e.message:"Unable to share screen.")}};
 return <main className="companion-page"><div className="companion-card"><small className="companion-eyebrow">1MUSLIM · SECOND DEVICE</small><h1>Join My Own Live</h1><p>Keep your phone camera and microphone broadcasting. Connect this laptop to share its screen into the same Live.</p><label htmlFor="my-live">Your active Live</label><select id="my-live" value={selected} onChange={e=>setSelected(e.target.value)} disabled={sharing}>{streams.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select><div className="companion-actions">{sharing?<button onClick={stop}>■ Stop Screen Sharing</button>:<button onClick={()=>void share()} disabled={!selected}>▣ Share This Laptop’s Screen</button>}<Link href="/">← Home</Link></div><p role="status" className="companion-status">{status}</p><div className="companion-note">🔒 Only your own active Live sessions appear here. This device never requests your camera or microphone. Screen capture requires browser permission.</div></div><style jsx>{`
.companion-page{min-height:100dvh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 0%,#22604b,#071c17 75%);color:#f9efd6}.companion-card{width:min(520px,100%);padding:clamp(24px,5vw,44px);border:1px solid #d7bf8088;border-radius:24px;background:#103629e8;box-shadow:0 20px 70px #0008}.companion-eyebrow{color:#e1c789;letter-spacing:.18em;font-size:11px}.companion-card h1{font-size:clamp(27px,5vw,42px);margin:12px 0}.companion-card p{line-height:1.6;color:#e0e8da}.companion-card label{display:block;margin:22px 0 8px;color:#e1c789;font-size:13px}.companion-card select{width:100%;padding:14px;border-radius:12px;border:1px solid #d7bf8088;background:#173e31;color:#fff}.companion-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:22px}.companion-actions button{padding:13px 17px;border:0;border-radius:12px;background:#dfc78b;color:#14362b;font-weight:800;cursor:pointer}.companion-actions button:disabled{opacity:.4}.companion-actions a{color:#e8d7ad}.companion-status{font-size:13px}.companion-note{padding-top:16px;border-top:1px solid #d7bf8044;font-size:12px;line-height:1.6;color:#b9cfc0}
`}</style></main>;
}
