"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import ProfileAvatar, { ACCESSORIES, AVATAR_TIERS, tierForXp } from "../components/ProfileAvatar";
import { createClient } from "../../utils/supabase/client";
import ProfileContentSections from "../components/ProfileContentSections";
import FeaturedBadge from "../components/FeaturedBadge";
import PublicBadgeSelector from "../components/PublicBadgeSelector";
import HudHudTenFriends from "../components/HudHudTenFriends";
import ProfileAnalytics from "../components/ProfileAnalytics";
import ProfileMemberStats from "../components/ProfileMemberStats";
import ProfileNavIcon from "../components/icons/ProfileNavIcon";

type Profile = {
  id: string; display_name: string; username: string | null; first_name: string | null; last_name: string | null;
  city: string | null; state: string | null; country: string | null; gender: string | null; bio: string | null;
  xp_total: number; avatar_gender: string; avatar_package: string; avatar_config: Record<string, unknown>;
  profile_background: string; profile_accent: string; community: string | null;
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

const AVATAR_CHOICES=[
  {url:"/assets/avatars/default-male.jpg",label:"Classic Male",xp:0},
  {url:"/assets/avatars/Default-women.png",label:"Classic Female",xp:0},
  {url:"/assets/avatars/floral-avatar-female.PNG",label:"Floral Female",xp:0},
  {url:"/assets/avatars/silver-avatar-male.jpg",label:"Silver Male",xp:5000},
  {url:"/assets/avatars/silver-avatar-female.jpg",label:"Silver Female",xp:5000},
  {url:"/assets/avatars/gold-avatar-male.PNG",label:"Gold Male",xp:5000},
  {url:"/assets/avatars/gold-avatar-female.PNG",label:"Gold Female",xp:5000},
  {url:"/assets/avatars/water-avatar-male.PNG",label:"Water Male",xp:5000},
  {url:"/assets/avatars/water-avatar-female.PNG",label:"Water Female",xp:5000},
  {url:"/assets/avatars/diamond-avatar-female.PNG",label:"Diamond Female",xp:10000},
  {url:"/assets/avatars/cosmic-avatar-male.PNG",label:"Cosmic Male",xp:10000},
  {url:"/assets/avatars/cosmic-avatar-female.PNG",label:"Cosmic Female",xp:10000},
  {url:"/assets/avatars/emerald-royalty-female.PNG",label:"Emerald Royalty Female",xp:10000},
  {url:"/assets/avatars/violet-sentinel-female.PNG",label:"Violet Sentinel Female",xp:10000},
  {url:"/assets/avatars/tina-the-salafi-female.PNG",label:"Tina The Salafi Female",xp:20000}
] as const;
const COVER_STOCK=[{id:"emerald",label:"Emerald",url:"/assets/profile-backgrounds/emerald.PNG"},{id:"sapphire",label:"Sapphire",url:"/assets/profile-backgrounds/sapphire.PNG"},{id:"ruby",label:"Ruby",url:"/assets/profile-backgrounds/rose-gold.PNG"},{id:"amethyst",label:"Amethyst",url:"/assets/profile-backgrounds/amethyst.PNG"},{id:"titanium",label:"Titanium",url:"/assets/profile-backgrounds/silver-dust.PNG"},{id:"obsidian",label:"Obsidian",url:"/assets/profile-backgrounds/obsidian.PNG"}] as const;
const BACKGROUND_CHOICES=[
  {id:"emerald-night",accent:"emerald",label:"Emerald Night"},
  {id:"gold-dusk",accent:"gold",label:"Gold Dusk"},
  {id:"water-blue",accent:"blue",label:"Water Blue"},
  {id:"violet-sky",accent:"violet",label:"Violet Sky"},
  {id:"rose-garden",accent:"rose",label:"Rose Garden"},
  {id:"slate-stone",accent:"slate",label:"Slate Stone"}
] as const;




function ProfileOrbitStudio({profile,onEdit,ashab,isOwner=true}:{profile:Profile;onEdit:()=>void;ashab:Profile[];isOwner?:boolean;editing?:boolean;editorTab?:string}){
 const [section,setSection]=useState<"activity"|"connections"|"analytics">("activity");
 const coverUrl=typeof profile.avatar_config?.profileCoverUrl==="string"?profile.avatar_config.profileCoverUrl:COVER_STOCK.find(c=>c.id===profile.avatar_config?.profileBackgroundTheme)?.url||COVER_STOCK[5].url;
 const avatar=typeof profile.avatar_config?.selectedAvatarUrl==="string"?profile.avatar_config.selectedAvatarUrl:profile.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
 return <section className="profileProfessional">
  <header className="profileProfessionalCard profileProfessionalHeader">
   <div className="profileProfessionalCover" style={{backgroundImage:`url("${coverUrl}")`}}>{isOwner&&<button type="button" className="profileCoverEdit" onClick={onEdit} aria-label="Edit cover photo">✎ Edit cover</button>}</div>
   <div className="profileProfessionalIdentity">
    <img className="profileProfessionalAvatar" src={avatar} alt="Your profile avatar"/>
    {isOwner&&<button className="profileProfessionalEdit" type="button" onClick={onEdit} aria-label="Edit profile">✎</button>}
    <h1>{profile.display_name||"1Muslim Member"}</h1>
    <p className="profileProfessionalHandle">@{profile.username||"member"} · {profile.xp_total.toLocaleString()} XP</p>
    <p className="profileProfessionalBio">{profile.bio||"Add a bio to introduce yourself to the 1Muslim community."}</p>
    {(profile.city||profile.state||profile.country)&&<p className="profileProfessionalLocation">📍 {[profile.city,profile.state,profile.country].filter(Boolean).join(", ")}</p>}
    {isOwner&&<p className="profileProfessionalConnection">{ashab.length} connections · 1Muslim community</p>}
    
   </div>
  </header>
  <ProfileMemberStats userId={profile.id} displayName={isOwner?undefined:(profile.display_name||profile.username||"Member")} />
  {isOwner&&<section className="profileProfessionalCard profileProfessionalQuickMenu" aria-label="Profile quick menu"><h2>My Profile</h2><div className="profileProfessionalQuickGrid"><a href="#profile-media-library">▦ <span>Posts &amp; Videos</span><small>My clips and posts</small></a><a href="#profile-media-library">♡ <span>Likes &amp; Saved</span><small>My content library</small></a><button type="button" onClick={onEdit}>⚙ <span>Settings</span><small>Manage profile</small></button></div></section>}
  {isOwner&&<section className="profileProfessionalCard profileProfessionalWorkspace" aria-label="Your activity analytics"><ProfileAnalytics inline/></section>}
 </section>;
}

function ProfileOverview({profile,tier,ashab,postCount,postText,setPostText,posting,publishFirstPost,onEdit}:{profile:Profile;tier:any;ashab:Profile[];postCount:number;postText:string;setPostText:(v:string)=>void;posting:boolean;publishFirstPost:()=>void;onEdit:()=>void}){
  return <section className="profileOverview">
    <ProfileOrbitStudio profile={profile} onEdit={onEdit} ashab={ashab}/>

    <div className="profileLegacyOverview" hidden>
    <header className={"profileOverviewHero header-"+profile.profile_accent}>
      <div className="profileOverviewCover"><div className="backPagesBrand">1Muslim</div><div className="profileOverviewActions"><button type="button" className="profileSignOut" aria-label="Sign out" onClick={()=>window.dispatchEvent(new Event("1muslim:profile-signout"))}>↪</button><Link href="/find" className="ghost">⌕ Discover</Link><button className="primary" onClick={onEdit}>✎ Edit</button></div></div>
      <div className="profileOverviewBody">
        <div className="profileOverviewMain"><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p className="profileHandle">@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p><p className="profileBio">{profile.bio||"Your profile is your space. Add a short bio so the community can get to know you."}</p>
          <FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at}/><Link href="/arabic-badges" className="ghost" style={{display:"inline-flex",marginTop:10}}>🔤 Arabic Badge Program →</Link><div className="profileChips">{profile.city&&<span>📍 {profile.city}{profile.state?", "+profile.state:""}</span>}<span>⭐ {profile.xp_total.toLocaleString()} XP</span>{profile.shahada_verified_at&&<span>✓ Shahadah verified</span>}</div>
        </div></div>
      <div className="profileOverviewStats"><div><b>{postCount}</b><span>Posts</span></div><div><b>{profile.xp_total.toLocaleString()}</b><span>XP</span></div><div><b>{profile.community?"1":"0"}</b><span>Community</span></div></div>
    </header>
    </div>
    <section className="profileOverviewSection profileLibraryWrapper">
      {!postCount&&<div className="firstPostCard"><span className="eyebrow">FIRST POST</span><h3>Say something to the community ✨</h3><p>Share a thought, reminder, lesson, or something useful.</p><div className="firstPostComposer"><textarea value={postText} maxLength={500} onChange={e=>setPostText(e.target.value)} placeholder="What would you like to share?"/><div><small>{postText.length}/500</small><button className="primary" onClick={publishFirstPost} disabled={!postText.trim()||posting}>{posting?"Posting…":"Post"}</button></div></div></div>}
      <ProfileContentSections userId={profile.id}/>
    </section>
    <style jsx>{`.backPagesBrand{position:absolute;top:18px;left:0;right:0;text-align:center;font-size:25px;font-weight:800;letter-spacing:-.04em;color:var(--gold);pointer-events:none}.profileOverviewActions{top:76px!important;left:18px!important;right:18px!important;justify-content:center!important}.profileOverviewActions button,.profileOverviewActions a{border-radius:999px!important;min-height:40px!important;padding:9px 16px!important;font-size:12px!important;font-weight:650!important;box-shadow:none!important;background:color-mix(in srgb,var(--panel) 80%,transparent)!important;border:1px solid var(--line)!important;color:var(--text)!important;transition:transform .2s ease,background .2s ease!important}.profileOverviewActions button:active,.profileOverviewActions a:active{transform:scale(.97)}.profileOverviewActions .ghost{display:inline-flex!important;align-items:center!important}.profileSignOut{min-width:44px!important}.profileOverviewCover{height:150px!important;background:linear-gradient(135deg,var(--panel2),var(--panel))!important}@media(max-width:700px){.profileOverviewActions{gap:8px!important}.profileOverviewActions button,.profileOverviewActions a{padding:9px 13px!important}.backPagesBrand{font-size:23px}}`}</style><style jsx>{`.profileOverview{max-width:1120px;margin:0 auto;padding:24px 18px 80px}.profileOverviewHero{overflow:hidden;border:1px solid var(--line);border-radius:28px;background:var(--panel);box-shadow:var(--shadow)}.profileOverviewCover{height:185px;position:relative;background:linear-gradient(135deg,#102218,#0b130e)}.profileOverviewCover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(214,231,184,.18),transparent 30%)}.profileOverviewActions{position:absolute;right:18px;top:18px;z-index:2;display:flex;gap:8px}.profileOverviewActions button,.profileOverviewActions a{backdrop-filter:blur(12px)}.profileSignOut{background:linear-gradient(120deg,#123b57,#142339)!important;border:1px solid #80e6ff!important;color:#fff!important;box-shadow:0 0 16px #65caff55;font-weight:800;cursor:pointer}.profileOverviewBody{padding:0 30px 10px;position:relative}.profileOverviewAvatar{margin-top:-76px;position:relative;z-index:3;width:150px}.profileOverviewMain{margin-top:15px}.profileOverviewMain h1{font-size:44px;letter-spacing:-.06em;margin:6px 0 2px}.profileHandle{color:var(--muted);font-size:12px;margin:0}.profileBio{max-width:680px;color:#aab5ae;line-height:1.65;font-size:14px;margin:14px 0 0}.profileChips{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.profileChips span{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 10px;color:var(--muted);font-size:10px;font-weight:800}.profileOverviewStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 30px 28px}.profileOverviewStats>div{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:14px}.profileOverviewStats b{display:block;font-size:23px}.profileOverviewStats span{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:3px}.profileOverviewSection{margin-top:18px;border:1px solid var(--line);background:var(--panel);border-radius:24px;padding:24px}.sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.sectionHeading h2{margin:6px 0 2px;font-size:24px;letter-spacing:-.04em}.sectionHeading p{margin:0;color:var(--muted);font-size:11px}.carouselHint{color:#6f7d75;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.ashabCarousel{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;scrollbar-width:none}.ashabCarousel::-webkit-scrollbar{display:none}.ashabCard{flex:0 0 175px;scroll-snap-align:start;text-align:left;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:18px;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;transition:.18s}.ashabCard:hover{transform:translateY(-2px);border-color:#52664f}.ashabCard strong{font-size:13px;margin-top:4px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ashabCard small{font-size:10px;color:var(--muted)}.ashabCard em{font-style:normal;font-size:8px;font-weight:900;letter-spacing:.12em;color:var(--gold);margin-top:4px}.ashabEmpty{min-width:100%;box-sizing:border-box;border:1px dashed #354239;border-radius:18px;padding:20px;display:flex;align-items:center;gap:14px}.ashabEmptyIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#1a241b;color:var(--gold)}.ashabEmpty h3{margin:0 0 4px;font-size:15px}.ashabEmpty p{margin:0;color:var(--muted);font-size:11px}.ashabEmpty .ghost{margin-left:auto;white-space:nowrap}.firstPostCard{border:1px solid #344237;background:linear-gradient(145deg,#101912,#0b110d);border-radius:20px;padding:20px}.firstPostCard h3{margin:6px 0 3px;font-size:20px}.firstPostCard p{margin:0;color:var(--muted);font-size:11px}.firstPostComposer{margin-top:16px}.firstPostComposer textarea{width:100%;min-height:100px;box-sizing:border-box;border:1px solid var(--line);background:#080d09;color:var(--text);border-radius:14px;padding:12px;resize:vertical}.firstPostComposer>div{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.firstPostComposer small{color:var(--muted);font-size:9px}@media(max-width:700px){.profileOverview{padding:12px 12px 70px}.profileOverviewCover{height:150px}.profileOverviewBody{padding:0 18px 8px}.profileOverviewAvatar{width:120px;margin-top:-60px}.profileOverviewMain h1{font-size:34px}.profileOverviewActions .ghost{display:none}.profileOverviewActions button{padding:9px 12px}.profileOverviewStats{padding:16px 18px 20px}.profileOverviewSection{padding:18px}.ashabCard{flex-basis:160px}.ashabEmpty{display:grid}.ashabEmpty .ghost{margin:0;width:100%;text-align:center}}`}</style>
  </section>
}

