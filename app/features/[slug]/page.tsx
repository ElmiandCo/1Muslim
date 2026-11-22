import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {featureBySlug,featurePages} from "../feature-content";
import styles from "../features.module.css";

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return featurePages.map(page=>({slug:page.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const item=featureBySlug[slug];
 if(!item)return {title:"Feature not found | 1Muslim"};
 return {
  title:item.title,
  description:item.description,
  alternates:{canonical:"/features/"+slug},
  openGraph:{title:item.title,description:item.description,url:"https://1muslim.live/features/"+slug,type:"article",siteName:"1Muslim"},
  twitter:{card:"summary",title:item.title,description:item.description}
 };
}
export default async function FeatureDetailPage({params}:Props){
 const {slug}=await params;
 const item=featureBySlug[slug];if(!item)notFound();
 const url="https://1muslim.live/features/"+slug;
 const structured=[
  {"@context":"https://schema.org","@type":"WebPage","@id":url+"#webpage",url,name:item.title,description:item.description,inLanguage:"en",isPartOf:{"@id":"https://1muslim.live/#website"},about:{"@id":"https://1muslim.live/#organization"}},
  {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
   {"@type":"ListItem",position:1,name:"1Muslim",item:"https://1muslim.live"},
   {"@type":"ListItem",position:2,name:"Features",item:"https://1muslim.live/features"},
   {"@type":"ListItem",position:3,name:item.label,item:url}
  ]}
 ];
 return <main className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
  <div className={styles.shell}>
   <nav className={styles.nav}><Link href="/features">← All 1Muslim features</Link><span>ONE MUSLIM · ONE PLATFORM</span><Link href="/auth">Join free ↗</Link></nav>
   <section className={styles.hero}>
    <p className={styles.eyebrow}>{item.label}</p>
    <h1>{item.headline}</h1>
    <p>{item.lead}</p>
    <div className={styles.ctaRow}><Link href={item.primary.href} className={styles.primary}>{item.primary.label} ↗</Link><Link href={item.secondary.href} className={styles.secondary}>{item.secondary.label} ↗</Link></div>
   </section>
   <section className={styles.intro}><p>{item.summary}</p></section>
   <section className={styles.section}><p className={styles.eyebrow}>WHAT 1MUSLIM ACTUALLY OFFERS</p>
    <h2>Explore the experience.</h2>
    <div className={styles.grid}>{item.highlights.map((highlight,index)=><article className={styles.card} key={highlight.title}>
     <span className={styles.number}>{String(index+1).padStart(2,"0")}</span><h3>{highlight.title}</h3><p>{highlight.body}</p>
    </article>)}</div>
   </section>
   <section className={styles.faqSection}><p className={styles.eyebrow}>PRODUCT QUESTIONS</p><h2>Get to know this part of 1Muslim.</h2>
    <div className={styles.faq}>{item.questions.map(q=><article key={q.question}><h3>{q.question}</h3><p>{q.answer}</p></article>)}</div>
   </section>
   <section className={styles.related}><p className={styles.eyebrow}>ONE CONNECTED PLATFORM</p><h2>Explore what's next.</h2>
    <div className={styles.relatedLinks}>{item.related.map(related=>{
     const other=featureBySlug[related];return other?<Link key={other.slug} href={"/features/"+other.slug}>{other.label} ↗</Link>:null;
    })}</div>
   </section>
   <section className={styles.note}><span className={styles.eyebrow}>GROWING IN PUBLIC</span><h2>See 1Muslim's own numbers.</h2>
    <p>Follow dated, first-party registration trends and read how 1Muslim distinguishes new profiles from visitors or active users. Our ambition is global, but our performance claims stay tied to evidence.</p>
    <Link href="/growth">Public growth and analytics ↗</Link>
   </section>
   <footer className={styles.footer}><Link href="/platform">Platform overview</Link><Link href="/about">Our mission</Link><Link href="/unlocked">1Muslim Unlocked</Link></footer>
  </div></main>;
}