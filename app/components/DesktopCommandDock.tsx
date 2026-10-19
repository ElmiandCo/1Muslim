"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
const items=[["Live","/live","◉"],["Posts","/ummah","▤"],["Messages","/messages","✉"],["Qur’an","/elm-tent/quran","۞"],["Profile","/profile","♙"]];
export default function DesktopCommandDock(){
 const pathname=usePathname();
 return <nav className="desktopCommandDock" aria-label="Desktop quick navigation">
 <div className="desktopDockBrand"><span>✦</span><strong>1MUSLIM</strong><small>COMMUNITY HQ</small></div>
 <div className="desktopDockLinks">{items.map(([label,href,icon])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined}><span aria-hidden="true">{icon}</span>{label}</Link>)}</div>
 <Link href="/streaming/go-live" className="desktopDockLive">● Go Live ↗</Link>
 <style jsx global>{`
 .desktopCommandDock{display:none}
 @media(min-width:1050px){.desktopCommandDock{display:flex;position:fixed;z-index:88;top:15px;left:50%;transform:translateX(-50%);width:min(92vw,1240px);height:64px;align-items:center;justify-content:space-between;gap:22px;padding:9px 22px;box-sizing:border-box;border:1px solid rgba(220,194,130,.26);border-radius:22px;background:linear-gradient(105deg,rgba(8,26,28,.7),rgba(14,31,40,.46));backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 15px 42px #0005;color:#e8fff3}
 .desktopDockBrand{display:flex;align-items:center;gap:10px;white-space:nowrap}.desktopDockBrand span{font-size:23px;color:#f2d48c;text-shadow:0 0 14px #a9ffd0}.desktopDockBrand strong{letter-spacing:.15em;font-size:14px}.desktopDockBrand small{font-size:9px;opacity:.5;letter-spacing:.14em}.desktopDockLinks{display:flex;gap:5px}.desktopDockLinks a{display:flex;align-items:center;gap:9px;padding:10px 15px;border-radius:14px;color:#e6f8f0;text-decoration:none;font-size:13px;transition:background .24s,transform .24s,box-shadow .24s}.desktopDockLinks a:hover,.desktopDockLinks a[aria-current=page]{background:#7feac020;box-shadow:inset 0 0 0 1px #7feac045;transform:translateY(-2px)}.desktopDockLinks a span{font-size:18px;color:#e9cf90}.desktopDockLive{white-space:nowrap;border-radius:16px;padding:12px 17px;background:linear-gradient(125deg,#135d4b,#228e72);border:1px solid #a3f0c770;color:#fff;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 0 25px #3edc8740}
 body:has(.desktopCommandDock) main{scroll-margin-top:85px}
 }
 @media(prefers-reduced-motion:reduce){.desktopDockLinks a{transition:none!important}}
 `}</style></nav>
}
