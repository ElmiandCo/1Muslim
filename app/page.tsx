"use client";

import Link from "next/link";
import { ThemeToggle } from "./components/SiteNav";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import LiveNowFocus from "./components/LiveNowFocus";
import StoriesRail from "./components/StoriesRail";
import TimelinePopup, { type TimelineItem } from "./components/TimelinePopup";

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


const easyTimeline: TimelineItem[] = [
  {id:"jesus",date:"1st c.",title:"Jesus & Jewish context",summary:"Jesus lived and taught in Roman-ruled Judea within the Jewish religious world of the first century.",detail:"This period sits at the intersection of Jewish religious life, Roman political power and several Jewish movements. The New Testament, Josephus and archaeology are among the sources historians use to reconstruct the setting. Islamic teaching honors ʿIsa (Jesus) as a mighty messenger of Allah, while the Christian tradition develops its own account of his identity and mission.",lens:"Separate what a source says from later theological interpretation, and distinguish Islamic belief from historical reconstruction.",sourceLabel:"Encyclopaedia Britannica — Jesus",sourceUrl:"https://www.britannica.com/biography/Jesus"},
  {id:"early-christianity",date:"1st–4th c.",title:"Texts & traditions circulate",summary:"Early Christian communities developed across the Roman world, producing texts, debates and different theological traditions.",detail:"The first centuries of Christianity included diverse communities, writings and arguments about Jesus, scripture, authority and doctrine. The process was not a single moment when one complete system suddenly appeared; traditions developed over time and differed across regions.",lens:"Ask which text, community and century a claim belongs to before treating it as universal early Christian belief.",sourceLabel:"Encyclopaedia Britannica — Christianity",sourceUrl:"https://www.britannica.com/topic/Christianity"},
  {id:"nicaea",date:"325 CE",title:"Council of Nicaea",summary:"Emperor Constantine convened a major council where bishops debated the relationship between the Father and the Son.",detail:"The Council of Nicaea produced a creed using language affirming the Son as fully divine and condemned Arius's position. It was a major event in Christian doctrinal history, but it did not simply 'create Christianity.' Christian communities and debates existed for centuries before 325.",lens:"Nicaea is best understood as a major milestone in an already developing theological and institutional history.",sourceLabel:"Encyclopaedia Britannica — Council of Nicaea",sourceUrl:"https://www.britannica.com/event/Council-of-Nicaea-Christianity-325"},
  {id:"revelation",date:"7th c.",title:"Qur’anic revelation in Arabia",summary:"Muslims believe the Qur’an began to be revealed to Muhammad ﷺ in Makkah in the early 7th century.",detail:"In Islamic belief, Muhammad ﷺ received the first revelation through Jibril (Gabriel) and continued receiving revelation over roughly 23 years. The Qur’an presents itself as revelation from Allah and repeatedly places Muhammad within the line of earlier prophets.",lens:"For Islamic theology, revelation is the primary claim; historical study can separately examine manuscripts, inscriptions, transmission and early sources.",sourceLabel:"Qur’an 96:1–5 — Quran.com",sourceUrl:"https://quran.com/96/1-5"}
];

