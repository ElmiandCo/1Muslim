import Link from "next/link";
import styles from "./editorial-masthead.module.css";
export default function EditorialMasthead({current}:{current:"studio"|"command"}){
 return <header className={styles.bar}>
 <Link href="/qibla/newsroom" className={styles.brand}>1MUSLIM <em>QIBLA</em></Link>
 <nav aria-label="Qibla editorial navigation"><Link href="/qibla/newsroom">PUBLICATIONS</Link><Link aria-current={current==="studio"?"page":undefined} href="/qibla/studio">EDITORIAL STUDIO</Link><Link aria-current={current==="command"?"page":undefined} href="/qibla/command">COMMAND CENTER</Link><Link href="/">1MUSLIM ↗</Link></nav>
 </header>
}