function MemberFollowControl({viewerId,memberId}:{viewerId:string;memberId:string}){
 const [following,setFollowing]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  let live=true;setLoading(true);setError("");setFollowing(false);
  const db=createClient();
  void db.from("profile_follows").select("follower_id").eq("follower_id",viewerId).eq("following_id",memberId).maybeSingle()
   .then(({data,error})=>{if(!live)return;if(error)setError("Unable to check follow status.");else setFollowing(!!data);setLoading(false)});
  return()=>{live=false};
 },[viewerId,memberId]);
 const toggle=async()=>{
  if(saving||loading||viewerId===memberId)return;
  setSaving(true);setError("");
  const db=createClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||user?.id!==viewerId){setError("Sign in to follow members.");setSaving(false);return}
  const result=following
   ?await db.from("profile_follows").delete().eq("follower_id",viewerId).eq("following_id",memberId)
   :await db.from("profile_follows").upsert({follower_id:viewerId,following_id:memberId},{onConflict:"follower_id,following_id",ignoreDuplicates:true});
  if(result.error){setError("Could not update your follow. Please try again.")}
  else{setFollowing(!following);window.dispatchEvent(new CustomEvent("1muslim:follow-changed",{detail:{memberId,viewerId}}))}
  setSaving(false);
 };
 if(viewerId===memberId)return null;
 return <div className="profileMemberFollowWrap"><button type="button" className={"profileMemberFollowButton"+(following?" isFollowing":"")} disabled={loading||saving} aria-pressed={following} onClick={()=>void toggle()}>{loading?"Checking…":saving?"Saving…":following?"✓ Following":"+ Follow"}</button>{error&&<span role="alert" className="profileMemberFollowError">{error}</span>}
 <style>{`.profileMemberFollowWrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0}.profileMemberFollowButton{min-width:128px;padding:12px 19px;border:1px solid #285d99;border-radius:14px;background:#285d99;color:white;font-size:15px;font-weight:750;cursor:pointer}.profileMemberFollowButton.isFollowing{background:white;color:#285d99}.profileMemberFollowButton:disabled{opacity:.55;cursor:wait}.profileMemberFollowError{color:#9b3333;font-size:12px}`}</style></div>;
}

