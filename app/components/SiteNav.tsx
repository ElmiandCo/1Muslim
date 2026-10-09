"use client";

import Link from "next/link";
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
  ]},
  { title: "Community", items: [
    { label: "Community", ar: "المجتمع", href: "/community" },
    { label: "Ashab", ar: "أصحاب", href: "/ashab" },
    { label: "Find People", ar: "بحث", href: "/find" },
  ]},
];

const liveItems = [
  { label: "Live Now", ar: "مباشر", href: "/streaming" },
  { label: "Go Live", ar: "ابدأ البث", href: "/streaming/go-live" },
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
  const [user, setUser] = useState<NavUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anyoneLive, setAnyoneLive] = useState(false);
  const [openMenu, setOpenMenu] = useState<"explore" | "live" | "mobile" | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

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

  const accountLabel = user?.display_name || (user?.username ? "@" + user.username : user?.email?.split("@")[0]) || "My account";
  const closeMenu = () => setOpenMenu(null);
  const signOut = async () => { await createClient().auth.signOut(); window.location.href = "/"; };
  const label = (text: string, ar: string) => user?.arabic_terms_enabled ? <>{text} <span className="arabicNav">{ar}</span></> : text;

  return <header ref={navRef} className={compact ? "siteNav compact" : "siteNav"}>
    <Link href="/" className="siteBrand logoBrand" aria-label="1Muslim.Live Home"><img src="/assets/1muslim-live-logo.PNG" alt="1Muslim.Live" className="premiumLogo" /></Link>

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

    <nav className="muslimMobileDock" aria-label="Mobile primary navigation">
      <div className="muslimDockShell">
        <Link href="/" className={pathname === "/" ? "dockItem selected" : "dockItem"} aria-label="Home"><span className="dockIcon">⌂</span><small>Home</small></Link>
        <Link href="/streaming" className={pathname.startsWith("/streaming") ? "dockItem selected" : "dockItem"} aria-label="Live"><span className="dockIcon">◉{anyoneLive && <span className="dockLiveBeacon" aria-hidden="true" />}</span><small>{anyoneLive ? "On Air" : "Live"}</small></Link>
        <Link href={user ? "/profile" : "/auth"} className="dockCenter" aria-label={user ? "My profile" : "Sign in to your profile"}><img src="/assets/1muslim-mobile-logo.PNG" alt="" /><span className="dockCenterText">Profile</span></Link>
        <Link href="/#paths" className="dockItem" aria-label="Learn"><span className="dockIcon">▤</span><small>Learn</small></Link>
        <button type="button" className="dockItem" aria-label="Create content" aria-expanded={createOpen} onClick={() => setCreateOpen(!createOpen)}><span className="dockIcon">＋</span><small>Create</small></button>
      </div>
      {createOpen && <div className="dockCreateMenu" role="menu"><Link href="/streaming/go-live" onClick={() => setCreateOpen(false)}>🔴 Go Live</Link><Link href="/community" onClick={() => setCreateOpen(false)}>✦ Community</Link><Link href="/streaming/go-live" onClick={() => setCreateOpen(false)}>◷ Schedule a Live</Link></div>}
    </nav>
    <div className="mobileNavActions"><Link href="/">Home</Link><Link href="/streaming"><span className={anyoneLive ? "liveSignal isLive" : "liveSignal"} /> {anyoneLive ? "On Air" : "Live"}</Link></div>

    {loadingAuth ? <span className="authNav authLoading">Account</span> : user ? <div className="authAccount">
      <Link href="/notifications" className="notificationBell" aria-label="Notifications">🔔{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
      <Link href="/profile" className="authNav authProfileLink">
        <ProfileAvatar name={user.display_name} gender={user.gender} avatarGender={user.avatar_gender} avatarPackage={user.avatar_package} avatarConfig={user.avatar_config} accent={user.profile_accent ?? "emerald"} size="sm" />
        <span className="authAccountName">{accountLabel}</span>
      </Link>
      <button type="button" className="authSignOut" onClick={signOut}>Sign out</button>
    </div> : <Link href="/auth" className="authNav">Sign in</Link>}

    <ThemeToggle />

    <button type="button" className={`mobileMenuButton ${openMenu === "mobile" ? "isOpen" : ""}`} aria-label={openMenu === "mobile" ? "Close navigation menu" : "Open navigation menu"} aria-expanded={openMenu === "mobile"} onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}><span/><span/><span/></button>

    {openMenu === "mobile" && <div className="mobileMenuPanel" role="dialog" aria-label="1Muslim navigation">
      <div className="mobileMenuHeader"><strong>Explore 1Muslim</strong><button type="button" onClick={closeMenu} aria-label="Close menu">×</button></div>
      <Link href="/" className="mobileMenuHome" onClick={closeMenu}><span>Home</span><small>الرئيسية</small></Link>
      <section><span className="mobileMenuSection">EXPLORE</span>
        {exploreGroups.flatMap(g => g.items).map(item => <MenuLink key={item.href} href={item.href} label={item.label} ar={item.ar} onClick={closeMenu} />)}
      </section>
      <section><span className="mobileMenuSection">LIVE</span>
        {liveItems.map(item => <MenuLink key={item.href} href={item.href} label={item.label} ar={item.ar} onClick={closeMenu} />)}
      </section>
      {user && <section><span className="mobileMenuSection">ACCOUNT</span>
        <MenuLink href="/notifications" label={<>Notifications {unreadCount > 0 ? `(${unreadCount > 99 ? "99+" : unreadCount})` : ""}</>} ar="الإشعارات" onClick={closeMenu}/>
        <MenuLink href="/profile" label="Profile" ar="الملف الشخصي" onClick={closeMenu}/>
        <MenuLink href="/settings" label="Settings" ar="الإعدادات" onClick={closeMenu}/>
        <MenuLink href="/support" label="Support" ar="الدعم" onClick={closeMenu}/>
      </section>}
      <div className="mobileMenuFooter"><ThemeToggle/>{user ? <button type="button" className="mobileMenuSignOut" onClick={signOut}>Sign out</button> : <Link href="/auth" onClick={closeMenu}>Sign in</Link>}</div>
    </div>}
    <style jsx>{`
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
