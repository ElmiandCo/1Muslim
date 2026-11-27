"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import AnimatedMuslimBrand from "../components/AnimatedMuslimBrand";
import ProfileCinematicPosts from "../components/ProfileCinematicPosts";
import SearchFeatureRails from "../search/SearchFeatureRails";
import "../search/search-feature-rails.css";
import "./profile-search-home.css";

type Identity={
  id:string;display_name:string;username:string|null;bio:string|null;gender:string|null;
  avatar_gender:string;avatar_config:Record<string,unknown>;city:string|null;state:string|null;country:string|null;
  xp_total:number;shahada_verified_at:string|null;
};
type Props={
  profile:Identity;postCount:number;expanded:boolean;editing:boolean;
  onExpand:()=>void;onCollapse:()=>void;onEdit:()=>void;onSettings:()=>void;onPosts:()=>void;onSignOut:()=>void;
};

function avatarFor(profile:Identity){
  const config=profile.avatar_config||{};
  const choices=[config.adminAvatarUrl,config.customAvatarUrl,config.selectedAvatarUrl,config.avatarUrl];
  const selected=choices.find(url=>typeof url==="string"&&(/^(https:\/\/|\/assets\/avatars\/)/).test(url));
  if(typeof selected==="string")return selected;
  return profile.avatar_gender==="female"||profile.gender==="female"
    ?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg";
}
const reducedMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ProfileSearchHome({profile,postCount,expanded,editing,onExpand,onCollapse,onEdit,onSettings,onPosts,onSignOut}:Props){
  const router=useRouter();
  const [search,setSearch]=useState("");
  const [detailsOpen,setDetailsOpen]=useState(true);
  const [arrival,setArrival]=useState(false);
  const railRoot=useRef<HTMLDivElement>(null);
  const pauseUntil=useRef(0);
  const touchStart=useRef<number|null>(null);
  useEffect(()=>{
    let fresh=false;
    try{fresh=sessionStorage.getItem("1muslim:profile-arrival")==="1";sessionStorage.removeItem("1muslim:profile-arrival")}catch{}
    if(!fresh||reducedMotion())return;
    setArrival(true);
    const id=window.setTimeout(()=>setArrival(false),800);
    return()=>window.clearTimeout(id);
  },[]);
  useEffect(()=>{
    if(expanded||editing||reducedMotion())return;
    const id=window.setInterval(()=>{
      const rail=railRoot.current?.querySelector<HTMLElement>(".profileCinematicGrid");
      if(!rail||document.hidden||Date.now()<pauseUntil.current||rail.scrollWidth<=rail.clientWidth+8)return;
      if(rail.contains(document.activeElement)||rail.matches(":hover"))return;
      if(rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-16)rail.scrollTo({left:0,behavior:"smooth"});
      else rail.scrollBy({left:116,behavior:"smooth"});
    },3500);
    return()=>window.clearInterval(id);
  },[expanded,editing]);
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(search.trim())router.push("/search?q="+encodeURIComponent(search.trim()));
    else router.push("/search");
  };
  const location=[profile.city,profile.state,profile.country].filter(Boolean).join(", ");
  return <section className={"profileSearchHome"+(arrival?" isArriving":"")+(expanded||editing?" hasOpenPanel":"")} aria-label="Your personalized One Muslim Search Home">
    <div className="profileSearchUtilities" aria-label="Account controls">
      <button type="button" className="profileSearchOrb profileSearchAccountOrb" onClick={expanded||editing?onCollapse:()=>setDetailsOpen(o=>!o)} aria-label={expanded||editing?"Return to your profile search home":detailsOpen?"Collapse profile details":"Show profile details"} title="My profile">
        <img src={avatarFor(profile)} alt=""/>
      </button>
      <button type="button" className="profileSearchOrb" onClick={onSettings} aria-label="Profile settings" title="Profile settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.4 1.6.9 2.4-.7 2 3.5-1.8 1.7v1.9l1.8 1.7-2 3.5-2.4-.7-1.6.9L14 20h-4l-.6-2.4-1.6-.9-2.4.7-2-3.5 1.8-1.7v-1.9L3.4 8.6l2-3.5 2.4.7 1.6-.9L10 2Z"/></svg>
      </button>
      <button type="button" className="profileSearchOrb" onClick={onSignOut} aria-label="Sign out" title="Sign out">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg>
      </button>
    </div>
    <div className="profileSearchCentered">
      <Link href="/search" className="profileSearchBrand" aria-label="One Muslim.Live search home"><AnimatedMuslimBrand/><span className="profileSearchLive" aria-hidden="true">.Live</span></Link>
      <div className="profileSearchEntry">
        <form className="profileSearchField" role="search" onSubmit={submit}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/></svg>
          <input aria-label="Search One Muslim" type="search" autoComplete="off" placeholder="Search with HudHud" value={search} onChange={e=>setSearch(e.target.value)}/>
          <button type="button" className="profileSearchHud" aria-label="Open HudHud" onClick={()=>router.push("/hudhud"+(search.trim()?"?q="+encodeURIComponent(search.trim()):""))}><img src="/assets/hudhud-logo.PNG" alt=""/></button>
        </form>
        <span className="profileSearchAvatarChange" aria-label="Your profile avatar">
          {arrival&&<img className="profileSearchPreviousAvatar" src="/assets/hudhud-logo.PNG" alt=""/>}
          <img className="profileSearchCurrentAvatar" src={avatarFor(profile)} alt=""/>
        </span>
      </div>
    </div>
    {!expanded&&!editing&&<div className="profileSearchPersonal">
      <div className="profileSearchStoryHeading"><span>Your posts</span><button type="button" onClick={onPosts} className="profileSearchAdd" aria-label="Open posts and add a post" title="Add a post">+</button></div>
      <div ref={railRoot} className="profileSearchStoryRail" onTouchStart={()=>{pauseUntil.current=Date.now()+7000}} onPointerDown={()=>{pauseUntil.current=Date.now()+7000}}>
        <ProfileCinematicPosts profileId={profile.id} feedMode="own" limit={16}/>
      </div>
      <div className="profileSearchIdentity">
        <button type="button" className="profileSearchDrag" aria-expanded={detailsOpen} aria-controls="profile-search-identity-details" onClick={()=>setDetailsOpen(o=>!o)} onTouchStart={e=>{touchStart.current=e.touches[0]?.clientY??null}} onTouchEnd={e=>{const from=touchStart.current;touchStart.current=null;const to=e.changedTouches[0]?.clientY;if(from!==null&&to!==undefined&&Math.abs(to-from)>35)setDetailsOpen(to>from)}} aria-label={detailsOpen?"Collapse your profile information":"Expand your profile information"}>
          <span aria-hidden="true"/>
          <small>{detailsOpen?"Hide details":"Show details"}</small>
        </button>
        <div className={"profileSearchIdentityDetails"+(detailsOpen?" isOpen":"")} id="profile-search-identity-details" aria-hidden={!detailsOpen}>
          <h2>{profile.display_name||"1Muslim member"}{profile.shahada_verified_at&&<span className="profileSearchVerified" title="Shahada verified" aria-label="Verified">✓</span>}</h2>
          {profile.username&&<p className="profileSearchHandle">@{profile.username}</p>}
          {profile.bio&&<p className="profileSearchBio">{profile.bio}</p>}
          {location&&<p className="profileSearchLocation">{location}</p>}
          <div className="profileSearchStats"><span><strong>{postCount}</strong> Posts</span><span><strong>{Number(profile.xp_total||0).toLocaleString()}</strong> XP</span></div>
          <div className="profileSearchActions">
            <button type="button" onClick={onEdit}>Edit profile</button>
            <button type="button" onClick={onExpand}>View all profile features <span aria-hidden="true">↗</span></button>
          </div>
        </div>
      </div>
    </div>}
    {!expanded&&!editing&&<div className="profileSearchFullRail"><SearchFeatureRails/></div>}
    {(expanded||editing)&&<button className="profileSearchReturn" onClick={onCollapse} type="button">‹ Back to Search Profile</button>}
  </section>;
}
