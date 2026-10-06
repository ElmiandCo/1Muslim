"use client";

import Link from "next/link";
import { ThemeToggle } from "./components/SiteNav";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import LiveNowFocus from "./components/LiveNowFocus";

type Path = "easy" | "advanced";

const easy = [
  ["01", "Allah is One", "Islam begins with worship of One God — without partners, equals, or intermediaries.", "Qur’an 112:1"],
  ["02", "The Qur’an", "Start with a translation you understand. Read slowly, ask questions, and return often.", "Read the Qur’an"],
  ["03", "You can return", "A difficult day does not mean you are too far away. Turn back, pray, keep going.", "Qur’an 39:53"],
  ["04", "Learn the prayer", "Learn the positions and words step by step. Practice before you feel ready.", "Prayer Academy"]
];

const advanced = [
  ["01", "Tawhid", "Why does worship belong to the Creator alone? Explore divine unity and classical arguments.", "Explore"],
  ["02", "Qur’an & Revelation", "Revelation, preservation, transmission, language, manuscripts and scholarly context.", "Explore"],
  ["03", "Jesus & Christianity", "Jesus in Islam, Gospel traditions, early Christian debates and the Qur’anic view.", "Explore"],
  ["04", "Prophethood", "Why Muslims believe Muhammad ﷺ was a messenger and how revelation fits the prophetic tradition.", "Explore"]
];

const foundations = [
  ["Allah", "The One God"],
  ["Shahadah", "Testimony of faith"],
  ["Tawhid", "Oneness of Allah"],
  ["Qur’an", "Revelation / recitation"],
  ["Tafsir", "Qur’anic explanation"],
  ["Hadith", "Reports about the Prophet ﷺ"],
  ["Sunnah", "The prophetic way"],
  ["Seerah", "Biography of Muhammad ﷺ"],
  ["Dua", "Supplication"],
  ["Salah", "Ritual prayer"],
  ["Wudu", "Ablution"],
  ["Tawbah", "Repentance"]
];

const explore = [
  ["Why One God?", "If God is God, what does worship belonging to Him alone mean?", "Tawhid"],
  ["Understanding Jesus", "Honor Jesus. Worship God. Explore the Islamic view of ʿIsa.", "Qur’an 5:72"],
  ["History & Christianity", "A sourced timeline from Jesus and the early church to the emergence of Islam.", "Timeline"],
  ["Isaiah 42", "Read the passage, its context, the Muslim interpretation and alternative interpretations.", "Compare"],
  ["The Qur’an", "Read, reflect, return — with translation, recitation, tafsir and context.", "Open Qur’an"],
  ["Prayer Academy", "See the positions, learn what to say, then test yourself.", "Take quiz"]
];

