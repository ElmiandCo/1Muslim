/** Read-only official-playlist audit: no auto approvals or imports. */
import fs from "node:fs";
const KEY=process.env.YOUTUBE_API_KEY;
if(!KEY)throw Error("YOUTUBE_API_KEY missing");
const handles=["KOKOBULLE-it5so","astaanmedia","BestEverFoodReviewShow","TurkishDramas-EnglishSubtitles","turkishdramatv"];
const api=async(path,params)=>{const url=new URL("https://www.googleapis.com/youtube/v3/"+path);Object.entries({...params,key:KEY}).forEach(([k,v])=>url.searchParams.set(k,String(v)));const r=await fetch(url);if(!r.ok)throw Error(path+" "+r.status+" "+(await r.text()).slice(0,250));return r.json()};
const paginate=async(path,params,max=100)=>{let all=[],token,complete=true;for(let i=0;i<max;i++){const p=await api(path,{...params,...(token?{pageToken:token}:{})});all.push(...(p.items||[]));token=p.nextPageToken;if(!token)return {items:all,complete:true}}return {items:all,complete:false}};
const duration=s=>{const m=String(s||"").match(/P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/);return m?(Number(m[1]||0)*86400+Number(m[2]||0)*3600+Number(m[3]||0)*60+Number(m[4]||0)):0};
const episode=t=>{const x=t.match(/(?:season|s)\\s*(\\d+)\\s*(?:episode|ep|e|bölüm)\\s*(\\d+)/i)||t.match(/(?:episode|ep|bölüm|qaybta|qaybtii|xalqa)\\s*[:#.-]?\\s*(\\d+)/i);return x?(x.length===3?{season:Number(x[1]),episode:Number(x[2])}:{season:null,episode:Number(x[1])}):{season:null,episode:null}};
const report={generated_at:new Date().toISOString(),channels:[],roster:[],missing_episodes:[],quran:{covered_chapters:[],missing_chapters:[]},warnings:["Public/embeddable status is not proof of distribution rights.","Missing episode numbers are inferred from parsed titles only; original broadcast numbering requires editorial verification."]};
const seen=new Set();
for(const handle of handles){try{
 const ch=(await api("channels",{part:"snippet,contentDetails",forHandle:handle})).items?.[0];if(!ch)throw Error("Official handle unresolved");
 const channel={handle,id:ch.id,title:ch.snippet?.title,playlists:[],complete:true,verified_identity:"handle resolved via YouTube API"};
 const lists=await paginate("playlists",{part:"snippet,contentDetails",channelId:ch.id,maxResults:50});
 const uploads=ch.contentDetails?.relatedPlaylists?.uploads;
 const playlists=[...(uploads?[{id:uploads,snippet:{title:"Official uploads"}}]:[]),...lists.items];
 if(!lists.complete)channel.complete=false;
 for(const list of playlists){try{
  const data=await paginate("playlistItems",{part:"snippet,contentDetails",playlistId:list.id,maxResults:50});
  channel.playlists.push({id:list.id,title:list.snippet?.title,count:data.items.length,complete:data.complete});
  if(!data.complete)channel.complete=false;
  const ids=[...new Set(data.items.map(x=>x.contentDetails?.videoId||x.snippet?.resourceId?.videoId).filter(x=>/^[\\w-]{11}$/.test(x)))];
  for(let i=0;i<ids.length;i+=50){const details=await api("videos",{part:"snippet,contentDetails,status",id:ids.slice(i,i+50).join(",")});
   for(const v of details.items||[]){if(seen.has(v.id))continue;seen.add(v.id);
    const title=v.snippet?.title||"",seconds=duration(v.contentDetails?.duration),e=episode(title);
    const isShort=/\\b(shorts?|trailer|teaser|preview|highlight|clip|reaction)\\b/i.test(title);
    const isTurkish=/turkish/i.test(handle),isSomaliaTravel=handle!=="BestEverFoodReviewShow"||/somali|somalia|somaliland|mogadishu|hargeisa/i.test(title+" "+v.snippet?.description);
    const fullLength=seconds>=(isTurkish?1200:handle==="KOKOBULLE-it5so"?480:600);
    const eligible=v.status?.privacyStatus==="public"&&v.status?.embeddable===true&&v.snippet?.channelId===ch.id&&fullLength&&!isShort&&isSomaliaTravel;
    report.roster.push({id:v.id,url:"https://www.youtube.com/watch?v="+v.id,channel:ch.snippet?.title,handle,playlist:list.snippet?.title,playlist_id:list.id,title,season:e.season,episode:e.episode,published_at:v.snippet?.publishedAt,duration_seconds:seconds,public:v.status?.privacyStatus==="public",embeddable:v.status?.embeddable===true,eligible,rights:"publisher review required"});
   }
  }
 }catch(err){channel.complete=false;channel.playlists.push({id:list.id,error:String(err)})}}
 report.channels.push(channel);
}catch(err){report.channels.push({handle,error:String(err),complete:false})}}
const grouped=new Map();
for(const r of report.roster.filter(x=>x.episode!==null)){const key=[r.handle,r.playlist,r.season??"unknown"].join("|");if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r.episode)}
for(const [key,numbers] of grouped){const unique=[...new Set(numbers)].sort((a,b)=>a-b);if(!unique.length)continue;const missing=[];for(let i=unique[0];i<=unique.at(-1);i++)if(!unique.includes(i))missing.push(i);report.missing_episodes.push({series_playlist_season:key,observed:unique.length,range:[unique[0],unique.at(-1)],missing})}
report.roster.sort((a,b)=>a.handle.localeCompare(b.handle)||a.playlist.localeCompare(b.playlist)||(a.season??0)-(b.season??0)||(a.episode??0)-(b.episode??0)||a.title.localeCompare(b.title));
fs.mkdirSync("audit-reports",{recursive:true});
fs.writeFileSync("audit-reports/deepwatch-playlists.json",JSON.stringify(report,null,2));
console.log("AUDIT_SUMMARY",JSON.stringify({channels:report.channels.length,roster:report.roster.length,eligible:report.roster.filter(x=>x.eligible).length,missing_episode_groups:report.missing_episodes.filter(x=>x.missing.length).length,incomplete_channels:report.channels.filter(x=>!x.complete).length}));
