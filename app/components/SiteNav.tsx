"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import ProfileAvatar from "./ProfileAvatar";

const links = [
  { label: "Home", ar: "الرئيسية", href: "/" },
  { label: "Learn", ar: "تعلّم", href: "/#paths" },
  { label: "Elm Tent", ar: "الخيمة", href: "/learn/elm-tent" },
  { label: "Community", ar: "المجتمع", href: "/community" },
  { label: "Ashab", ar: "أصحاب", href: "/ashab" },
  { label: "Find", ar: "بحث", href: "/find" },
  { label: "Streaming", ar: "البث", href: "/streaming" },
  { label: "Videos", ar: "الفيديوهات", href: "/streaming/library" },
  { label: "Profile", ar: "الملف الشخصي", href: "/profile" },
  { label: "Settings", ar: "الإعدادات", href: "/settings" },
  { label: "Support", ar: "الدعم", href: "/support" },
];

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("1muslim-theme"); const isLight = saved === "light"; setLight(isLight); document.documentElement.classList.toggle("light", isLight); }, []);
  const toggle = () => { const next = !light; setLight(next); document.documentElement.classList.toggle("light", next); localStorage.setItem("1muslim-theme", next ? "light" : "dark"); };
  return <button className="themeToggle" onClick={toggle} aria-label={light ? "Switch to night mode" : "Switch to day mode"}>{light ? "☾ Night" : "☀ Day"}</button>;
}

type NavUser = {
  id: string;
  email?: string;
  display_name?: string;
  username?: string;
  gender?: string | null;
  avatar_gender?: string | null;
  avatar_package?: string | null;
  avatar_config?: Record<string, unknown> | null;
  profile_accent?: string | null;
  arabic_terms_enabled?: boolean;
};

export default function SiteNav({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient(); let mounted = true;
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!authUser) { setUser(null); setLoadingAuth(false); return; }
      const { data: profile } = await supabase.from("profiles")
        .select("display_name,username,gender,avatar_gender,avatar_package,avatar_config,profile_accent,arabic_terms_enabled")
        .eq("id", authUser.id).maybeSingle();
      if (!mounted) return;
      setUser({
        id: authUser.id,
        email: authUser.email ?? undefined,
        display_name: profile?.display_name ?? undefined,
        username: profile?.username ?? undefined,
        gender: profile?.gender ?? null,
        avatar_gender: profile?.avatar_gender ?? null,
        avatar_package: profile?.avatar_package ?? null,
        avatar_config: profile?.avatar_config ?? null,
        profile_accent: profile?.profile_accent ?? null,
        arabic_terms_enabled: !!profile?.arabic_terms_enabled
      });
      setLoadingAuth(false);
    };
    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadUser(); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const accountLabel = user?.display_name || (user?.username ? "@" + user.username : user?.email?.split("@")[0]) || "My account";
  const signOut = async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = "/"; };
  const label = (item: typeof links[number]) => user?.arabic_terms_enabled ? <>{item.label} <span className="arabicNav">{item.ar}</span></> : item.label;

  return <header className={compact ? "siteNav compact" : "siteNav"}>
    <Link href="/" className="siteBrand" aria-label="1Muslim Home"><img src="/1muslim-logo.svg" alt="1Muslim" className="siteLogo" /></Link>
    <nav className="siteNavLinks">{links.map((link) => <Link key={link.href} href={link.href}>{label(link)}</Link>)}<Link href="/streaming" className="liveNav">🔴 Live</Link><Link href="/streaming/go-live" className="goLiveNav">Go Live</Link></nav>
    {loadingAuth ? <span className="authNav authLoading">Account</span> : user ? (
      <div className="authAccount">
        <Link href="/profile" className="authNav" style={{display:"inline-flex",alignItems:"center",gap:8}}>
          <ProfileAvatar
            name={user.display_name}
            gender={user.gender}
            avatarGender={user.avatar_gender}
            avatarPackage={user.avatar_package}
            avatarConfig={user.avatar_config}
            accent={user.profile_accent ?? "emerald"}
            size="sm"
          />
          <span>{accountLabel}</span>
        </Link>
        <button type="button" className="authSignOut" onClick={signOut}>Sign out</button>
      </div>
    ) : <Link href="/auth" className="authNav">Sign in</Link>}
    <ThemeToggle />
  </header>;
};
