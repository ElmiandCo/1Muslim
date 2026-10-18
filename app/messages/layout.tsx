import Link from "next/link";
import "./messenger-clean-base.css";
import "./messenger-clean-search.css";
import "./messenger-clean-inbox.css";
import "./messenger-clean-responsive.css";

export default function MessengerLayout({children}:{children:React.ReactNode}){
 return <div className="muslimMessengerFrame">
  {children}
  <nav className="muslimMessengerDock" aria-label="1Muslim navigation">
   <Link href="/" aria-label="Home"><span>⌂</span><small>Home</small></Link>
   <Link href="/live" aria-label="Live"><span>◉</span><small>Live</small></Link>
   <Link href="/ummah" aria-label="Explore"><span>⌕</span><small>Explore</small></Link>
   <Link href="/messages" aria-current="page" aria-label="Messages"><span>●</span><small>Messages</small></Link>
   <Link href="/notifications" aria-label="Notifications"><span>♧</span><small>Alerts</small></Link>
   <Link href="/profile" aria-label="Profile"><span>◯</span><small>Profile</small></Link>
  </nav>
  <style>{`
  .muslimMessengerDock{position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);left:50%;transform:translateX(-50%);width:min(95vw,620px);height:68px;display:flex;align-items:center;justify-content:space-around;gap:2px;z-index:80;border-radius:30px;background:rgba(255,255,255,.94);border:1px solid #dfe7e4;box-shadow:0 6px 30px #0002;backdrop-filter:blur(20px);padding:5px}
  .muslimMessengerDock a{display:flex;flex:1;min-width:0;align-items:center;justify-content:center;flex-direction:column;gap:2px;text-decoration:none;color:#15201e;font-size:22px;border-radius:23px;height:58px}
  .muslimMessengerDock a small{font-size:10px;font-weight:600}
  .muslimMessengerDock a[aria-current]{background:#dcf9eb;color:#00754d;box-shadow:0 0 15px #1cd68c55}
  body:has(.omMessengerNight) .muslimMessengerDock{background:rgba(16,23,32,.95);border-color:#35423e}
  body:has(.omMessengerNight) .muslimMessengerDock a{color:#fff}
  body:has(.omMessengerNight) .muslimMessengerDock a[aria-current]{background:#064a38;color:#b8ffe1}
  `}</style>
 </div>;
}