const terms = [
  ["Mus’haf", "A physical written copy of the Qur’anic text."],
  ["Iman", "Faith in Allah, His angels, books, messengers, the Last Day and divine decree."],
  ["Shirk", "Associating partners with Allah in worship or what belongs uniquely to Him."],
  ["Sawm", "Fasting during Ramadan from dawn to sunset."],
  ["Zakah", "Obligatory charitable giving with its rules and eligible recipients."],
  ["Qiblah", "The direction toward the Ka‘bah in Makkah."]
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  const [path, setPath] = useState<Path>("easy");
  const [active, setActive] = useState("Home");
  const [signedIn, setSignedIn] = useState(false);
  const [accountName, setAccountName] = useState("");
  useEffect(() => { const supabase=createClient(); supabase.auth.getUser().then(async ({data}) => { if(!data.user) return; setSignedIn(true); const {data:profile}=await supabase.from("profiles").select("display_name,username").eq("id",data.user.id).maybeSingle(); setAccountName(profile?.display_name || (profile?.username ? "@"+profile.username : "My profile")); }); }, []);

  const lessonSet = path === "easy" ? easy : advanced;

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="homeLogo" aria-label="1Muslim Home"><img src="/1muslim-logo.svg" alt="1Muslim" /></Link>
        <nav>
          {[
            ["Home","/","⌂"],["Learn","/#paths","◈"],["Explore","/#explore","◎"],["Community","/community","♧"],["Streaming","/streaming","▶"]
          ].map(([item,href,icon]) => <Link key={item} href={href} className={active === item ? "nav active" : "nav"} onClick={() => setActive(item)}><span className="navIcon">{icon}</span>{item}</Link>)}
        </nav>
        <button className="primary sideCta" onClick={() => document.getElementById("paths")?.scrollIntoView({behavior:"smooth"})}>Start learning</button>
        <ThemeToggle />
        {signedIn ? <div className="authSidebarLink"><Link href="/profile">👤 {accountName}</Link><button onClick={async()=>{await createClient().auth.signOut();window.location.reload();}}>Sign out</button></div> : <Link href="/auth" className="authSidebarLink">Sign in / Create account</Link>}
        <div className="sidebarBottom">
          <div className="miniAvatar">OM</div>
          <div><strong>Start where you are.</strong><span>No pressure. No race.</span></div>
          <span className="more">•••</span>
        </div>
      </aside>

      <main className="feed">
        <header className="mobileTop">
          <Link href="/" className="homeLogo compactLogo" aria-label="1Muslim Home"><img src="/1muslim-logo.svg" alt="1Muslim" /></Link>
          <ThemeToggle />
        </header>

        <div className="feedHeader">
          <nav className="feedTabs" aria-label="Home sections">
            <Link href="/" className="feedTab active">For You</Link>
            <Link href="/#paths" className="feedTab">Learn</Link>
            <Link href="/#explore" className="feedTab">Explore</Link>
          </nav>
          <div className="tinyLine" />
        </div>

        <section className="heroPost">
          <div className="eyebrow">1MUSLIM LIVE</div>
          <h1>Watch. Learn. Reflect. Together.</h1>
          <p>The heart of 1Muslim is becoming live community: one continuous channel, scheduled pro streamers, real conversations, and a place to return throughout the day.</p>
          <div className="heroActions">
            <Link href="/streaming" className="primary">Enter Live Now <Arrow /></Link>
            <Link href="/streaming/scheduled" className="ghost">See Scheduled Lives</Link>
          </div>
          <div className="welcomeMeta"><span>● Watch without an account</span><span>·</span><span>Sign in to participate</span></div>
        </section>
        <LiveNowFocus />

        <section className="sectionBlock"><div className="sectionTitle"><div><span className="eyebrow">STILL YOUR JOURNEY</span><h2>Start where you are.</h2></div><span className="counter">Learn at your pace</span></div><p className="adaptive" style={{marginTop:0}}>Live is the front door. Learning, Qur’an, community and reflection are still here when you want to go deeper.</p></section>

        <section className="sectionBlock learnPaths" id="paths">
          <div className="learnPathsHead">
            <div>
              <span className="eyebrow">CHOOSE YOUR PACE</span>
              <h2>Two ways to learn.</h2>
              <p>Start gently or go straight into the deeper questions. You can switch paths whenever you want.</p>
            </div>
            <span className="counter">01 — 02</span>
          </div>

          <div className="learningChoices">
            <button className={path === "easy" ? "learningChoice active" : "learningChoice"} onClick={() => setPath("easy")}>
              <span className="choiceNumber">01</span>
              <span className="choiceLabel">RECOMMENDED</span>
              <strong>The Easy Path</strong>
              <p>Build a clear foundation without rushing. Short lessons, practical guidance and Qur’an-first learning.</p>
              <span className="choiceMeta"><b>Allah</b><b>Qur’an</b><b>Prayer</b><i>↗</i></span>
            </button>
            <button className={path === "advanced" ? "learningChoice active" : "learningChoice"} onClick={() => setPath("advanced")}>
              <span className="choiceNumber">02</span>
              <span className="choiceLabel">DEEP DIVE</span>
              <strong>The Advanced Path</strong>
              <p>Go deeper into Tawhid, Tafsir, Hadith, Seerah, revelation and the questions behind the foundations.</p>
              <span className="choiceMeta"><b>Tawhid</b><b>Tafsir</b><b>Seerah</b><i>↗</i></span>
            </button>
          </div>

          <div className="learnLessonsHead">
            <span>{path === "easy" ? "EASY PATH" : "ADVANCED PATH"} · NEXT LESSONS</span>
            <span>Swipe to explore</span>
          </div>
          <div className="carousel">
            {lessonSet.map(([num,title,text,tag]) => (
              <Link href="/learn/elm-tent#sessions" className="lessonCard" key={num}>
                <span className="num">{num}</span><div className="cardTag">{tag}</div><h3>{title}</h3><p>{text}</p><span className="textButton">Open lesson <Arrow /></span>
              </Link>
            ))}
          </div>
          <p className="adaptive">Learning should branch, not break. If a deeper question needs a foundation, 1Muslim can bring you back to it.</p>
        </section>

        <section className="shahadahPost">
          <div className="postTop"><div className="miniAvatar gold">OM</div><div><strong>1Muslim</strong><span>@onemuslim · Foundation</span></div><span className="more">•••</span></div>
          <div className="eyebrow">THE SHAHADAH</div>
          <h2>Know it. Believe it. Then say it.</h2>
          <p>You can love your mother before you ever say, “I love my mother.” Saying it doesn’t create the love — it affirms what you already know and feel.</p>
          <p>Faith works with that same honesty. When you have learned enough about Allah, His Qur’an and His Messengers, you can affirm what you believe:</p>
          <blockquote>“I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is His Messenger.”</blockquote>
          <Link className="primary" href="/recording-studio/shahadah">Say it <Arrow /></Link>
        </section>

        <section className="sectionBlock compact">
          <div className="sectionTitle"><div><span className="eyebrow">FOUNDATIONS</span><h2>The words you’ll keep hearing.</h2></div><span className="counter">12 terms</span></div>
          <div className="horizontalCards">
            {foundations.slice(0,6).map(([a,b]) => <div className="termCard" key={a}><strong>{a}</strong><span>{b}</span></div>)}
          </div>
          <div className="horizontalCards second">
            {foundations.slice(6).map(([a,b]) => <div className="termCard" key={a}><strong>{a}</strong><span>{b}</span></div>)}
          </div>
        </section>

        <section className="sectionBlock" id="explore">
          <div className="sectionTitle"><div><span className="eyebrow">EXPLORE</span><h2>Questions deserve good answers.</h2></div><span className="counter">Swipe →</span></div>
          <div className="carousel exploreCarousel">
            {explore.map(([title,text,tag]) => <article className="exploreCard" key={title}><span className="cardTag">{tag}</span><h3>{title}</h3><p>{text}</p><button className="textButton">Explore <Arrow /></button></article>)}
          </div>
        </section>

        <section className="timeline">
          <div><span className="eyebrow">A STARTING TIMELINE</span><h2>Context before conclusions.</h2><p>History is worth checking carefully. Use primary evidence and reputable scholarship rather than oversimplified internet claims.</p></div>
          <div className="timelineRow">
            <div><b>1st c.</b><span>Jesus & Jewish context</span></div><div><b>1st–4th c.</b><span>Texts & traditions circulate</span></div><div><b>325 CE</b><span>Nicaea & the Nicene Creed</span></div><div><b>7th c.</b><span>Qur’anic revelation in Arabia</span></div>
          </div>
        </section>

        <section className="quranPost">
          <div className="eyebrow">QUR’AN</div><h2>Read. Reflect. Return.</h2><p>Use the Qur’an alongside a trusted translation, recitation, tafsir and scholarly context. Start with a passage that speaks to the question you’re asking.</p>
          <div className="quranActions"><button className="primary">Open Qur’an <Arrow /></button><button className="ghost">Read Surah Al-Ikhlas</button></div>
        </section>

        <section className="sectionBlock compact">
          <div className="sectionTitle"><div><span className="eyebrow">DICTIONARY</span><h2>Small words. Big ideas.</h2></div><span className="counter">Swipe →</span></div>
          <div className="carousel">
            {terms.map(([a,b]) => <article className="definition" key={a}><h3>{a}</h3><p>{b}</p></article>)}
          </div>
        </section>

        <section className="starter">
          <div><span className="eyebrow">STARTER PACK</span><h2>Your first few things.</h2><p>Nothing here is a test of belonging. Take what helps you take the next step.</p></div>
          <div className="starterGrid"><button>Qur’an translation <Arrow /></button><button>Prayer mat <Arrow /></button><button>Modest clothing <Arrow /></button><button>Hijab, if you choose <Arrow /></button></div>
        </section>

        <footer><strong>1Muslim</strong><span>Learn · Connect · Reflect · Return</span><span>Built for people wherever they are in their journey.</span></footer>
      </main>

      <aside className="rightRail">
        <div className="search">⌕ <input placeholder="Search 1Muslim" /></div>
        <div className="railCard"><span className="eyebrow">START HERE</span><h3>New to Islam?</h3><p>Take the gentle route through Allah, Qur’an, prayer, forgiveness and daily life.</p><button className="primary">Start Easy Path</button></div>
        <div className="railCard"><span className="eyebrow">PRAYER ACADEMY</span><h3>Learn salah by seeing it.</h3><div className="prayerMini"><span>Standing</span><span>↕</span><span>Bowing</span><span>↕</span><span>Prostration</span></div><button className="ghost full">Take the quiz</button></div>
        <div className="railCard quiet"><span className="eyebrow">COMMUNITY</span><h3>Leave something for the next person.</h3><p>Share a reflection, encouragement or honest question. Core lessons stay protected; community contributions add to them.</p></div>
      </aside>

      <nav className="mobileNav"><Link href="/" >⌂<small>Home</small></Link><Link href="/#paths">◈<small>Learn</small></Link><Link href="/#explore">◎<small>Explore</small></Link><Link href="/community">♧<small>Community</small></Link><Link href="/ashab">👥<small>Ashab</small></Link><Link href="/streaming">🔴<small>Live</small></Link></nav>
    </div>
  );
}
