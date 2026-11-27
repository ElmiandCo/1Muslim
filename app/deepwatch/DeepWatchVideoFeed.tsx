"use client";

import {useEffect,useMemo,useState} from "react";
import type {RegisteredVideo} from "../components/videoRegistry";

type FeedProps={
 videos:RegisteredVideo[];
 saved:string[];
 loading:boolean;
 heading:string;
 description?:string;
 shortsOnly?:boolean;
 onPlay:(video:RegisteredVideo)=>void;
 onDetails:(video:RegisteredVideo)=>void;
 onSave:(id:string)=>void;
};
const thumb=(id:string)=>"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg";
export const isDeepWatchShort=(video:RegisteredVideo)=>{
 const tags=[video.title,video.category,...(video.categories||[])].join(" ");
 return video.format==="phone"||/(?:#shorts|\bshorts\b|\bshort.form\b)/i.test(tags);
};
function Poster({video,short=false}:{video:RegisteredVideo;short?:boolean}){
 return <span className={"dwPlatformPoster"+(short?" dwPlatformPosterShort":"")}>
  <img src={thumb(video.videoId)} alt="" loading="lazy" decoding="async"/>
  {short&&<span className="dwPlatformShortBadge">SHORT</span>}
  <span className="dwPlatformPlay" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg></span>
 </span>;
}
function VideoTile({video,saved,onPlay,onDetails,onSave,short=false}:{
 video:RegisteredVideo;saved:boolean;short?:boolean;
 onPlay:(video:RegisteredVideo)=>void;onDetails:(video:RegisteredVideo)=>void;onSave:(id:string)=>void;
}){
 return <article className={"dwPlatformVideo"+(short?" dwPlatformVideoShort":"")}>
   <button className="dwPlatformVideoLaunch" type="button" onClick={()=>onPlay(video)} aria-label={"Play "+video.title}>
    <Poster video={video} short={short}/>
   </button>
   <div className="dwPlatformVideoMeta">
    <span className="dwPlatformAvatar" aria-hidden="true">1M</span>
    <div className="dwPlatformVideoCopy">
     <button type="button" className="dwPlatformVideoTitle" onClick={()=>onPlay(video)}>{video.title}</button>
     <span>{video.category||"Videos"} · 1Muslim DeepWatch</span>
    </div>
    <div className="dwPlatformVideoActions">
     <button type="button" title="Video details" aria-label={"View details for "+video.title} onClick={()=>onDetails(video)}>⋯</button>
     <button type="button" title={saved?"Remove from My List":"Save to My List"} aria-label={(saved?"Remove from My List: ":"Save to My List: ")+video.title} onClick={()=>onSave(video.videoId)} aria-pressed={saved}>{saved?"✓":"＋"}</button>
    </div>
   </div>
 </article>;
}

export default function DeepWatchVideoFeed({videos,saved,loading,heading,description,shortsOnly,onPlay,onDetails,onSave}:FeedProps){
 const [limit,setLimit]=useState(24);
 const category=shortsOnly?"shorts":heading;
 useEffect(()=>setLimit(24),[category]);
 const visible=useMemo(()=>videos.slice(0,limit),[videos,limit]);
 return <section className="dwPlatformFeed" aria-labelledby="dwPlatformFeedTitle">
  <div className="dwPlatformFeedHeading">
   <div><span className="dwPlatformEyebrow">1MUSLIM VIDEO NETWORK</span><h1 id="dwPlatformFeedTitle">{heading}</h1>{description&&<p>{description}</p>}</div>
  </div>
  {visible.length>0?<div className={"dwPlatformGrid"+(shortsOnly?" dwPlatformGridShorts":"")}>
   {visible.map(video=><VideoTile key={video.videoId} video={video} saved={saved.includes(video.videoId)} short={shortsOnly||isDeepWatchShort(video)}
    onPlay={onPlay} onDetails={onDetails} onSave={onSave}/>)}
  </div>:<div className="dwPlatformEmpty" role="status">{loading?"Loading approved videos…":shortsOnly?"No verified short-form videos have been approved yet.":"No approved videos match this view."}</div>}
  {videos.length>limit&&<button type="button" className="dwPlatformLoad" onClick={()=>setLimit(n=>n+24)}>Show more videos <span aria-hidden="true">↓</span></button>}
 </section>;
}