function ProfileSocialHub({profile,children}:{profile:Profile;children:React.ReactNode}){
 const [active,setActive]=useState<"feed"|"profile"|"muslimeen">("profile");
 const [arabic,setArabic]=useState<string|null>(null);
 const [messenger,setMessenger]=useState(false);
 const [feed,setFeed]=useState<Array<{id:string;body:string|null;created_at:string;user_id:string}>>([]);
 const [members,setMembers]=useState<Array<{id:string;display_name:string|null;username:string|null;bio:string|null;avatar_config:Record<string,unknown>|null}>>([]);
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState<string|null>(null);
 const [memberProfile,setMemberProfile]=useState<Profile|null>(null);
 const positions=useRef<Record<string,number>>({});
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{const client=createClient();void client.from("community_posts").select("id,body,created_at,author_id").order("created_at",{ascending:false}).limit(35).then(({data})=>setFeed((data||[]).map((p:any)=>({id:p.id,body:p.body,created_at:p.created_at,user_id:p.author_id}))));void client.from("profiles").select("id,display_name,username,bio,avatar_config").limit(70).then(({data})=>setMembers((data||[]).filter(x=>x.id!==profile.id)));},[profile.id]);
 useEffect(()=>{if(!selected){setMemberProfile(null);return;}void createClient().from("profiles").select("*").eq("id",selected).single().then(({data})=>setMemberProfile(data as Profile|null));},[selected]);
 useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current)},[]);
 const switchTab=(next:typeof active)=>{positions.current[active]=window.scrollY;setActive(next);setSelected(null);setArabic(next);if(timeout.current)clearTimeout(timeout.current);timeout.current=setTimeout(()=>setArabic(null),1000);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:positions.current[next]||0,behavior:"instant"})));};
 const names:{id:typeof active;en:string;ar:string}[]=[{id:"feed",en:"Feed",ar:"الأمة"},{id:"profile",en:"My Profile",ar:"ملفي الشخصي"},{id:"muslimeen",en:"1Muslimeen",ar:"المسلمون"}];
 return <div className={"profileSocialHub profileSocial-"+active}>
  <nav className="profileSocialTop" aria-label="Social profile navigation"><Link href="/" className="profileSocialHome" aria-label="Go to 1Muslim Home" title="Home"><ProfileNavIcon kind="home"/></Link><div className="profileSocialTabs">{names.map(n=><button type="button" key={n.id} aria-label={n.en} title={n.en} aria-current={active===n.id?"page":undefined} onClick={()=>switchTab(n.id)}><ProfileNavIcon kind={n.id==="muslimeen"?"community":n.id}/></button>)}</div><button type="button" className="profileMessengerTrigger" aria-label="Open Messenger" onClick={()=>setMessenger(true)}><ProfileNavIcon kind="messages"/><span>Messenger</span></button></nav>
  <div hidden={active!=="profile"}>{children}</div>
  <section hidden={active!=="feed"} className="profileSocialFeedFrame" aria-label="The Ummah Feed"><iframe title="1Muslim Posts — The Ummah Feed" src="/posts" loading="lazy" className="profileSocialCommunityEmbed"/><div className="profileSocialFeedFooter"><Link href="/posts">Open full Ummah Feed ↗</Link></div></section>
  <section hidden={active!=="muslimeen"} className="profileSocialContent"><header><h1>1Muslimeen</h1><p>Discover members of our Ummah.</p></header><label className="profileSocialSearch">Search members<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names or usernames"/></label>{selected&&<button className="profileSocialBack" type="button" onClick={()=>setSelected(null)}>← Back to members</button>}{selected&&memberProfile?<div className="profileSocialMemberDetail"><ProfileOrbitStudio profile={memberProfile} onEdit={()=>{}} ashab={[]} isOwner={false}/><MemberFollowControl key={selected} viewerId={profile.id} memberId={selected}/><Link href={"/messages?user="+selected}>Message member ↗</Link></div>:<div className="profileSocialMembers">{members.filter(m=>(m.display_name+" "+m.username).toLowerCase().includes(search.toLowerCase())).map(m=><button type="button" key={m.id} onClick={()=>setSelected(m.id)}><strong>{m.display_name||"1Muslim member"}</strong><span>@{m.username||"member"}</span><small>{m.bio||"View member profile"}</small></button>)}</div>}</section>
  {messenger&&<div className="profileMessengerBackdrop" onClick={()=>setMessenger(false)}><aside className="profileMessengerDrawer" aria-label="Messenger" onClick={e=>e.stopPropagation()}><header><h2>Messenger</h2><button type="button" onClick={()=>setMessenger(false)} aria-label="Close Messenger">✕</button></header><iframe title="1Muslim Messenger conversations" src="/messages" className="profileMessengerFrame" loading="lazy"/><Link href="/messages" className="profileMessengerFullLink">Open full Messenger ↗</Link></aside></div>}
 </div>;
}

