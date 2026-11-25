"use client";
import Link from "next/link";
import styles from "./GuestWelcomeHome.module.css";

type IconName = "ummah" | "watch" | "quran" | "live" | "games" | "home" | "explore" | "about";

function Glyph({name}:{name:IconName}) {
  const common = {width:28,height:28,viewBox:"0 0 32 32",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
  switch(name){
    case "ummah": return <svg {...common}><circle cx="16" cy="9" r="4"/><path d="M7 27v-3c0-5 3-8 9-8s9 3 9 8v3M4 18c-2 2-3 4-3 8M28 18c2 2 3 4 3 8"/><circle cx="5" cy="13" r="3"/><circle cx="27" cy="13" r="3"/></svg>;
    case "watch": return <svg {...common}><rect x="4" y="6" width="24" height="20" rx="4"/><path d="m13 11 9 5-9 5z"/></svg>;
    case "quran": return <svg {...common}><path d="M16 8c-4-3-8-3-13-2v19c5-1 10-1 13 2 3-3 8-3 13-2V6c-5-1-9-1-13 2zM16 8v19M7 11h5m-5 4h5m8-4h5m-5 4h5"/></svg>;
    case "live": return <svg {...common}><circle cx="16" cy="16" r="3" fill="currentColor" stroke="none"/><path d="M10 10a8 8 0 0 0 0 12m12-12a8 8 0 0 1 0 12M6 6a14 14 0 0 0 0 20m20-20a14 14 0 0 1 0 20"/></svg>;
    case "games": return <svg {...common}><path d="M9 11h14c3 0 5 2 6 6l2 7c.5 3-2.5 4.5-4.5 3l-5-4H10.5l-5 4C3.5 28.5.5 27 .9 24l2-7c1-4 3-6 6.1-6zM7 17h8m-4-4v8"/><circle cx="23" cy="16" r="1"/><circle cx="26" cy="20" r="1"/></svg>;
    case "home": return <svg {...common}><path d="m3 15 13-11 13 11M6 13v15h20V13M13 28v-9h6v9"/></svg>;
    case "explore": return <svg {...common}><circle cx="16" cy="16" r="12"/><path d="m21 11-4 10-6 2 4-10z"/></svg>;
    case "about": return <svg {...common}><path d="M6 8h20M6 16h20M6 24h20"/></svg>;
  }
}

const destinations:{label:string;href:string;icon:IconName}[]=[
  {label:"Ummah",href:"/community",icon:"ummah"},
  {label:"DeepWatch",href:"/deepwatch",icon:"watch"},
  {label:"Qur’an",href:"/quran-library",icon:"quran"},
  {label:"Live",href:"/live",icon:"live"},
  {label:"Games",href:"/elm-tent",icon:"games"}
];

const showcase=[
  {title:"Stories of faith",subtitle:"Discover meaningful films",art:"faith"},
  {title:"Documentaries",subtitle:"Explore history and learning",art:"history"},
  {title:"For the whole Ummah",subtitle:"Find series and more",art:"series"}
] as const;

/** Public profile-inspired guest entry. Everything below is illustrative and privacy-safe.
 * Never render member data or fake live prayer times before the visitor opts in.
 */
export default function GuestWelcomeHome(){
  return <main className={styles.page} aria-label="Welcome to 1Muslim">
    <div className={styles.layout}>
      <section className={styles.cover} aria-label="One Ummah, one home">
        <div className={styles.coverLight} aria-hidden="true"/>
        <svg className={styles.skyline} viewBox="0 0 1000 270" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
          <defs><linearGradient id="guestStone" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e2b970"/><stop offset="1" stopColor="#935a37"/></linearGradient><linearGradient id="guestDome" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffdc94"/><stop offset="1" stopColor="#b67647"/></linearGradient></defs>
          <g fill="url(#guestStone)" stroke="#e9bd85" strokeWidth="2" opacity=".92">
            <path d="M110 262V148h250v114H110zm410 0V148h250v114H520z"/>
            <path d="M320 262V118h330v144H320z"/>
            <path d="M370 118c0-70 50-112 112-112s112 42 112 112H370" fill="url(#guestDome)"/>
            <path d="M160 148c0-46 39-80 75-80s75 34 75 80H160m410 0c0-46 39-80 75-80s75 34 75 80H570" fill="url(#guestDome)"/>
            <path d="M205 262V66h22V30l-12-15-12 15v36h2zm530 0V66h22V30l-12-15-12 15v36h2z"/>
            <path d="M35 262V105h23V65L47 50 36 65v40h-1zm880 0V105h23V65l-11-15-11 15v40h-1z"/>
          </g>
          <g fill="#5e392b" opacity=".60"><path d="M445 262v-61c0-47 74-47 74 0v61zm-296 0v-59c0-33 42-33 42 0v59zm565 0v-59c0-33 42-33 42 0v59z"/></g>
          <g fill="#ffe9b8" opacity=".83"><rect x="212" y="89" width="9" height="19" rx="5"/><rect x="741" y="89" width="9" height="19" rx="5"/><rect x="43" y="125" width="8" height="15" rx="4"/><rect x="922" y="125" width="8" height="15" rx="4"/><path d="M405 183c0-21 25-21 25 0v24h-25zm120 0c0-21 25-21 25 0v24h-25z"/></g>
        </svg>
        <header className={styles.topbar}>
          <Link className={styles.logo} href="/" aria-label="1Muslim home"><span>1</span>Muslim</Link>
          <div className={styles.topActions}>
            <Link href="/auth?next=%2Fsearch" className={styles.signIn}>Sign In</Link>
            <Link href="/auth?mode=signup&next=%2Fsearch" className={styles.joinTop}>Join 1Muslim <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        <Link href="/learn" className={styles.prayerGlass} aria-label="Explore prayer and Salah">
          <span className={styles.prayerEyebrow}>PRAYER &amp; SALAH</span>
          <span className={styles.prayerTitle}>Your daily connection <span aria-hidden="true">›</span></span>
          <span className={styles.prayerDots} aria-hidden="true"><i/><i/><i/><i/><i/></span>
        </Link>
      </section>

      <section className={styles.intro} aria-label="Join the 1Muslim community">
        <div className={styles.identityRow}>
          <div className={styles.avatar} aria-hidden="true"><span>1M</span></div>
          <div className={styles.identityText}>
            <h1>Welcome to <em>1Muslim</em></h1>
            <p className={styles.motto}>One Ummah · One Home</p>
          </div>
        </div>
        <p className={styles.introText}>A global Muslim community to connect, learn, watch, share, and grow together.</p>
        <div className={styles.mainActions}>
          <Link className={styles.primary} href="/auth?mode=signup&next=%2Fsearch">Join 1Muslim <span aria-hidden="true">→</span></Link>
          <Link className={styles.secondary} href="/auth?next=%2Fsearch">I already have an account</Link>
        </div>
      </section>

      <nav className={styles.shortcuts} aria-label="Explore 1Muslim">
        {destinations.map(item=><Link key={item.label} className={styles.shortcut} href={item.href}><Glyph name={item.icon}/><span>{item.label}</span></Link>)}
      </nav>

      <section className={styles.watchSection} aria-labelledby="guest-watch-title">
        <div className={styles.sectionHeading}><h2 id="guest-watch-title"><Glyph name="watch"/> Watch in DeepWatch</h2><Link href="/deepwatch">Explore All <span aria-hidden="true">→</span></Link></div>
        <div className={styles.watchRail}>
          {showcase.map(card=><Link href="/deepwatch" key={card.title} className={styles.watchCard+" "+styles[card.art]}>
            <span className={styles.watchArt} aria-hidden="true"><Glyph name="watch"/></span>
            <span className={styles.watchCaption}><strong>{card.title}</strong><small>{card.subtitle}</small></span>
            <span className={styles.playGlyph} aria-hidden="true">▶</span>
          </Link>)}
        </div>
        <span className={styles.railAccent} aria-hidden="true"><i/><i/><i/></span>
      </section>

      <Link className={styles.discover} href="/community">
        <span className={styles.avatarStack} aria-hidden="true">
          <img src="/assets/avatars/default-male.jpg" alt="" loading="lazy"/>
          <img src="/assets/avatars/Default-women.png" alt="" loading="lazy"/>
          <img src="/assets/avatars/gold-avatar-male.PNG" alt="" loading="lazy"/>
          <img src="/assets/avatars/floral-avatar-female.PNG" alt="" loading="lazy"/>
          <img src="/assets/avatars/silver-avatar-male.jpg" alt="" loading="lazy"/>
        </span>
        <span className={styles.discoverText}><strong>Discover Muslims</strong><span>Connect with a global Ummah.</span></span>
        <span className={styles.discoverArrow} aria-hidden="true">→</span>
      </Link>

      <nav className={styles.bottomNav} aria-label="Public site navigation">
        <Link href="/" aria-current="page" className={styles.active}><Glyph name="home"/><span>Home</span></Link>
        <Link href="/quran-library"><Glyph name="quran"/><span>Qur’an</span></Link>
        <Link href="/features"><Glyph name="explore"/><span>Explore</span></Link>
        <Link href="/community"><Glyph name="ummah"/><span>Ummah</span></Link>
        <Link href="/platform"><Glyph name="about"/><span>More</span></Link>
      </nav>
    </div>
  </main>;
}
