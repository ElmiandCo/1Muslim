"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteNav from "../components/SiteNav";
import ProfileAvatar, { ACCESSORIES, AVATAR_TIERS, tierForXp } from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";
import ProfileContentSections from "../components/ProfileContentSections";

type Profile = {
  id: string; display_name: string; username: string | null; first_name: string | null; last_name: string | null;
  city: string | null; state: string | null; country: string | null; gender: string | null; bio: string | null;
  xp_total: number; avatar_gender: string; avatar_package: string; avatar_config: Record<string, unknown>;
  profile_background: string; profile_accent: string;
  display_name_changed_at: string | null; username_changed_at: string | null; shahada_verified_at: string | null; shahada_audio_path: string | null; shahada_language: "ar" | "en" | null;
};

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function cooldownRemaining(changedAt: string | null) {
  if (!changedAt) return null;
  const remaining = new Date(changedAt).getTime() + THREE_DAYS - Date.now();
  if (remaining <= 0) return null;
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h remaining` : `${hours}h remaining`;
}

const colors = [["emerald","Emerald"],["gold","Gold"],["blue","Sapphire"],["violet","Violet"],["rose","Rose"],["slate","Slate"]];



function ProfileOverview({profile,tier,ashab,postCount,postText,setPostText,posting,publishFirstPost,onEdit}:{profile:Profile;tier:any;ashab:Profile[];postCount:number;postText:string;setPostText:(v:string)=>void;posting:boolean;publishFirstPost:()=>void;onEdit:()=>void}){
  return <section className="profileOverview">
    <header className={"profileOverviewHero header-"+profile.profile_accent}>
      <div className="profileOverviewCover"><div className="profileOverviewActions"><Link href="/find" className="ghost">Find People</Link><button className="primary" onClick={onEdit}>✦ Edit profile</button></div></div>
      <div className="profileOverviewBody"><div className="profileOverviewAvatar"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/></div>
        <div className="profileOverviewMain"><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p className="profileHandle">@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p><p className="profileBio">{profile.bio||"Your profile is your space. Add a short bio so the community can get to know you."}</p>
          <div className="profileChips">{profile.city&&<span>📍 {profile.city}{profile.state?", "+profile.state:""}</span>}<span>⭐ {profile.xp_total.toLocaleString()} XP</span>{profile.shahada_verified_at&&<span>✓ Shahadah verified</span>}</div>
        </div></div>
      <div className="profileOverviewStats"><div><b>{postCount}</b><span>Posts</span></div><div><b>{ashab.length}</b><span>Ashab</span></div><div><b>{profile.community?"1":"0"}</b><span>Community</span></div></div>
    </header>
    <section className="profileOverviewSection"><div className="sectionHeading"><div><span className="eyebrow">YOUR CIRCLE</span><h2>Your Ashab</h2><p>People you’ve accepted as Ashab.</p></div><span className="carouselHint">Swipe →</span></div>
      <div className="ashabCarousel">{ashab.length?ashab.map(a=><button key={a.id} className="ashabCard" onClick={()=>window.location.href="/find?profile="+a.id}><ProfileAvatar name={a.display_name} gender={a.gender} avatarGender={a.avatar_gender} avatarPackage={a.avatar_package} avatarConfig={a.avatar_config} accent={a.profile_accent} size="md"/><strong>{a.display_name||a.username||"Member"}</strong><small>@{a.username||"member"}</small><em>ASHAB</em></button>):<div className="ashabEmpty"><div className="ashabEmptyIcon">✦</div><div><h3>Your Ashab circle starts here.</h3><p>When you accept an Ashab request, they’ll appear here.</p></div><Link href="/find" className="ghost">Find People</Link></div>}</div>
    </section>
    <section className="profileOverviewSection"><div className="sectionHeading"><div><span className="eyebrow">YOUR VOICE</span><h2>Your posts</h2><p>{postCount?"Your latest reflections and community posts.":"Your profile is ready for its first post."}</p></div></div>
      {!postCount&&<div className="firstPostCard"><span className="eyebrow">FIRST POST</span><h3>Say something to the community ✨</h3><p>Share a thought, reminder, lesson, or something useful.</p><div className="firstPostComposer"><textarea value={postText} maxLength={500} onChange={e=>setPostText(e.target.value)} placeholder="What would you like to share?"/><div><small>{postText.length}/500</small><button className="primary" onClick={publishFirstPost} disabled={!postText.trim()||posting}>{posting?"Posting…":"Post"}</button></div></div></div>}
      {postCount>0&&<ProfileContentSections userId={profile.id}/>}
    </section>
    <style jsx>{`.profileOverview{max-width:1120px;margin:0 auto;padding:24px 18px 80px}.profileOverviewHero{overflow:hidden;border:1px solid var(--line);border-radius:28px;background:var(--panel);box-shadow:var(--shadow)}.profileOverviewCover{height:185px;position:relative;background:linear-gradient(135deg,#102218,#0b130e)}.profileOverviewCover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(214,231,184,.18),transparent 30%)}.profileOverviewActions{position:absolute;right:18px;top:18px;z-index:2;display:flex;gap:8px}.profileOverviewActions button,.profileOverviewActions a{backdrop-filter:blur(12px)}.profileOverviewBody{padding:0 30px 10px;position:relative}.profileOverviewAvatar{margin-top:-76px;position:relative;z-index:3;width:150px}.profileOverviewMain{margin-top:15px}.profileOverviewMain h1{font-size:44px;letter-spacing:-.06em;margin:6px 0 2px}.profileHandle{color:var(--muted);font-size:12px;margin:0}.profileBio{max-width:680px;color:#aab5ae;line-height:1.65;font-size:14px;margin:14px 0 0}.profileChips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.profileChips span{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 10px;color:var(--muted);font-size:10px;font-weight:800}.profileOverviewStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 30px 28px}.profileOverviewStats>div{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:14px}.profileOverviewStats b{display:block;font-size:23px}.profileOverviewStats span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:3px}.profileOverviewSection{margin-top:18px;border:1px solid var(--line);background:var(--panel);border-radius:24px;padding:24px}.sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.sectionHeading h2{margin:6px 0 2px;font-size:24px;letter-spacing:-.04em}.sectionHeading p{margin:0;color:var(--muted);font-size:11px}.carouselHint{color:#6f7d75;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.ashabCarousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;scrollbar-width:none}.ashabCarousel::-webkit-scrollbar{display:none}.ashabCard{flex:0 0 175px;scroll-snap-align:start;text-align:left;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:18px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;transition:.18s}.ashabCard:hover{transform:translateY(-2px);border-color:#52664f}.ashabCard strong{font-size:13px;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ashabCard small{font-size:10px;color:var(--muted)}.ashabCard em{font-style:normal;font-size:8px;font-weight:900;letter-spacing:.12em;color:var(--gold);margin-top:4px}.ashabEmpty{min-width:100%;box-sizing:border-box;border:1px dashed #354239;border-radius:18px;padding:20px;display:flex;align-items:center;gap:14px}.ashabEmptyIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#1a241b;color:var(--gold)}.ashabEmpty h3{margin:0 0 4px;font-size:15px}.ashabEmpty p{margin:0;color:var(--muted);font-size:11px}.ashabEmpty .ghost{margin-left:auto;white-space:nowrap}.firstPostCard{border:1px solid #344237;background:linear-gradient(145deg,#101912,#0b110d);border-radius:20px;padding:20px}.firstPostCard h3{margin:6px 0 3px;font-size:20px}.firstPostCard p{margin:0;color:var(--muted);font-size:11px}.firstPostComposer{margin-top:16px}.firstPostComposer textarea{width:100%;min-height:100px;box-sizing:border-box;border:1px solid var(--line);background:#080d09;color:var(--text);border-radius:14px;padding:12px;resize:vertical}.firstPostComposer>div{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.firstPostComposer small{color:var(--muted);font-size:9px}@media(max-width:700px){.profileOverview{padding:12px 12px 70px}.profileOverviewCover{height:150px}.profileOverviewBody{padding:0 18px 8px}.profileOverviewAvatar{width:120px;margin-top:-60px}.profileOverviewMain h1{font-size:34px}.profileOverviewActions .ghost{display:none}.profileOverviewActions button{padding:9px 12px}.profileOverviewStats{padding:16px 18px 20px}.profileOverviewSection{padding:18px}.ashabCard{flex-basis:160px}.ashabEmpty{display:grid}.ashabEmpty .ghost{margin:0;width:100%;text-align:center}}`}</style>
  </section>
}

export default function ProfilePage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [editing,setEditing]=useState(false);
  const [ashab,setAshab]=useState<Profile[]>([]);
  const [postCount,setPostCount]=useState(0);
  const [postText,setPostText]=useState("");
  const [posting,setPosting]=useState(false);
  const [tab,setTab]=useState<"profile"|"avatar"|"header"|"live"|"shahada">("profile");
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [authRequired,setAuthRequired]=useState(false);
  const [liveConnectors,setLiveConnectors]=useState<Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>>({});
  const [vaultUrl,setVaultUrl]=useState("");
  const providers=["tiktok","youtube","twitch"] as const;

  useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setAuthRequired(true);return;}const {data}=await s.from("profiles").select("*").eq("id",user.id).single();if(data)setProfile(data as Profile);
    const {data:postRows}=await s.from("posts").select("id").eq("user_id",user.id); setPostCount(postRows?.length??0);
    const {data:friendships}=await s.from("ashab_friendships").select("requester_id,addressee_id").eq("status","accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ashabIds=(friendships??[]).map((row:any)=>row.requester_id===user.id?row.addressee_id:row.requester_id).filter(Boolean);
    if(ashabIds.length){const {data:ashabRows}=await s.from("profiles").select("*").in("id",ashabIds);setAshab((ashabRows??[]) as Profile[]);}
    const {data:connectors}=await s.from("live_connectors").select("provider,handle,channel_url,enabled,is_live,live_title").eq("user_id",user.id);
    const map:Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>={};
    for(const row of (connectors??[])) map[row.provider]={handle:row.handle??"",channel_url:row.channel_url??"",enabled:!!row.enabled,is_live:!!row.is_live,live_title:row.live_title??""};
    setLiveConnectors(map);})()},[]);

  useEffect(()=>{if(tab!=="shahada"||!profile?.shahada_audio_path)return;let active=true;(async()=>{const s=createClient();const {data}=await s.storage.from("shahada-safe-vault").createSignedUrl(profile.shahada_audio_path!,600);if(active&&data?.signedUrl)setVaultUrl(data.signedUrl)})();return()=>{active=false}},[tab,profile?.shahada_audio_path]);

  const tier=useMemo(()=>tierForXp(profile?.xp_total??0),[profile?.xp_total]);
  const update=(patch:Partial<Profile>)=>setProfile(p=>p?{...p,...patch}:p);
  const displayCooldown=cooldownRemaining(profile?.display_name_changed_at??null);
  const usernameCooldown=cooldownRemaining(profile?.username_changed_at??null);

  const save=async()=>{
    if(!profile)return;
    setSaving(true);setMessage("");
    const s=createClient();
    const original=await s.from("profiles").select("display_name,username").eq("id",profile.id).single();
    const displayChanged=original.data && profile.display_name!==original.data.display_name;
    const usernameChanged=original.data && profile.username!==original.data.username;
    const handle=(profile.username??"").trim().replace(/^@+/,"").toLowerCase();
    if(usernameChanged && handle && !/^[a-z0-9_.]{3,30}$/.test(handle)){
      setSaving(false);setMessage("Member handle must be 3–30 characters using letters, numbers, underscores, or periods.");return;
    }
    const config={...(profile.avatar_config??{}),gender:profile.avatar_gender,package:profile.avatar_package,accessories:Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories:[]};
    const {data,error}=await s.from("profiles").update({display_name:profile.display_name.trim(),username:handle||null,first_name:profile.first_name,last_name:profile.last_name,city:profile.city,state:profile.state,country:profile.country,gender:profile.gender,bio:profile.bio,avatar_gender:profile.avatar_gender,avatar_package:profile.avatar_package,avatar_config:config,profile_background:profile.profile_background,profile_accent:profile.profile_accent}).eq("id",profile.id).select("display_name,username,display_name_changed_at,username_changed_at").single();
    setSaving(false);
    if(error){setMessage(error.message);return;}
    update({display_name:data?.display_name??profile.display_name,username:data?.username??null,display_name_changed_at:data?.display_name_changed_at??profile.display_name_changed_at,username_changed_at:data?.username_changed_at??profile.username_changed_at});
    setMessage(displayChanged||usernameChanged?"Profile identity updated.":"Profile saved.");
    setEditing(false);
  };

  const updateConnector=(provider:string,patch:Partial<{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>)=>setLiveConnectors(x=>({...x,[provider]:{handle:x[provider]?.handle??"",channel_url:x[provider]?.channel_url??"",enabled:x[provider]?.enabled??true,is_live:x[provider]?.is_live??false,live_title:x[provider]?.live_title??"",...patch}}));
  const saveConnector=async(provider:string)=>{
    if(!profile)return;
    const row=liveConnectors[provider]??{handle:"",channel_url:"",enabled:true,is_live:false,live_title:""};
    const s=createClient();
    const {error}=await s.from("live_connectors").upsert({user_id:profile.id,provider,handle:row.handle.trim()||null,channel_url:row.channel_url.trim()||null,enabled:row.enabled,is_live:row.is_live,live_title:row.live_title.trim()||null,updated_at:new Date().toISOString()},{onConflict:"user_id,provider"});
    setMessage(error?error.message:`${provider[0].toUpperCase()+provider.slice(1)} live connector saved.`);
  };

  const toggleAccessory=(id:string)=>{if(!profile)return;const item=ACCESSORIES.find(x=>x.id===id);if(!item)return;const required=AVATAR_TIERS.find(x=>x.key===item.tier)?.minXp??0;if(profile.xp_total<required)return;const current=Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories.map(String):[];const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];update({avatar_config:{...profile.avatar_config,accessories:next}})};

  if(authRequired)return <main><SiteNav compact/><section className="profileEmpty"><h1>Build your profile.</h1><p>Sign in to customize your OneMuslim identity.</p><Link href="/auth" className="primary">Sign in</Link></section></main>;
  if(!profile)return <main><SiteNav compact/><section className="profileEmpty"><p>Loading your profile…</p></section></main>;

  const publishFirstPost=async()=>{const body=postText.trim();if(!body||posting)return;setPosting(true);const s=createClient();const {error}=await s.from("posts").insert({user_id:profile.id,body});if(error){setMessage(error.message);setPosting(false);return;}setPostText("");setPostCount(x=>x+1);setPosting(false);};

  return <main className="profilePage"><SiteNav/>{!editing?<ProfileOverview profile={profile} tier={tier} ashab={ashab} postCount={postCount} postText={postText} setPostText={setPostText} posting={posting} publishFirstPost={publishFirstPost} onEdit={()=>setEditing(true)}/>:<div className="profileShell">
    <header className={`profileHero header-${profile.profile_accent}`}><div className="profileHeroTop"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/><div><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p>@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p></div></div><div className="profileHeroActions"><Link href="/find" className="ghost">Find People</Link><button className="primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save changes"}</button></div></header>
    <div className="profileEditorToolbar"><button className="ghost" onClick={()=>setEditing(false)}>← Close editor</button><span>Profile settings</span></div><div className="profileTabs">{(["profile","avatar","header","live","shahada"] as const).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x==="profile"?"Profile":x==="avatar"?"Avatar & Accessories":x==="header"?"Header Color":x==="live"?"Live & Streaming":"Shahada Vault"}</button>)}</div>

    {tab==="profile"&&<section className="profileEditor"><div className="editorIntro"><span className="eyebrow">PERSONAL DETAILS</span><h2>Tell people who you are.</h2><p>Your profile is yours. Keep only the information you want to share.</p></div><div className="formGrid">
      <label>Display name<input value={profile.display_name??""} disabled={!!displayCooldown} onChange={e=>update({display_name:e.target.value})}/><small className="fieldNote">{displayCooldown?`You can change your display name again in ${displayCooldown}.`:"You can change this once every 3 days."}</small></label><label>@ Member handle<input value={profile.username?`@${profile.username}`:""} placeholder="@member" disabled={!!usernameCooldown} onChange={e=>update({username:e.target.value.replace(/^@+/,"")})}/><small className="fieldNote">{usernameCooldown?`You can change your handle again in ${usernameCooldown}.`:"You can change this once every 3 days."}</small></label><label>First name<input value={profile.first_name??""} onChange={e=>update({first_name:e.target.value})}/></label><label>Last name<input value={profile.last_name??""} onChange={e=>update({last_name:e.target.value})}/></label>
      <label>Gender<input value={profile.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : "Not selected"} disabled /><small className="fieldNote">Gender is selected once during onboarding and cannot be changed.</small></label>
      <label>City<input value={profile.city??""} onChange={e=>update({city:e.target.value})}/></label><label>State<input value={profile.state??""} onChange={e=>update({state:e.target.value})}/></label><label>Country<input value={profile.country??""} onChange={e=>update({country:e.target.value})}/></label>
      <label className="wide">Bio<textarea value={profile.bio??""} maxLength={500} onChange={e=>update({bio:e.target.value})}/></label>
    </div>{message&&<div className="saveMessage">{message}</div>}</section>}

    {tab==="live"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">LIVE & STREAMING</span><h2>Bring your live presence to 1Muslim.</h2><p>Connect your TikTok, YouTube or Twitch profile. When a connector is marked live, your profile gets the animated Live ring and a Watch Stream button.</p></div>
      <div className="liveConnectorGrid">{providers.map(provider=>{const row=liveConnectors[provider]??{handle:"",channel_url:"",enabled:true,is_live:false,live_title:""};const label=provider==="tiktok"?"TikTok":provider==="youtube"?"YouTube":"Twitch";return <article className={"liveConnectorCard "+(row.is_live?"active":"")} key={provider}>
        <div className="connectorTop"><div><span className="eyebrow">{label}</span><h3>{row.is_live?"🔴 LIVE NOW":"Connect "+label}</h3></div><button className={"liveToggle "+(row.is_live?"on":"")} onClick={()=>updateConnector(provider,{is_live:!row.is_live})}>{row.is_live?"LIVE":"OFF"}</button></div>
        <label>Username / channel<input value={row.handle} onChange={e=>updateConnector(provider,{handle:e.target.value})} placeholder={provider==="twitch"?"username":provider==="youtube"?"@channel":"@username"}/></label>
        <label>Watch URL<input value={row.channel_url} onChange={e=>updateConnector(provider,{channel_url:e.target.value})} placeholder={"https://"+(provider==="tiktok"?"www.tiktok.com/@username/live":provider==="youtube"?"www.youtube.com/@channel/live":"www.twitch.tv/username")}/></label>
        <label>Live title<input value={row.live_title} onChange={e=>updateConnector(provider,{live_title:e.target.value})} placeholder="What are you streaming?"/></label>
        <button className="primary" onClick={()=>void saveConnector(provider)}>Save {label}</button>
        <small>{row.is_live?"Your profile will show Live now.":"Connect first; automatic platform detection can be enabled when the platform API is authorized."}</small>
      </article>})}</div>
      <style jsx>{`.liveConnectorGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.liveConnectorCard{border:1px solid var(--line);background:var(--panel2);border-radius:18px;padding:16px}.liveConnectorCard.active{border-color:#71404a;box-shadow:0 0 24px rgba(255,77,94,.08)}.connectorTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.liveConnectorCard h3{margin:5px 0 14px;font-size:16px}.liveConnectorCard label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#94a49a;margin:10px 0}.liveConnectorCard input{width:100%;box-sizing:border-box;border:1px solid var(--line);background:#080d09;color:var(--text);border-radius:10px;padding:10px;font-size:11px}.liveConnectorCard .primary{border:0;cursor:pointer;width:100%;margin-top:4px}.liveConnectorCard small{display:block;color:#718078;font-size:9px;line-height:1.5;margin-top:9px}.liveToggle{border:1px solid #493034;background:#170d0e;color:#b9979b;border-radius:999px;padding:6px 9px;font-size:8px;font-weight:900}.liveToggle.on{background:#ff4d5e;border-color:#ff4d5e;color:#fff;box-shadow:0 0 16px rgba(255,77,94,.35)}@media(max-width:850px){.liveConnectorGrid{grid-template-columns:1fr}}`}</style>
    </section>}
    {tab==="shahada"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">PRIVATE SAFE VAULT</span><h2>Your Shahada verification.</h2><p>Your original voice recording is private. Only your authenticated account can request a short-lived playback link. Your public profile never exposes the recording.</p></div>
      <div className="shahadaVaultCard">
        <div><span className="eyebrow">STATUS</span><h3>{profile.shahada_verified_at?"✓ SHAHADA VERIFIED":"Not verified"}</h3><p>{profile.shahada_language==="ar"?"Arabic":"English"} · {profile.shahada_verified_at?new Date(profile.shahada_verified_at).toLocaleDateString():"—"}</p></div>
        {profile.shahada_audio_path&&vaultUrl?<audio controls preload="metadata" src={vaultUrl}/>:
          <span className="muted">No private recording available.</span>}
      </div>
      <style jsx>{`.shahadaVaultCard{border:1px solid var(--line);background:var(--panel2);border-radius:18px;padding:18px;display:grid;gap:16px}.shahadaVaultCard h3{margin:6px 0;font-size:18px;color:#d6e7b8}.shahadaVaultCard p{margin:0;color:#7d8a82;font-size:11px}.shahadaVaultCard audio{width:100%}`}</style>
    </section>}
    {tab==="avatar"&&<section className="avatarEditor"><div className="avatarPreview"><ProfileAvatar name={profile.display_name} gender={profile.gender} avatarGender={profile.avatar_gender} avatarPackage={profile.avatar_package} avatarConfig={profile.avatar_config} accent={profile.profile_accent} size="lg"/><strong>{tier.icon} {tier.name}</strong><span>{tier.quality}</span><small>{profile.xp_total.toLocaleString()} XP</small></div><div><span className="eyebrow">5 XP TIERS</span><h2>Earn your look.</h2><p className="muted">Everyone starts with a clean default avatar. More XP unlocks better accessories and richer avatar packages.</p><div className="tierGrid">{AVATAR_TIERS.map(t=><div className={`tierCard ${profile.xp_total>=t.minXp?"unlocked":"locked"}`} key={t.key}><b>{t.icon} {t.name}</b><span>{t.minXp.toLocaleString()} XP</span><small>{profile.xp_total>=t.minXp?t.quality:"Locked"}</small></div>)}</div><div className="accessoryGrid">{ACCESSORIES.map(item=>{const required=AVATAR_TIERS.find(x=>x.key===item.tier)!.minXp;const unlocked=profile.xp_total>=required;const selected=Array.isArray(profile.avatar_config?.accessories)&&profile.avatar_config.accessories.map(String).includes(item.id);return <button key={item.id} disabled={!unlocked} className={`accessoryCard ${selected?"selected":""} ${!unlocked?"locked":""}`} onClick={()=>toggleAccessory(item.id)}><span>{unlocked?item.icon:"🔒"}</span><b>{item.name}</b><small>{unlocked?"Tap to equip":`${required.toLocaleString()} XP`}</small></button>})}</div></div></section>}

    {tab==="header"&&<section className="headerEditor"><span className="eyebrow">PROFILE HEADER</span><h2>Choose your header color.</h2><p className="muted">Your choice follows you into Find People and your public profile.</p><div className="colorGrid">{colors.map(([key,name])=><button key={key} className={profile.profile_accent===key?"selected":""} onClick={()=>update({profile_accent:key})}><span className={`swatch ${key}`}></span><b>{name}</b></button>)}</div><div className={`headerDemo header-${profile.profile_accent}`}><strong>{profile.display_name}</strong><span>Public profile header preview</span></div></section>}
    <ProfileContentSections userId={profile.id}/>
  </div>}</main>;
}
