"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "../../utils/supabase/client";
import ProfileAvatar from "./ProfileAvatar";

const exploreGroups = [
  { title: "Learn", items: [
    { label: "Learn", ar: "تعلّم", href: "/#paths" },
    { label: "Elm Tent", ar: "الخيمة", href: "/learn/elm-tent" },
    { label: "Qur’an Studio", ar: "القرآن", href: "/quran-studio" },
    { label: "Videos", ar: "الفيديوهات", href: "/streaming/library" },
    { label: "1Muslim Videos", ar: "مقاطع", href: "/videos" },
  ]},
  { title: "Community", items: [
    { label: "Community", ar: "المجتمع", href: "/community" },
    { label: "Maps", ar: "خرائط", href: "/maps" },
    { label: "Ashab", ar: "أصحاب", href: "/ashab" },
    { label: "Find People", ar: "بحث", href: "/find" },
  ]},
];

const liveItems = [
  { label: "Live Now", ar: "مباشر", href: "/streaming" },
  { label: "Go Live", ar: "ابدأ البث", href: "/streaming/go-live" },
  { label: "Audio Rooms", ar: "غرف صوتية", href: "/audio-rooms" },
  { label: "Group Calls", ar: "مكالمات جماعية", href: "/messages/groups" },
  { label: "Recordings", ar: "التسجيلات", href: "/streaming/library" },
];

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const isLight = localStorage.getItem("1muslim-theme") === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("1muslim-theme", next ? "light" : "dark");
    window.dispatchEvent(new Event("1muslim:theme-changed"));
  };
  return <button className="themeToggle" onClick={toggle} aria-label={light ? "Switch to night mode" : "Switch to day mode"}>{light ? "☾ Night" : "☀ Day"}</button>;
}

type NavUser = {
  id: string; email?: string; display_name?: string; username?: string;
  gender?: string | null; avatar_gender?: string | null; avatar_package?: string | null;
  avatar_config?: Record<string, unknown> | null; profile_accent?: string | null;
  arabic_terms_enabled?: boolean;
};

function MenuLink({ href, label, ar, onClick }: { href: string; label: ReactNode; ar?: string; onClick?: () => void }) {
  return <Link href={href} onClick={onClick}><span>{label}</span>{ar && <small>{ar}</small>}</Link>;
}

