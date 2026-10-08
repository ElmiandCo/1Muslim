"use client";

import SiteNav from "../components/SiteNav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import RecordingThumbnail from "../../components/RecordingThumbnail";
import ReconnectTrivia from "../components/ReconnectTrivia";

type LiveStream = { id: string; title: string; category: string; room_name: string; viewer_count: number; started_at: string; scheduled_end_at: string | null; thumbnail_path: string | null; aspect_ratio: "9:16" | "1:1" | "16:9"; host_id: string; host_gender: string | null; host_avatar_url: string | null };

type RecordedLive = { id:string; title:string; category:string; duration_seconds:number; created_at:string; thumbnail_path:string|null; stream_id:string|null; stream_started_at:string|null; stream_ended_at:string|null; user_id:string; host_name:string; host_avatar_url:string|null; host_gender:string|null; };
type Video = {
  id: string;
  title: string;
  creator: string;
  category: string;
  duration: string;
  description: string;
  accent: string;
  src: string;
  live?: boolean;
  thumbnail: string;
};

const videos: Video[] = [
  {
    id: "quran-01",
    title: "Surah Al-Ikhlas — A Short Reflection",
    creator: "1Muslim",
    category: "Qur'an",
    duration: "08:24",
    description: "A calm introduction to Surah Al-Ikhlas and the meaning of Allah's oneness.",
    accent: "☾",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
  {
    id: "new-muslim-01",
    title: "Where Do I Start?",
    creator: "1Muslim Learning",
    category: "New Muslim",
    duration: "14:12",
    description: "A welcoming first lesson for someone discovering Islam or beginning again.",
    accent: "✦",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
  {
    id: "prayer-01",
    title: "Salah: Standing, Bowing & Sujood",
    creator: "Prayer Academy",
    category: "Prayer",
    duration: "11:40",
    description: "A visual walkthrough of the core movements of salah.",
    accent: "⌁",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
  {
    id: "seerah-01",
    title: "The Life of Muhammad ﷺ — The Beginning",
    creator: "1Muslim Seerah",
    category: "Seerah",
    duration: "22:08",
    description: "Start the Seerah with historical context and a careful timeline.",
    accent: "◇",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
  {
    id: "tawhid-01",
    title: "Why One God?",
    creator: "1Muslim Foundations",
    category: "Tawhid",
    duration: "18:31",
    description: "An accessible introduction to Tawhid and worship belonging to Allah alone.",
    accent: "1",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
  {
    id: "community-01",
    title: "Ask 1Muslim: Faith, Doubt & Honest Questions",
    creator: "1Muslim Community",
    category: "Community",
    duration: "31:05",
    description: "A community conversation about asking difficult questions without shame.",
    accent: "◎",
    src: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnail: "/assets/avatars/default-male.jpg",
  },
];

const categories = ["All", "Qur'an", "New Muslim", "Prayer", "Seerah", "Tawhid", "Community"];

export default function StreamingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState("All");
  const [recordedLives, setRecordedLives] = useState<RecordedLive[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [admin, setAdmin] = useState(false);
  const [adminVideos, setAdminVideos] = useState<Video[]>([]);
  const [adminModal, setAdminModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminCategory, setAdminCategory] = useState("Qur'an");
  const [adminFile, setAdminFile] = useState<File | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");


  useEffect(() => {
    const loadLives = async () => {
      const { data } = await supabase.from("live_streams").select("id,title,category,room_name,viewer_count,started_at,scheduled_end_at,thumbnail_path,aspect_ratio,host_id").eq("status","live").gte("last_heartbeat_at", new Date(Date.now() - 60_000).toISOString()).order("started_at",{ascending:false});
      const rows = (data ?? []) as Omit<LiveStream,"host_gender"|"host_avatar_url">[];
      const hostIds = Array.from(new Set(rows.map(row => row.host_id).filter(Boolean)));
      let profileMap:Record<string,{gender:string|null;avatar_url:string|null}>={};
      if (hostIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,gender,avatar_url").in("id",hostIds);
        profileMap = Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile]));
      }
      setLiveStreams(rows.map(row => ({
        ...row,
        host_gender: profileMap[row.host_id]?.gender ?? null,
        host_avatar_url: profileMap[row.host_id]?.avatar_url ?? null
      })));
    };
    void loadLives();
    const channel = supabase.channel("1muslim-live-discovery").on("postgres_changes",{event:"*",schema:"public",table:"live_streams"},() => void loadLives()).subscribe();
    const timer = window.setInterval(loadLives, 10000);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const loadRecordedLives = async () => {
      const { data } = await supabase.from("live_recordings").select("id,title,category,duration_seconds,created_at,thumbnail_path,user_id").eq("visibility","public").order("created_at",{ascending:false}).limit(12);
      const rows = (data ?? []) as Omit<RecordedLive,"stream_id"|"stream_started_at"|"stream_ended_at"|"host_name"|"host_avatar_url"|"host_gender">[];
      const ids = rows.map(row => row.id);
      const hostIds = Array.from(new Set(rows.map(row => row.user_id).filter(Boolean)));
      let profileMap:Record<string,{display_name:string|null;username:string|null;avatar_url:string|null;gender:string|null}>={};
      if(hostIds.length){
        const {data:profiles}=await supabase.from("profiles").select("id,display_name,username,avatar_url,gender").in("id",hostIds);
        profileMap=Object.fromEntries((profiles??[]).map(profile=>[profile.id,profile]));
      }
      let streamMap:Record<string,string> = {};
      let streamRows:Array<{id:string;recording_id:string|null;started_at:string|null;ended_at:string|null}> = [];
      if (ids.length) {
        const { data: streamData } = await supabase.from("live_streams").select("id,recording_id,started_at,ended_at").in("recording_id",ids);
        streamRows = (streamData ?? []) as Array<{id:string;recording_id:string|null;started_at:string|null;ended_at:string|null}>;
        streamMap = Object.fromEntries(streamRows.filter(stream => stream.recording_id).map(stream => [stream.recording_id as string,stream.id]));
      }
      setRecordedLives(rows.map(row => {
        const profile=profileMap[row.user_id];
        const linked=streamRows.find(stream=>stream.recording_id===row.id);
        return {...row,stream_id:streamMap[row.id] ?? null,stream_started_at:linked?.started_at??null,stream_ended_at:linked?.ended_at??null,host_name:profile?.display_name||profile?.username||"1Muslim Host",host_avatar_url:profile?.avatar_url??null,host_gender:profile?.gender??null};
      }));
    };
    void loadRecordedLives();
  }, [supabase]);

  useEffect(() => {
    const loadAdminLibrary = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: adminRow } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (!adminRow) return;
      setAdmin(true);
      const { data } = await supabase.from("admin_videos").select("id,title,description,category,storage_path,duration_seconds").order("created_at", { ascending: false });
      setAdminVideos((data ?? []).map((v: any) => ({
        id:v.id,title:v.title,creator:"1Muslim",category:v.category,duration:formatDuration(v.duration_seconds),description:v.description,accent:"✦",thumbnail:"/assets/avatars/default-male.jpg",
        src:supabase.storage.from("admin-videos").getPublicUrl(v.storage_path).data.publicUrl
      })));
    };
    void loadAdminLibrary();
  }, []);

const openAdminEditor = (video?: Video) => {
  setEditingVideo(video ?? null);
  setAdminTitle(video?.title ?? "");
  setAdminDescription(video?.description ?? "");
  setAdminCategory(video?.category ?? "Qur'an");
  setAdminFile(null);
  setAdminMessage("");
  setAdminModal(true);
  };

  const saveAdminVideo = async () => {
  if (!admin) return;
  if (!adminTitle.trim()) { setAdminMessage("Title is required."); return; }
  setAdminSaving(true); setAdminMessage("");
  const supabase = createClient();
  if (editingVideo) {
    const { error } = await supabase.from("admin_videos").update({
      title: adminTitle.trim(), description: adminDescription.trim(), category: adminCategory, updated_at: new Date().toISOString()
    }).eq("id", editingVideo.id);
    if (error) { setAdminMessage(error.message); setAdminSaving(false); return; }
    setAdminVideos(v => v.map(x => x.id === editingVideo.id ? {...x,title:adminTitle.trim(),description:adminDescription.trim(),category:adminCategory} : x));
    setAdminSaving(false); setAdminModal(false); return;
  }
  if (!adminFile) { setAdminMessage("Choose a video file."); setAdminSaving(false); return; }
  if (!adminFile.type.startsWith("video/")) { setAdminMessage("Please choose a video file."); setAdminSaving(false); return; }
  const ext = adminFile.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `admin/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("admin-videos").upload(path, adminFile, {contentType:adminFile.type,upsert:false});
  if (uploadError) { setAdminMessage(uploadError.message); setAdminSaving(false); return; }
  const duration = await readVideoDuration(adminFile);
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("admin_videos").insert({
    title:adminTitle.trim(),description:adminDescription.trim(),category:adminCategory,storage_path:path,mime_type:adminFile.type,duration_seconds:Math.round(duration),created_by:userData.user?.id
  }).select("id,title,description,category,storage_path,duration_seconds").single();
  if (error || !data) {
    await supabase.storage.from("admin-videos").remove([path]);
    setAdminMessage(error?.message ?? "Could not save video."); setAdminSaving(false); return;
  }
  setAdminVideos(v => [{id:data.id,title:data.title,creator:"1Muslim",category:data.category,duration:formatDuration(data.duration_seconds),description:data.description,accent:"✦",thumbnail:"/assets/avatars/default-male.jpg",src:supabase.storage.from("admin-videos").getPublicUrl(data.storage_path).data.publicUrl}, ...v]);
  setAdminSaving(false); setAdminModal(false);
  };

  
  const allVideos = useMemo(() => [...adminVideos, ...videos], [adminVideos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allVideos.filter((video) => {
      const categoryMatch = category === "All" || video.category === category;
      const queryMatch = !q || [video.title, video.creator, video.category, video.description].join(" ").toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [category, query, allVideos]);

  return (
    <main className="streamingPage">
      <style jsx>{`
        .streamingPage{min-height:100vh;background:var(--bg);color:var(--text)}.topicLiveList{display:grid;gap:22px}.topicLiveSection{border:1px solid #1b241f;border-radius:20px;background:linear-gradient(145deg,#0d130f,#080d09);padding:15px}.topicLiveHead{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 13px}.topicLiveHead h3{font-size:18px;margin:5px 0 3px;letter-spacing:-.035em}.topicLiveHead p{font-size:10px;color:#748078;margin:0}.topicGoLive{white-space:nowrap;text-decoration:none;border:1px solid #354238;border-radius:999px;padding:9px 12px;color:#d6e7b8;background:#101811;font-size:10px;font-weight:800}.topicGoLive:hover{background:#182219;border-color:#61785a}@media(max-width:620px){.topicLiveHead{align-items:flex-start;flex-direction:column}.topicGoLive{width:100%;text-align:center}}
        .streamTop{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:16px max(22px,calc((100vw - 1180px)/2));border-bottom:1px solid #1b241f;background:rgba(5,8,6,.9);backdrop-filter:blur(18px)}
        .brand{display:flex;align-items:center;gap:10px;font-weight:850;letter-spacing:-.04em}
        .mark{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;border:1px solid #354237;background:#101811;color:#d6e7b8}
        .back{color:#9aa69e;text-decoration:none;font-size:13px}.back:hover{color:#fff}
        .topLinks{display:flex;gap:9px;align-items:center}.topLink{padding:9px 13px;border:1px solid #263029;border-radius:999px;color:#aeb8b1;text-decoration:none;font-size:12px}.topLink.active{background:#d6e7b8;color:#071008;border-color:#d6e7b8;font-weight:800}
        .shell{max-width:1180px;margin:auto;padding:38px 22px 80px}
        .hero{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;align-items:stretch}
        .heroMain,.heroSide{border:1px solid #1b241f;border-radius:24px;background:linear-gradient(145deg,#101712,#080d09);padding:30px;overflow:hidden}
        .heroMain{position:relative;min-height:285px}.heroMain:after{content:"";position:absolute;width:330px;height:330px;border-radius:50%;right:-110px;top:-150px;background:radial-gradient(circle,rgba(145,180,125,.18),transparent 68%);pointer-events:none}
        .eyebrow{font-size:10px;letter-spacing:.15em;color:#829b87;font-weight:850}.hero h1{font-size:48px;line-height:1;letter-spacing:-.065em;margin:12px 0}.hero p{max-width:650px;color:#9ba69f;line-height:1.65;font-size:14px}
        .stats{display:flex;gap:20px;margin-top:25px}.stat strong{display:block;font-size:19px}.stat span{font-size:10px;color:#6e7a72}
        .heroSide h3{font-size:18px;margin:7px 0}.heroSide p{font-size:11px;color:#7f8b83;line-height:1.6}.liveBadge{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #3a463d;border-radius:999px;font-size:10px;color:#cbd8ce}.dot{width:7px;height:7px;border-radius:50%;background:#b9d98e;box-shadow:0 0 12px #b9d98e}
        .liveSection{margin:26px 0 8px}.liveSectionHead{display:flex;justify-content:space-between;align-items:end;margin-bottom:12px}.liveSectionHead h2{font-size:21px;letter-spacing:-.04em;margin:5px 0}.liveGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.liveCard{border:1px solid #29352d;background:#0a100c;border-radius:17px;overflow:hidden;text-decoration:none;color:inherit}.liveThumb{height:125px;background:radial-gradient(circle at 50% 35%,rgba(214,231,184,.2),transparent 35%),linear-gradient(145deg,#172119,#070b08);display:flex;align-items:center;justify-content:center;position:relative}.liveThumb img{width:100%;height:100%;object-fit:cover;display:block}.liveThumbMark{font-size:38px;color:#b8ce9d}.liveNow{position:absolute;top:9px;left:9px;background:#d6e7b8;color:#071008;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:900}.liveCardBody{padding:11px}.liveCardBody h3{font-size:13px;margin:0 0 5px}.liveCardBody p{font-size:9px;color:#7e8982;margin:0}.liveViewer{float:right;color:#a9b7ad}.controls{display:flex;gap:10px;align-items:center;margin:24px 0 16px}.search{flex:1;min-width:160px;background:#0b110d;border:1px solid #1b241f;border-radius:999px;padding:11px 15px;color:#fff;outline:0;font-size:12px}.search:focus{border-color:#587052}
        .chips{display:flex;gap:7px;overflow:auto;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chip{border:1px solid #263029;background:#0b110d;color:#89958d;border-radius:999px;padding:9px 13px;font-size:10px;white-space:nowrap;cursor:pointer}.chip.active{background:#d6e7b8;border-color:#d6e7b8;color:#071008;font-weight:800}
        .sectionTitle{display:flex;justify-content:space-between;align-items:end;margin:27px 0 14px}.sectionTitle h2{font-size:21px;letter-spacing:-.04em;margin:5px 0}.count{font-size:10px;color:#66736a}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #1b241f;background:#0a100c;border-radius:18px;overflow:hidden;transition:.2s}.card:hover{transform:translateY(-2px);border-color:#344238}.thumb{height:155px;background:radial-gradient(circle at 70% 25%,rgba(214,231,184,.17),transparent 25%),linear-gradient(145deg,#172119,#070b08);display:flex;align-items:center;justify-content:center;position:relative}.videoThumbImage{width:100%;height:100%;object-fit:cover;display:block}.thumbOverlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.38))}.thumbMark{font-size:50px;color:#b8ce9d;text-shadow:0 0 35px rgba(184,206,157,.25)}.duration{position:absolute;right:9px;bottom:9px;background:rgba(0,0,0,.72);padding:5px 7px;border-radius:6px;font-size:9px}.cardBody{padding:14px}.meta{font-size:9px;color:#76917b;letter-spacing:.1em;text-transform:uppercase}.card h3{font-size:15px;line-height:1.25;margin:7px 0}.card p{font-size:10px;color:#7e8982;line-height:1.5;min-height:31px}.watch{flex:1;border:1px solid #2d3931;background:#101812;color:#dce8db;border-radius:10px;padding:9px;font-size:11px;font-weight:750;cursor:pointer}.watch:hover{background:#172219}
        .watchRow{display:flex;gap:7px}.adminBtn,.editBtn{border:1px solid #2d3931;background:#d6e7b8;color:#071008;border-radius:10px;padding:9px 11px;font-size:10px;font-weight:800;cursor:pointer}.editBtn{background:#101812;color:#dce8db}.adminOverlay{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(10px);z-index:120;display:grid;place-items:center;padding:20px}.adminModal{width:min(620px,100%);background:#080d09;border:1px solid #29352d;border-radius:20px;padding:22px}.adminModal h2{margin:6px 0;font-size:25px}.adminModal p,.adminHint{color:#7e8982;font-size:11px}.adminForm{display:grid;gap:12px;margin-top:17px}.adminForm label{display:grid;gap:6px;color:#93a098;font-size:10px}.adminForm input,.adminForm textarea,.adminForm select{background:#070c08;border:1px solid #263029;color:#fff;border-radius:10px;padding:10px;font:inherit;font-size:12px}.adminForm textarea{min-height:100px}.adminActions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.adminActions button{border:1px solid #29352d;background:#101812;color:#dce8db;border-radius:10px;padding:10px 14px;cursor:pointer}.adminActions .save{background:#d6e7b8;color:#071008;font-weight:800}.adminMessage{color:#ffbcbc;font-size:11px}.empty{border:1px dashed #263029;border-radius:18px;padding:40px;text-align:center;color:#738077}.empty strong{display:block;color:#cbd4cd;margin-bottom:6px}
        .playerOverlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);z-index:100;display:grid;place-items:center;padding:20px}.player{width:min(900px,100%);background:#080d09;border:1px solid #29352d;border-radius:20px;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.6)}.player video{display:block;width:100%;aspect-ratio:16/9;background:#000}.playerInfo{padding:17px;display:flex;justify-content:space-between;gap:15px}.playerInfo h3{margin:0 0 5px;font-size:16px}.playerInfo p{margin:0;color:#7e8982;font-size:10px}.close{border:1px solid #303b33;background:#0f1511;color:#fff;border-radius:999px;width:34px;height:34px;cursor:pointer}
        @media(max-width:900px){.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.liveGrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.liveGrid{grid-template-columns:1fr}.topLinks .topLink:not(.active){display:none}.shell{padding:24px 15px 80px}.hero h1{font-size:39px}.heroMain,.heroSide{padding:22px}.controls{flex-direction:column;align-items:stretch}.grid{grid-template-columns:1fr}.thumb{height:185px}}
      `}</style>

          <SiteNav />

      <div className="shell">
        <section className="hero">
          <div className="heroMain">
            <span className="eyebrow">1MUSLIM LIVE</span>
            <h1>Live Now.</h1>
            <p>The main 1Muslim channel: a continuous rotation of pro streamers, scheduled handoffs, and live community conversation. Watch publicly; sign in when you want to participate.</p>
            <div className="stats"><div className="stat"><strong>LIVE NOW</strong><span>CONTINUOUS CHANNEL</span></div><div className="stat"><strong>SCHEDULED</strong><span>NEXT UP</span></div><div className="stat"><strong>24/7</strong><span>ROTATION MODEL</span></div></div>
          </div>
          <div className="heroSide">
            <span className="liveBadge"><i className="dot" /> MAIN CHANNEL</span>
            <Link href="/streaming/go-live" className="topLink" style={{display:"inline-block",marginTop:12}}>Go Live →</Link>
            <h3>Two live destinations.</h3>
            <p>Jump into Live Now for the current broadcast, or open Scheduled Lives to see who is next and when the handoff happens.</p>
            <Link href="/streaming/scheduled" className="topLink" style={{display:"inline-block",marginTop:10}}>Scheduled Lives →</Link>
          </div>
        </section>
        <div style={{display:"flex",gap:8,margin:"20px 0 4px",flexWrap:"wrap"}}>
          <Link href="/streaming" className="chip active" style={{textDecoration:"none"}}>● Live Now</Link>
          <Link href="/streaming/scheduled" className="chip" style={{textDecoration:"none"}}>Scheduled Lives</Link>
        </div>

        <section className="liveSection">
          <div className="liveSectionHead"><div><span className="eyebrow">RECORDED LIVES</span><h2>Previous Lives</h2></div><span className="count">{recordedLives.length} available</span></div>
          {recordedLives.length ? <div className="liveGrid">{recordedLives.map((recording) => recording.stream_id ? <Link href={`/streaming/live/${recording.stream_id}`} className="liveCard" key={recording.id}><div className="liveThumb"><RecordingThumbnail compact title={recording.title} hostName={recording.host_name} date={new Date(recording.stream_started_at ?? recording.created_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})} durationSeconds={recording.duration_seconds} photoUrl={recording.host_avatar_url} gender={recording.host_gender} customThumbnailUrl={recording.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(recording.thumbnail_path).data.publicUrl : null} /><span className="liveNow" style={{background:"#172119",color:"#d6e7b8"}}>REPLAY</span></div><div className="liveCardBody"><h3>{recording.title}</h3><p>{recording.host_name} · {recording.category}<span className="liveViewer">{formatDuration(recording.duration_seconds)}</span></p>{recording.stream_ended_at&&<p style={{marginTop:6,color:"#9eaa9f"}}>Ended {new Date(recording.stream_ended_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}</p>}</div></Link> : null)}</div> : <div className="empty"><strong>No recorded Lives yet.</strong>Finished public Lives will appear here.</div>}
        </section>

        <section className="liveSection">
          <div className="liveSectionHead"><div><span className="eyebrow">LIVE NOW</span><h2>Watch Muslims who are live</h2></div><span className="count">{liveStreams.length} live</span></div>
          {liveStreams.length ? <div className="topicLiveList">
            {Array.from(new Set(liveStreams.map((stream) => stream.category || "Community"))).map((topic) => {
              const streams = liveStreams
                .filter((stream) => (stream.category || "Community") === topic)
                .sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0));
              return (
                <section className="topicLiveSection" key={topic}>
                  <div className="topicLiveHead">
                    <div>
                      <span className="eyebrow">LIVE TOPIC · MOST VIEWED FIRST</span>
                      <h3>{topic}</h3>
                      <p>Popular Lives appear first. This ranking uses the view count of the individual Live.</p>
                    </div>
                    <Link href={`/streaming/go-live?topic=${encodeURIComponent(topic)}`} className="topicGoLive">Go Live in {topic} →</Link>
                  </div>
                  <div className="liveGrid">
                    {streams.map((stream) => {
                      const end = stream.scheduled_end_at ? new Date(stream.scheduled_end_at).getTime() : 0;
                      const remaining = end - Date.now();
                      const thumbnail = stream.thumbnail_path
                        ? supabase.storage.from("live-recordings").getPublicUrl(stream.thumbnail_path).data.publicUrl
                        : stream.host_avatar_url || (stream.host_gender?.toLowerCase() === "female"
                          ? "/assets/avatars/default-female.jpg"
                          : "/assets/avatars/default-male.jpg");
                      return (
                        <Link href={`/streaming/live/${stream.id}`} className="liveCard" key={stream.id}>
                          <div className="liveThumb">
                            <img src={thumbnail} alt="" />
                            <span className="liveNow">● LIVE</span>
                            {remaining > 0 && remaining <= 120000 ? (
                              <span style={{position:"absolute",bottom:9,left:9,background:"#111c12",color:"#d8e9bd",border:"1px solid #4b5d43",borderRadius:999,padding:"5px 8px",fontSize:9,fontWeight:900}}>
                                SWITCHING IN {Math.ceil(remaining / 1000)}s
                              </span>
                            ) : null}
                          </div>
                          <div className="liveCardBody">
                            <h3>{stream.title}</h3>
                            <p>{topic}<span className="liveViewer">👥 {stream.viewer_count ?? 0} watching</span></p>
                            {remaining > 0 && remaining <= 120000 ? (
                              <p style={{color:"#b9ceaa",marginTop:6}}>Next streamer is preparing. The channel will continue.</p>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div> : <div style={{position:"relative",minHeight:390,border:"1px solid #263029",borderRadius:22,overflow:"hidden",background:"radial-gradient(circle at 50% 35%,rgba(72,103,68,.18),rgba(5,8,6,.98) 68%)"}}>
  <div style={{minHeight:390,display:"grid",placeItems:"center",textAlign:"center",padding:"80px 18px 150px"}}>
    <div>
      <div style={{fontSize:72,animation:"oneMuslimWaitingButterfly 3.2s ease-in-out infinite"}}>🦋</div>
      <span className="eyebrow">1MUSLIM LIVE</span>
      <h3 style={{fontSize:25,margin:"8px 0"}}>No Live right now</h3>
      <p style={{maxWidth:430,margin:"0 auto",color:"#7f8b83",fontSize:11,lineHeight:1.6}}>Stay here for the next broadcast. The player will hand off to the next Live as soon as a host goes live.</p>
      <Link href="/streaming/scheduled" className="topLink" style={{display:"inline-block",marginTop:15}}>See Next Scheduled Live →</Link>
    </div>
  </div>
  <ReconnectTrivia mode="waiting" eventKey={`waiting-${liveStreams.length}`} />
  <style jsx>{`@keyframes oneMuslimWaitingButterfly{0%,100%{transform:translateY(4px) rotate(-2deg)}50%{transform:translateY(-9px) rotate(2deg)}}`}</style>
</div>}
        </section>

        <div className="controls">
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos, teachers, topics..." />
        </div>
        <div className="chips">{categories.map((item) => <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div className="sectionTitle"><div><span className="eyebrow">LIBRARY</span><h2>Continue learning</h2></div><span className="count">{filtered.length} results</span>{admin && <button className="adminBtn" onClick={() => openAdminEditor()}>＋ Upload video</button>}</div>
        {filtered.length ? <div className="grid">{filtered.map((video) => <article className="card" key={video.id}><div className="thumb"><img className="videoThumbImage" src={video.thumbnail} alt="" /><span className="thumbOverlay" /><span className="duration">{video.duration}</span></div><div className="cardBody"><span className="meta">{video.category} · {video.creator}</span><h3>{video.title}</h3><p>{video.description}</p><div className="watchRow"><button className="watch" onClick={() => setSelected(video)}>▶ Watch now</button>{admin && <>{adminVideos.some(v => v.id === video.id) && <button className="editBtn" onClick={() => openAdminEditor(video)}>Edit</button>}<button className="adminBtn" onClick={() => openAdminEditor()}>Upload video</button></>}</div></div></article>)}</div> : <div className="empty"><strong>No videos found.</strong>Try another search or topic.</div>}

        <div className="sectionTitle"><div><span className="eyebrow">NEXT</span><h2>Keep exploring</h2></div></div>
        <div className="chips"><Link href="/" className="chip">Home feed</Link><Link href="/learn" className="chip">Learning paths</Link><button className="chip" onClick={() => setCategory("Qur'an")}>Qur'an</button><button className="chip" onClick={() => setCategory("Prayer")}>Prayer Academy</button></div>
      </div>

      {adminModal && <div className="adminOverlay" onClick={() => !adminSaving && setAdminModal(false)}><div className="adminModal" onClick={e => e.stopPropagation()}><span className="eyebrow">{editingVideo ? "ADMIN EDITOR" : "ADMIN VIDEO LIBRARY"}</span><h2>{editingVideo ? "Edit video" : "Upload a 1Muslim video"}</h2><p>Only elmiandco@gmail.com can publish and edit these library videos.</p><div className="adminForm"><label>Title<input value={adminTitle} onChange={e=>setAdminTitle(e.target.value)} maxLength={180} /></label><label>Caption / description<textarea value={adminDescription} onChange={e=>setAdminDescription(e.target.value)} maxLength={1000} /></label><label>Topic<select value={adminCategory} onChange={e=>setAdminCategory(e.target.value)}>{categories.filter(x=>x!=="All").map(x=><option key={x}>{x}</option>)}</select></label>{!editingVideo && <label>Video file<input type="file" accept="video/*" onChange={e=>setAdminFile(e.target.files?.[0] ?? null)} /><span className="adminHint">Choose the video you want in the official 1Muslim library.</span></label>}{adminMessage&&<div className="adminMessage">{adminMessage}</div>}</div><div className="adminActions"><button onClick={()=>setAdminModal(false)} disabled={adminSaving}>Cancel</button><button className="save" onClick={()=>void saveAdminVideo()} disabled={adminSaving}>{adminSaving ? "Saving…" : editingVideo ? "Save changes" : "Publish video"}</button></div></div></div>}

      {selected && <div className="playerOverlay" onClick={() => setSelected(null)}><div className="player" onClick={(e) => e.stopPropagation()}><video src={selected.src} controls autoPlay playsInline /><div className="playerInfo"><div><h3>{selected.title}</h3><p>{selected.creator} · {selected.category} · {selected.duration}</p></div><button className="close" onClick={() => setSelected(null)} aria-label="Close player">×</button></div></div></div>}
    </main>
  );
}


function formatDuration(seconds: number | null | undefined) { const total=Math.max(0,Math.round(Number(seconds)||0)); return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`; }
function readVideoDuration(file: File): Promise<number> { return new Promise(resolve => { const url=URL.createObjectURL(file); const video=document.createElement("video"); video.preload="metadata"; video.onloadedmetadata=()=>{const d=Number.isFinite(video.duration)?video.duration:0; URL.revokeObjectURL(url); resolve(d)}; video.onerror=()=>{URL.revokeObjectURL(url);resolve(0)}; video.src=url; }); }