const advancedTimeline: TimelineItem[] = [
  {id:"adam",date:"Primordial",title:"Adam عليه السلام",summary:"In Islam, Adam is the first human and a prophet of Allah.",detail:"The Qur’an describes Allah creating Adam, teaching him, and placing him and his spouse in the earthly test. Islamic sources do not give Adam a securely established historical date, so this belongs at the beginning of the theological timeline rather than being assigned a modern archaeological date.",lens:"Do not invent a BCE date for Adam. Keep the theological claim distinct from what archaeology can date.",sourceLabel:"Qur’an 2:30–39 — Quran.com",sourceUrl:"https://quran.com/2/30-39"},
  {id:"ibrahim",date:"Patriarchal era",title:"Ibrahim / Abraham عليه السلام",summary:"Abraham occupies a central place in the Islamic prophetic tradition and in Jewish and Christian scripture.",detail:"The Qur’an presents Ibrahim as a hanif devoted to Allah and connects him with the Kaʿbah through Ibrahim and Ismaʿil. Modern historians cannot establish a precise calendar date for Abraham from independent evidence, so an exact year should not be presented as settled history.",lens:"Use 'patriarchal era' or 'traditional dating' rather than a falsely precise year.",sourceLabel:"Qur’an 2:124–129 — Quran.com",sourceUrl:"https://quran.com/2/124-129"},
  {id:"musa",date:"2nd millennium BCE tradition",title:"Musa / Moses عليه السلام",summary:"Moses is a major prophet in Islam and a foundational figure in the Torah tradition.",detail:"The Qur’an gives extensive attention to Musa, Pharaoh, the Exodus and revelation of the Tawrah. Historical dating of the Exodus and Moses remains debated among scholars, so the timeline should identify the broad traditional setting without pretending there is one universally accepted archaeological date.",lens:"Separate the Qur’anic account, biblical tradition and archaeological/historical hypotheses.",sourceLabel:"Qur’an 20:9–79 — Quran.com",sourceUrl:"https://quran.com/20/9-79"},
  {id:"david-solomon",date:"c. 11th–10th c. BCE",title:"David, Solomon & the Israelite monarchy",summary:"The Israelite monarchy becomes an important part of the historical and scriptural landscape of the ancient Levant.",detail:"Archaeology and inscriptions provide evidence for the wider Israelite and Judahite kingdoms, while the biblical narratives provide theological and literary accounts of David and Solomon. The Met notes evidence for David's dynasty and describes Jerusalem's growth through the Iron Age.",lens:"This is a place where archaeology and scripture overlap, but they are not identical kinds of evidence.",sourceLabel:"The Metropolitan Museum of Art — Ancient Israel",sourceUrl:"https://www.metmuseum.org/de/perspectives/cyrus-and-the-judean-diaspora"},
  {id:"exile",date:"8th–6th c. BCE",title:"Assyrian & Babylonian upheavals",summary:"Assyrian conquest, Babylonian conquest and exile reshaped the kingdoms of Israel and Judah.",detail:"Samaria fell to Assyria around 722/721 BCE. Jerusalem and the First Temple were destroyed by Babylonian forces in 587/586 BCE, followed by deportations. Persian rule later allowed exiled Judeans to return and rebuild.",lens:"These events are especially useful for understanding the historical setting behind later Jewish texts and traditions.",sourceLabel:"The Metropolitan Museum of Art — Eastern Mediterranean chronology",sourceUrl:"https://82nd-and-fifth.metmuseum.org/toah/ht/04/wae.html"},
  {id:"second-temple",date:"6th c. BCE–70 CE",title:"Second Temple period",summary:"Jewish life developed through Persian, Hellenistic and Roman rule, with the Jerusalem Temple at its center.",detail:"The Second Temple was rebuilt after the Babylonian exile and later dramatically expanded under Herod. The region passed through Persian, Hellenistic and Roman political control. Jewish communities also developed outside Judea, creating a diverse religious and cultural landscape.",lens:"The Second Temple period is essential background for understanding Jesus, the early Jesus movement and later Jewish tradition.",sourceLabel:"The Metropolitan Museum of Art — Eastern Mediterranean chronology",sourceUrl:"https://82nd-and-fifth.metmuseum.org/toah/ht/04/wae.html"},
  {id:"jesus-advanced",date:"1st c. CE",title:"Jesus / ʿIsa عليه السلام",summary:"Jesus lived in Roman Judea and became the central figure of Christianity; Islam later identifies him as the Messiah and a prophet.",detail:"The historical Jesus is studied through early Christian writings and other ancient evidence. Christian theology makes claims about his identity that go beyond historical description. The Qur’an presents ʿIsa as the Messiah, son of Maryam and messenger of Allah, while rejecting the divinization of Jesus.",lens:"Keep three layers distinct: historical reconstruction, Christian theology and the Islamic Qur’anic account.",sourceLabel:"Encyclopaedia Britannica — Jesus",sourceUrl:"https://www.britannica.com/biography/Jesus"},
  {id:"paul",date:"1st c. CE",title:"Saul / Paul of Tarsus",summary:"Paul became a major missionary and letter-writer in the early Christian movement.",detail:"Paul, traditionally known as Saul before his Christian mission, became one of the most influential figures in early Christianity. His letters are among the earliest surviving Christian writings and played a major role in the spread of the movement among Gentiles.",lens:"Paul is historically important, but his theology should not be projected backward onto every earlier follower of Jesus.",sourceLabel:"Encyclopaedia Britannica — St. Paul the Apostle",sourceUrl:"https://www.britannica.com/biography/Saint-Paul-the-Apostle"},
  {id:"temple-70",date:"70 CE",title:"Destruction of the Second Temple",summary:"Roman forces destroyed the Jerusalem Temple during the First Jewish Revolt.",detail:"The revolt against Rome began in 66 CE and the Temple was destroyed in 70 CE. This transformed Jewish religious life and became a major turning point for the Jewish world and for the developing Christian movement.",lens:"Use Josephus, archaeology and later Jewish and Christian sources carefully, remembering that later sources have different purposes.",sourceLabel:"The Metropolitan Museum of Art — Judaea under Rome",sourceUrl:"https://www.metmuseum.org/exhibitions/listings/2019/world-between-empires-art-and-identity-ancient-middle-east/exhibition-galleries"},
  {id:"early-debates",date:"2nd–3rd c. CE",title:"Early Christian communities & debates",summary:"Christian communities spread across the Roman world while debating scripture, authority and the identity of Jesus.",detail:"The early centuries included multiple communities and theological trajectories. Bishops, teachers, texts and councils gradually shaped what became mainstream Christian doctrine. This development is much larger than a single council or emperor.",lens:"Track claims by century and region. 'Christianity' was not a culturally uniform institution in every place from the beginning.",sourceLabel:"Encyclopaedia Britannica — Christianity",sourceUrl:"https://www.britannica.com/topic/Christianity"},
  {id:"constantine",date:"313 CE",title:"Edict of Milan",summary:"Constantine and Licinius established a policy of religious toleration in the Roman Empire.",detail:"The 313 settlement is commonly associated with Constantine and Licinius and marked a major change in the legal position of Christians. It preceded Nicaea by twelve years and helps explain the growing relationship between imperial power and Christian institutions.",lens:"Toleration in 313 and doctrinal decisions at Nicaea in 325 are related developments, but they are not the same event.",sourceLabel:"Encyclopaedia Britannica — Constantine I",sourceUrl:"https://www.britannica.com/biography/Constantine-I-Roman-emperor"},
  {id:"nicaea-advanced",date:"325 CE",title:"Council of Nicaea",summary:"A major imperial-era council addressed the Arian controversy and produced the Nicene Creed.",detail:"Nicaea affirmed language about the Son being of the same substance as the Father and rejected Arius's teaching. The council was one step in a longer history of Christian doctrinal development; later councils continued debating Christology and related questions.",lens:"Do not reduce Christian doctrine to one council. Nicaea was important, but Constantinople, Ephesus and Chalcedon followed.",sourceLabel:"Encyclopaedia Britannica — Council of Nicaea",sourceUrl:"https://www.britannica.com/event/Council-of-Nicaea-Christianity-325"},
  {id:"justinian",date:"527–565 CE",title:"Justinian & Byzantine religious policy",summary:"The reign of Justinian saw extensive imperial legislation affecting religious communities, including Jews.",detail:"Justinian's Byzantine government issued legislation that restricted aspects of Jewish communal and religious life. The broader history is well documented, but a simple statement that 'Justinian banned the Shema' needs careful sourcing and qualification. Evidence for restrictions on Jewish worship exists, while the precise attribution and scope of a specific Shema prohibition are debated.",lens:"For this topic especially, avoid turning a debated secondary claim into an absolute historical fact.",sourceLabel:"The Metropolitan Museum of Art — Judaism during the Byzantine period",sourceUrl:"https://www.metmuseum.org/exhibitions/listings/2012/byzantium-and-islam/blog/topical-essays/posts/judaism"},
  {id:"arabia",date:"6th–7th c. CE",title:"Arabia before Islam",summary:"Arabia contained diverse tribal, religious and trading communities before the Qur’anic revelation.",detail:"The Qur’an emerged in a world connected to the Byzantine and Sasanian spheres and to long-distance trade. Western Arabia included polytheistic, Jewish and Christian communities and traditions, while the Qur’an addressed its audience within a wider Abrahamic landscape.",lens:"Use early Islamic sources alongside archaeology, inscriptions and late antique studies when reconstructing the period.",sourceLabel:"Encyclopaedia Britannica — Arabia",sourceUrl:"https://www.britannica.com/place/Arabia-peninsula-Asia"},
  {id:"muhammad",date:"c. 570 CE",title:"Birth of Muhammad ﷺ",summary:"Muhammad ﷺ was born in Makkah and later became the final prophet in Islamic belief.",detail:"Traditional Islamic biography places his birth around 570 CE. The Qur’an itself does not give a birth year. Muhammad's early life in Makkah preceded the beginning of revelation and his later migration to Madinah.",lens:"Use 'c. 570' rather than a falsely exact birth date; Islamic historical tradition provides the framework for the biography.",sourceLabel:"Encyclopaedia Britannica — Muhammad",sourceUrl:"https://www.britannica.com/biography/Muhammad"},
  {id:"revelation-advanced",date:"610 CE",title:"First revelation",summary:"Muslims believe the first Qur’anic revelation came to Muhammad ﷺ in the Cave of Hira.",detail:"Islamic tradition identifies the opening verses of Surah al-ʿAlaq as the beginning of revelation. The Qur’an was then revealed gradually over the prophetic mission, with Muhammad ﷺ teaching and reciting it to his companions.",lens:"The Qur’an is the primary Islamic source for revelation; the seerah and hadith provide additional historical detail.",sourceLabel:"Qur’an 96:1–5 — Quran.com",sourceUrl:"https://quran.com/96/1-5"},
  {id:"hijrah",date:"622 CE",title:"Hijrah to Madinah",summary:"The migration from Makkah to Madinah became a defining turning point in the history of the Muslim community.",detail:"The Hijrah established a new phase of the Prophet's ﷺ mission and became the starting point of the Islamic calendar. In Madinah, the Muslim community developed religious, social and political institutions under the Prophet's leadership.",lens:"Treat the Hijrah as both a religious milestone and a major historical turning point.",sourceLabel:"Encyclopaedia Britannica — Hijrah",sourceUrl:"https://www.britannica.com/topic/Hijrah-Islam"},
  {id:"death",date:"632 CE",title:"Death of Muhammad ﷺ",summary:"Muhammad ﷺ died in Madinah in 632 CE after completing his prophetic mission according to Islamic belief.",detail:"The Prophet's ﷺ death marked the transition from prophetic leadership to the caliphate and the beginning of a new phase in Muslim political history. Islamic sources preserve extensive material about his final period and the community's response.",lens:"Separate the theological finality of prophethood from the later political history of the Muslim community.",sourceLabel:"Encyclopaedia Britannica — Muhammad",sourceUrl:"https://www.britannica.com/biography/Muhammad"}
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
  const [isTestAdmin, setIsTestAdmin] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineItem | null>(null);
  const [accountName, setAccountName] = useState("");
  const [myScheduledLives, setMyScheduledLives] = useState<Array<{id:string;title:string;category:string;starts_at:string;ends_at:string}>>([]);
  useEffect(() => { const supabase=createClient(); supabase.auth.getUser().then(async ({data}) => { if(!data.user) return; setSignedIn(true); setIsTestAdmin((data.user.email ?? "").toLowerCase() === "hudhudbyelmi@gmail.com"); const {data:profile}=await supabase.from("profiles").select("display_name,username").eq("id",data.user.id).maybeSingle(); setAccountName(profile?.display_name || (profile?.username ? "@"+profile.username : "My profile"));
      const {data:scheduled}=await supabase.from("live_schedule_slots").select("id,title,category,starts_at,ends_at").eq("host_id",data.user.id).in("status",["scheduled","waiting"]).gt("starts_at",new Date().toISOString()).order("starts_at",{ascending:true}).limit(3);
      setMyScheduledLives((scheduled??[]) as Array<{id:string;title:string;category:string;starts_at:string;ends_at:string}>);
    }); }, []);

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

        {isTestAdmin && <section className="adminWelcome" aria-label="Admin controls">
          <div className="adminWelcomeTop"><div><span className="eyebrow">ADMIN MODE · TEST</span><h2>👋 Welcome, Admin</h2><p>Signed in as <strong>hudhudbyelmi@gmail.com</strong>. You have access to the 1Muslim control center.</p></div><span className="adminBadge">● ADMIN</span></div>
          <div className="adminControls">
            <Link href="/streaming/go-live" className="adminControl"><span>🔴</span><div><strong>Live Control</strong><small>Go live & manage the broadcast</small></div><b>→</b></Link>
            <Link href="/streaming/scheduled" className="adminControl"><span>📅</span><div><strong>Scheduled Streams</strong><small>Review upcoming host sessions</small></div><b>→</b></Link>
            <Link href="/admin/videos" className="adminControl"><span>🎥</span><div><strong>Saved Videos</strong><small>Manage the guaranteed video list</small></div><b>→</b></Link>
            <Link href="/community" className="adminControl"><span>👥</span><div><strong>Community</strong><small>Open the community feed</small></div><b>→</b></Link>
            <div className="adminControl disabled"><span>📊</span><div><strong>Platform Activity</strong><small>Command center coming next</small></div><b>•</b></div>
            <div className="adminControl disabled"><span>⚙️</span><div><strong>Admin Settings</strong><small>Permissions coming next</small></div><b>•</b></div>
          </div>
        </section>}

        <StoriesRail />
        <LiveNowFocus mode="hero" />
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
        <LiveNowFocus mode="carousel" />
        {signedIn && myScheduledLives.length > 0 && <section className="sectionBlock" style={{marginTop:18}}>
          <div className="sectionTitle"><div><span className="eyebrow">YOUR UPCOMING LIVES</span><h2>My scheduled Lives.</h2></div><Link href="/streaming/scheduled" className="counter">See all →</Link></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:14}}>
            {myScheduledLives.map(live=><Link key={live.id} href="/streaming/go-live" style={{textDecoration:"none",color:"inherit",border:"1px solid var(--border,#263029)",borderRadius:18,padding:16}}>
              <div className="eyebrow">{live.category}</div><h3 style={{margin:"8px 0 5px"}}>{live.title}</h3>
              <div style={{fontSize:11,opacity:.7}}>{new Date(live.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}</div>
              <div style={{fontSize:11,marginTop:10}}>Prep in Live Studio →</div>
            </Link>)}
          </div>
        </section>}

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
          <div className="timelineHeader">
            <div><span className="eyebrow">A STARTING TIMELINE</span><h2>{path === "advanced" ? "Go deeper. Follow the thread." : "Context before conclusions."}</h2><p>{path === "advanced" ? "A deeper route from the earliest prophetic tradition through the ancient Near East, Jesus, Paul, the councils, Byzantine history and the birth of Islam. Tap any point for the fuller explanation and source." : "History is worth checking carefully. Tap any point to open a short explanation and a real source. Switch to Advanced above for the expanded route."}</p></div>
            <span className="timelineMode">{path === "advanced" ? "ADVANCED · " + advancedTimeline.length + " POINTS" : "EASY · " + easyTimeline.length + " POINTS"}</span>
          </div>
          <div className="timelineRow expanded">
            {(path === "advanced" ? advancedTimeline : easyTimeline).map((item) => (
              <button key={item.id} className="timelinePoint" onClick={() => setSelectedTimeline(item)} aria-label={`Open ${item.title}`}>
                <b>{item.date}</b><span>{item.title}</span><i>Open ↗</i>
              </button>
            ))}
          </div>
        </section>
        <TimelinePopup item={selectedTimeline} onClose={() => setSelectedTimeline(null)} />

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
