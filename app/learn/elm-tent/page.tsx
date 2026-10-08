import Link from "next/link";
import SiteNav from "../../components/SiteNav";

const sessions = [
  { tag: "FOUNDATION", title: "Knowing Allah", text: "A guided session on tawhid, worship, and what it means to know the One we worship.", status: "Coming soon" },
  { tag: "QUR’AN", title: "How to Begin Reading", text: "Build a practical relationship with the Qur’an through reading, reflection, recitation, and trusted explanation.", status: "Coming soon" },
  { tag: "PRACTICE", title: "Learning Salah", text: "A calm, step-by-step session for learning the prayer and building consistency.", status: "Coming soon" },
];

export default function ElmTentPage() {
  return (
    <main className="elmTentPage">
      <SiteNav />
      <section className="elmTentHero">
        <div className="tentOrb" aria-hidden="true"><span>1</span></div>
        <div className="elmTentEyebrow">LESSONS & SESSIONS</div>
        <h1>Elm Tent</h1>
        <p>A place to sit, learn, ask, and grow — through focused lessons and live teaching sessions.</p>
        <div className="elmTentActions">
          <Link className="primary" href="/learn/elm-tent/lessons">🎓 Start 12 Lessons ↗</Link>
          <Link className="ghost" href="/learn/elm-tent/library">📚 Open Library</Link>
          <Link className="ghost" href="#sessions">Explore sessions</Link>
          <Link className="ghost" href="/streaming">See Live</Link>
        </div>
      </section>

      <section className="elmTentIntro">
        <div><span className="elmTentEyebrow">THE IDEA</span><h2>Pull up a seat.</h2></div>
        <p>Elm Tent is OneMuslim’s dedicated learning space. Lessons can be watched at your pace, while live sessions give people a place to learn together, ask questions, and return to the recordings afterward.</p>
      </section>

      <section className="elmTentIntro"><div><span className="elmTentEyebrow">BOOKS · PDFS · PRIMARY SOURCES</span><h2>Elm Tent Library 📚</h2></div><p>Explore the Seerah, Qur’an translations, classical works and curated reading resources. Save notes, follow source links, and bring your own legally obtained PDFs into your learning workspace. <Link href="/learn/elm-tent/library">Browse the library →</Link></p></section>

      <section className="elmTentIntro"><div><span className="elmTentEyebrow">12 STEPS · CERTIFICATION</span><h2>Learn. Answer. Grow.</h2></div><p>Take one lesson at a time, get immediate feedback, earn lesson points, and complete all 12 introductory assessments to unlock your 1Muslim Learning Certificate. <Link href="/learn/elm-tent/lessons">Begin the journey →</Link></p></section>

      <section className="elmTentSessions" id="sessions">
        <div className="elmTentSectionHead"><div><span className="elmTentEyebrow">SESSIONS</span><h2>Learn together.</h2></div><span>3 starting sessions</span></div>
        <div className="elmTentGrid">
          {sessions.map((session) => (
            <article className="elmTentCard" key={session.title}>
              <span>{session.tag}</span><h3>{session.title}</h3><p>{session.text}</p>
              <div><b>{session.status}</b><button type="button">Remind me ↗</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="elmTentFlow">
        <div><span className="elmTentEyebrow">ONE SESSION. THREE WAYS TO LEARN.</span><h2>Live → Learn → Return.</h2></div>
        <div className="elmTentFlowCards"><div><b>01</b><strong>Join live</strong><span>Attend the teaching session and participate.</span></div><div><b>02</b><strong>Study</strong><span>Review the lesson and supporting material.</span></div><div><b>03</b><strong>Return</strong><span>Watch the saved session again when you need it.</span></div></div>
      </section>

      <footer className="elmTentFooter"><strong>Elm Tent · 1Muslim</strong><span>Learn with sincerity. Ask with honesty. Keep going.</span></footer>
    </main>
  );
}
