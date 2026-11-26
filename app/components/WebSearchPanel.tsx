"use client";
import {useEffect,useState} from "react";
import styles from "./WebSearchPanel.module.css";

type Kind="web"|"news"|"video";
type Item={title:string;url:string;description:string;source:string;kind:Kind;score:number;publishedAt?:string};
type SearchData={query:string;results:Item[];total:number;provider:string};
type SummaryData={summary:string;sources:Array<{number:number;title:string;url:string}>};
export default function WebSearchPanel({query}:{query:string}){
  const [data,setData]=useState<SearchData|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [active,setActive]=useState<"All"|"Web"|"News"|"Videos">("All");
  const [summary,setSummary]=useState<SummaryData|null>(null);
  const [summaryBusy,setSummaryBusy]=useState(false);
  const [summaryError,setSummaryError]=useState("");
  useEffect(()=>{
    if(query.trim().length<2){setData(null);setBusy(false);setError("");return;}
    const controller=new AbortController();
    setBusy(true);setError("");setData(null);setActive("All");setSummary(null);setSummaryError("");
    void fetch("/api/web-search?q="+encodeURIComponent(query),{cache:"no-store",signal:controller.signal})
      .then(async response=>{
        const json=await response.json();
        if(!response.ok)throw Error(json?.error||"Web search is unavailable.");
        return json as SearchData;
      }).then(json=>{if(!controller.signal.aborted)setData(json);})
      .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Unable to search");})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[query]);
  if(query.trim().length<2)return null;
  const visible=(data?.results||[]).filter(item=>active==="All" || item.kind===({Web:"web",News:"news",Videos:"video"} as const)[active]);
  const summarize=async()=>{
    if(summaryBusy)return;
    setSummaryBusy(true);setSummaryError("");setSummary(null);
    try{
      const response=await fetch("/api/web-search/summary",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),cache:"no-store"
      });
      const json=await response.json();
      if(!response.ok)throw Error(json?.error||"Summary unavailable");
      setSummary(json as SummaryData);
    }catch(reason){setSummaryError(reason instanceof Error?reason.message:"Summary unavailable");}
    finally{setSummaryBusy(false);}
  };
  return <section className={styles.section} aria-label="Search the entire web">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>THE ENTIRE WEB · MUSLIM-RELEVANT RESULTS FIRST</span><h2>Worldwide web results</h2>
        <p>Explore the whole internet, with a gentle preference for trusted Muslim-relevant sources.</p></div>
      <span className={styles.provider}>Powered by Brave Search</span>
    </div>
    {busy&&<div className={styles.status} role="status">Searching the open web…</div>}
    {error&&<div className={styles.warning} role="status"><strong>Web search not ready</strong><p>{error}</p><small>1Muslim's own directory search is still available below.</small></div>}
    {data&&<div>
      <div className={styles.tabs} role="group" aria-label="Filter web results">
        {(["All","Web","News","Videos"] as const).map(filter=>
          <button type="button" key={filter} onClick={()=>setActive(filter)} aria-pressed={filter===active} className={filter===active?styles.selected:""}>{filter}</button>)}
        <span className={styles.count}>{data.total} results returned</span>
      </div>
      <div className={styles.summaryAction}>
        <button type="button" disabled={summaryBusy||!data.total} onClick={()=>void summarize()}>{summaryBusy?"Summarizing sources…":"✦ Summarize with HudHud AI"}</button>
        <small>Optional · answers use linked search snippets</small>
      </div>
      {summaryError&&<p className={styles.warning} role="alert">{summaryError}</p>}
      {summary&&<aside className={styles.summary} aria-label="AI search summary">
        <div className={styles.summaryTitle}>✦ AI overview <span>Based on search snippets</span></div>
        <p>{summary.summary}</p>
        <div className={styles.citations}>{summary.sources.map(item=><a href={item.url} key={item.number} target="_blank" rel="noopener noreferrer">[{item.number}] {item.title}</a>)}</div>
      </aside>}
      <div className={styles.results}>
        {visible.map(item=><article className={styles.result} key={item.url}>
          <div className={styles.site}><span className={styles.globe}>◉</span><span>{item.source}<small>{item.url.length>100?item.url.slice(0,100)+"…":item.url}</small></span>{item.kind!=="web"&&<b>{item.kind}</b>}</div>
          <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
          {item.description&&<p>{item.description}</p>}
        </article>)}
        {!visible.length&&<p className={styles.empty}>No {active.toLowerCase()} results for this query. Try All or another phrase.</p>}
      </div>
    </div>}
  </section>;
}
