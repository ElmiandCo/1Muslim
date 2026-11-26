"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import styles from "./WebSearchPanel.module.css";

export type GlobalSearchMode="All"|"Web"|"Images"|"Videos"|"News"|"AI Overview";
type Kind="web"|"news"|"video";
type Item={title:string;url:string;description:string;source:string;kind:Kind;score:number;publishedAt?:string;thumbnailUrl?:string};
type SearchData={query:string;results:Item[];total:number;provider:string;partial?:boolean};
type ImageItem={title:string;pageUrl:string;imageUrl:string;thumbnailUrl:string;source:string;width?:number;height?:number};
type ImageData={query:string;results:ImageItem[];total:number;provider:string};
type SummaryData={summary:string;sources:Array<{number:number;title:string;url:string}>};
const titles:Record<GlobalSearchMode,string>={
  All:"Search the world",Web:"Web results",Images:"Images",Videos:"Videos",News:"Latest news","AI Overview":"HudHud AI Overview"
};

export default function WebSearchPanel({query,mode="All"}:{query:string;mode?:GlobalSearchMode}){
  const [data,setData]=useState<SearchData|null>(null);
  const [images,setImages]=useState<ImageData|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [summary,setSummary]=useState<SummaryData|null>(null);
  const [summaryBusy,setSummaryBusy]=useState(false);
  const [summaryError,setSummaryError]=useState("");
  const lastSummaryQuery=useRef("");
  const isImages=mode==="Images";
  const vertical=mode==="News"?"news":mode==="Videos"?"video":mode==="Web"||mode==="AI Overview"?"web":"all";

  useEffect(()=>{
    setSummary(null);setSummaryError("");lastSummaryQuery.current="";
  },[query]);
  useEffect(()=>{
    if(query.trim().length<2||isImages){setData(null);return;}
    const controller=new AbortController();
    setBusy(true);setError("");setData(null);
    void fetch("/api/web-search?q="+encodeURIComponent(query)+"&type="+vertical,{cache:"no-store",signal:controller.signal})
      .then(async response=>{const json=await response.json();if(!response.ok)throw Error(json?.error||"Web search is unavailable.");return json as SearchData;})
      .then(json=>{if(!controller.signal.aborted)setData(json);})
      .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Unable to search");})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[query,vertical,isImages]);
  useEffect(()=>{
    if(query.trim().length<2||!isImages)return;
    const controller=new AbortController();
    setBusy(true);setError("");setImages(null);
    void fetch("/api/web-search/images?q="+encodeURIComponent(query),{cache:"no-store",signal:controller.signal})
      .then(async response=>{const json=await response.json();if(!response.ok)throw Error(json?.error||"Image search unavailable.");return json as ImageData;})
      .then(json=>{if(!controller.signal.aborted)setImages(json);})
      .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Unable to find images");})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>controller.abort();
  },[query,isImages]);

  const summarize=useCallback(async()=>{
    setSummaryBusy(true);setSummaryError("");setSummary(null);
    try{
      const response=await fetch("/api/web-search/summary",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),cache:"no-store"
      });
      const json=await response.json();
      if(!response.ok)throw Error(json?.error||"AI overview unavailable");
      setSummary(json as SummaryData);
    }catch(reason){setSummaryError(reason instanceof Error?reason.message:"AI overview unavailable");}
    finally{setSummaryBusy(false);}
  },[query]);
  useEffect(()=>{
    if(mode!=="AI Overview"||!data?.total||lastSummaryQuery.current===query)return;
    lastSummaryQuery.current=query;void summarize();
  },[mode,data,query,summarize]);

  if(query.trim().length<2)return null;
  const results=data?.results||[];
  const loading=busy||(mode==="AI Overview"&&summaryBusy);
  return <section className={styles.section} aria-label={titles[mode]}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>1MUSLIM SEARCH · THE OPEN WEB</span><h2>{titles[mode]}</h2>
      <p>{mode==="AI Overview"?"AI-generated answers linked to public search sources.":isImages?"Browse images from around the world with strict SafeSearch.":"Find worldwide information alongside the entire 1Muslim community."}</p></div>
      <span className={styles.provider}>Results by Brave Search</span>
    </div>
    {loading&&<div className={styles.status} role="status">{isImages?"Finding images…":mode==="AI Overview"?"Preparing your overview…":"Searching the worldwide web…"}</div>}
    {error&&<div className={styles.warning} role="status"><strong>Global search not ready</strong><p>{error}</p><small>You can still search the 1Muslim directory below.</small></div>}
    {isImages ? (images&&<div>
      <p className={styles.resultCount}>{images.total} image previews · Tap an image to visit its original web page.</p>
      <div className={styles.imageGrid}>
        {images.results.map((item,index)=><a key={item.imageUrl+"|"+index} href={item.pageUrl} target="_blank" rel="noopener noreferrer" className={styles.imageCard} aria-label={"View source for "+item.title}>
          <span className={styles.imageCanvas}><img src={item.thumbnailUrl} alt={item.title} loading="lazy" referrerPolicy="no-referrer"/></span>
          <span className={styles.imageInfo}><strong>{item.title}</strong><small>{item.source} ↗</small></span>
        </a>)}
      </div>
      {images.total===0&&<p className={styles.empty}>No safe images were found for this query.</p>}
    </div>) : (data&&<div>
      {mode==="AI Overview"||mode==="All"||mode==="Web" ? <div className={styles.summaryAction}>
        {mode!=="AI Overview"&&<button type="button" disabled={summaryBusy||!data.total} onClick={()=>void summarize()}>{summaryBusy?"Reviewing sources…":"✦ Get HudHud AI Overview"}</button>}
        <small>Source-grounded · Verify important information</small>
      </div> : <p className={styles.resultCount}>{data.total} {mode.toLowerCase()} results</p>}
      {summaryError&&<p className={styles.warning} role="alert">{summaryError}</p>}
      {summary&&<aside className={styles.summary} aria-label="AI overview">
        <div className={styles.summaryTitle}>✦ HudHud AI Overview <span>Based on linked web excerpts</span></div>
        <p>{summary.summary}</p>
        <div className={styles.citations}>{summary.sources.map(item=><a href={item.url} key={item.number} target="_blank" rel="noopener noreferrer">[{item.number}] {item.title}</a>)}</div>
      </aside>}
      <div className={styles.results} aria-label="Worldwide results">
        {mode!=="AI Overview"&&results.map(item=><article className={styles.result} key={item.kind+item.url}>
          <div className={styles.site}><span className={styles.globe}>{item.kind==="video"?"▶":item.kind==="news"?"◷":"◉"}</span>
            <span>{item.source}<small>{item.url.length>100?item.url.slice(0,100)+"…":item.url}</small></span>{item.kind!=="web"&&<b>{item.kind}</b>}</div>
          <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
          {item.description&&<p>{item.description}</p>}
          {item.publishedAt&&<small className={styles.age}>{item.publishedAt}</small>}
        </article>)}
        {!results.length&&mode!=="AI Overview"&&<p className={styles.empty}>No results were found. Try a different query.</p>}
      </div>
    </div>)}
  </section>;
}
