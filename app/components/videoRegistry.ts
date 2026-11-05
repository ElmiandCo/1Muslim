import {useEffect,useState} from "react";
/* Curated YouTube registry: add verified IDs here, up to 100 entries. No fabricated videos. */
export type RegisteredVideo={videoId:string;title:string;category:string;startSeconds:number;endSeconds:number|null;format:"desktop"|"phone"};
const seed:RegisteredVideo[]=[
  {
    "videoId": "gF7RjyK8gQ0",
    "title": "Featured Discussion",
    "category": "Dawah",
    "startSeconds": 28,
    "endSeconds": null,
    "format": "desktop"
  },
  {
    "videoId": "Isi6CwpmTX8",
    "title": "Featured Video",
    "category": "Dawah",
    "startSeconds": 1,
    "endSeconds": null,
    "format": "desktop"
  },
  {
    "videoId": "eZVppeK0BMk",
    "title": "Lesson 3",
    "category": "Dawah",
    "startSeconds": 15,
    "endSeconds": 120,
    "format": "desktop"
  },
  {
    "videoId": "KKg-TM8MGlM",
    "title": "Short 1",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "w6iV6gZIYkY",
    "title": "Short 2",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "Mf7EK7EIEXM",
    "title": "Short 3",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "4Kcf3ha_du8",
    "title": "Short 4",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "9iJ5eESSycM",
    "title": "Short 5",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "R7JlVfBbGRQ",
    "title": "Short 6",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "_DrLkl2doyw",
    "title": "Short 7",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "rA5lPeUCHzU",
    "title": "Short 8",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  },
  {
    "videoId": "9Zl_dVkWDes",
    "title": "Short 9",
    "category": "Shorts",
    "startSeconds": 0,
    "endSeconds": null,
    "format": "phone"
  }
];
export const videoRegistry=seed.slice(0,100);
export function getRegistryVideos(format:"desktop"|"phone"){return videoRegistry.filter(v=>v.format===format)}
export const VIDEO_REGISTRY_CAPACITY=100;

/** Approved database entries replace seeds; seeds remain available during outages or empty registries. */
let latestVideos:RegisteredVideo[]|null=null;
const subscribers=new Set<(videos:RegisteredVideo[])=>void>();
let inflight:Promise<void>|null=null;
async function refreshVideos(){
 if(inflight)return inflight;
 inflight=(async()=>{try{
  const response=await fetch("/api/videos/featured",{cache:"no-store"});
  if(!response.ok)return;
  const payload=await response.json();
  if(payload.source!=="approved"||!Array.isArray(payload.videos)||payload.videos.length===0)return;
  const verified=payload.videos.filter((v:RegisteredVideo)=>/^[A-Za-z0-9_-]{11}$/.test(v.videoId)&&typeof v.title==="string"&&(v.format==="phone"||v.format==="desktop")).slice(0,100);
  if(!verified.length)return;
  const combined=[...verified,...videoRegistry.filter(seed=>!verified.some((v:RegisteredVideo)=>v.videoId===seed.videoId))].slice(0,100);
  latestVideos=combined;subscribers.forEach(fn=>fn(combined));
 }catch{}finally{inflight=null}})();
 return inflight;
}
export function useFeaturedVideos(){
 const [videos,setVideos]=useState<RegisteredVideo[]>(()=>latestVideos||videoRegistry);
 useEffect(()=>{
  subscribers.add(setVideos);if(latestVideos)setVideos(latestVideos);
  void refreshVideos();
  const timer=window.setInterval(()=>{void refreshVideos()},60000);
  return()=>{subscribers.delete(setVideos);clearInterval(timer)};
 },[]);
 return videos;
}