export default function ProfilePage() {
  const router=useRouter();
  const [signingOut,setSigningOut]=useState(false);
  const [isHudHudAdmin,setIsHudHudAdmin]=useState(false);
  const [uploadingAvatar,setUploadingAvatar]=useState(false);
  const signOut=async()=>{
    if(signingOut)return;
    setSigningOut(true);
    const {error}=await createClient().auth.signOut();
    if(error){setMessage("Sign out failed: "+error.message);setSigningOut(false);return;}
    try{sessionStorage.setItem("1muslim-hudhud-farewell","1")}catch{}
    window.dispatchEvent(new CustomEvent("1muslim:farewell"));
    window.setTimeout(()=>{router.replace("/");router.refresh()},1400);
  };
  const [profile,setProfile]=useState<Profile|null>(null);
  const [editing,setEditing]=useState(false);
  const [ashab,setAshab]=useState<Profile[]>([]);
  const [postCount,setPostCount]=useState(0);
  const [postText,setPostText]=useState("");
  const [posting,setPosting]=useState(false);
  const [tab,setTab]=useState<"profile"|"avatar"|"header"|"live"|"shahada"|"badges">("profile");
const [avatarPage,setAvatarPage]=useState(0);
  useEffect(()=>{const openBadges=()=>{if(new URLSearchParams(window.location.search).get("tab")==="badges"||window.location.hash==="#profile-badges"){setEditing(true);setTab("badges");window.setTimeout(()=>document.getElementById("profile-badges")?.scrollIntoView({behavior:"smooth",block:"start"}),250)}};openBadges();window.addEventListener("hashchange",openBadges);return()=>window.removeEventListener("hashchange",openBadges)},[]);
  const [avatarTransition,setAvatarTransition]=useState<"unlock"|"change"|null>(null); const [avatarSaving,setAvatarSaving]=useState(false); const [saving,setSaving]=useState(false); const [colorSaving,setColorSaving]=useState(false); const [message,setMessage]=useState(""); const [authRequired,setAuthRequired]=useState(false);
  const [liveConnectors,setLiveConnectors]=useState<Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>>({});
  const [vaultUrl,setVaultUrl]=useState("");
  const providers=["tiktok","youtube","twitch"] as const;

  useEffect(()=>{window.addEventListener("1muslim:profile-signout",signOut);return()=>window.removeEventListener("1muslim:profile-signout",signOut)},[signingOut]);
  useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){setAuthRequired(true);return;}setIsHudHudAdmin((user.email||"").toLowerCase()==="hudhudbyelmi@gmail.com");const {data}=await s.from("profiles").select("*").eq("id",user.id).single();if(data)setProfile(data as Profile);
    const [profilePosts,communityPosts]=await Promise.all([s.from("posts").select("id").eq("user_id",user.id),s.from("community_posts").select("id").eq("author_id",user.id)]);setPostCount((profilePosts.data?.length??0)+(communityPosts.data?.length??0));
    const {data:friendships}=await s.from("ashab_friendships").select("requester_id,addressee_id").eq("status","accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const ashabIds=(friendships??[]).map((row:any)=>row.requester_id===user.id?row.addressee_id:row.requester_id).filter(Boolean);
    if(ashabIds.length){const {data:ashabRows}=await s.from("profiles").select("*").in("id",ashabIds);setAshab((ashabRows??[]) as Profile[]);}
    const {data:connectors}=await s.from("live_connectors").select("provider,handle,channel_url,enabled,is_live,live_title").eq("user_id",user.id);
    const map:Record<string,{handle:string;channel_url:string;enabled:boolean;is_live:boolean;live_title:string}>={};
    for(const row of (connectors??[])) map[row.provider]={handle:row.handle??"",channel_url:row.channel_url??"",enabled:!!row.enabled,is_live:!!row.is_live,live_title:row.live_title??""};
    setLiveConnectors(map);})()},[]);

  useEffect(()=>{if(tab!=="shahada"||!profile?.shahada_audio_path)return;let active=true;(async()=>{const s=createClient();const {data}=await s.storage.from("shahada-safe-vault").createSignedUrl(profile.shahada_audio_path!,600);if(active&&data?.signedUrl)setVaultUrl(data.signedUrl)})();return()=>{active=false}},[tab,profile?.shahada_audio_path]);

  const uploadAdminAvatar=async(file:File|undefined)=>{
    if(!file||!profile||!isHudHudAdmin)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("Use a PNG, JPEG or WebP avatar.");return}
    if(file.size>3*1024*1024){setMessage("Avatar must be under 3 MB.");return}
    setUploadingAvatar(true);setMessage("");
    const s=createClient();
    const {data:{user}}=await s.auth.getUser();
    if(!user||user.id!==profile.id||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com"){setUploadingAvatar(false);setMessage("Admin authentication required.");return}
    const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    const path=`hudhud-admin/${user.id}/avatar-${Date.now()}.${extension}`;
    const {error:uploadError}=await s.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setUploadingAvatar(false);setMessage("Avatar upload failed: "+uploadError.message);return}
    const url=s.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const avatar_config={...(profile.avatar_config||{}),adminAvatarUrl:url};
    const {error:saveError}=await s.from("profiles").update({avatar_config}).eq("id",user.id);
    setUploadingAvatar(false);
    if(saveError){setMessage("Avatar uploaded but could not be saved: "+saveError.message);return}
    update({avatar_config});setMessage("HudHud admin avatar saved.");
  };
  const [stockSaving,setStockSaving]=useState(false);
  const selectStockCover=async(url:string)=>{if(!profile||stockSaving)return;setStockSaving(true);setMessage("");const avatar_config={...(profile.avatar_config||{}),profileCoverUrl:url};const {error}=await createClient().from("profiles").update({avatar_config}).eq("id",profile.id);if(error)setMessage("Could not save cover: "+error.message);else{update({avatar_config});setMessage("Stock cover saved.")}setStockSaving(false)};
  const [coverPreview,setCoverPreview]=useState<string|null>(null);
  const [coverFile,setCoverFile]=useState<File|null>(null);
  const [coverZoom,setCoverZoom]=useState(1);
  const [coverPosition,setCoverPosition]=useState(50);
  const [coverUploading,setCoverUploading]=useState(false);
  useEffect(()=>()=>{if(coverPreview)URL.revokeObjectURL(coverPreview)},[coverPreview]);
  const uploadProfileCover=async()=>{
   if(!profile||!coverFile||coverUploading)return;
   setCoverUploading(true);setMessage("");
   try{
    const img=new Image();const src=URL.createObjectURL(coverFile);
    try{await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Image could not be read"));img.src=src});
     const canvas=document.createElement("canvas");canvas.width=1500;canvas.height=500;
     const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image processing unavailable");
     const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight)*coverZoom;
     const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
     ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)*coverPosition/100,w,h);
     const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Crop failed")),"image/jpeg",.88));
     const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user||user.id!==profile.id)throw new Error("Sign in to save your cover.");
     const path=`profile-covers/${user.id}/cover-${Date.now()}.jpg`;
     const {error:uploadError}=await client.storage.from("avatars").upload(path,blob,{contentType:"image/jpeg",upsert:false});if(uploadError)throw uploadError;
     const url=client.storage.from("avatars").getPublicUrl(path).data.publicUrl;
     const avatar_config={...(profile.avatar_config||{}),profileCoverUrl:url};
     const {error:saveError}=await client.from("profiles").update({avatar_config}).eq("id",user.id);if(saveError)throw saveError;
     update({avatar_config});setCoverFile(null);setCoverPreview(null);setMessage("Cover image saved to your profile.");
    }finally{URL.revokeObjectURL(src)}
   }catch(e){setMessage(e instanceof Error?e.message:"Could not upload cover image.")}finally{setCoverUploading(false)}
  };
  const tier=useMemo(()=>tierForXp(profile?.xp_total??0),[profile?.xp_total]);
  const update=(patch:Partial<Profile>)=>setProfile(p=>p?{...p,...patch}:p);
  const chooseBackground=async(choice:(typeof BACKGROUND_CHOICES)[number])=>{
    if(!profile||colorSaving||choice.id===profile.profile_background)return;
    const previous={profile_accent:profile.profile_accent,profile_background:profile.profile_background};
    update({profile_accent:choice.accent,profile_background:choice.id});
    setColorSaving(true);setMessage("");
    const {error}=await createClient().from("profiles").update({profile_accent:choice.accent,profile_background:choice.id}).eq("id",profile.id);
    setColorSaving(false);
    if(error){update(previous);setMessage("Could not save background: "+error.message);}
    else setMessage("Background saved automatically.");
  };
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
    window.dispatchEvent(new Event("1muslim:profile-saved"));
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

  const selectAvatar=async(url:string)=>{
    if(!profile||avatarSaving)return;
    const choice=AVATAR_CHOICES.find(item=>item.url===url);
    if(!choice){setMessage("Invalid avatar image.");return}
    const isSilver=url.includes("silver-avatar");
    if(profile.xp_total<choice.xp){setMessage(`${choice.label} unlocks at ${choice.xp.toLocaleString()} XP.`);return}
    if(profile.avatar_config?.selectedAvatarUrl===url)return;
    setAvatarSaving(true);setMessage("Saving your avatar…");
    const s=createClient();const {data:{user}}=await s.auth.getUser();
    if(!user||user.id!==profile.id){setAvatarSaving(false);setMessage("Sign in to change your avatar.");return}
    const firstSilver=isSilver&&profile.avatar_config?.silverAvatarFirstChangeShown!==true;
    const config={...(profile.avatar_config||{}),selectedAvatarUrl:url,...(firstSilver?{silverAvatarFirstChangeShown:true}:{})};
    const {error}=await s.from("profiles").update({avatar_config:config}).eq("id",user.id);
    if(error){setAvatarSaving(false);setMessage("Could not save avatar: "+error.message);return}
    update({avatar_config:config});window.dispatchEvent(new Event("1muslim:profile-saved"));setAvatarTransition(firstSilver?"unlock":"change");
    setMessage(firstSilver?"✦ Silver avatar equipped!":"Avatar changed and saved.");
    window.setTimeout(()=>setAvatarTransition(null),firstSilver?2600:900);
    setAvatarSaving(false);
    if(firstSilver)await s.from("notifications").insert({user_id:user.id,type:"xp_milestone",title:"✦ Silver avatar unlocked",body:"Your Silver avatar is ready. Visit Profile → Avatar to switch anytime.",entity_type:"profile",entity_id:user.id});
  };
  const toggleAccessory=(id:string)=>{if(!profile)return;const item=ACCESSORIES.find(x=>x.id===id);if(!item)return;const required=AVATAR_TIERS.find(x=>x.key===item.tier)?.minXp??0;if(profile.xp_total<required)return;const current=Array.isArray(profile.avatar_config?.accessories)?profile.avatar_config.accessories.map(String):[];const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];update({avatar_config:{...profile.avatar_config,accessories:next}})};

  if(authRequired)return <main><section className="profileEmpty"><h1>Build your profile.</h1><p>Sign in to customize your OneMuslim identity.</p><Link href="/auth" className="primary">Sign in</Link></section></main>;
  if(!profile)return <main><section className="profileEmpty"><p>Loading your profile…</p></section></main>;

  const publishFirstPost=async()=>{const body=postText.trim();if(!body||posting)return;setPosting(true);const s=createClient();const {error}=await s.from("posts").insert({user_id:profile.id,body});if(error){setMessage(error.message);setPosting(false);return;}setPostText("");setPostCount(x=>x+1);setPosting(false);};

  return <main className="profilePage profileCommandPage"><ProfileSocialHub profile={profile}>{!editing?<ProfileOverview profile={profile} tier={tier} ashab={ashab} postCount={postCount} postText={postText} setPostText={setPostText} posting={posting} publishFirstPost={publishFirstPost} onEdit={()=>setEditing(true)}/>:<div className="profileShell">
    <ProfileOrbitStudio profile={profile} onEdit={()=>setEditing(false)} ashab={ashab} editing editorTab={tab}/>
    <header className={`profileHero header-${profile.profile_accent}`}><div className="profileHeroTop"><div><span className="eyebrow">YOUR ONE MUSLIM PROFILE</span><h1>{profile.display_name||"Member"}</h1><p>@{profile.username||"member"} · {tier.name} · {profile.xp_total.toLocaleString()} XP</p></div></div><div className="profileHeroActions"><Link href="/find" className="ghost">Find People</Link><button className="primary" onClick={save} disabled={saving||colorSaving}>{saving?"Saving…":"Save & close"}</button></div></header>
    <div className="profileEditorToolbar"><strong>PROFILE SETTINGS</strong><button className="ghost" onClick={()=>setEditing(false)}>← Back to profile</button></div><div className="profileEditorNav"><div className="profileTabs" aria-label="Profile editor sections">{(["profile","avatar","header","live","shahada","badges"] as const).map(x=><button type="button" className={tab===x?"active":""} aria-pressed={tab===x} onClick={()=>setTab(x)} key={x}>{x==="profile"?"Identity":x==="avatar"?"Avatars":x==="header"?"Appearance":x==="live"?"Connections":x==="badges"?"Ranks":"Verification"}</button>)}</div><p className="profileNavHint">Swipe through settings • All existing profile fields are preserved</p></div>{tab==="badges"&&<div className="profileBadgeEditor"><FeaturedBadge userId={profile.id} verifiedAt={profile.shahada_verified_at} editable/></div>}

    {tab==="badges"&&<section id="profile-badges" style={{scrollMarginTop:100}}><PublicBadgeSelector userId={profile.id} verifiedAt={profile.shahada_verified_at}/></section>}
    {tab==="profile"&&<section className="profileEditor"><div className="editorIntro"><span className="eyebrow">PERSONAL DETAILS</span><h2>Tell people who you are.</h2><p>Your profile is yours. Keep only the information you want to share.</p></div><div className="formGrid">
      <label>Display name<input value={profile.display_name??""} disabled={!!displayCooldown} onChange={e=>update({display_name:e.target.value})}/><small className="fieldNote">{displayCooldown?`You can change your display name again in ${displayCooldown}.`:"You can change this once every 3 days."}</small></label><label>@ Member handle<input value={profile.username?`@${profile.username}`:""} placeholder="@member" disabled={!!usernameCooldown} onChange={e=>update({username:e.target.value.replace(/^@+/,"")})}/><small className="fieldNote">{usernameCooldown?`You can change your handle again in ${usernameCooldown}.`:"You can change this once every 3 days."}</small></label><label>First name<input value={profile.first_name??""} onChange={e=>update({first_name:e.target.value})}/></label><label>Last name<input value={profile.last_name??""} onChange={e=>update({last_name:e.target.value})}/></label>
      <label>Gender<input value={profile.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : "Not selected"} disabled /><small className="fieldNote">Gender is selected once during onboarding and cannot be changed.</small></label>
      <label>City<input value={profile.city??""} onChange={e=>update({city:e.target.value})}/></label><label>State<input value={profile.state??""} onChange={e=>update({state:e.target.value})}/></label><label>Country<input value={profile.country??""} onChange={e=>update({country:e.target.value})}/></label>
      <label className="wide">Bio <small>{(profile.bio??"").length}/35</small><textarea value={profile.bio??""} maxLength={35} rows={2} onChange={e=>update({bio:e.target.value})}/></label>
    </div>{message&&<div className="saveMessage">{message}</div>}</section>}

    {tab==="live"&&<section className="profileEditor">
      <div className="editorIntro"><span className="eyebrow">SOCIAL CONNECTIONS</span><h2>Connect your world.</h2><p>Replace manual social handles with real account connections. Tap a glowing card to open the connector. Your Elmi Light adds a little magic to every tap.</p></div>
      <div className="socialConnectGrid">
       {(["tiktok","youtube","twitch"] as const).map(provider=>{const label=provider==="tiktok"?"TikTok":provider==="youtube"?"YouTube":"Twitch";const available=provider==="tiktok";return <article className="socialConnectCard" key={provider}>
        <div className="socialParticleField" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:(i*29%91+4)+"%",top:(i*37%76+8)+"%",animationDelay:(i*.16)+"s"}}/>)}</div>
        <div className="socialConnectTop"><span className="eyebrow">{label.toUpperCase()}</span><span className="socialConnectStatus">{available?"SANDBOX":"COMING SOON"}</span></div>
        <div className="socialConnectIcon" aria-hidden="true">{provider==="tiktok"?"♪":provider==="youtube"?"▶":"◈"}</div>
        <h3>{label}</h3><p>{available?"Open the 1Muslim TikTok connection experience. Authorization is still being prepared in sandbox.":"Account authorization will appear here when this connector is ready."}</p>
        {available?<Link href="/tiktok" className="socialConnectAction" onClick={()=>window.dispatchEvent(new CustomEvent("1muslim:action-success"))}><span className="socialActionSpark">✦</span> Connect <span aria-hidden="true">↗</span></Link>:<button type="button" className="socialConnectAction" disabled>✦ Connect · Soon</button>}
       </article>})}
      </div>
      <p className="socialConnectNote">Connections only show as verified after platform authorization succeeds. These cards do not manually mark an account live.</p>
      <style jsx>{`
      .socialConnectGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}.socialConnectCard{position:relative;isolation:isolate;overflow:hidden;min-width:0;border:1px solid #68d6c455;border-radius:22px;padding:22px;background:radial-gradient(circle at 50% 20%,#1d3e4c,#0a151c 75%);box-shadow:0 12px 40px #0004}.socialConnectTop{display:flex;justify-content:space-between;gap:10px;position:relative;z-index:1}.socialConnectStatus{font-size:9px;letter-spacing:.12em;color:#a8f4d8}.socialConnectIcon{position:relative;z-index:1;display:grid;place-items:center;width:66px;height:66px;margin:28px auto 12px;border:1px solid #91eddd88;border-radius:21px;background:#142b35;color:#c6fff0;font-size:35px;box-shadow:0 0 25px #5ddcc333}.socialConnectCard h3{position:relative;text-align:center;font-size:21px;margin:0 0 10px}.socialConnectCard p{position:relative;min-height:75px;text-align:center;color:#b9d4d2;font-size:12px;line-height:1.7}.socialConnectAction{position:relative;z-index:1;display:flex;justify-content:center;align-items:center;gap:11px;width:100%;box-sizing:border-box;padding:15px;border:1px solid #8cf9d6;border-radius:999px;background:linear-gradient(100deg,#155457,#14516a);color:#fff;text-decoration:none;font-weight:900;letter-spacing:.03em;cursor:pointer;box-shadow:0 0 16px #55d7cd55;transition:transform .25s,box-shadow .25s}.socialConnectAction:hover{transform:translateY(-3px);box-shadow:0 0 30px #74fff088}.socialConnectAction:disabled{opacity:.45;cursor:not-allowed}.socialActionSpark{font-size:22px;color:#fff5b9;animation:socialPulse 2s ease-in-out infinite}.socialParticleField{position:absolute;inset:0;pointer-events:none}.socialParticleField i{position:absolute;width:3px;height:18px;border-radius:100%;background:linear-gradient(transparent,#85f7ef,#fff1b2,transparent);box-shadow:0 0 9px #74fff0;animation:socialFall 3s ease-in-out infinite}.socialConnectNote{margin-top:18px;color:#a8bcb9;font-size:12px;line-height:1.6}@keyframes socialFall{0%,100%{opacity:0;transform:translateY(-12px)}40%{opacity:.8}85%{opacity:0;transform:translateY(35px)}}@keyframes socialPulse{50%{filter:drop-shadow(0 0 12px #fff1b2);transform:scale(1.18)}}@media(max-width:850px){.socialConnectGrid{grid-template-columns:1fr}.socialConnectCard p{min-height:0}}@media(prefers-reduced-motion:reduce){.socialParticleField i,.socialActionSpark{animation:none}}
      `}</style>
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
    {tab==="avatar"&&<section className="avatarEditor">{isHudHudAdmin&&<div style={{gridColumn:"1 / -1",padding:20,border:"1px solid #77e7ef",borderRadius:18,background:"#102b36",marginBottom:18}}><strong>✦ HudHud Admin · Custom Avatar Upload</strong><p className="muted">Admin-only avatar upload. PNG, JPG or WebP, up to 3 MB.</p><input aria-label="Upload HudHud admin avatar" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingAvatar} onChange={e=>{void uploadAdminAvatar(e.target.files?.[0]);e.target.value=""}}/>{uploadingAvatar&&<p>Uploading avatar…</p>}{message&&<p role="status">{message}</p>}</div>}<div className={`avatarTransitionStage ${avatarTransition==="unlock"?"avatarUnlock":avatarTransition==="change"?"avatarSwap":""}`}><div className="avatarPreview"><strong>{tier.icon} {tier.name}</strong><span>{tier.quality}</span><small>{profile.xp_total.toLocaleString()} XP</small></div>{avatarTransition==="unlock"&&<div className="silverBadgeReveal" role="status" aria-label="Premium avatar unlocked"><div className="silverBadgeHalo"/><div className="silverBadgeArt">✦</div><div className="silverBadgeTitle">AVATAR UNLOCKED</div><div className="silverBadgeSub">Your new chapter begins</div></div>}</div><div style={{gridColumn:"1 / -1",padding:"16px",border:"1px solid #b9a06a77",borderRadius:16,background:"#fff",color:"#172d47",marginBottom:14}}><span className="eyebrow">YOUR AVATAR · SAVED TO YOUR PROFILE</span><h2 style={{margin:"8px 0"}}>Choose your look</h2><p className="muted">Official 1Muslim avatars unlock with XP and save immediately to your profile.</p><div className="avatarChoiceGrid" role="region" aria-label="Avatar carousel">{AVATAR_CHOICES.filter(choice=>{const gender=String(profile.avatar_gender||profile.gender||"").toLowerCase();return gender==="female"||gender==="woman"?choice.label.toLowerCase().includes("female"):gender==="male"||gender==="man"?choice.label.toLowerCase().includes("male")&&!choice.label.toLowerCase().includes("female"):true}).map(choice=>{const locked=profile.xp_total<choice.xp;const chosen=profile.avatar_config?.selectedAvatarUrl===choice.url;return <button type="button" key={choice.url} onClick={()=>void selectAvatar(choice.url)} disabled={avatarSaving||locked} className={`avatarChoice ${chosen?"selected":""} ${locked?"locked":""}`}><img src={choice.url} alt=""/><span>{choice.label}</span><small>{locked?`🔒 ${choice.xp.toLocaleString()} XP`:chosen?"Equipped ✓":"Equip"}</small></button>})}</div><p role="status" className="muted">{message}</p></div><div><span className="eyebrow">5 XP TIERS</span><h2>Earn your look.</h2><p className="muted">Accessories are saved when you choose Save & close.</p><div className="tierGrid">{AVATAR_TIERS.map(t=><div className={`tierCard ${profile.xp_total>=t.minXp?"unlocked":"locked"}`} key={t.key}><b>{t.icon} {t.name}</b><span>{t.minXp.toLocaleString()} XP</span><small>{profile.xp_total>=t.minXp?t.quality:"Locked"}</small></div>)}</div><div className="accessoryGrid">{ACCESSORIES.map(item=>{const required=AVATAR_TIERS.find(x=>x.key===item.tier)!.minXp;const unlocked=profile.xp_total>=required;const selected=Array.isArray(profile.avatar_config?.accessories)&&profile.avatar_config.accessories.map(String).includes(item.id);return <button key={item.id} disabled={!unlocked} className={`accessoryCard ${selected?"selected":""} ${!unlocked?"locked":""}`} onClick={()=>toggleAccessory(item.id)}><span>{unlocked?item.icon:"🔒"}</span><b>{item.name}</b><small>{unlocked?"Tap to equip":`${required.toLocaleString()} XP`}</small></button>})}</div></div></section>}

    <style>{`@keyframes avatarUnlockGlow{0%{transform:scale(.94)}35%{transform:scale(1.065)}100%{transform:scale(1)}}@keyframes avatarSwapFade{0%{opacity:.35;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}@keyframes avatarUnlockLabel{0%{opacity:0;transform:translateY(12px)}25%,75%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}.avatarTransitionStage{position:relative}.avatarUnlock .avatarPreview{animation:avatarUnlockGlow 2.5s ease-in-out both}.avatarSwap .avatarPreview{animation:avatarSwapFade .75s ease-out both}.silverBadgeReveal{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;pointer-events:none;border-radius:20px;overflow:hidden;background:radial-gradient(ellipse at center,#0b332dd9 0%,#071a18ed 74%);animation:silverReveal 2.55s ease-in-out both}.silverBadgeHalo{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,#e7d3a04d,transparent 70%);filter:blur(15px);animation:silverHalo 2.5s ease-in-out both}.silverBadgeArt{position:relative;width:min(48%,150px);height:auto;object-fit:contain;filter:drop-shadow(0 6px 22px #b5e6d07a);animation:silverBadgeEnter 2.5s cubic-bezier(.2,.75,.25,1) both}.silverBadgeTitle{position:relative;color:#f2e3b5;font-size:clamp(12px,2.5vw,18px);font-weight:800;letter-spacing:.13em;text-shadow:0 2px 18px #d9c27c99}.silverBadgeSub{position:relative;color:#c1dacb;font-size:11px;letter-spacing:.04em}@keyframes silverReveal{0%{opacity:0}14%,73%{opacity:1}100%{opacity:0}}@keyframes silverHalo{0%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1.25)}100%{opacity:0;transform:scale(1.6)}}@keyframes silverBadgeEnter{0%{opacity:0;transform:translateY(18px) scale(.7) rotate(-7deg)}30%,75%{opacity:1;transform:translateY(0) scale(1) rotate(0)}100%{opacity:0;transform:translateY(-8px) scale(1.06)}}@media(prefers-reduced-motion:reduce){.avatarUnlock .avatarPreview,.avatarSwap .avatarPreview,.silverBadgeReveal,.silverBadgeHalo,.silverBadgeArt{animation:none}}`}</style>
    {tab==="header"&&<section className="headerEditor"><span className="eyebrow">PROFILE BACKGROUND</span><h2>Choose your profile atmosphere.</h2><div className="profileCoverUploader"><h3>Cover photograph</h3><p>Choose one of our original 1Muslim backgrounds, or upload your own.</p><div className="profileStockCovers">{COVER_STOCK.map(c=><button type="button" key={c.id} disabled={stockSaving} onClick={()=>void selectStockCover(c.url)} aria-label={`Use ${c.label} cover`} className={profile.avatar_config?.profileCoverUrl===c.url?"selected":""}><img src={c.url} alt=""/><span>{c.label}</span></button>)}</div><p>Upload a banner like the one on a professional social profile. Preview and crop it before saving.</p><input aria-label="Upload profile cover image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){setMessage("Choose a JPG, PNG or WebP under 8 MB.");return}setCoverFile(file);setCoverPreview(URL.createObjectURL(file));setCoverZoom(1);setCoverPosition(50);e.target.value=""}}/>{coverPreview&&<><div className="profileCoverCrop" style={{backgroundImage:`url("${coverPreview}")`,backgroundSize:`auto ${coverZoom*100}%`,backgroundPosition:`center ${coverPosition}%`}}/><label>Zoom <input type="range" min="1" max="2.5" step=".05" value={coverZoom} onChange={e=>setCoverZoom(Number(e.target.value))}/></label><label>Vertical position <input type="range" min="0" max="100" value={coverPosition} onChange={e=>setCoverPosition(Number(e.target.value))}/></label><button type="button" disabled={coverUploading} onClick={()=>void uploadProfileCover()}>{coverUploading?"Uploading…":"Crop & save cover"}</button></>}</div><p className="muted">Your background is saved immediately and appears on your public profile header.</p><div className="colorGrid">{BACKGROUND_CHOICES.map(choice=><button key={choice.id} className={profile.profile_background===choice.id?"selected":""} onClick={()=>void chooseBackground(choice)} disabled={colorSaving} aria-pressed={profile.profile_background===choice.id}><span className={`swatch ${choice.accent}`}></span><b>{choice.label}</b></button>)}</div><div className={`headerDemo header-${profile.profile_accent}`}><strong>{profile.display_name}</strong><span>{profile.profile_background||"Classic"} background preview</span></div><p role="status" className="muted">{colorSaving?"Saving background…":message}</p></section>}
    <ProfileContentSections userId={profile.id}/>
  </div>}<style>{`body:has(.profilePage){overflow-y:auto!important}.profilePage .muslimMobileDock,body:has(.profilePage) .muslimMobileDock{display:none!important}.profilePage{min-height:100dvh;overflow-x:hidden;overflow-y:visible!important}.profileShell{max-width:1100px;margin:0 auto;padding-bottom:110px!important;overflow:visible!important}.profileTabs{display:flex!important;gap:8px!important;overflow-x:auto!important;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:8px 4px 15px!important}.profileTabs::-webkit-scrollbar{display:none}.profileTabs button{flex:0 0 auto!important;scroll-snap-align:start;min-height:43px!important;border-radius:999px!important;padding:10px 16px!important;font-size:13px!important;letter-spacing:.01em!important;white-space:nowrap!important;transition:background .2s ease,border-color .2s ease!important}.profileTabs button.active{box-shadow:0 3px 16px rgba(19,110,79,.2)}.profileEditor textarea{min-height:70px!important;resize:vertical}.profileHero{padding-top:160px!important}.profileOverviewBody{padding-top:150px!important}.avatarPreview{min-height:100px!important;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:45px 20px 16px!important;overflow:visible!important}.avatarTransitionStage{overflow:visible!important}@media(max-width:640px){.profileShell{padding-left:12px!important;padding-right:12px!important}.profileTabs{position:sticky;top:0;z-index:20;backdrop-filter:blur(18px);background:rgba(9,33,29,.9);border-radius:16px}}`}</style><style>{`
.profileCommandPage{background:#f3f7fc!important;color:#213954}
.profileCoverBanner{height:clamp(155px,27vw,270px);background:linear-gradient(120deg,#c7d9ed,#eef5fc 55%,#8baed0);background-position:center;background-size:cover;border-radius:22px 22px 0 0;position:relative;overflow:hidden}
.profileCoverBadge{position:absolute;bottom:12px;left:15px;background:#0b274e99;color:white;padding:7px 12px;border-radius:30px;font-size:10px;letter-spacing:.14em}
.profileCoverUploader{background:#f6f9fe;color:#244467;border:1px solid #d3e0ee;padding:18px;border-radius:18px;margin:15px 0;display:grid;gap:12px}
.profileCoverUploader h3,.profileCoverUploader p{margin:0}
.profileStockCovers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.profileStockCovers button{padding:0!important;overflow:hidden;border:2px solid #cad8e9!important;background:#fff!important;color:#244467!important;border-radius:12px;display:grid}.profileStockCovers button.selected{border-color:#2777c5!important}.profileStockCovers img{width:100%;height:64px;object-fit:cover}.profileStockCovers span{font-size:11px;padding:6px 2px}.profileCoverUploader input[type=file]{max-width:100%}.profileCoverUploader label{display:grid;gap:5px}.profileCoverUploader button{background:#24548a;color:white;padding:12px;border-radius:12px;border:0;font-weight:700}
.profileCoverCrop{width:100%;aspect-ratio:3/1;border-radius:12px;background-repeat:no-repeat;background-color:#d8e5f4;background-size:cover!important}
.profileCommandPage .profileOrbitMagazine{background:#f9fbff!important;color:#1c3555!important;border:1px solid #dce6f3!important;border-radius:26px;box-shadow:0 12px 38px #183e6418}
.profileCommandPage .profileOrbitMagazine h2{font-family:inherit!important;font-weight:800!important;letter-spacing:.035em;font-size:clamp(23px,5vw,39px)}
.profileCommandPage .profileOrbitStage{border-radius:26px;overflow:hidden;background:radial-gradient(circle at 50% 50%,#193d6b,#07192e 75%)}
.profileCommandPage .profileOrbitIdentity{background:#fff;color:#1e385a;border-radius:22px;padding:22px;box-shadow:0 5px 22px #1a3d6115}
.profileCommandPage .profileOrbitIdentity h3{color:#18365c}
.profileCommandPage .profileOrbitIdentity button,.profileCommandPage .profileStudioNav button{background:#eaf2fd;color:#224d7d;border:1px solid #c9dbf1;border-radius:14px}
.profileCommandPage .profileShell{background:#f3f7fc;color:#213954}
.profileCommandPage .profileHero,.profileCommandPage .profileEditor,.profileCommandPage .avatarEditor,.profileCommandPage .headerEditor{background:#fff;color:#213954;border:1px solid #dbe6f3;border-radius:22px;box-shadow:0 8px 24px #203e6010;padding:clamp(16px,4vw,28px)}
.profileCommandPage .profileTabs{position:static!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));background:transparent!important;gap:10px!important;overflow:visible!important}
.profileCommandPage .profileTabs button{border:1px solid #c9d9ed!important;border-radius:14px!important;background:#fff!important;color:#24466c!important;min-height:52px!important;font-weight:700}
.profileCommandPage .profileTabs button.active{background:#24548a!important;color:#fff!important}
.profileCommandPage .profileEditor input,.profileCommandPage .profileEditor textarea{background:#f8fbff;color:#1c3451;border:1px solid #cbd9ea;border-radius:12px}
@media(min-width:720px){.profileCommandPage .profileTabs{grid-template-columns:repeat(3,minmax(0,1fr))}}

/* Consistent HudHud Command floating-card visual system throughout Profile */
.profileCommandPage{min-height:100vh;background-color:#f2f6fc!important;background-image:linear-gradient(#2c568009 1px,transparent 1px),linear-gradient(90deg,#2c568009 1px,transparent 1px)!important;background-size:32px 32px!important}
.profileCommandPage .profileShell{max-width:1120px;margin:auto;padding:clamp(12px,3vw,30px)!important;background:transparent!important}
.profileCommandPage .profileOrbitMagazine{background:transparent!important;border:0!important;box-shadow:none!important;display:grid;gap:18px}
.profileCommandPage .profileCoverBanner{border:1px solid #e0e8f3;box-shadow:0 12px 30px #193c631c;border-radius:25px!important}
.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes,.profileCommandPage .profileOverview,.profileCommandPage .profileOverviewCover,.profileCommandPage .profileOverviewBody,.profileCommandPage .profileOverviewMain,.profileCommandPage .profileOverviewStats,.profileCommandPage .profileOverviewSection,.profileCommandPage .profileHeroTop,.profileCommandPage .profileHeroActions,.profileCommandPage .profileEditorToolbar,.profileCommandPage .profileTabs,.profileCommandPage .profileEditor,.profileCommandPage .profileCoverUploader{background:#fff!important;color:#203954!important;border:1px solid #dce5f1!important;border-radius:24px!important;box-shadow:0 9px 28px #203e6017!important}
.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes,.profileCommandPage .profileOverviewSection,.profileCommandPage .profileHeroTop,.profileCommandPage .profileHeroActions,.profileCommandPage .profileEditorToolbar{padding:clamp(16px,3vw,26px)!important}
.profileCommandPage .profileOrbitStage{box-shadow:0 10px 30px #203e601c;border:1px solid #dce5f1}
.profileCommandPage .profileOrbitMagazine h2,.profileCommandPage .profileOrbitMagazine h3,.profileCommandPage .profileOverview h2,.profileCommandPage .profileEditor h2,.profileCommandPage .profileEditor h3{color:#19395f!important}
.profileCommandPage .profileOrbitMagazine p,.profileCommandPage .profileOverview p,.profileCommandPage .profileEditor p{line-height:1.6}
.profileCommandPage .profileOrbitMetrics>*,.profileCommandPage .profileOrbitAnalytics>*,.profileCommandPage .profileOverviewStats>*{border-radius:16px;background:#f7faff;border:1px solid #e2eaf4;padding:12px}
.profileCommandPage .profileEditor{display:grid;gap:18px}
.profileCommandPage .profileEditor label{color:#284768}
.profileCommandPage .profileEditor input,.profileCommandPage .profileEditor textarea,.profileCommandPage .profileEditor select{background:#f8fbff!important;color:#193755!important;border:1px solid #cbd9ea!important;border-radius:12px!important}
.profileCommandPage .profileStockCovers button{box-shadow:0 4px 12px #244c7517;transition:transform .2s ease,box-shadow .2s ease}
.profileCommandPage .profileStockCovers button:active{transform:scale(.98)}
.profileCommandPage .profileTabs{padding:12px!important}
.profileCommandPage .profileTabs button{box-shadow:0 3px 12px #244c7510}
.profileCommandPage .profileOrbitMagazine>section,.profileCommandPage .profileOrbitMagazine>article{min-width:0}
@media(max-width:600px){.profileCommandPage .profileShell{padding:12px!important}.profileCommandPage .profileOrbitMagazine{gap:14px}.profileCommandPage .profileOrbitMasthead,.profileCommandPage .profileAppearanceControls,.profileCommandPage .profileOrbitIdentity,.profileCommandPage .profileStudioNav,.profileCommandPage .profileFriendsStudio,.profileCommandPage .profileOrbitAnalytics,.profileCommandPage .profileOrbitMetrics,.profileCommandPage .profileOrbitPageTimes{padding:16px!important;border-radius:20px!important}.profileCommandPage .profileStockCovers{grid-template-columns:repeat(2,minmax(0,1fr))}}



.profileCommandPage .profileProfessional{display:grid;gap:20px;max-width:1050px;margin:0 auto;color:#1d3553;font-family:Arial,Helvetica,sans-serif}
.profileCommandPage .profileProfessionalCard{background:#fff!important;border:1px solid #dce5f0!important;border-radius:22px!important;box-shadow:0 8px 25px #1d42641a!important;overflow:hidden}
.profileCommandPage .profileProfessionalHeader{padding:0!important}
.profileCommandPage .profileProfessionalCover{height:clamp(160px,28vw,270px);background-position:center;background-size:cover;position:relative}
.profileCommandPage .profileCoverEdit{position:absolute;right:18px;top:18px;border:0;border-radius:28px;background:#fffffff0;color:#244b73;padding:10px 15px;font-weight:700}
.profileCommandPage .profileProfessionalIdentity{padding:0 clamp(18px,4vw,36px) 28px;position:relative}
.profileCommandPage .profileProfessionalAvatar{display:block;width:112px;height:112px;border-radius:50%;object-fit:cover;border:5px solid #fff;box-shadow:0 4px 15px #203d5b24;margin-top:-56px;position:relative}
.profileCommandPage .profileProfessionalEdit{position:absolute;right:22px;top:20px;background:#edf4fb;border:1px solid #cddceb;border-radius:50%;width:44px;height:44px;font-size:22px;color:#234d7a}
.profileCommandPage .profileProfessionalIdentity h1{font-size:clamp(27px,5vw,40px);margin:14px 0 6px;font-weight:800;letter-spacing:-.025em;color:#172d47}
.profileCommandPage .profileProfessionalIdentity p{margin:8px 0;line-height:1.55}
.profileCommandPage .profileProfessionalHandle,.profileCommandPage .profileProfessionalLocation{color:#64748b}
.profileCommandPage .profileProfessionalBio{font-size:17px}
.profileCommandPage .profileProfessionalConnection{color:#2463a1;font-weight:700}
.profileCommandPage .profileProfessionalActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.profileCommandPage .profileProfessionalActions button,.profileCommandPage .profileProfessionalActions a,.profileCommandPage .profileProfessionalNav button{border-radius:22px;padding:11px 17px;border:1px solid #b9cee5;background:#f5f9ff;color:#204b79;text-decoration:none;font-weight:700;font-size:14px}
.profileCommandPage .profileProfessionalActions button:first-child,.profileCommandPage .profileProfessionalNav button[aria-pressed=true]{background:#235a93;color:#fff}
.profileCommandPage .profileProfessionalSummary,.profileCommandPage .profileProfessionalWorkspace{padding:clamp(20px,4vw,32px)!important}
.profileCommandPage .profileProfessional h2{font-size:23px;font-weight:800;color:#1a3455;margin:0 0 16px}
.profileCommandPage .profileProfessional h3{font-size:17px;color:#1a3455}
.profileCommandPage .profileProfessionalStatGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.profileCommandPage .profileProfessionalStatGrid>div{background:#f7faff;border:1px solid #e2eaf4;border-radius:16px;padding:16px;display:grid;gap:8px}
.profileCommandPage .profileProfessionalStatGrid strong{font-size:clamp(18px,3vw,26px);color:#204b79;overflow-wrap:anywhere}
.profileCommandPage .profileProfessionalStatGrid span{color:#667991;font-size:12px}
.profileCommandPage .profileProfessionalNav{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.profileCommandPage .profileProfessionalInner{background:#f8fbff;border:1px solid #e2eaf4;border-radius:16px;padding:20px}
.profileCommandPage .profileProfessionalRow{padding:12px;border-bottom:1px solid #dce5f0}
.profileCommandPage .profileOverviewSection{background:#fff!important;color:#203954!important;border:1px solid #dce5f0!important;box-shadow:0 8px 25px #1d42641a!important}
.profileCommandPage .profileOverviewSection *{color:inherit}
.profileCommandPage .profileOverviewSection a{color:#245a95!important}
@media(max-width:550px){.profileCommandPage .profileProfessionalStatGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.profileCommandPage .profileProfessionalAvatar{width:96px;height:96px;margin-top:-48px}.profileCommandPage .profileProfessionalActions{gap:7px}}

.profileCommandPage .profileProfessionalQuickMenu{padding:clamp(18px,3vw,28px)!important}.profileCommandPage .profileProfessionalQuickGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.profileCommandPage .profileProfessionalQuickGrid>a,.profileCommandPage .profileProfessionalQuickGrid>button{min-width:0;display:grid;grid-template-columns:30px 1fr;gap:2px 8px;align-items:center;text-align:left;text-decoration:none;font-size:21px;border-radius:17px;border:1px solid #d4e1f0;background:#f7faff;color:#1d4978;padding:16px;box-shadow:0 5px 14px #244b7210}.profileCommandPage .profileProfessionalQuickGrid span{font-size:15px;font-weight:800;color:#19395f}.profileCommandPage .profileProfessionalQuickGrid small{grid-column:2;font-size:11px;color:#6d8197}.profileCommandPage .profileProfessionalQuickGrid>a:active,.profileCommandPage .profileProfessionalQuickGrid>button:active{transform:scale(.99)}@media(max-width:420px){.profileCommandPage .profileProfessionalQuickGrid>a,.profileCommandPage .profileProfessionalQuickGrid>button{padding:12px 9px;grid-template-columns:22px 1fr;font-size:18px}.profileCommandPage .profileProfessionalQuickGrid span{font-size:12px}}
.profileCommandPage .profileLibraryWrapper{padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}.profileCommandPage .profileLibraryWrapper>.profileMediaLibrary{margin-top:0!important}.profileCommandPage .profileOverview{background:transparent!important}.profileCommandPage .profileLibraryWrapper .contentSection{background:#fff!important}.profileCommandPage .profileLibraryWrapper .contentList{background:transparent!important}.profileCommandPage .profileLibraryWrapper .contentList>a{background:#fff!important;color:#1d3859!important}.profileCommandPage .profileLibraryWrapper .tabs{background:transparent!important}.profileCommandPage .profileLibraryWrapper .tabs button{background:#f6f9ff!important;color:#28496f!important}.profileCommandPage .profileLibraryWrapper .tabs button.on{background:#245b95!important;color:white!important}
.profileSocialHub{min-height:100vh;transition:background-color .4s ease}.profileSocial-feed{background:#fff}.profileSocial-profile{background:#fff}.profileSocial-muslimeen{background:#fff}.profileSocialTop{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px clamp(10px,3vw,28px);background:#fffffff5;border-bottom:1px solid #dce5ef;box-shadow:0 3px 15px #17385712;backdrop-filter:blur(12px)}.profileSocialTabs{display:flex;gap:6px;min-width:0;overflow-x:auto}.profileSocialTabs button,.profileMessengerTrigger{border:1px solid #d4e0ef;background:#f7faff;color:#28486a;padding:12px 15px;border-radius:13px;font-weight:750;white-space:nowrap;min-width:86px}.profileSocialTabs button[aria-current=page]{background:#245b95;color:#fff}.profileSocial-feed .profileSocialTabs button[aria-current=page]{background:#245b95}.profileSocial-muslimeen .profileSocialTabs button[aria-current=page]{background:#245b95}.profileMessengerTrigger{background:#152437;color:#fff;min-width:auto}.profileSocialHome{display:flex;align-items:center;justify-content:center;flex:0 0 42px;height:44px;border:1px solid #d4e0ef;border-radius:13px;background:#f7faff;color:#245b95;text-decoration:none}.profileSocialHome svg,.profileMessengerTrigger svg{width:21px;height:21px;display:block}.profileMessengerTrigger{display:flex;align-items:center;justify-content:center;gap:7px}.profileSocialTabs{flex:1;scrollbar-width:none}.profileSocialTabs::-webkit-scrollbar{display:none}@media(max-width:480px){.profileSocialTop{gap:6px;padding:9px 8px}.profileSocialHome{flex-basis:39px;height:42px}.profileSocialTabs button{min-width:auto;padding:11px 10px;font-size:12px}.profileMessengerTrigger{padding:11px;min-width:42px}.profileMessengerTrigger span{display:none}}.profileSocialTop{justify-content:initial}.profileSocialHome,.profileMessengerTrigger{flex:0 0 48px;min-width:48px;height:48px;box-sizing:border-box}.profileSocialTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;flex:1;overflow:visible}.profileSocialTabs button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;height:48px;padding:0;box-sizing:border-box}.profileSocialTabs svg{width:23px;height:23px;display:block}.profileSocialHome svg,.profileMessengerTrigger svg{width:23px;height:23px}.profileMessengerTrigger span{display:none}@media(max-width:480px){.profileSocialTop{gap:8px;padding:10px 12px}.profileSocialHome,.profileMessengerTrigger{flex-basis:44px;min-width:44px;height:44px}.profileSocialTabs{gap:8px}.profileSocialTabs button{height:44px;padding:0}.profileSocialTabs svg{width:22px;height:22px}}.profileSocialContent{max-width:1050px;margin:20px auto;padding:clamp(14px,3vw,26px);background:#fff;border:1px solid #dce5f0;border-radius:22px;box-shadow:0 9px 28px #203e6017}.profileSocialContent>header h1{margin:0;font-size:27px;color:#183859}.profileSocialContent>header p{color:#667d96}.profileSocialItem{background:#fff;border:1px solid #e1eaf3;box-shadow:0 4px 15px #203e6010;border-radius:17px;padding:18px;margin:12px 0;display:grid;gap:10px}.profileSocialItem>button{border:0;background:transparent;text-align:left;color:#245b95;font-weight:800}.profileSocialItem p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.profileSocialItem a,.profileSocialMemberDetail>a{color:#245b95;font-weight:700}.profileSocialMembers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.profileSocialMembers button{display:grid;gap:8px;text-align:left;background:#fff;border:1px solid #dce5f0;border-radius:16px;padding:18px;box-shadow:0 4px 14px #203e6010}.profileSocialMembers span{color:#245b95}.profileSocialMembers small{color:#718399}.profileSocialSearch{display:grid;gap:7px;font-weight:700;color:#28486a}.profileSocialSearch input{padding:13px;border:1px solid #c9d9e9;border-radius:12px}.profileSocialBack{border:0;background:#f4e9c8;color:#775c21;border-radius:12px;padding:10px;margin-top:14px}.profileMessengerBackdrop{position:fixed;inset:0;z-index:100;background:#07121e66;display:flex;justify-content:flex-end}.profileMessengerDrawer{height:100%;width:min(400px,95vw);background:#111b2a;color:white;padding:22px;box-shadow:-12px 0 35px #0005;display:flex;flex-direction:column;gap:16px}.profileMessengerDrawer header{display:flex;justify-content:space-between}.profileMessengerDrawer header button{background:transparent;border:0;color:white;font-size:22px}.profileMessengerDrawer a{color:#fff;background:#263b55;border-radius:14px;padding:16px;text-decoration:none}@media(max-width:570px){.profileSocialTop{padding:9px 7px}.profileSocialTabs button{font-size:12px;min-width:0;padding:10px}.profileMessengerTrigger{padding:10px;font-size:12px}.profileMessengerTrigger span{display:none}.profileSocialMembers{grid-template-columns:1fr}}
.profileSocialFeedFrame{width:100%;max-width:1100px;margin:0 auto;padding:0 8px 24px}.profileSocialCommunityEmbed{display:block;width:100%;height:min(85vh,1050px);min-height:650px;border:0;border-radius:20px;background:#f2eee5}.profileSocialFeedFooter{padding:12px;text-align:right}.profileSocialFeedFooter a{color:#245b95;font-weight:750}@media(max-width:570px){.profileSocialFeedFrame{padding:0 0 15px}.profileSocialCommunityEmbed{border-radius:0;height:calc(100dvh - 100px);min-height:580px}}
.profileMessengerDrawer{width:min(520px,100vw)!important;padding:12px!important}.profileMessengerDrawer>header{flex:0 0 auto;align-items:center;padding:0 8px}.profileMessengerDrawer>header h2{font-size:18px;margin:8px 0}.profileMessengerFrame{width:100%;flex:1 1 auto;min-height:0;border:0;border-radius:12px;background:#f3efe6}.profileMessengerFullLink{flex:0 0 auto;text-align:center;padding:10px!important;font-size:13px}@media(max-width:570px){.profileMessengerDrawer{padding:7px!important}.profileMessengerFrame{border-radius:8px}}

/* Compact profile command redesign: preserve editor sections and data bindings. */
.profileCommandPage .profileEditorToolbar{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;padding:14px 18px!important;margin:10px 0!important;border:1px solid #cad5e3!important;border-radius:20px!important;background:#fff!important;box-shadow:0 10px 24px #182f4b12!important;color:#193553!important}
.profileCommandPage .profileEditorToolbar .ghost{font-size:13px!important;padding:9px 12px!important;border:1px solid #c9d5e2!important;border-radius:12px!important;color:#244768!important;background:#f7f9fc!important}
.profileEditorNav{padding:10px 12px 4px;margin:12px 0 18px;border:1px solid #d3deeb;border-radius:20px;background:#fff;box-shadow:0 12px 28px #1d385017}
.profileCommandPage .profileEditorNav .profileTabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;scroll-snap-type:x mandatory!important;padding:7px 2px 10px!important;scrollbar-width:none!important}
.profileCommandPage .profileEditorNav .profileTabs button{flex:0 0 auto!important;min-width:112px!important;padding:12px 16px!important;border-radius:13px!important;scroll-snap-align:start!important;white-space:nowrap!important;box-shadow:none!important}
.profileNavHint{font-size:11px;color:#70839a;text-align:center;margin:2px 0 8px}
.profileBadgeEditor{margin:10px 0;padding:10px;border-radius:18px;background:#fff;border:1px solid #d8e2ed}
.profileCommandPage .avatarChoiceGrid{display:flex!important;grid-template-columns:none!important;overflow-x:auto!important;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory!important;gap:12px!important;padding:10px 4px 18px!important;scrollbar-width:thin}
.profileCommandPage .avatarChoiceGrid .avatarChoice{flex:0 0 clamp(148px,44vw,200px)!important;scroll-snap-align:start!important;min-width:0!important}
.profileCommandPage .avatarChoiceGrid .avatarChoice img{width:100%!important;aspect-ratio:1!important;object-fit:cover!important}
.profileCommandPage .profileHero{padding:18px!important;margin-bottom:12px!important}
.profileCommandPage .profileHeroActions{gap:10px!important}
@media(max-width:600px){.profileCommandPage .profileEditorToolbar{padding:12px!important}.profileCommandPage .profileHeroActions{display:flex!important;flex-wrap:wrap!important}.profileCommandPage .profileEditorNav .profileTabs button{min-width:108px!important}.profileCommandPage .profileEditor{padding:18px!important}}
`}</style></ProfileSocialHub></main>;
}

