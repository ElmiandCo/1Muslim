"use client";

import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import AnimatedMuslimBrand from "../components/AnimatedMuslimBrand";
import ProfileCinematicPosts from "../components/ProfileCinematicPosts";
import SearchFeatureRails from "../search/SearchFeatureRails";
import ProfileImmersiveStage,{type ProfileSearchRequest} from "./ProfileImmersiveStage";
import "../search/search-feature-rails.css";
import "./profile-search-home.css";

type Identity={
  id:string;display_name:string;username:string|null;hide_1muslim_id?:boolean|null;bio:string|null;gender:string|null;
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
type ProfileSpeechEvent={results:ArrayLike<{0:{transcript:string};isFinal:boolean}>};
type ProfileSpeechRecognition={
 lang:string;interimResults:boolean;continuous:boolean;
 onresult:((event:ProfileSpeechEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;abort:()=>void;
};
type ProfileVoiceWindow=Window&{SpeechRecognition?:new()=>ProfileSpeechRecognition;webkitSpeechRecognition?:new()=>ProfileSpeechRecognition};

export default function ProfileSearchHome({profile,postCount,expanded,editing,onExpand,onCollapse,onEdit,onSettings,onPosts,onSignOut}:Props){
  const [search,setSearch]=useState("");
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [stageRequest,setStageRequest]=useState<ProfileSearchRequest|null>(null);
  const [micListening,setMicListening]=useState(false);
  const [micError,setMicError]=useState("");
  const requestToken=useRef(0);
  const speechSession=useRef<ProfileSpeechRecognition|null>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const [arrival,setArrival]=useState(false);
  const railRoot=useRef<HTMLDivElement>(null);
  const pauseUntil=useRef(0);
  const touchStart=useRef<number|null>(null);
  useEffect(()=>{
    let fresh=false;
    try{fresh=sessionStorage.getItem("1muslim:profile-arrival")==="1"||new URLSearchParams(window.location.search).get("arrival")==="1";sessionStorage.removeItem("1muslim:profile-arrival");if(new URLSearchParams(window.location.search).has("arrival"))window.history.replaceState(null,"","/profile")}catch{}
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
  const runStage=(mode:"search"|"hudhud",inputText:string)=>{
    const query=inputText.trim().slice(0,900);
    if(!query)return;
    setSearch(query);setMicError("");
    searchInput.current?.blur();
    setStageRequest({token:++requestToken.current,query,mode});
  };
  const stopSpeech=()=>{
    const active=speechSession.current;speechSession.current=null;
    if(active){active.onend=null;active.onerror=null;active.onresult=null;try{active.abort()}catch{}}
    setMicListening(false);
  };
  useEffect(()=>()=>{const active=speechSession.current;if(active)try{active.abort()}catch{}},[]);
  const speak=()=>{
    if(speechSession.current){stopSpeech();return}
    const host=window as ProfileVoiceWindow;
    const Speech=host.SpeechRecognition||host.webkitSpeechRecognition;
    if(!Speech){setMicError("Speech recognition isn't supported here. Please type your question.");return}
    setMicError("");
    try{
      const active=new Speech();let heard="";
      active.lang="en-US";active.interimResults=true;active.continuous=false;
      active.onresult=event=>{
        let text="",done=false;
        for(let i=0;i<event.results.length;i++){
          text+=(event.results[i][0]?.transcript||"")+" ";
          if(event.results[i].isFinal)done=true;
        }
        heard=text.trim();setSearch(heard);
        if(done&&heard.length>2)try{active.stop()}catch{}
      };
      active.onerror=event=>{
        if(speechSession.current!==active)return;
        speechSession.current=null;setMicListening(false);
        if(event.error!=="no-speech"&&event.error!=="aborted")
          setMicError(event.error==="not-allowed"?"Allow microphone access to speak to HudHud.":"Voice recognition stopped. Try typing instead.");
      };
      active.onend=()=>{
        if(speechSession.current!==active)return;
        speechSession.current=null;setMicListening(false);
        if(heard.length>2)runStage("hudhud",heard);
      };
      active.start();speechSession.current=active;setMicListening(true);
    }catch{
      setMicError("Tap the microphone again or type your question.");
      setMicListening(false);
    }
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    runStage("search",search);
  };
  const location=[profile.city,profile.state,profile.country].filter(Boolean).join(", ");
  return <section className={"profileSearchHome dsHomeMode"+(arrival?" isArriving":"")+(expanded||editing?" hasOpenPanel":"")} aria-label="Your personalized One Muslim Search Home">
    <div className="profileSearchUtilities" aria-label="One Muslim header and account controls">
      <Link href="/search" className="profileSearchBrand" aria-label="One Muslim.Live search home"><AnimatedMuslimBrand/><span className="profileSearchLive" aria-hidden="true">.Live</span></Link>
      <div className="profileSearchUtilityActions">
        <button type="button" className="profileSearchOrb" onClick={onSettings} aria-label="Profile settings" title="Profile settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.4 1.6.9 2.4-.7 2 3.5-1.8 1.7v1.9l1.8 1.7-2 3.5-2.4-.7-1.6.9L14 20h-4l-.6-2.4-1.6-.9-2.4.7-2-3.5 1.8-1.7v-1.9L3.4 8.6l2-3.5 2.4.7 1.6-.9L10 2Z"/></svg>
        </button>
        <button type="button" className="profileSearchOrb" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg>
        </button>
      </div>
    </div>
    <div className="profileSearchCentered">
      <div className="profileSearchEntry">
        <form className="profileSearchField" role="search" onSubmit={submit}>
          <button type="submit" className="profileSearchSubmit" aria-label="Search from your profile">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/></svg>
          </button>
          <input ref={searchInput} aria-label="Search One Muslim" type="search" autoComplete="off" placeholder="Search with HudHud" value={search} onChange={e=>setSearch(e.target.value)}/>
          <button type="button" className={"profileSearchHud"+(micListening?" isListening":"")} aria-label={micListening?"Stop HudHud microphone":search.trim()?"Ask HudHud this question":"Speak with HudHud"} aria-pressed={micListening}
            onClick={()=>search.trim()?runStage("hudhud",search):speak()}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 1.8 7.3L21 12l-7.2 2.7L12 22l-1.8-7.3L3 12l7.2-2.7L12 2Z"/><path d="m19.5 3.7.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5.5-1.6Z"/></svg></button>
          <button type="button" className="profileSearchAvatarControl" onClick={expanded||editing?onCollapse:()=>setDetailsOpen(o=>!o)} aria-label={expanded||editing?"Return to search profile":detailsOpen?"Collapse profile details":"Show your profile details"} title="My profile">
            <img className="profileSearchCurrentAvatar" src={avatarFor(profile)} alt=""/>
          </button>
        </form>
      </div>
      {micListening&&<span role="status" className="profileSearchMicStatus">Listening…</span>}
      {micError&&<p className="profileSearchMicError" role="alert">{micError}</p>}
    </div>
    {!expanded&&!editing&&<ProfileImmersiveStage request={stageRequest}/>}
    {!expanded&&!editing&&<div className="profileSearchPersonal">
      <div className="profileSearchStoryHeading"><span>Your posts</span><button type="button" onClick={onPosts} className="profileSearchAdd" aria-label="Open posts and add a post" title="Add a post">+</button></div>
      <div ref={railRoot} className="profileSearchStoryRail" onTouchStart={()=>{pauseUntil.current=Date.now()+7000}} onPointerDown={()=>{pauseUntil.current=Date.now()+7000}}>
        <ProfileCinematicPosts profileId={profile.id} feedMode="own" limit={16}/>
      </div>
      <div className="profileSearchIdentity">
        <button type="button" className="profileSearchDrag" aria-expanded={detailsOpen} aria-controls="profile-search-identity-details" onClick={()=>setDetailsOpen(o=>!o)} onTouchStart={e=>{touchStart.current=e.touches[0]?.clientY??null}} onTouchEnd={e=>{const from=touchStart.current;touchStart.current=null;const to=e.changedTouches[0]?.clientY;if(from!==null&&to!==undefined&&Math.abs(to-from)>35){e.preventDefault();setDetailsOpen(to>from)}}} aria-label={detailsOpen?"Collapse your profile information":"Expand your profile information"}>
          <span aria-hidden="true"/>
          <small>{detailsOpen?"Hide details":"Show details"}</small>
        </button>
        <div className={"profileSearchIdentityDetails"+(detailsOpen?" isOpen":"")} id="profile-search-identity-details" aria-hidden={!detailsOpen}>
          <h2>{profile.display_name||"1Muslim member"}{profile.shahada_verified_at&&<span className="profileSearchVerified" title="Shahada verified" aria-label="Verified">✓</span>}</h2>
          {profile.username&&!profile.hide_1muslim_id&&<p className="profileSearchHandle">@{profile.username}</p>}
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