export default function SiteNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [smartInput,setSmartInput]=useState<HTMLElement|null>(null);
  const [smartIntro,setSmartIntro]=useState(false);
  const [smartReady,setSmartReady]=useState(false);
  const [dailyDone,setDailyDone]=useState(false);
  useEffect(()=>{const onStatus=(e:Event)=>setDailyDone(Boolean((e as CustomEvent<{used:boolean}>).detail?.used));window.addEventListener("hudhud-daily-status",onStatus);return()=>window.removeEventListener("hudhud-daily-status",onStatus)},[]);
  useEffect(()=>{
    const editable=(el:Element|null):HTMLElement|null=>{if(!(el instanceof HTMLElement))return null;if(el.matches('textarea,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),[contenteditable="true"]'))return el;return el.closest('[contenteditable="true"]') as HTMLElement|null};
    const sync=()=>{const el=editable(document.activeElement);if(el&&!el.closest(".muslimMobileDock")){setSmartInput(el);setSmartReady(Boolean((el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement?el.value:el.textContent)?.trim()))}else{setSmartInput(null);setSmartReady(false)}};
    const onInput=()=>sync();
    const onFocus=()=>sync();
    document.addEventListener("focusin",onFocus);document.addEventListener("input",onInput);
    document.addEventListener("focusout",()=>setTimeout(sync,0));
    return()=>{document.removeEventListener("focusin",onFocus);document.removeEventListener("input",onInput)};
  },[pathname]);
  const isVideoPage=pathname==="/videos"||pathname.startsWith("/videos/")||pathname.startsWith("/streaming/library");
  const isReplay=pathname.startsWith("/streaming/replay/")||pathname.startsWith("/streaming/recordings/");
  const isLiveWatch=pathname.startsWith("/streaming/live/")||pathname.startsWith("/streaming/watch/");
  const isLiveHost=pathname==="/streaming/go-live";
  const isProfile=pathname.startsWith("/profile")||pathname.startsWith("/users/")||pathname.startsWith("/member/");
  const smartLabel=smartInput&&smartReady?"Send":isLiveHost?"Go Live":isLiveWatch?"Chat":isReplay?"Comment":isVideoPage?"Videos":pathname==="/community"?(dailyDone?"Daily Done":"Daily Post"):pathname.startsWith("/learn")||pathname.startsWith("/elm-tent")||pathname==="/quran-studio"?"Qur’an":isProfile?"Share":"Ummah";
  const routerSmart=(href:string)=>{window.location.assign(href)};
  const smartTap=()=>{
    if(smartInput?.isConnected&&smartReady){
      const form=smartInput.closest("form");
      if(form){form.requestSubmit();return}
      const scope=smartInput.closest('[role="dialog"],section,article,main')||document;
      const buttons=Array.from(scope.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
      const send=buttons.find(b=>/^(send|post|publish|reply|share|submit)(\b|\s|$)/i.test((b.textContent||"").trim().replace(/^[^\w]+/,"")));
      if(send){send.click();return}
    }
    if(isLiveWatch||isReplay){
      const field=document.querySelector<HTMLElement>('textarea[placeholder*="comment" i],input[placeholder*="comment" i],textarea[placeholder*="chat" i],input[placeholder*="message" i]');
      if(field){field.focus();field.scrollIntoView({behavior:"smooth",block:"center"});return}
      return;
    }
    if(isVideoPage){routerSmart("/streaming/library");return}
    if(pathname==="/community"){
      if(dailyDone)return;
      try{sessionStorage.setItem("1muslim-compose-mode","daily")}catch{}
      routerSmart("/?compose=1");return;
    }
    if(pathname.startsWith("/learn")||pathname==="/quran-studio"||pathname.startsWith("/elm-tent")){routerSmart("/quran-studio");return}
    if(isProfile){
      const composer=document.querySelector<HTMLElement>('.firstPostComposer textarea,.composer textarea,textarea[placeholder*="post" i]');
      if(composer){composer.focus();composer.scrollIntoView({behavior:"smooth",block:"center"});return}
      const profileId=pathname.split("/")[2];
      const url=location.origin+(profileId?"/profile/"+profileId:"/profile");
      if(navigator.share)void navigator.share({title:"1Muslim Profile",url}).catch(()=>{});
      else void navigator.clipboard.writeText(url).catch(()=>{});
      return;
    }
    routerSmart("/community");
  };
  useEffect(()=>{if(pathname!=="/")return;try{if(localStorage.getItem("1muslim-smart-tap-intro"))return;const t=setTimeout(()=>{window.dispatchEvent(new CustomEvent("hudhud-smart-tap-intro",{detail:{message:"🌀 Smart-Tap: The center HudHud button changes with your page. Open Ummah, create a Daily Post, jump into Qur’an Studio, or send what you're writing!"}}));localStorage.setItem("1muslim-smart-tap-intro","1")},1800);return()=>clearTimeout(t)}catch{}},[pathname]);

  const [voiceRecording,setVoiceRecording]=useState(false);
  useEffect(()=>{const fn=(e:Event)=>setVoiceRecording(Boolean((e as CustomEvent<{recording:boolean}>).detail?.recording));window.addEventListener("1muslim:recorder-status",fn);return()=>window.removeEventListener("1muslim:recorder-status",fn)},[]);
  const [goLiveReady,setGoLiveReady]=useState(false);
  useEffect(()=>{const onReady=(event:Event)=>setGoLiveReady(Boolean((event as CustomEvent<{ready:boolean}>).detail?.ready));window.addEventListener("1muslim:go-live-ready",onReady);if(pathname!=="/streaming/go-live")setGoLiveReady(false);return()=>window.removeEventListener("1muslim:go-live-ready",onReady)},[pathname]);
  const [dockMounted, setDockMounted] = useState(false);
  useEffect(() => setDockMounted(true), []);
  const [wakeUp, setWakeUp] = useState(false);
  const [exploreHint, setExploreHint] = useState(false);
  const wakeLastY = useRef(0);
  const wakeDistance = useRef(0);
  const [user, setUser] = useState<NavUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anyoneLive, setAnyoneLive] = useState(false);
  const [openMenu, setOpenMenu] = useState<"explore" | "live" | "mobile" | "hudhud" | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const [navHidden,setNavHidden]=useState(false);
  const [pageGlow,setPageGlow]=useState(false);
  useEffect(()=>{setNavHidden(false);setPageGlow(true);const t=setTimeout(()=>setPageGlow(false),1100);return()=>clearTimeout(t)},[pathname]);
  useEffect(()=>{let last=window.scrollY;const onScroll=()=>{const y=window.scrollY;const delta=y-last;if(y<36)setNavHidden(false);else if(Math.abs(delta)>7&&openMenu!=="mobile")setNavHidden(delta>0);last=y};window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[openMenu]);
  const [mobilePanelVisible,setMobilePanelVisible]=useState(false);
  useEffect(()=>{if(openMenu==="mobile")setMobilePanelVisible(true);else if(mobilePanelVisible){const timer=window.setTimeout(()=>setMobilePanelVisible(false),850);return()=>window.clearTimeout(timer)}},[openMenu,mobilePanelVisible]);
  useEffect(()=>{document.body.classList.toggle("oneMuslimNavExpanded",openMenu==="mobile");return()=>document.body.classList.remove("oneMuslimNavExpanded")},[openMenu]);

  useEffect(() => {
    const supabase = createClient(); let mounted = true;
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!authUser) { setUser(null); setUnreadCount(0); setLoadingAuth(false); return; }
      const { data: profile } = await supabase.from("profiles")
        .select("display_name,username,gender,avatar_gender,avatar_package,avatar_config,profile_accent,arabic_terms_enabled")
        .eq("id", authUser.id).maybeSingle();
      if (!mounted) return;
      setUser({
        id: authUser.id, email: authUser.email ?? undefined,
        display_name: profile?.display_name ?? undefined, username: profile?.username ?? undefined,
        gender: profile?.gender ?? null, avatar_gender: profile?.avatar_gender ?? null,
        avatar_package: profile?.avatar_package ?? null, avatar_config: profile?.avatar_config ?? null,
        profile_accent: profile?.profile_accent ?? null, arabic_terms_enabled: !!profile?.arabic_terms_enabled,
      });
      setLoadingAuth(false);
    };
    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadUser(); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const s = createClient();
    const loadUnread = async () => {
      const { count } = await s.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
      setUnreadCount(count ?? 0);
    };
    void loadUnread();
    const timer = window.setInterval(() => void loadUnread(), 8000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const checkLive = async () => {
      const { data, error } = await supabase.from("live_streams")
        .select("id").eq("status", "live")
        .gte("last_heartbeat_at", new Date(Date.now() - 60_000).toISOString())
        .limit(1);
      if (mounted && !error) setAnyoneLive((data?.length ?? 0) > 0);
    };
    void checkLive();
    const interval = window.setInterval(() => void checkLive(), 10000);
    const onVisible = () => { if (document.visibilityState === "visible") void checkLive(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { mounted = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  useEffect(() => {
    const outside = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = openMenu === "mobile" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openMenu]);

  // Wake Up Call #1: a subtle, scroll-driven pulse for signed-out mobile visitors.
  // Never intercept touches or block scrolling. Fade out shortly after scrolling stops.
  useEffect(() => {
    if (loadingAuth || user || pathname.startsWith("/auth") || pathname.startsWith("/onboarding") || openMenu === "mobile") {
      setWakeUp(false);
      return;
    }
    if (!window.matchMedia("(max-width: 700px)").matches) return;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let pulseTimer: ReturnType<typeof setTimeout> | undefined;
    wakeLastY.current = window.scrollY;
    const scroll = () => {
      const y = window.scrollY;
      const delta = Math.abs(y - wakeLastY.current);
      wakeLastY.current = y;
      if (delta < 1) return;
      wakeDistance.current += delta;
      if (wakeDistance.current >= 260) {
        wakeDistance.current %= 260;
        setWakeUp(true);
        if (pulseTimer) clearTimeout(pulseTimer);
        pulseTimer = setTimeout(() => setWakeUp(false), 320);
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setWakeUp(false);
        wakeDistance.current = 0;
        if (pulseTimer) clearTimeout(pulseTimer);
      }, 180);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      if (idleTimer) clearTimeout(idleTimer);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, [loadingAuth, user, pathname, openMenu]);
  useEffect(() => { if (user) setWakeUp(false); }, [user]);

  // A quiet invitation to explore on the homepage; independent of scroll pulses.
  useEffect(() => {
    if (loadingAuth || user || pathname !== "/" || openMenu === "mobile") { setExploreHint(false); return; }
    if (!window.matchMedia("(max-width: 700px)").matches) return;
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem("1muslim-explore-hint") === "1"; } catch {}
    if (alreadyShown) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const show = setTimeout(() => {
      if (window.scrollY > 500) return;
      setExploreHint(true);
      try { sessionStorage.setItem("1muslim-explore-hint", "1"); } catch {}
      hide = setTimeout(() => setExploreHint(false), 3800);
    }, 3200);
    const onScroll = () => { if (window.scrollY > 500) setExploreHint(false); };
    window.addEventListener("scroll", onScroll, {passive:true});
    return () => { clearTimeout(show); if (hide) clearTimeout(hide); window.removeEventListener("scroll", onScroll); };
  }, [loadingAuth, user, pathname, openMenu]);

  const accountLabel = user?.display_name || (user?.username ? "@" + user.username : user?.email?.split("@")[0]) || "My account";
  const closeMenu = () => setOpenMenu(null);
  const signOut = async () => { await createClient().auth.signOut(); window.location.href = "/"; };
  const label = (text: string, ar: string) => user?.arabic_terms_enabled ? <>{text} <span className="arabicNav">{ar}</span></> : text;

  return <header ref={navRef} className={`${compact ? "siteNav compact" : "siteNav"} muslimTopGlass ${navHidden && !openMenu ? "muslimTopHidden" : ""} ${pageGlow ? "muslimPageGlow" : ""}`}>
    <button type="button" className="siteBrand hudhudTopOrb" aria-label="HudHud Mode menu" aria-expanded={openMenu==="hudhud"} onClick={()=>{setWakeUp(false);setOpenMenu(openMenu==="hudhud"?null:"hudhud")}}><img src="/assets/hudhud-logo.PNG" alt="" /><span className="hudhudTopGlow" aria-hidden="true"/></button>

    {openMenu==="hudhud"&&<div className="hudhudModeMenu" role="menu" aria-label="HudHud Mode quick actions">
      <div className="hudhudModeTitle"><span className="hudhudModeSpark">✦</span><strong>HUDHUD MODE</strong><button type="button" onClick={closeMenu} aria-label="Close HudHud Mode">×</button></div>
      <p className="hudhudModeHint">Your illuminated shortcuts</p>
      {[
        {icon:"◉",title:"Go Live",href:"/streaming/go-live",ar:"بث مباشر"},
        {icon:"۞",title:"Quran Studio",href:"/quran-studio",ar:"القرآن"},
        {icon:"✧",title:"Tajweed AI",href:"/quran-studio",ar:"تجويد"},
        {icon:"✦",title:"Elm Tent",href:"/learn/elm-tent",ar:"خيمة العلم"},
        {icon:"♧",title:"Video Chat 💬",href:"/messages",ar:"محادثة"},
      ].map((item,index)=><Link key={item.title} role="menuitem" href={item.href} onClick={()=>{closeMenu();if(item.title==="Tajweed AI")sessionStorage.setItem("1muslim-hudhud-tajweed","1")}} className="hudhudModeItem" style={{animationDelay:index*65+"ms"}}><span className="hudhudModeIcon" aria-hidden="true">{item.icon}</span><span className="hudhudModeText"><strong>{item.title}</strong><small lang="ar">{item.ar}</small></span><span className="hudhudModeArrow">↗</span></Link>)}
      <button type="button" className="hudhudModeSignOut" role="menuitem" onClick={()=>void signOut()}><span aria-hidden="true">⇥</span> Sign Out</button>
    </div>}
    <nav className="siteNavLinks" aria-label="Primary navigation">
      <Link href="/" className="siteHomeLink">Home</Link>

      <div className="navMenuWrap">
        <button type="button" className={`navMenuButton ${openMenu === "explore" ? "isOpen" : ""}`} aria-expanded={openMenu === "explore"} onClick={() => setOpenMenu(openMenu === "explore" ? null : "explore")}>Explore <span>⌄</span></button>
        {openMenu === "explore" && <div className="navDropdown exploreDropdown">
          {exploreGroups.map(group => <div className="navDropdownGroup" key={group.title}>
            <span className="navDropdownLabel">{group.title}</span>
            {group.items.map(item => <MenuLink key={item.href} href={item.href} label={label(item.label, item.ar)} onClick={closeMenu} />)}
          </div>)}
        </div>}
      </div>

      <div className="navMenuWrap">
        <button type="button" className={`navMenuButton liveMenuButton ${openMenu === "live" ? "isOpen" : ""}`} aria-expanded={openMenu === "live"} onClick={() => setOpenMenu(openMenu === "live" ? null : "live")}><span className={anyoneLive ? "liveSignal isLive" : "liveSignal"} aria-hidden="true" /> Live {anyoneLive && <span className="onAirLabel">ON AIR</span>} <span>⌄</span></button>
        {openMenu === "live" && <div className="navDropdown liveDropdown">
          <span className="navDropdownLabel">LIVE</span>
          {liveItems.map(item => <MenuLink key={item.href} href={item.href} label={label(item.label, item.ar)} onClick={closeMenu} />)}
        </div>}
      </div>
    </nav>

    <div className={wakeUp ? "wakeUpBackdrop wakeUpActive" : "wakeUpBackdrop"} aria-hidden="true" />
    {exploreHint && !wakeUp && <button type="button" className="wakeExploreHint" onClick={() => { setExploreHint(false); window.scrollBy({top: Math.round(window.innerHeight * .75),behavior: "smooth"}); }} aria-label="Scroll down and explore more">✦ Scroll down &amp; explore more <span aria-hidden="true">↓</span></button>}
    {dockMounted && createPortal(<>{smartIntro&&<div role="status" style={{position:"fixed",bottom:165,left:"50%",transform:"translateX(-50%)",zIndex:9999,width:"min(330px,90vw)",padding:16,borderRadius:20,background:"linear-gradient(135deg,#102f29,#172b44)",color:"#eafff3",border:"1px solid #83ffc1",boxShadow:"0 0 30px #55ffb344",fontSize:13}}><button type="button" onClick={()=>setSmartIntro(false)} aria-label="Dismiss Smart-Tap introduction" style={{float:"right",background:"transparent",border:0,color:"white",fontSize:20}}>×</button><strong>🌀 HudHud Smart-Tap</strong><p>The center orb changes to help you move: Ummah, Daily Post, Qur’an Studio, or Send when you’re writing. ✨</p></div>}    <nav className="muslimMobileDock" aria-label="Mobile primary navigation">
      <div className="muslimDockShell">
        <Link href="/" className={pathname === "/" ? "dockItem selected" : "dockItem"} aria-label="Home"><span className="dockIcon">⌂</span><small>Home</small></Link>
        <Link href="/streaming" className={pathname.startsWith("/streaming") ? "dockItem selected" : "dockItem"} aria-label="Live"><span className="dockIcon">◉{anyoneLive && <span className="dockLiveBeacon" aria-hidden="true" />}</span><small>{anyoneLive ? "On Air" : "Live"}</small></Link>
        {(pathname==="/quran-studio"||pathname.startsWith("/elm-tent/quran"))
          ? <button type="button" className={voiceRecording?"dockCenter dockGoLiveReady":"dockCenter"} aria-label={voiceRecording?"Recording in progress":"Tajweed practice recorder (HudHud Mode required)"} onClick={()=>{let active=false;try{active=JSON.parse(localStorage.getItem("1muslim-hudhud-entry-preferences-v1")||"{}").vision===true}catch{}if(!active){window.dispatchEvent(new CustomEvent("hudhud-recorder-locked"));alert("Enable HudHud Vision Beta to use Tajweed recording.");return;}window.dispatchEvent(new Event("1muslim:quran-record"));document.querySelector<HTMLElement>(".omAyahFocused .qrv")?.scrollIntoView({behavior:"smooth",block:"center"})}}><img src="/assets/hudhud-logo.PNG" alt=""/><span className="dockCenterText">{voiceRecording?"● Recording":"Record"}</span></button>
          : pathname==="/streaming/go-live"&&goLiveReady
          ? <button type="button" className="dockCenter dockGoLiveReady" aria-label="Go Live now" onClick={()=>document.querySelector<HTMLButtonElement>("[data-go-live-start]")?.click()}><span className="dockLiveDot" aria-hidden="true">●</span><span className="dockCenterText">Go Live</span></button>
          : <button type="button" className={wakeUp ? "dockCenter wakeUpSpotlight" : "dockCenter"} disabled={pathname==="/community"&&dailyDone&&!smartReady} onClick={() => {setWakeUp(false);smartTap()}} aria-label={"HudHud Smart-Tap: "+smartLabel}><img src="/assets/1muslim-mobile-logo.PNG" alt="" /><span className="dockCenterText">{smartLabel}</span></button>}
        <Link href="/messages" className={pathname.startsWith("/messages")?"dockItem selected":"dockItem"} aria-label="Messages and one-to-one Muslim calls"><span className="dockIcon">💬</span><small>Messages</small></Link>
        <button type="button" className="dockItem" aria-label="Create content" aria-expanded={createOpen} onClick={() => setCreateOpen(!createOpen)}><span className="dockIcon">＋</span><small>Create</small></button>
      </div>
      {createOpen && <div className="dockCreateMenu" role="menu"><Link href="/messages" onClick={() => setCreateOpen(false)}>💬 Message or 1:1 Call</Link><Link href="/streaming/go-live" onClick={() => setCreateOpen(false)}>🔴 Go Live</Link><Link href="/community" onClick={() => setCreateOpen(false)}>✦ Community</Link><Link href="/streaming/go-live" onClick={() => setCreateOpen(false)}>◷ Schedule a Live</Link></div>}
    </nav>
</>, document.body)}
    <Link href="/learn/elm-tent/library" className="mobileLibraryShortcut" aria-label="Open the 1Muslim Library"><span aria-hidden="true">✦</span><span>Library</span></Link>

    <Link href="/messages" className="authNav" aria-label="Open Messages and one-to-one Muslim calls" title="Messages · 1:1 Muslim Call" style={{display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}><span aria-hidden="true" style={{fontSize:20}}>💬</span><span>Messages</span></Link>
    {loadingAuth ? <span className="authNav authLoading">Account</span> : user ? <div className="authAccount">
      <Link href="/notifications" className="notificationBell" aria-label="Notifications">🔔{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
      <Link href="/profile" className="authNav authProfileLink">
        <ProfileAvatar name={user.display_name} gender={user.gender} avatarGender={user.avatar_gender} avatarPackage={user.avatar_package} avatarConfig={user.avatar_config} accent={user.profile_accent ?? "emerald"} size="sm" />
        <span className="authAccountName">{accountLabel}</span>
      </Link>
      <Link href="/settings" className="authNav" aria-label="Open Settings" title="Settings">⚙ <span>Settings</span></Link>
      <button type="button" className="authSignOut" onClick={signOut}>Sign out</button>
    </div> : <Link href="/auth" className="authNav">Sign in</Link>}

    <ThemeToggle />

    <button type="button" className={`mobileMenuButton ${openMenu === "mobile" ? "isOpen" : ""}`} aria-label={openMenu === "mobile" ? "Close navigation menu" : "Open navigation menu"} aria-expanded={openMenu === "mobile"} onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}><span/><span/><span/></button>

    {mobilePanelVisible && <div className={`mobileMenuPanel muslimNavGallery ${openMenu==="mobile"?"oneMuslimMenuEntering":"oneMuslimMenuLeaving"}`} role="dialog" aria-modal="true" aria-label="1Muslim navigation" aria-hidden={openMenu!=="mobile"} inert={openMenu!=="mobile"}>
      <div className="mobileMenuHeader"><div><small className="muslimNavKicker">✦ YOUR 1MUSLIM SPACE</small><strong>Explore 1Muslim</strong><span className="muslimNavSubhead">Choose where you want to go.</span></div><button type="button" onClick={closeMenu} aria-label="Close navigation">×</button></div>
      <div className="muslimNavGalleryGrid">
        <Link href="/" className="muslimNavTile muslimNavHome" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">⌂</span><span className="muslimNavTileText"><strong>Home</strong><small>الرئيسية</small></span></Link>
        <Link href="/quran-studio" className="muslimNavTile muslimNavFeatured" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">۞</span><span className="muslimNavTileText"><strong>Qur’an Studio</strong><small>القرآن</small></span></Link>
        <Link href="/streaming" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">◉</span><span className="muslimNavTileText"><strong>Live Now</strong><small>مباشر</small></span></Link>
        <Link href="/community" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">✦</span><span className="muslimNavTileText"><strong>Community</strong><small>المجتمع</small></span></Link>
      </div>
      <section className="muslimNavSection"><span className="mobileMenuSection">✧ DISCOVER & LEARN</span><div className="muslimNavGalleryGrid">
        <Link href="/#paths" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">✧</span><span className="muslimNavTileText"><strong>Learn</strong><small>تعلّم</small></span></Link>
        <Link href="/learn/elm-tent" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">☪</span><span className="muslimNavTileText"><strong>Elm Tent</strong><small>الخيمة</small></span></Link>
        <Link href="/streaming/library" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">▣</span><span className="muslimNavTileText"><strong>Videos</strong><small>الفيديوهات</small></span></Link>
        <Link href="/videos" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">▷</span><span className="muslimNavTileText"><strong>1Muslim Videos</strong><small>مقاطع</small></span></Link>
        <Link href="/ashab" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">♧</span><span className="muslimNavTileText"><strong>Ashab</strong><small>أصحاب</small></span></Link>
        <Link href="/find" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">⌕</span><span className="muslimNavTileText"><strong>Find People</strong><small>بحث</small></span></Link>
      </div></section>
      <section className="muslimNavSection"><span className="mobileMenuSection">◉ LIVE & CREATE</span><div className="muslimNavGalleryGrid">
        <Link href="/streaming/go-live" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">●</span><span className="muslimNavTileText"><strong>Go Live</strong><small>ابدأ البث</small></span></Link>
        <Link href="/streaming/library" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">◷</span><span className="muslimNavTileText"><strong>Recordings</strong><small>التسجيلات</small></span></Link>
      </div></section>
      {user && <section className="muslimNavSection muslimNavAccount"><span className="mobileMenuSection">⚙ YOUR SPACE & SETTINGS</span><div className="muslimNavGalleryGrid">
        <Link href="/profile" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">◎</span><span className="muslimNavTileText"><strong>Profile</strong><small>الملف الشخصي</small></span></Link>
        <Link href="/notifications" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">♧</span><span className="muslimNavTileText"><strong>Notifications {unreadCount>0?`(${unreadCount>99?"99+":unreadCount})`:""}</strong><small>الإشعارات</small></span></Link>
        <Link href="/settings" className="muslimNavTile muslimNavSettings" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">⚙</span><span className="muslimNavTileText"><strong>Settings</strong><small>الإعدادات</small></span></Link>
        <Link href="/support" className="muslimNavTile" onClick={closeMenu}><span className="muslimNavTileIcon" aria-hidden="true">✧</span><span className="muslimNavTileText"><strong>Support</strong><small>الدعم</small></span></Link>
      </div></section>}
      <div className="mobileMenuFooter"><ThemeToggle/>{user ? <button type="button" className="mobileMenuSignOut" onClick={signOut}>Sign out</button> : <Link href="/auth" onClick={closeMenu}>Sign in</Link>}</div>
    </div>}
    <style jsx>{`
      :global(.dockGoLiveReady){background:linear-gradient(145deg,#a10f22,#ed2939)!important;border:2px solid #ff7580!important;color:#fff!important;box-shadow:0 0 20px #f5224a99,0 5px 25px #0009!important;cursor:pointer;display:flex!important;flex-direction:column;align-items:center;justify-content:center}
      :global(.dockGoLiveReady .dockLiveDot){font-size:22px;line-height:1;color:#fff;animation:dockReadyPulse 1.7s ease-in-out infinite}
      :global(.dockGoLiveReady .dockCenterText){color:white!important;font-weight:900!important;font-size:12px!important}
      @keyframes dockReadyPulse{50%{opacity:.5;transform:scale(.85)}}
      :global(.wakeExploreHint){position:fixed;bottom:calc(104px + env(safe-area-inset-bottom,0px));right:14px;z-index:9900;max-width:calc(100vw - 28px);border:1px solid #a3e8c2;background:linear-gradient(130deg,#15382d,#253553);color:#f3fff9;padding:10px 13px;border-radius:999px;box-shadow:0 9px 28px #0007;font-size:12px;font-weight:700;cursor:pointer;animation:exploreFloatIn .55s ease both}
      :global(.wakeExploreHint span){display:inline-block;margin-left:5px;color:#a3e8c2}
      @keyframes exploreFloatIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      :global(body.oneMuslimNavExpanded .muslimMobileDock){transform:translateY(calc(110% + env(safe-area-inset-bottom,0px)))!important;opacity:.35;pointer-events:none}
      :global(.muslimMobileDock){transition:transform .65s cubic-bezier(.22,1,.36,1),opacity .55s ease!important}
      :global(.mobileMenuPanel.oneMuslimMenuEntering){animation:oneMuslimMenuDrop .68s cubic-bezier(.16,1,.3,1) both!important;transform-origin:top center}
      :global(.mobileMenuPanel.oneMuslimMenuLeaving){animation:oneMuslimMenuRetract .6s cubic-bezier(.45,0,.2,1) both!important;pointer-events:none}
      @keyframes oneMuslimMenuDrop{0%{opacity:0;transform:translateY(-48px) scale(.97);filter:blur(5px)}70%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
      @keyframes oneMuslimMenuRetract{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}100%{opacity:0;transform:translateY(-55px) scale(.97);filter:blur(4px)}}
      @media(prefers-reduced-motion:reduce){:global(.muslimMobileDock){transition:none!important}:global(.mobileMenuPanel.oneMuslimMenuEntering),:global(.mobileMenuPanel.oneMuslimMenuLeaving){animation:none!important}}
      :global(.wakeUpBackdrop){position:fixed;inset:0;background:rgba(3,9,15,.22);pointer-events:none;z-index:9990;opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s}
      :global(.wakeUpBackdrop.wakeUpActive){opacity:1;visibility:visible}
      :global(.muslimMobileDock:has(.wakeUpSpotlight)){z-index:9991!important}
      :global(.wakeUpSpotlight){position:relative!important;z-index:9992!important;filter:drop-shadow(0 0 11px #5fffc2) drop-shadow(0 0 16px #a388ff);transition:filter .3s ease}
      @media(prefers-reduced-motion:reduce){:global(.wakeUpBackdrop){transition:none!important}:global(.wakeExploreHint){animation:none!important}:global(.wakeUpSpotlight){filter:none!important}}
      :global(.siteNav.muslimTopGlass){background:rgba(9,29,23,.64)!important;backdrop-filter:blur(22px) saturate(1.35);-webkit-backdrop-filter:blur(22px) saturate(1.35);border-bottom:1px solid rgba(166,242,195,.22);transition:transform .32s cubic-bezier(.2,.8,.2,1),background .3s ease!important;position:sticky;top:0;z-index:1000}
      :global(.siteNav.muslimTopHidden){transform:translateY(-110%);pointer-events:none}
      :global(.siteNav.muslimPageGlow:after){content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 20%,rgba(147,255,186,.22) 50%,transparent 80%);animation:muslimNavSweep 1.05s ease-out both}
      @keyframes muslimNavSweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
      @media(prefers-reduced-motion:reduce){:global(.siteNav.muslimTopGlass){transition:none!important}:global(.siteNav.muslimPageGlow:after){animation:none}}
      @media(max-width:700px){:global(.siteNav.muslimTopGlass .mobileMenuButton),:global(.siteNav.muslimTopGlass .themeToggle),:global(.siteNav.muslimTopGlass .mobileLibraryShortcut){border-radius:16px!important;background:rgba(32,77,55,.25)!important;box-shadow:inset 0 1px rgba(255,255,255,.12),0 3px 15px rgba(0,0,0,.12)}}
      .hudhudTopOrb{width:48px;height:48px;flex:0 0 48px;position:relative;border:1px solid #58bf9866;border-radius:50%;padding:7px;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#164a37,#071912);box-shadow:0 0 18px #29d18a22;cursor:pointer;animation:hudhudTopFloat 3.5s ease-in-out infinite}.hudhudTopOrb img{width:100%;height:100%;object-fit:contain;position:relative;z-index:1}.hudhudTopGlow{position:absolute;inset:-4px;border-radius:50%;border:1px solid #6fdfad33;animation:hudhudTopPulse 2.5s ease-in-out infinite;pointer-events:none}@keyframes hudhudTopFloat{50%{transform:translateY(-4px)}}@keyframes hudhudTopPulse{50%{opacity:.3;transform:scale(1.15)}}@media(prefers-reduced-motion:reduce){.hudhudTopOrb,.hudhudTopGlow{animation:none}}
      .hudhudModeMenu{position:absolute;left:12px;top:calc(100% + 9px);width:min(340px,calc(100vw - 24px));z-index:1100;padding:18px;border:1px solid #63e5a355;border-radius:23px;background:linear-gradient(145deg,#0d2923f5,#081719f7);box-shadow:0 22px 70px #000b,0 0 34px #36de8a1a;backdrop-filter:blur(22px);color:#eafff2;animation:hudhudMenuEnter .35s cubic-bezier(.2,1,.3,1) both}.hudhudModeTitle{display:flex;align-items:center;gap:9px;letter-spacing:.18em;font-size:12px;color:#9cf5c2}.hudhudModeTitle button{margin-left:auto;background:transparent;color:#bff9d6;border:0;font-size:24px;cursor:pointer}.hudhudModeSpark{font-size:22px;animation:hudhudSpark 2.6s ease-in-out infinite}.hudhudModeHint{font-size:11px;color:#a6c9b7;margin:4px 0 16px}.hudhudModeItem{display:flex;align-items:center;gap:13px;padding:10px 8px;border:1px solid transparent;border-radius:16px;color:#ecfff3;text-decoration:none;background:#ffffff06;margin-bottom:7px;animation:hudhudMenuEnter .45s both;transition:background .25s,border-color .25s,transform .25s}.hudhudModeItem:hover,.hudhudModeItem:focus-visible{background:#5cffa017;border-color:#66f1aa55;transform:translateX(3px)}.hudhudModeIcon{height:43px;width:43px;flex:0 0 43px;border:1px solid #79efad77;border-radius:15px;display:grid;place-items:center;background:radial-gradient(circle,#55e89e20,#ffffff04);color:#a3ffd0;font-size:25px;text-shadow:0 0 15px #64ffc4;box-shadow:inset 0 0 15px #5af0a211;animation:hudhudIconBreathe 3s ease-in-out infinite}.hudhudModeText{display:flex;flex-direction:column;gap:2px;font-size:14px}.hudhudModeText small{color:#8db9a4;font-size:11px}.hudhudModeArrow{margin-left:auto;color:#9df5bd}.hudhudModeSignOut{width:100%;margin-top:11px;padding:13px 12px;text-align:left;background:#ffffff06;color:#f6d9d9;border:1px solid #ffffff1c;border-radius:14px;cursor:pointer;font-size:13px}.hudhudModeSignOut span{margin-right:12px;font-size:20px}@keyframes hudhudMenuEnter{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes hudhudIconBreathe{50%{box-shadow:0 0 15px #4df0a755;filter:brightness(1.2)}}@keyframes hudhudSpark{50%{opacity:.5;transform:rotate(20deg)}}@media(prefers-reduced-motion:reduce){.hudhudModeMenu,.hudhudModeItem,.hudhudModeIcon,.hudhudModeSpark{animation:none}}
      .logoBrand{display:flex;align-items:center;flex:0 1 auto;min-width:0;max-width:190px;overflow:hidden}
      .premiumLogo{display:block;width:clamp(122px,14vw,182px);height:46px;max-width:100%;object-fit:contain;object-position:left center;border-radius:3px}
      @media(max-width:700px){.logoBrand{max-width:138px}.premiumLogo{width:138px;height:40px}}
      .newBrand{display:inline-flex;align-items:center;gap:7px;text-decoration:none;white-space:nowrap;color:inherit}
      .brandMark{display:inline-flex;align-items:center;justify-content:center;position:relative;width:37px;height:37px;border:1px solid rgba(194,235,185,.6);border-radius:13px;background:linear-gradient(135deg,#172f23,#07110c);box-shadow:inset 0 1px rgba(255,255,255,.14),0 4px 18px rgba(0,0,0,.18)}
      .brandOne{font-weight:950;font-size:25px;line-height:1;color:#d9f2c7;letter-spacing:-.09em;transform:translateX(-3px)}
      .brandCrescent{position:absolute;right:3px;top:4px;font-size:12px;color:#b4d7a3}
      .brandWord{font-size:clamp(17px,1.7vw,22px);font-weight:950;letter-spacing:-.07em;color:var(--text,#f2f5f0)}
      .brandPeriod{color:#a9d99a}
      .liveSignal{display:inline-block;width:9px;height:9px;flex:none;border-radius:50%;background:#65726a;vertical-align:middle}
      .liveSignal.isLive,.dockLiveBeacon{background:#ff334a;box-shadow:0 0 0 3px rgba(255,51,74,.14),0 0 12px rgba(255,51,74,.9);animation:liveBeaconPulse 1.8s ease-in-out infinite}
      .onAirLabel{font-size:8px;font-weight:900;letter-spacing:.08em;color:#ff6674}
      .dockLiveBeacon{position:absolute;right:-5px;top:-2px;width:9px;height:9px;border-radius:50%}
      @keyframes liveBeaconPulse{0%,100%{opacity:1;box-shadow:0 0 0 3px rgba(255,51,74,.14),0 0 12px rgba(255,51,74,.9)}50%{opacity:.65;box-shadow:0 0 0 6px rgba(255,51,74,.04),0 0 5px rgba(255,51,74,.45)}}
      .notificationBell{position:relative;width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--line);border-radius:11px;background:var(--panel2);text-decoration:none;font-size:14px}
      .notificationBell span{position:absolute;right:-5px;top:-6px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#dbe9c4;color:#071008;font-size:8px;font-weight:900;display:grid;place-items:center}
      @media(max-width:700px){.notificationBell{display:none}}
    `}</style>
  </header>;
}
