import styles from "./OneSearchBar.module.css";

export default function OneSearchBar() {
  return <form action="/search" method="get" role="search" className={styles.search} aria-label="Search the web and 1Muslim">
    <div className={styles.caption}><span className={styles.mark}>1M</span><span>1Muslim Search<small>The whole web. Your Ummah, closer.</small></span></div>
    <div className={styles.inputRow}><span aria-hidden="true" className={styles.icon}>⌕</span>
      <input type="search" name="q" minLength={2} maxLength={120} required
        aria-label="Search the worldwide web and 1Muslim"
        placeholder="Search anything across the world…"/>
      <button type="submit">Search <span aria-hidden="true">↗</span></button>
    </div>
    <p>Global results, with Muslim-relevant sources highlighted · Browse without signing in</p>
  </form>;
}
