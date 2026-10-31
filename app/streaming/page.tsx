"use client";

import SiteNav from "../components/SiteNav";
import ReplayThumbnail from "./ReplayThumbnail";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useLiveDiscovery } from "../../lib/live-discovery-client";
import ReconnectTrivia from "../components/ReconnectTrivia";
import LiveKitViewer from "../../components/LiveKitViewer";

type LiveStream = { id: string; title: string; category: string; room_name: string; viewer_count: number; started_at: string; scheduled_end_at: string | null; thumbnail_path: string | null; aspect_ratio: "9:16" | "1:1" | "16:9"; host_id: string; host_gender: string | null; host_avatar_url: string | null };

type HubReplay = { id: string; title: string; category: string; durationSeconds: number; recordedAt: string; mediaType: "audio" | "video"; href: string; previewUrl?: string|null };
type HubSchedule = { id: string; title: string; category: string; startsAt: string; endsAt: string; hostReady: boolean; href: string };
type HubSnapshot = { currentLives: Array<{id:string}>; audioRooms: Array<{id:string}>; gameStreams: Array<{id:string}>; pastLives: HubReplay[]; scheduledLives: HubSchedule[] };
const ALL_STREAMS_SCROLL_KEY = "1muslim:all-streams:scroll";

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
  const discovery = useLiveDiscovery();
  const [category, setCategory] = useState("All");
  const [hub, setHub] = useState<HubSnapshot | null>(null);
  const [hubLoaded, setHubLoaded] = useState(false);
  const [hubError, setHubError] = useState(false);
  const [hubRefresh, setHubRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [activeLiveIndex,setActiveLiveIndex]=useState(0);
  const liveTouchStart=useRef<{x:number;y:number}|null>(null);
  const rankedLives=useMemo(()=>[...liveStreams].sort((a,b)=>(b.viewer_count||0)-(a.viewer_count||0)),[liveStreams]);
  const currentLive=rankedLives[Math.min(activeLiveIndex,Math.max(0,rankedLives.length-1))];
  const playingLiveRef=useRef<LiveStream|null>(null);
  useEffect(()=>{playingLiveRef.current=currentLive??null},[currentLive]);
  const stepLive=(direction:number)=>setActiveLiveIndex(index=>rankedLives.length?(index+direction+rankedLives.length)%rankedLives.length:0);
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
    let active = true;
    const rows = discovery.lives as Omit<LiveStream,"host_gender"|"host_avatar_url">[];
    const hostIds = Array.from(new Set(rows.map(row => row.host_id).filter(Boolean)));
    const loadProfiles = async () => {
      let profileMap:Record<string,{gender:string|null;avatar_url:string|null}>={};
      if (hostIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,gender,avatar_url").in("id",hostIds);
        profileMap = Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile]));
      }
      if (!active) return;
      const next = rows.map(row => ({
        ...row,
        host_gender: profileMap[row.host_id]?.gender ?? null,
        host_avatar_url: profileMap[row.host_id]?.avatar_url ?? null
      }));
      const selected = playingLiveRef.current;
      if (selected && discovery.presence[selected.id]?.state === "RECONNECTING" && !next.some(row=>row.id===selected.id)) {
        next.push(selected);
      }
      setLiveStreams(next);
      const ranked = [...next].sort((a,b)=>(b.viewer_count||0)-(a.viewer_count||0));
      setActiveLiveIndex(current => {
        const index = selected ? ranked.findIndex(row=>row.id===selected.id) : -1;
        return index>=0 ? index : Math.min(current,Math.max(0,ranked.length-1));
      });
    };
    void loadProfiles();
    return () => { active = false; };
  }, [supabase, discovery.lives, discovery.presence]);

  // Read the server-verified All Streams hub only on mount, presence changes,
  // or return to the tab. No fixed short-interval DB polling.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/live-hub", { signal: controller.signal });
        if (!response.ok) throw new Error("All Streams snapshot unavailable");
        const data = await response.json() as HubSnapshot;
        if (controller.signal.aborted) return;
        setHub(data);
        setHubError(false);
      } catch {
        if (!controller.signal.aborted) setHubError(true);
      } finally {
        if (!controller.signal.aborted) setHubLoaded(true);
      }
    }, 150);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [discovery.lives, discovery.presence, hubRefresh]);

  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible") setHubRefresh(value => value + 1);
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  // Restore the precise All Streams position after exiting the full-screen
  // viewer; wait for the asynchronous sections to be rendered first.
  useEffect(() => {
    if (!hubLoaded) return;
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(ALL_STREAMS_SCROLL_KEY); } catch { /* unavailable */ }
    if (!saved) return;
    const offset = Number(saved);
    if (!Number.isFinite(offset) || offset < 0) return;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: offset, behavior: "instant" });
      try { sessionStorage.removeItem(ALL_STREAMS_SCROLL_KEY); } catch { /* unavailable */ }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [hubLoaded]);

  const rememberHubPosition = () => {
    try { sessionStorage.setItem(ALL_STREAMS_SCROLL_KEY, String(window.scrollY)); } catch { /* unavailable */ }
  };
  const audioRooms = liveStreams.filter(stream => discovery.presence[stream.id]?.state === "READY_AUDIO");
  const gameStreams = liveStreams.filter(stream => /(?:^|[\\s/_,-])(?:games?|gaming|gameplay|e-?sports?)(?:$|[\\s/_,-])/i.test(stream.category || ""));
  const renderHubLiveCard = (stream: LiveStream, label: string) => (
    <Link key={stream.id} href={`/streaming/live/${stream.id}`} onClick={rememberHubPosition} className="liveCard">
      <div className="liveThumb">
        <img src={stream.thumbnail_path ? supabase.storage.from("live-recordings").getPublicUrl(stream.thumbnail_path).data.publicUrl : stream.host_avatar_url || "/assets/avatars/default-male.jpg"} alt="" />
        <span className="liveNow">{label}</span>
      </div>
      <div className="liveCardBody"><h3>{stream.title}</h3><p>{stream.category || "Community"}<span className="liveViewer">👥 {stream.viewer_count || 0}</span></p></div>
    </Link>
  );

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
      <style jsx>{`@keyframes oneMuslimWaitingButterfly{0%,100%{transform:translateY(4px) rotate(-2deg)}50%{transform:translateY(-9px) rotate(2deg)}}

        .streamingPage{min-height:100vh;background:var(--bg);color:var(--text)}.topicLiveList{display:grid;gap:22px}.topicLiveSection{border:1px solid #1b241f;border-radius:20px;background:linear-gradient(145deg,#0d130f,#080d09);padding:15px}.topicLiveHead{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 13px}.topicLiveHead h3{font-size:18px;margin:5px 0 3px;letter-spacing:-.035em}.topicLiveHead p{font-size:10px;color:#748078;margin:0}.topicGoLive{white-space:nowrap;text-decoration:none;border:1px solid #354238;border-radius:999px;padding:9px 12px;color:#d6e7b8;background:#101811;font-size:10px;font-weight:800}.topicGoLive:hover{background:#182219;border-color:#61785a}@media(max-width:620px){.topicLiveHead{align-items:flex-start;flex-direction:column}.topicGoLive{width:100%;text-align:center}}
        .streamTop{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:16px max(22px,calc((100vw - 1180px)/2));border-bottom:1px solid #1b241f;background:rgba(5,8,6,.9);backdrop-filter:blur(18px)}
        .brand{display:flex;align-items:center;gap:10px;font-weight:850;letter-spacing:-.04em}
        .mark{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;border:1px solid #354237;background:#101811;color:#d6e7b8}
        .back{color:#9aa69e;text-decoration:none;font-size:13px}.back:hover{color:#fff}
        .topLinks{display:flex;gap:9px;align-items:center}.topLink{padding:9px 13px;border:1px solid #263029;border-radius:999px;color:#aeb8b1;text-decoration:none;font-size:12px}.topLink.active{background:#d6e7b8;color:#071008;border-color:#d6e7b8;font-weight:800}
        .shell{max-width:1180px;margin:auto;padding:38px 22px 80px}
        .hero{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;align-items:stretch}
        .heroMain,.heroSide{border:1px solid #1b241f;border-radius:24px;background:linear-gradient(145deg,#101712,#080d09);padding:30px;overflow:hidden}
        .heroMain{position:relative;min-height:285px}.mainLivePlayer{margin-top:22px;border:1px solid #29352d;border-radius:18px;overflow:hidden;background:#050805}.mainLivePlayerHead{padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.mainLivePlayerHead h3{margin:7px 0 3px;font-size:17px}.mainLivePlayerHead p{margin:0;font-size:10px;color:#7e8982}.heroMain:after{content:"";position:absolute;width:330px;height:330px;border-radius:50%;right:-110px;top:-150px;background:radial-gradient(circle,rgba(145,180,125,.18),transparent 68%);pointer-events:none}
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

        /* Live Orbit — 1Muslim homepage-inspired cinematic glass system */
        .shell{padding-bottom:calc(180px + env(safe-area-inset-bottom))!important}.liveOrbit{position:relative;border:1px solid #d7b87975;border-radius:34px;padding:clamp(14px,3vw,28px);background:linear-gradient(140deg,#0b342cde,#061c18f2 60%,#153d32dd);box-shadow:0 16px 65px #0009,inset 0 1px #e5d7a33d;overflow:hidden}.liveOrbit:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 90% 0%,#b49a5c20,transparent 50%);pointer-events:none}.liveOrbitHeading{position:relative;display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.liveOrbitHeading h1{font-size:clamp(26px,5vw,44px);letter-spacing:-.05em;margin:3px 0}.liveOrbitPeriod{color:#e5cb88}.orbitGoLive{border:1px solid #ef96966b;border-radius:999px;background:linear-gradient(130deg,#812f3c,#451b2a);box-shadow:0 4px 18px #e4525530;color:#fff0e6;padding:11px 15px;white-space:nowrap;text-decoration:none;font-weight:700;font-size:13px}.liveOrbitStage{position:relative;border:1px solid #e2c98768;border-radius:26px;overflow:hidden;background:radial-gradient(ellipse at center,#154137,#06140f 75%);box-shadow:0 12px 40px #0009;touch-action:pan-y}.liveOrbitActive{animation:orbitArrival .4s ease-out}.orbitPlayerMeta{display:flex;align-items:center;gap:12px;padding:11px 15px;color:#e7e8dc;font-size:12px}.orbitLiveBadge{border-radius:99px;background:#9c3445;color:white;padding:5px 9px;font-weight:800;letter-spacing:.1em}.orbitCount{margin-left:auto;color:#d4c392}.orbitVideo{min-height:230px;aspect-ratio:9/16;display:grid;place-items:center;overflow:hidden;background:#03120f}.orbitVideo>div{width:100%;height:100%}.orbitVideo video{width:100%!important;height:100%!important;object-fit:contain!important}.orbitPlayerMeta{background:rgba(2,12,9,.65);backdrop-filter:blur(8px)}.orbitPlayerFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px}.orbitPlayerFoot>div{display:grid;gap:4px;min-width:0}.orbitPlayerFoot strong{font-size:17px}.orbitPlayerFoot small{color:#b7c3b7}.orbitPlayerFoot a{font-size:12px;color:#f3ddac;text-decoration:none;white-space:nowrap}.liveOrbitStandby{min-height:clamp(270px,42vw,420px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:10px}.orbitStandbyIcon{font-size:52px;color:#e3cb8b;text-shadow:0 0 35px #edc778aa;animation:orbitFloat 5s ease-in-out infinite}.liveOrbitStandby small{letter-spacing:.2em;color:#b8c6af}.liveOrbitStandby h2{font-size:clamp(23px,4vw,38px);margin:0}.liveOrbitStandby p{color:#a6b6ab;margin:0}.liveOrbitStandby>div{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:13px}.liveOrbitStandby a{border:1px solid #d8c18b70;border-radius:99px;padding:10px 16px;color:#f6e6c4;text-decoration:none;background:#18403499}.orbitNavigation{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:13px}.orbitNavigation>button{width:40px;height:40px;border-radius:50%;border:1px solid #e1ca8a66;background:#1a4939bb;color:#f4dfb2;font-size:28px;cursor:pointer}.orbitNavigation>button:disabled{opacity:.25}.orbitDots{display:flex;align-items:center;justify-content:center;gap:7px;min-height:30px;color:#c7c9b5;font-size:12px}.orbitDots button{width:7px;height:7px;padding:0;border:0;border-radius:99px;background:#c7c9b566}.orbitDots button.active{width:24px;background:#e6d095}.orbitShortcuts{display:flex;gap:8px;overflow-x:auto;padding:12px 0 2px;scrollbar-width:none}.orbitShortcuts a{flex:0 0 auto;text-decoration:none;color:#e8dfc2;border:1px solid #e4ce8c55;border-radius:14px;background:#ffffff0b;padding:11px 15px;font-size:12px}.liveSection{margin-top:25px}.liveSection .empty{padding:18px!important}.liveSectionHead h2{font-size:clamp(21px,3.4vw,29px)!important}@keyframes orbitArrival{from{opacity:.4;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}@keyframes orbitFloat{50%{transform:translateY(-9px)}}@media(max-width:620px){.shell{padding:15px 12px calc(175px + env(safe-area-inset-bottom))!important}.liveOrbit{padding:12px;border-radius:25px}.liveOrbitStage{border-radius:19px;touch-action:pan-x}.orbitVideo{min-height:calc(100dvh - 225px);max-height:calc(100dvh - 180px);aspect-ratio:9/16}.orbitPlayerFoot{align-items:flex-start;flex-direction:column}.orbitShortcuts a{padding:9px 12px}}@media(prefers-reduced-motion:reduce){.liveOrbitActive,.orbitStandbyIcon{animation:none}}
      `}</style>

          <style>{`
          /* Streaming only: keep navigation icons in a clean, non-overlapping row. */
          @media(max-width:767px){
            .streamingPage .siteNav{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;min-width:0!important;padding-inline:12px!important;box-sizing:border-box!important;background:rgba(3,22,18,.94)!important;backdrop-filter:blur(18px)!important}
            .streamingPage .siteNav .mobileLibraryShortcut{position:static!important;flex:0 0 auto!important;max-width:105px!important;white-space:nowrap!important}
            .streamingPage .siteNav .siteBrand{flex:0 0 48px!important}
            .streamingPage .siteNav .siteMenuButton{flex:0 0 44px!important}
            .streamingPage .shell{padding-top:12px}
          }
          `}</style>
          <SiteNav />

      <div className="shell">
        <section className="liveOrbit" aria-label="Swipeable live broadcasts">
          <div className="liveOrbitHeading"><div><span className="eyebrow">1MUSLIM · LIVE ORBIT</span><h1>All Streams<span className="liveOrbitPeriod">.</span></h1></div><Link href="/streaming/go-live" className="orbitGoLive">● Go Live ↗</Link></div>
          <div className="liveOrbitStage" onTouchStart={e=>{liveTouchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=liveTouchStart.current;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.2)stepLive(dy<0?1:-1);liveTouchStart.current=null}}>
            {currentLive?<div className="liveOrbitActive" key={currentLive.id}>
              <div className="orbitPlayerMeta"><span className="orbitLiveBadge">● LIVE</span><span>◉ {currentLive.viewer_count||0} watching</span><span className="orbitCount">{activeLiveIndex+1} / {rankedLives.length}</span></div>
              <div className="orbitVideo"><LiveKitViewer key={currentLive.id} roomName={currentLive.room_name} streamId={currentLive.id} embedded /></div>
              <div className="orbitPlayerFoot"><div><strong>{currentLive.title}</strong><small>{currentLive.category||"Community"} · Live now</small></div><Link href={"/streaming/live/"+currentLive.id} onClick={rememberHubPosition}>Join conversation ↗</Link></div>
            </div>:<div className="liveOrbitStandby"><span className="orbitStandbyIcon" aria-hidden="true">✦</span><small>1MUSLIM LIVE · STANDBY</small><h2>We'll be live soon.</h2><p>Discover upcoming broadcasts or start a gathering.</p><div><Link href="/streaming/scheduled">See upcoming Lives ↗</Link><Link href="/streaming/go-live">Go Live ●</Link></div></div>}
          </div>
          <div className="orbitNavigation"><button type="button" onClick={()=>stepLive(-1)} disabled={rankedLives.length<2} aria-label="Previous live">‹</button><div className="orbitDots">{rankedLives.length>1?rankedLives.map((stream,index)=><button type="button" key={stream.id} className={index===activeLiveIndex?"active":""} onClick={()=>setActiveLiveIndex(index)} aria-label={"Watch live "+(index+1)} aria-current={index===activeLiveIndex?"true":undefined}/>):<span>{rankedLives.length?"You're watching the only live stream":"No streams currently live"}</span>}</div><button type="button" onClick={()=>stepLive(1)} disabled={rankedLives.length<2} aria-label="Next live">›</button></div>
          <div className="orbitShortcuts"><Link href="/streaming/scheduled">◷ Up Next</Link><Link href="/streaming/library">▣ Library</Link><Link href="/videos">▶ Videos</Link><Link href="/streaming/go-live">＋ Create Live</Link></div>
        </section>
        <nav className="chips" aria-label="All Streams sections" style={{margin:"20px 0 8px",paddingBottom:5}}>
          <a className="chip active" href="#live-now" style={{textDecoration:"none"}}>● Live Now</a>
          <a className="chip" href="#audio-rooms" style={{textDecoration:"none"}}>🎙 Audio Rooms</a>
          <a className="chip" href="#game-streams" style={{textDecoration:"none"}}>🎮 Games</a>
          <a className="chip" href="#scheduled-lives" style={{textDecoration:"none"}}>◷ Scheduled</a>
          <a className="chip" href="#past-lives" style={{textDecoration:"none"}}>▶ Past Lives</a>
        </nav>
        {hubError && <p role="status" style={{color:"#e8c89c",fontSize:11}}>Some All Streams sections are temporarily unavailable. Live discovery remains active.</p>}



        <section className="liveSection" id="live-now">
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
                        <Link href={`/streaming/live/${stream.id}`} onClick={rememberHubPosition} className="liveCard" key={stream.id}>
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
</div>}
        </section>

        <section className="liveSection" id="audio-rooms">
          <div className="liveSectionHead"><div><span className="eyebrow">VOICE BROADCASTS</span><h2>Audio Rooms</h2></div><span className="count">{audioRooms.length} live</span></div>
          {audioRooms.length ? <div className="liveGrid">{audioRooms.map(stream => renderHubLiveCard(stream, "● AUDIO LIVE"))}</div> : <div className="empty"><strong>No Audio Rooms live right now.</strong>Voice-only broadcasts will appear when a host is connected.</div>}
        </section>

        <section className="liveSection" id="game-streams">
          <div className="liveSectionHead"><div><span className="eyebrow">LIVE GAMEPLAY</span><h2>Games</h2></div><span className="count">{gameStreams.length} live</span></div>
          {gameStreams.length ? <div className="liveGrid">{gameStreams.map(stream => renderHubLiveCard(stream, "● GAME LIVE"))}</div> : <div className="empty"><strong>No Games streams live right now.</strong>Only verified gameplay broadcasts appear here.</div>}
        </section>

        <section className="liveSection" id="scheduled-lives">
          <div className="liveSectionHead"><div><span className="eyebrow">UP NEXT</span><h2>Scheduled Lives</h2></div><Link className="topicGoLive" href="/streaming/go-live?schedule=1">＋ Schedule Live</Link></div>
          {hub?.scheduledLives.length ? <div className="liveGrid">{hub.scheduledLives.map(slot => (
            <Link key={slot.id} href={slot.href} onClick={rememberHubPosition} className="liveCard">
              <div className="liveThumb"><span className="liveThumbMark">◷</span><span className="liveNow">{slot.hostReady ? "HOST READY" : "UPCOMING"}</span></div>
              <div className="liveCardBody"><h3>{slot.title}</h3><p>{slot.category} · {new Date(slot.startsAt).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}</p></div>
            </Link>
          ))}</div> : <div className="empty"><strong>No scheduled Lives to show.</strong><Link href="/streaming/scheduled" className="topLink">Browse upcoming broadcasts →</Link></div>}
        </section>

        <section className="liveSection" id="past-lives">
          <div className="liveSectionHead"><div><span className="eyebrow">PUBLIC LIVE ARCHIVE</span><h2>Past Lives</h2></div><span className="count">{hub?.pastLives.length ?? 0} replays</span></div>
          {hub?.pastLives.length ? <div className="liveGrid">{hub.pastLives.map(recording => (
            <Link href={recording.href} onClick={rememberHubPosition} className="liveCard" key={recording.id}>
              <ReplayThumbnail src={recording.previewUrl||undefined} duration={recording.durationSeconds} audio={recording.mediaType==="audio"}/>
              <div className="liveCardBody"><h3>{recording.title}</h3><p>{recording.category} · {new Date(recording.recordedAt).toLocaleDateString()}<span className="liveViewer">{formatDuration(recording.durationSeconds)}</span></p></div>
            </Link>
          ))}</div> : <div className="empty"><strong>No public replays available.</strong>Completed recordings will appear after successful upload.</div>}
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
