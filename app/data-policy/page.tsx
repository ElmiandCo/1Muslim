import Link from "next/link";
import SiteNav from "../components/SiteNav";

export const metadata={title:"Data Policy | 1Muslim",description:"How 1Muslim handles account, community and activity data."};

export default function DataPolicyPage(){
 return <main className="legalPage"><SiteNav/><div className="legalWrap">
 <header className="legalHero"><span className="legalEyebrow">✦ 1MUSLIM / DATA & TRANSPARENCY</span><h1>Data Policy</h1><p>How we use and protect information when you participate in 1Muslim.</p><div className="legalMeta"><span>Updated November 8, 2026</span><span>✧ Read alongside our Privacy Policy</span></div></header>
 <article className="legalContent">
 <section className="legalCard"><div className="legalNumber">01</div><div><h2>Information you provide</h2><p>Account details, profile information, posts, messages, comments, uploads, learning activity and any verification information you submit may be processed to operate the features you choose to use. Public content can be seen by other members according to the feature's visibility settings.</p></div></section>
 <section className="legalCard"><div className="legalNumber">02</div><div><h2>Activity and presence</h2><p>We may record session identifiers, page visits, recent activity times and service diagnostics to show presence, secure accounts, understand feature usage and maintain service reliability. Online status is an approximation and does not guarantee that a person is actively looking at the site.</p></div></section>
 <section className="legalCard"><div className="legalNumber">03</div><div><h2>Storage and service providers</h2><p>Authorized infrastructure and service providers may process data needed for authentication, hosting, storage, communication and analytics. Access to private records is limited by applicable permissions and service safeguards. We do not promise that every type of content is end-to-end encrypted.</p></div></section>
 <section className="legalCard"><div className="legalNumber">04</div><div><h2>Control and removal</h2><p>Use available account and content controls to update or remove information. Requests for additional access, correction or deletion can be directed through available support channels. Some records may be retained where needed for security, legal compliance or dispute resolution.</p></div></section>
 <section className="legalCard"><div className="legalNumber">05</div><div><h2>Related policies</h2><p>This page supplements, and does not replace, our full <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>. Those documents provide additional details about your rights, responsibilities and how we process information.</p></div></section>
 </article><p style={{textAlign:"center",padding:"24px 0"}}><Link href="/qibla/newsroom">← Return to 1Qibla</Link></p>
 </div></main>
}
