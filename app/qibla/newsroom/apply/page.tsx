import Link from "next/link";
import styles from "../newsroom.module.css";

const roles = [
  { level: "L1", title: "Member", description: "Read published stories and take part in the 1Muslim community." },
  { level: "L2", title: "Writer", description: "Draft original articles and submit them for editorial review." },
  { level: "L3", title: "Editor", description: "Review submissions, refine articles, and send work for approval." },
  { level: "L4", title: "Approver", description: "Complete final reviews and authorize articles for publication." },
] as const;

export default function QiblaApplicationInformation() {
  return (
    <main className={styles.root}>
      <div style={{maxWidth:880,margin:"0 auto",padding:"clamp(20px,5vw,64px)"}}>
        <nav style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:38,fontSize:13}}>
          <Link className={styles.homeLink} href="/qibla/newsroom">← 1Qibla Magazine</Link>
          <Link className={styles.homeLink} href="/">1Muslim Home</Link>
        </nav>
        <span className={styles.eyebrow}>JOIN THE 1QIBLA EDITORIAL COMMUNITY</span>
        <h1 style={{fontSize:"clamp(36px,6vw,68px)",letterSpacing:"-.05em",margin:"12px 0"}}>Find your place at 1Qibla.</h1>
        <p className={styles.subhead} style={{lineHeight:1.7,maxWidth:650}}>Every member starts with a voice. Explore the editorial roles and the responsibilities that come with each level.</p>
        <section aria-label="Editorial levels" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14,marginTop:34}}>
          {roles.map(role => <article key={role.level} className={styles.railCard} style={{padding:22}}>
            <span className={styles.eyebrow}>{role.level}</span>
            <h2 style={{fontSize:23,margin:"10px 0"}}>{role.title}</h2>
            <p style={{margin:0}}>{role.description}</p>
          </article>)}
        </section>
        <div className={styles.railCard} style={{padding:24,marginTop:22}}>
          <h2 style={{marginTop:0,fontSize:22}}>Interested in contributing?</h2>
          <p>Writer, Editor, and Approver positions require review and approval. Applications will open when the secure editorial application workflow is ready.</p>
          <Link href="/qibla/newsroom">Explore published stories →</Link>
        </div>
      </div>
    </main>
  );
}
