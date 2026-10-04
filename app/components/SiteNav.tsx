"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/#paths" },
  { label: "Community", href: "/community" },
  { label: "Streaming", href: "/streaming" },
];

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("1muslim-theme");
    const isLight = saved === "light";
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

export default function SiteNav({ compact = false }: { compact?: boolean }) {
  return <header className={compact ? "siteNav compact" : "siteNav"}>
      <Link href="/" className="siteBrand"><span className="siteMark">1</span><span>1Muslim</span></Link>
      <nav className="siteNavLinks">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href="/streaming/go-live" className="liveNav">🔴 Go Live</Link></nav>
      <ThemeToggle />
    </header>;
}
