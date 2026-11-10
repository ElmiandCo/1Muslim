"use client";
import type {RegisteredVideo} from "../components/videoRegistry";

const PUBLISHERS=["One Islam Productions","Yaqeen Institute","PBS KIDS","Sesame Street","Curious George","Omar & Hana"];
function metadata(video:RegisteredVideo){
 const tags=(video.categories||[]).filter(tag=>!/^season \d+$/i.test(tag));
 const publisher=PUBLISHERS.find(name=>[video.title,...tags].some(value=>value.toLowerCase().includes(name.toLowerCase())));
 const season=video.title.match(/\bS(?:eason\s*)?(\d+)\b/i)?.[1]||(video.categories||[]).find(x=>/^season \d+$/i.test(x))?.match(/\d+/)?.[0];
 const episode=video.title.match(/\b(?:EP|Episode)\s*\.?\s*(\d+)\b/i)?.[1];
 const genres=[video.category,...tags].filter((v,i,a)=>a.findIndex(x=>x.toLowerCase()===v.toLowerCase())===i&&!PUBLISHERS.some(p=>p.toLowerCase()===v.toLowerCase())).slice(0,5);
 return {publisher,season,episode,genres};
}
export default function DeepWatchDetails({video,onSave,saved}:{video:RegisteredVideo;onSave:()=>void;saved:boolean}){
 const {publisher,season,episode,genres}=metadata(video);
 return <section className="deepwatchEditorial" aria-label="Title details">
  <div className="deepwatchEditorialMain">
   <p className="deepwatchEditorialEyebrow">1MUSLIM <span> / </span> DEEPWATCH <span> / </span> TITLE DETAILS</p>
   <h2>{video.title}</h2>
   <div className="deepwatchEditorialMeta">
    {publisher&&<span>{publisher}</span>}
    {season&&<span>Season {season}</span>}
    {episode&&<span>Episode {episode}</span>}
    <span>{video.category}</span>
   </div>
   <p className="deepwatchEditorialDescription">Explore this title in the 1Muslim DeepWatch collection. Watch using the official embedded video above.</p>
   <div className="deepwatchEditorialGenres" aria-label="Genres">{genres.map(tag=><span key={tag}>{tag}</span>)}</div>
   <button className="deepwatchEditorialSave" type="button" onClick={onSave}>{saved?"✓ Saved to My List":"+ Add to My List"}</button>
  </div>
  <aside className="deepwatchRatingPreview" aria-label="Ratings preview">
   <span className="deepwatchRatingKicker">COMMUNITY RATING</span>
   <div className="deepwatchRatingStars" aria-hidden="true">☆☆☆☆☆</div>
   <strong>Not yet rated</strong>
   <p>Community ratings are coming soon. No scores have been collected or estimated.</p>
   <span className="deepwatchRatingStatus">PREVIEW · NOT ACTIVE</span>
  </aside>
 </section>;
}
