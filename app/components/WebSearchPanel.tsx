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
  const summaryRequestId=useRef(0);
  const [overviewExpanded,setOverviewExpanded]=useState(false);
  const isImages=mode==="Images";
  const vertical=mode==="News"?"news":mode==="Videos"?"video":mode==="Web"||mode==="AI Overview"?"web":"all";

  useEffect(()=>{
    summaryRequestId.current+=1;setSummary(null);setSummaryError("");setOverviewExpanded(false);lastSummaryQuery.current="";
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
    const requestId=++summaryRequestId.current;
    setSummaryBusy(true);setSummaryError("");setSummary(null);setOverviewExpanded(false);
    try{
      const response=await fetch("/api/web-search/summary",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),cache:"no-store"
      });
      const json=await response.json();
      if(!response.ok)throw Error(json?.error||"AI overview unavailable");
      if(summaryRequestId.current===requestId)setSummary(json as SummaryData);
    }catch(reason){
      if(summaryRequestId.current===requestId)setSummaryError(reason instanceof Error?reason.message:"AI overview unavailable");
    }finally{if(summaryRequestId.current===requestId)setSummaryBusy(false);}
  },[query]);
  useEffect(()=>{
    // Search engines place the overview above results. Run once per COMMITTED query
    // only when real web sources have loaded, not for every search-box keystroke.
    if((mode!=="All"&&mode!=="AI Overview")||!data?.total||
       data.query.trim().toLowerCase()!==query.trim().toLowerCase()||
       lastSummaryQuery.current===query)return;
    lastSummaryQuery.current=query;void summarize();
  },[mode,data,query,summarize]);

  if(query.trim().length<2)return null;
  const results=data?.results||[];
  const overviewVisible=mode==="All"||mode==="AI Overview";
  const relatedVideos=mode==="All"?results.filter(item=>item.kind==="video"&&item.thumbnailUrl).slice(0,3):[];
  const overviewThumbnail=results.find(item=>item.kind==="video"&&item.thumbnailUrl)?.thumbnailUrl;
  const regularResults=mode==="All"&&relatedVideos.length?
    results.filter(item=>!relatedVideos.some(video=>video.url===item.url)):results;
  return <section className={styles.section} aria-label={titles[mode]}>
    {busy&&<div className={styles.status} role="status">{isImages?"Finding images…":"Searching the web…"}</div>}
    {error&&<div className={styles.warning} role="status"><strong>Web results temporarily unavailable</strong><p>{error}</p><small>1Muslim community results remain available below.</small></div>}
    {isImages ? (images&&<div>
      <div className={styles.metaLine}><span>{images.total} image results</span><span>Brave Search · SafeSearch on</span></div>
      <div className={styles.imageGrid}>
        {images.results.map((item,index)=><a key={item.imageUrl+"|"+index} href={item.pageUrl} target="_blank" rel="noopener noreferrer" className={styles.imageCard} aria-label={"View source for "+item.title}>
          <span className={styles.imageCanvas}><img src={item.thumbnailUrl} alt={item.title} loading="lazy" referrerPolicy="no-referrer"/></span>
          <span className={styles.imageInfo}><strong>{item.title}</strong><small>{item.source} ↗</small></span>
        </a>)}
      </div>
      {images.total===0&&<p className={styles.empty}>No safe images were found for this query.</p>}
    </div>) : (data&&<div>
      <div className={styles.metaLine}>
        <span>{data.total} {data.total===1?"result":"results"} from the open web</span>
        <span>Powered by {data.provider||"Brave Search"}</span>
      </div>
      {overviewVisible&&<section className={styles.overview} aria-label="HudHud AI Overview">
        <div className={styles.overviewHeading}>
          <span className={styles.aiSpark} aria-hidden="true">✦</span>
          <h2>HudHud AI Overview</h2>
          <span className={styles.aiCaption}>Based on web sources</span>
        </div>
        {summaryBusy&&<div className={styles.overviewLoading} role="status"><span>Reading sources and preparing an overview…</span><i/><i/><i/></div>}
        {summary&&<div className={styles.overviewBody}>
          {overviewThumbnail&&<div className={styles.overviewImage}><img src={overviewThumbnail} alt="" loading="lazy" referrerPolicy="no-referrer"/></div>}
          <div className={overviewExpanded?styles.overviewTextExpanded:styles.overviewTextPreview}><p>{summary.summary}</p></div>
          {(overviewExpanded||summary.summary.length<=200)&&<div className={styles.citations} aria-label="Sources for this AI overview">
            {summary.sources.map(item=><a href={item.url} key={item.number} target="_blank" rel="noopener noreferrer">[{item.number}] {item.title}</a>)}
          </div>}
          {summary.summary.length>200&&<button type="button" className={styles.showMore} onClick={()=>setOverviewExpanded(open=>!open)} aria-expanded={overviewExpanded}>{overviewExpanded?"Show less":"Show more"} <span aria-hidden="true">{overviewExpanded?"⌃":"⌄"}</span></button>}
          <small className={styles.overviewNote}>AI may make mistakes. Check the linked sources.</small>
        </div>}
        {!summaryBusy&&summaryError&&<div className={styles.overviewUnavailable}>
          <p>HudHud AI Overview isn’t available for this search.</p>
          {mode==="AI Overview"&&<button type="button" onClick={()=>void summarize()}>Retry overview</button>}
        </div>}
      </section>}
      {mode==="All"&&relatedVideos.length>0&&<section className={styles.videoGroup} aria-label="Videos from the web">
        <h2>Videos</h2><div className={styles.videoGroupRail}>{relatedVideos.map(item=><a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.videoGroupCard}>
          <span className={styles.videoGroupThumbnail}><img src={item.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/><b aria-hidden="true">▶</b></span>
          <strong>{item.title}</strong><small>{item.source}</small>
        </a>)}</div>
      </section>}
      {mode!=="AI Overview"&&<div className={styles.results} aria-label="Worldwide results">
        {regularResults.map(item=><article className={styles.result} key={item.kind+item.url}>
          <div className={styles.site}><span className={styles.globe} aria-hidden="true">{item.kind==="video"?"▶":item.kind==="news"?"◷":"◉"}</span>
            <span>{item.source}<small>{item.url.length>100?item.url.slice(0,100)+"…":item.url}</small></span>{item.kind!=="web"&&<b>{item.kind}</b>}</div>
          {item.kind==="video"&&item.thumbnailUrl&&<a className={styles.videoThumbnail} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={"Play "+item.title}>
            <img src={item.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/><span aria-hidden="true">▶</span>
          </a>}
          <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
          {item.description&&<p>{item.description}</p>}
          {item.publishedAt&&<small className={styles.age}>{item.publishedAt}</small>}
        </article>)}
        {!results.length&&<p className={styles.empty}>No results were found. Try a different query.</p>}
      </div>}
    </div>)}
  </section>;
}
