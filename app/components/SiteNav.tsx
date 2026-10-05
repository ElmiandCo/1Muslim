"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const links = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/#paths" },
  { label: "Elm Tent", href: "/learn/elm-tent" },
  { label: "Community", href: "/community" },
  { label: "Find", href: "/find" },
  { label: "Streaming", href: "/streaming" },
  { label: "Videos", href: "/streaming/library" },
  { label: "Profile", href: "/profile" },
];

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("1muslim-theme"); const isLight = saved === "light"; setLight(isLight); document.documentElement.classList.toggle("light", isLight); }, []);
  const toggle = () => { const next = !light; setLight(next); document.documentElement.classList.toggle("light", next); localStorage.setItem("1muslim-theme", next ? "light" : "dark"); };
  return <button className="themeToggle" onClick={toggle} aria-label={light ? "Switch to night mode" : "Switch to day mode"}>{light ? "☾ Night" : "☀ Day"}</button>;
}

export default function SiteNav({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<{ id:string; email?:string; display_name?:string; username?:string } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  useEffect(() => {
    const supabase = createClient(); let mounted = true;
    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!authUser) { setUser(null); setLoadingAuth(false); return; }
      const { data: profile } = await supabase.from("profiles").select("display_name,username").eq("id", authUser.id).maybeSingle();
      if (!mounted) return;
      setUser({ id: authUser.id, email: authUser.email ?? undefined, display_name: profile?.display_name ?? undefined, username: profile?.username ?? undefined });
      setLoadingAuth(false);
    };
    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadUser(); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  const accountLabel = user?.display_name || (user?.username ? "@" + user.username : user?.email?.split("@")[0]) || "My account";
  const signOut = async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = "/"; };
  return <header className={compact ? "siteNav compact" : "siteNav"}>
    <Link href="/" className="siteBrand"><span className="siteMark">1</span><span>1Muslim</span></Link>
    <nav className="siteNavLinks">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href="/streaming/go-live" className="liveNav">🔴 Go Live</Link></nav>
    {loadingAuth ? <span className="authNav authLoading">Account</span> : user ? <div className="authAccount"><Link href="/profile" className="authNav">👤 {accountLabel}</Link><button type="button" className="authSignOut" onClick={signOut}>Sign out</button></div> : <Link href="/auth" className="authNav">Sign in</Link>}
    <ThemeToggle />
  </header>;
}
