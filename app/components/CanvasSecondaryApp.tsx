"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import HomeMessagesChooser from "./HomeMessagesChooser";
import ProfileAvatar from "./ProfileAvatar";
import PublicBadgeSelector from "./PublicBadgeSelector";
import ElmTentAlphabet from "./ElmTentAlphabet";
import PostDesignStudio from "./PostDesignStudio";
import "./canvas-ummah-feed.css";

type Profile={display_name?:string|null;username?:string|null;xp_total?:number|null;bio?:string|null;shahada_verified_at?:string|null;id?:string;gender?:string|null;avatar_gender?:string|null;avatar_package?:string|null;avatar_config?:Record<string,unknown>|null;profile_accent?:string|null};
type DailyPost={id:string;content?:string|null;body?:string|null;text?:string|null;created_at?:string|null};
const destinations=["/profile","/recording-studio/shahadah","/community","/messages","/elm-tent","/community"];
const titles=["My Profile","Record Studio","Daily Posts · Ummah","Messenger","Elm Tent 🏕️","Community"];

function ProfileApp({active}:{active:boolean}){
 const [profile,setProfile]=useState<Profile|null>(null);const [earnedBadges,setEarnedBadges]=useState<string[]>([]);const [status,setStatus]=useState("Loading your profile…");const [editingAvatar,setEditingAvatar]=useState(false);const [savingAvatar,setSavingAvatar]=useState(false);const [selectedAvatar,setSelectedAvatar]=useState<string|null>(null);const [editNotice,setEditNotice]=useState("");const [tab,setTab]=useState<"avatar"|"background"|"badges">("avatar");const [bioDraft,setBioDraft]=useState("");const [savingBio,setSavingBio]=useState(false);const [slide,setSlide]=useState<"profile"|"ranks"|"settings">("profile");const [rankCountry,setRankCountry]=useState("All");const [rankGender,setRankGender]=useState("All");const [rankings,setRankings]=useState<Array<{id:string;display_name:string|null;username:string|null;xp_total:number|null;country:string|null;gender:string|null}>>([]);const [rankStatus,setRankStatus]=useState("Select Ranks to load the leaderboard.");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();(async()=>{
  const {data:{user}}=await db.auth.getUser();if(!alive)return;
  if(!user){setStatus("Sign in to see your profile.");return}
  const {data,error}=await db.from("profiles").select("id,display_name,username,xp_total,bio,shahada_verified_at,gender,avatar_gender,avatar_package,avatar_config,profile_accent").eq("id",user.id).maybeSingle();
  if(!alive)return;if(error){setStatus("Profile is unavailable right now.");return}
  setProfile(data);setBioDraft((data?.bio||"").slice(0,25));setStatus(data?"":"Complete your profile to begin.");const badges=await db.from("member_badges").select("badge_key").eq("user_id",user.id);if(alive)setEarnedBadges((badges.data??[]).map(row=>row.badge_key));
 })();return()=>{alive=false}},[active]);
 const chooseAvatar=async(url:string)=>{
  if(!profile?.id||savingAvatar)return;
  const silver=url.includes("silver-avatar");
  if(silver&&(profile.xp_total??0)<5000){setEditNotice("Silver unlocks at 5,000 XP.");return;}
  setSavingAvatar(true);setEditNotice("");
  const db=createClient();const {data:{user}}=await db.auth.getUser();
  if(!user||user.id!==profile.id){setEditNotice("Sign in to customize your profile.");setSavingAvatar(false);return;}
  const config={...(profile.avatar_config??{}),selectedAvatarUrl:url};
  const {error}=await db.from("profiles").update({avatar_config:config}).eq("id",user.id);
  if(error)setEditNotice(error.message);else{setProfile(p=>p?{...p,avatar_config:config}:p);setEditNotice("✓ Avatar saved");setSelectedAvatar(null);try{const audio=new Audio("/audio/hudhud-welcome.mp3");audio.volume=.65;void audio.play().catch(()=>{});}catch{}}
  setSavingAvatar(false);
 };
 const avatars=[{name:"Classic",url:"/assets/avatars/default-male.jpg",xp:0},{name:"Classic 2",url:"/assets/avatars/Default-women.png",xp:0},{name:"Silver",url:"/assets/avatars/silver-avatar-male.jpg",xp:5000},{name:"Silver 2",url:"/assets/avatars/silver-avatar-female.jpg",xp:5000}];
 useEffect(()=>{if(!active||slide!=="ranks")return;let alive=true;const db=createClient();setRankStatus("Loading rankings…");(async()=>{const {data,error}=await db.from("profiles").select("id,display_name,username,xp_total,country,gender").order("xp_total",{ascending:false}).limit(100);if(!alive)return;if(error){setRankStatus("Rankings unavailable.");return;}setRankings(data||[]);setRankStatus(data?.length?"":"No ranked members yet.");})();return()=>{alive=false}},[active,slide]);
 const countries=[...new Set(rankings.map(p=>p.country?.trim()).filter((v):v is string=>!!v))].sort();
 const filteredRanks=rankings.filter(p=>(rankCountry==="All"||p.country===rankCountry)&&(rankGender==="All"||p.gender?.toLowerCase()===rankGender.toLowerCase()));
 const panelStyle={background:"rgba(5,35,32,.52)",border:"1px solid rgba(215,180,98,.28)",borderRadius:16,padding:12};
  const saveBio=async()=>{if(!profile?.id||savingBio)return;setSavingBio(true);setEditNotice("");const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user||user.id!==profile.id){setEditNotice("Sign in to save your bio.");setSavingBio(false);return;}const bio=bioDraft.trim().slice(0,25);const {error}=await db.from("profiles").update({bio}).eq("id",user.id);if(error)setEditNotice("Could not save bio.");else{setProfile(p=>p?{...p,bio}:p);setEditNotice("✓ Bio saved");}setSavingBio(false);};
 return <div className="canvas-native-profile" style={{background:"linear-gradient(145deg,rgba(5,57,45,.76),rgba(5,26,25,.55))",border:"1px solid rgba(215,180,98,.4)",borderRadius:22,padding:"18px 14px",backdropFilter:"blur(18px)"}}><nav aria-label="Profile slides" style={{display:"flex",gap:5,justifyContent:"center",marginBottom:12}}>{(["profile","ranks","settings"] as const).map(item=><button key={item} type="button" onClick={()=>setSlide(item)} aria-current={slide===item?"page":undefined} style={{flex:1,maxWidth:120,padding:"8px 4px",border:"none",borderBottom:slide===item?"2px solid #e6c77e":"1px solid rgba(230,199,126,.2)",background:"transparent",color:slide===item?"#f8e9bd":"#c3d4cc",fontSize:12,fontWeight:600,textTransform:"capitalize"}}>{item}</button>)}</nav>{slide==="ranks"?<section aria-label="XP leaderboard" style={panelStyle}><h3 style={{margin:"0 0 8px"}}>✦ Community Ranks</h3><p style={{fontSize:12,opacity:.8}}>Top 100 XP profiles · filters</p><div style={{display:"flex",gap:8,marginBottom:12}}><select aria-label="Filter country" value={rankCountry} onChange={e=>setRankCountry(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option>{countries.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Filter gender" value={rankGender} onChange={e=>setRankGender(e.target.value)} style={{flex:1,minWidth:0,background:"#123c33",color:"#fff",borderRadius:9,padding:8,border:"1px solid #628575"}}><option>All</option><option value="male">Male</option><option value="female">Female</option></select></div><div style={{maxHeight:350,overflowY:"auto",display:"grid",gap:6}}>{filteredRanks.length?filteredRanks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:"rgba(255,255,255,.045)",borderRadius:12}}><strong style={{minWidth:27,color:"#e6c77e"}}>#{rankings.indexOf(p)+1}</strong><span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.display_name||p.username||"Member"}</span><strong style={{fontSize:12}}>{(p.xp_total||0).toLocaleString()} XP</strong></div>):<p role="status">{rankings.length?"No matching profiles.":rankStatus}</p>}</div></section>:slide==="settings"?<section aria-label="Profile settings" style={{display:"grid",gap:10,textAlign:"left"}}>{[{title:"Account & identity",items:[["Edit profile","/profile"],["Avatar & background","/profile#avatar"],["Account connections","/profile#connections"]]},{title:"Privacy & safety",items:[["Privacy and account controls","/profile"],["Safety and reporting","/profile"]]},{title:"Notifications & preferences",items:[["Notification preferences","/profile"],["Display preferences","/profile"]]},{title:"Community",items:[["Badges & rewards","/profile#badges"],["Social connections","/profile#connections"]]}].map(group=><div key={group.title} style={panelStyle}><h4 style={{margin:"0 0 5px",color:"#e6c77e",fontSize:12}}>{group.title}</h4>{group.items.map(([label,href])=><Link key={label} href={href} style={{display:"flex",justifyContent:"space-between",padding:"9px 2px",borderBottom:"1px solid rgba(255,255,255,.08)",fontSize:13}}>{label}<span aria-hidden="true">›</span></Link>)}</div>)}</section>:profile?<><div className="canvas-native-avatar" aria-label="Your selected avatar"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/></div><h3 style={{margin:"8px 0 3px"}}>{profile.display_name||profile.username||"Member"}</h3><strong style={{color:"#e6c77e"}}>✦ {(profile.xp_total||0).toLocaleString()} XP</strong><form onSubmit={e=>{e.preventDefault();void saveBio()}} style={{display:"flex",alignItems:"center",gap:6,margin:"12px auto",maxWidth:310,borderBottom:"1px solid rgba(226,203,145,.45)",background:"rgba(255,255,255,.045)",borderRadius:10,padding:"5px 8px"}}><input aria-label="Your bio, maximum 25 characters" maxLength={25} value={bioDraft} onChange={e=>setBioDraft(e.target.value)} placeholder="Add a short bio…" style={{flex:1,minWidth:0,color:"#f6f2e6",background:"transparent",border:0,outline:"none",font:"inherit"}}/><button type="submit" disabled={savingBio||bioDraft.trim()===(profile.bio||"")} aria-label="Save bio" style={{background:"transparent",border:0,color:"#e6c77e",cursor:"pointer",fontSize:20}}>➜</button></form><div role="tablist" aria-label="Profile customization" style={{display:"flex",gap:6,justifyContent:"center",margin:"12px 0"}}>{(["avatar","background","badges"] as const).map(t=><button key={t} type="button" role="tab" aria-selected={tab===t} onClick={()=>setTab(t)} style={{border:"1px solid rgba(215,180,98,.5)",borderRadius:20,padding:"8px 12px",background:tab===t?"rgba(206,169,86,.24)":"rgba(5,45,38,.4)",color:"#f7e7bb",cursor:"pointer",textTransform:"capitalize"}}>{t}</button>)}</div>{tab==="avatar"&&<div role="tabpanel"><div style={{display:"flex",justifyContent:"center",gap:9,flexWrap:"wrap"}}>{avatars.map(a=><button key={a.url} type="button" disabled={savingAvatar||(profile.xp_total??0)<a.xp} onClick={()=>{if(selectedAvatar===a.url){void chooseAvatar(a.url)}else{setSelectedAvatar(a.url);setEditNotice("Tap again to save this avatar");}}} aria-pressed={selectedAvatar===a.url} style={{border:selectedAvatar===a.url?"2px solid #f5d47a":"1px solid #c9ad6c",borderRadius:14,padding:7,background:"rgba(8,62,53,.7)",color:"#f6e9c8",display:"grid",gap:5,justifyItems:"center",opacity:(profile.xp_total??0)<a.xp?.5:1}}><img src={a.url} alt={a.name} style={{width:62,height:62,objectFit:"cover",borderRadius:12}}/><small>{a.name}{(profile.xp_total??0)<a.xp?" · 5k XP":""}</small></button>)}</div><Link href="/profile#avatar">More avatar styles ↗</Link></div>}{tab==="background"&&<div role="tabpanel"><p style={{color:"#e6d8b5"}}>Customize your profile background</p><Link href="/profile#background">Open background gallery ↗</Link></div>}{tab==="badges"&&<div role="tabpanel" className="canvas-profile-badges"><div className="canvas-profile-badge-grid">{([{key:"shahada",name:"Shahadah Certified",image:"/assets/badges/shahada-badge.png"},{key:"dua",name:"Dua Badge",image:"/assets/badges/dua-badge.PNG"},{key:"tiktok",name:"TikTok Connected",image:"/assets/badges/1Muslim-TikTok-badge.PNG"}] as const).map(b=>{const earned=earnedBadges.includes(b.key)||(b.key==="shahada"&&Boolean(profile.shahada_verified_at));return <div key={b.key} className={"canvas-profile-badge"+(earned?" is-earned":" is-locked")}><img src={b.image} alt="" loading="lazy"/><span>{b.name}</span><small>{earned?"Earned":"Not earned"}</small></div>})}</div>{profile.id&&<PublicBadgeSelector userId={profile.id} verifiedAt={profile.shahada_verified_at??null}/>}</div>}{editNotice&&<small role="status">{editNotice}</small>}</>:<p role="status">{status}</p>}</div>
}
function RecorderApp({active}:{active:boolean}){
 const [recording,setRecording]=useState(false);const [clip,setClip]=useState<string|null>(null);const [error,setError]=useState("");const recorder=useRef<MediaRecorder|null>(null);const stream=useRef<MediaStream|null>(null);const chunks=useRef<Blob[]>([]);
 useEffect(()=>()=>{if(recorder.current?.state==="recording")recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 const toggle=async()=>{
  if(recording){recorder.current?.stop();setRecording(false);return}
  if(!active)return;
  try{setError("");if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw Error("Recording is not supported in this browser.");
   stream.current=await navigator.mediaDevices.getUserMedia({audio:true});chunks.current=[];
   const r=new MediaRecorder(stream.current);recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
   r.onstop=()=>{setClip(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(new Blob(chunks.current,{type:r.mimeType||"audio/webm"}))});stream.current?.getTracks().forEach(t=>t.stop());stream.current=null};
   r.start();setRecording(true);
  }catch(e){setError(e instanceof Error?e.message:"Microphone unavailable.")}
 };
 return <div className="canvas-native-recorder"><div className={"canvas-recorder-ring"+(recording?" is-recording":"")}>♫</div><p>{recording?"Recording your voice…":"Record an audio message or reflection."}</p><button type="button" onClick={()=>void toggle()}>{recording?"■ Stop recording":"● Start recording"}</button>{clip&&<><audio controls src={clip}/><a href={clip} download="1muslim-recording.webm">Save recording to device ↓</a></>}{error&&<p role="alert">{error}</p>}<small>Recordings stay on this device until you choose to save them.</small></div>
}
type UmmahPost={id:string;body:string;created_at:string;author_name:string;author_handle:string;author_id?:string;avatar_url?:string|null};
const postThemes=["emerald","gold","makkah","midnight","garden","purple"] as const;
const backgroundForPost=(id:string)=>{let hash=2166136261;for(let i=0;i<id.length;i++)hash=Math.imul(hash^id.charCodeAt(i),16777619);return `/post-backgrounds/${postThemes[(hash>>>0)%postThemes.length]}.svg`};
type UmmahComment={id:string;post_id:string;name:string;body:string;created_at:string};
function DailyPostsApp({active}:{active:boolean}){
 const [posts,setPosts]=useState<UmmahPost[]>([]);
 const [status,setStatus]=useState("Loading Ummah posts…");
 const [selected,setSelected]=useState<string|null>(null);
 const [comments,setComments]=useState<UmmahComment[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [likes,setLikes]=useState<Record<string,boolean>>({});
 const [paused,setPaused]=useState(false);
 const lastTouch=useRef(0);
 const feedRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!active)return;let alive=true;
  const load=async()=>{try{const r=await fetch("/api/community-posts",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(alive){setPosts(data.posts||[]);setStatus(data.posts?.length?"":"No posts yet. Be the first to share.");}}catch{if(alive)setStatus("Unable to load the Ummah feed.");}};
  void load();const timer=setInterval(()=>void load(),5000);const refresh=()=>void load();window.addEventListener("1muslim:community-post-published",refresh);return()=>{alive=false;clearInterval(timer);window.removeEventListener("1muslim:community-post-published",refresh)};
 },[active]);
 useEffect(()=>{if(!active||paused||posts.length<2||typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const root=feedRef.current;if(!root)return;let last=0;let frame=0;const tick=(now:number)=>{if(!last)last=now;const delta=Math.min(now-last,100);last=now;if(Date.now()-lastTouch.current>500){const end=root.scrollHeight-root.clientHeight;if(end>1){root.scrollTop+=delta*.024;if(root.scrollTop>=end-1)root.scrollTop=0}}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[active,paused,posts.length]);
 const likePost=async(id:string)=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setNotice("Sign in to like posts.");return}const was=!!likes[id];setLikes(p=>({...p,[id]:!was}));const res=was?await db.from("ummah_post_likes").delete().eq("post_id",id).eq("user_id",user.id):await db.from("ummah_post_likes").upsert({post_id:id,user_id:user.id},{onConflict:"post_id,user_id"});if(res.error){setLikes(p=>({...p,[id]:was}));setNotice("Unable to save like.")}};
 useEffect(()=>{if(!active)return;const root=feedRef.current;if(!root)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle("ummah-in-view",entry.isIntersecting)},{root,threshold:.12,rootMargin:"0px 0px -8% 0px"});
  root.querySelectorAll(".ummah-floating-pair").forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 },[active,posts]);
 useEffect(()=>{if(!selected)return;let alive=true;const load=async()=>{try{const r=await fetch("/api/ummah-comments?postId="+encodeURIComponent(selected),{cache:"no-store"});const d=await r.json();if(alive)setComments(d.comments||[])}catch{if(alive)setNotice("Comments unavailable.")}};void load();return()=>{alive=false}},[selected]);
 const send=async(e:React.FormEvent)=>{e.preventDefault();if(!selected||!draft.trim()||busy)return;setBusy(true);setNotice("");try{
  const r=await fetch("/api/ummah-comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({postId:selected,body:draft.trim()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to comment");
  setComments(previous=>[...previous,d.comment]);setDraft("");
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to comment")}finally{setBusy(false)}};
 return <div className="ummah-canvas-shell">
  <div className="ummah-floating-feed" ref={feedRef} aria-label="Community posts" onTouchStart={()=>{lastTouch.current=Date.now();setPaused(true)}} onTouchEnd={()=>{lastTouch.current=Date.now();setPaused(false)}} onPointerDown={()=>{lastTouch.current=Date.now();setPaused(true)}} onPointerUp={()=>{lastTouch.current=Date.now();setPaused(false)}} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
   {posts.length?posts.map((post,i)=><div className="ummah-floating-pair" key={post.id} style={{["--ummah-tilt" as string]:(i%2===0?"-3deg":"3deg")}}>
    <button type="button" className="ummah-floating-post" style={{backgroundImage:`linear-gradient(180deg,rgba(1,18,16,.22),rgba(1,18,16,.78)),url("${backgroundForPost(post.id)}")`,backgroundSize:"cover",backgroundPosition:"center"}} onClick={()=>{setSelected(post.id);setComments([]);setNotice("")}} aria-label={"Open comments on post by "+post.author_name}>
     <span className="ummah-post-glow" aria-hidden="true"/>
     <span className="ummah-post-body">{post.body}</span>
     <span className="ummah-post-bottom"><span>✦ Ummah</span><span>{new Date(post.created_at).toLocaleDateString()}</span><span>Comments ↗</span></span>
    </button>
    <button type="button" className="ummah-like-button" aria-label={likes[post.id]?"Unlike post":"Like post"} aria-pressed={!!likes[post.id]} onClick={()=>void likePost(post.id)}>{likes[post.id]?"♥":"♡"}</button>
    <div className="ummah-floating-author" aria-label={"Posted by "+post.author_name}>
     <span className="ummah-floating-avatar" aria-hidden="true">{post.avatar_url?<img src={post.avatar_url} alt="" loading="lazy"/>:(post.author_name||"M").charAt(0).toUpperCase()}</span>
     <span className="ummah-floating-author-name">{post.author_name}</span>
    </div>
   </div>):<p className="ummah-feed-status" role="status">{status}</p>}
  </div>
  {selected&&<div className="ummah-comments-backdrop" role="presentation" onClick={()=>setSelected(null)}>
   <section className="ummah-comments-sheet" role="dialog" aria-modal="true" aria-label="Post comments" onClick={e=>e.stopPropagation()}>
    <header><strong>✦ Conversation</strong><button type="button" onClick={()=>setSelected(null)} aria-label="Close comments">✕</button></header>
    <p className="ummah-comment-post-preview">{posts.find(p=>p.id===selected)?.body}</p>
    <div className="ummah-comments-list">{comments.length?comments.map(c=><article key={c.id}><strong>{c.name}</strong><p>{c.body}</p></article>):<p>Be the first to comment.</p>}</div>
    <form onSubmit={e=>void send(e)}><input aria-label="Write a comment" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1500} placeholder="Write a thoughtful comment…"/><button type="submit" disabled={busy||!draft.trim()}>Send ↗</button></form>
    {notice&&<p role="alert">{notice}</p>}
   </section>
  </div>}
 </div>;
}
export function CommunityMap({active}:{active:boolean}){
 const [tab,setTab]=useState<"map"|"profile">("map");
 const [zoom,setZoom]=useState(0);
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 const [following,setFollowing]=useState<string[]>([]);
 const places=[
  {id:"mosque",kind:"Mosque",name:"Mosque Finder",city:"Search your city",phone:"Add a verified listing",schedule:"Prayer schedules are set by each mosque",image:"🕌",detail:"Find a local masjid or prayer space once its verified listing is available."},
  {id:"community",kind:"Community",name:"Local Communities",city:"Your area",phone:"Community contact shown on verified listings",schedule:"Events and circles appear here",image:"✦",detail:"Follow local circles for events, study groups, and announcements."}
 ];
 useEffect(()=>{try{setFollowing(JSON.parse(localStorage.getItem("1muslim:community-follows")||"[]"))}catch{}},[]);
 const visible=places.filter(place=>(place.name+place.kind+place.city).toLowerCase().includes(search.trim().toLowerCase()));
 const choose=(id:string)=>setSelected(id);
 const toggleFollow=(id:string)=>setFollowing(current=>{const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];try{localStorage.setItem("1muslim:community-follows",JSON.stringify(next))}catch{}return next});
 
 const bounds=[[-125,24,-66,50],[-111,29,-79,47],[-104,32,-85,45],[-99,35,-90,43],[-96,37,-92,41]] as const;
 const bbox=bounds[zoom];
 const url="https://www.openstreetmap.org/export/embed.html?bbox="+encodeURIComponent(bbox.join(","))+"&layer=mapnik";
 return <div className="canvas-community-map-shell">
  <div className="canvas-community-tabs" role="tablist" aria-label="Canvas six views"><button type="button" role="tab" aria-selected={tab==="map"} onClick={()=>setTab("map")}>🌎 Community Map</button><button type="button" role="tab" aria-selected={tab==="profile"} onClick={()=>setTab("profile")}>My Profile</button></div>
  {tab==="profile"?<ProfileApp active={active}/>:<div className="canvas-community-map-panel">
   <div className="canvas-community-map-heading"><strong>Mosque Finder & Local Communities</strong><span>Explore verified local places and community hubs</span></div>
   <form className="canvas-community-map-search" onSubmit={e=>e.preventDefault()}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mosque or community" aria-label="Search mosques and communities"/><button type="submit">Search</button></form>
   <div className="canvas-community-map-frame"><iframe title="Interactive map of the United States" loading="lazy" src={url} referrerPolicy="no-referrer-when-downgrade" allowFullScreen={false}/><div className="canvas-community-map-places" aria-label="Mosque and community results">{visible.map(place=><button type="button" key={place.id} onClick={()=>choose(place.id)} className={selected===place.id?"isSelected":""}><span>{place.image}</span><strong>{place.name}</strong><small>{place.kind}</small></button>)}</div>{selected&&(()=>{const place=places.find(item=>item.id===selected)!;return <article className="canvas-community-place-card" aria-label={place.name+" details"}><button type="button" onClick={()=>setSelected(null)} aria-label="Close place details">×</button><div className="canvas-community-place-image" aria-hidden="true">{place.image}</div><span>{place.kind.toUpperCase()}</span><h3>{place.name}</h3><p>{place.detail}</p><dl><div><dt>Phone</dt><dd>{place.phone}</dd></div><div><dt>Schedule</dt><dd>{place.schedule}</dd></div></dl><button type="button" className="canvas-community-follow" onClick={()=>toggleFollow(place.id)}>{following.includes(place.id)?"✓ Following":"Follow"}</button></article>})()}<div className="canvas-community-map-zoom"><button type="button" onClick={()=>setZoom(v=>Math.min(4,v+1))} disabled={zoom===4} aria-label="Zoom in">+</button><button type="button" onClick={()=>setZoom(v=>Math.max(0,v-1))} disabled={zoom===0} aria-label="Zoom out">−</button><button type="button" onClick={()=>setZoom(0)} aria-label="Reset map to United States">⌂</button></div></div>
   <p className="canvas-community-map-caption">Tap a Mosque or Community card for its image, phone, schedule, and Follow action. Verified local listings will replace these directory placeholders as they are added.</p>
  </div>}
 </div>;
}
export default function CanvasSecondaryApp({slot,active}:{slot:number;active:boolean}){
 return <div className="canvas-native-app"><header><span>0{slot+6} · 1MUSLIM</span><h2>{titles[slot]}</h2></header><div className="canvas-native-body">
 {slot===0?<ProfileApp active={active}/>:slot===1?<RecorderApp active={active}/>:slot===2?<DailyPostsApp active={active}/>:slot===3?<HomeMessagesChooser/>:slot===4?<ElmTentAlphabet/>:<div className="canvas-community-map-panel"><strong>Community connections</strong><p>Discover Muslims and mosques through the Community Map above.</p></div>}
 </div><footer><Link href={destinations[slot]}>Open full experience ↗</Link></footer></div>
}
