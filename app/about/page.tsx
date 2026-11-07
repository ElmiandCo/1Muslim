import type { Metadata } from "next";
import Link from "next/link";
import styles from "./mission.module.css";

export const metadata: Metadata = {
  title: "Our Mission | 1Muslim",
  description: "Why 1Muslim exists: remembrance of Allah, beneficial knowledge, Qur'an, and a welcoming Muslim community.",
};

const pillars = [
  { number: "01", title: "Remember Allah", text: "Make space in everyday life for dhikr, reflection, prayer, and reminders that bring us back to what matters." },
  { number: "02", title: "Stay close to the Qur’an", text: "Read, listen, learn, and return to the Qur’an—one verse and one meaningful step at a time." },
  { number: "03", title: "Grow in beneficial knowledge", text: "Discover lessons, stories, and trustworthy educational media that encourage learning and practice." },
  { number: "04", title: "Strengthen the Ummah", text: "Build sincere connections, share what benefits others, and invite friends and family into a welcoming space." },
];

export default function OurMissionPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.back} href="/" aria-label="Return to Home">← <span>Home</span></Link>
          <span className={styles.brand}>1MUSLIM <span className={styles.star}>✦</span></span>
        </header>

        <section className={styles.hero} aria-labelledby="mission-title">
          <div className={styles.eyebrow}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <p className={styles.kicker}>OUR PURPOSE · نِيَّتُنَا</p>
          <h1 id="mission-title">Our <em>Mission</em></h1>
          <p className={styles.lead}>A place to return to Allah. A community to grow with. A reminder worth sharing.</p>
          <div className={styles.divider} aria-hidden="true"><span>✧</span></div>
          <p className={styles.statement}>We are building 1Muslim for the sake of Allah: to help Muslims remember Him, stay connected to the Qur’an, seek beneficial knowledge, and encourage one another toward good.</p>
          <p className={styles.statementSmall}>Our aim is not simply more screen time. It is to make the time we spend here meaningful—and to help us carry that benefit into life beyond the screen.</p>
        </section>

        <section className={styles.pillars} aria-labelledby="pillars-title">
          <p className={styles.kicker}>WHAT GUIDES US</p>
          <h2 id="pillars-title">Four commitments. One intention.</h2>
          <div className={styles.grid}>
            {pillars.map(pillar => <article className={styles.card} key={pillar.number}>
              <span className={styles.number}>{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>)}
          </div>
        </section>

        <section className={styles.principle}>
          <p className={styles.kicker}>HOW WE BUILD</p>
          <h2>With patience, prayer, and sincerity.</h2>
          <p>Every feature—from Qur’an recitation and lessons to community, media, and progress—is an opportunity to encourage something good. We will keep reviewing our intentions, listening to our community, and improving with care. Progress and rewards should support learning, not replace sincere worship.</p>
        </section>

        <section className={styles.invite}>
          <span className={styles.inviteIcon} aria-hidden="true">✦</span>
          <h2>Come for a reminder.<br />Stay for what benefits you.</h2>
          <p>And when you find something beneficial, bring someone with you. May Allah place barakah in this effort, accept what is good, and guide us to what is better. Ameen.</p>
          <div className={styles.actions}>
            <Link href="/" className={styles.primary}>Explore 1Muslim <span aria-hidden="true">↗</span></Link>
            <Link href="/elm-tent/quran" className={styles.secondary}>Open the Qur’an <span aria-hidden="true">→</span></Link>
          </div>
        </section>
        <footer className={styles.footer}><span>1Muslim · Built with purpose</span><span>May Allah guide our intentions.</span></footer>
      </div>
    </main>
  );
}
