/**
 * DeepWatch Bot 2 — Somali / Turkish official-source discovery.
 * Fail closed: official uploads only; pending approval only; no guessed IDs.
 * The user approves licensing and publishing separately.
 */
const YOUTUBE=process.env.YOUTUBE_API_KEY;
const BASE=process.env.SUPABASE_URL?.replace(/\/$/,"");
const SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUOTA=50;
const SOURCES=[
 {handle:"KOKOBULLE-it5so",group:"somali",kind:"Game Shows"},
 {handle:"astaanmedia",group:"somali",kind:"Somali Entertainment"},
 {handle:"BestEverFoodReviewShow",group:"somali",kind:"Food & Travel"},
 {handle:"TurkishDramas-EnglishSubtitles",group:"turkish",kind:"Series"},
 {handle:"turkishdramatv",group:"turkish",kind:"Series"}
];
const state={source:"deepwatch-bot2",channels:[],scanned:0,eligible:0,duplicate:0,excluded:0,staged:{somali:0,turkish:0},existing:{somali:0,turkish:0},failures:[]};
const report=()=>console.log("BOT2_REPORT "+JSON.stringify(state));
function assertEnv(){for(const [k,v] of Object.entries({YOUTUBE_API_KEY:YOUTUBE,SUPABASE_URL:BASE,SUPABASE_SERVICE_ROLE_KEY:SERVICE}))if(!v)throw Error("PREFLIGHT_MISSING_"+k)}
async function api(endpoint,params){
 const u=new URL("https://www.googleapis.com/youtube/v3/"+endpoint);
 Object.entries({...params,key:YOUTUBE}).forEach(([k,v])=>u.searchParams.set(k,String(v)));
 const r=await fetch(u);if(!r.ok)throw Error("YOUTUBE_"+r.status+"_"+(await r.text()).slice(0,200));return r.json();
}
async function db(path,method="GET",body){
 const r=await fetch(BASE+"/rest/v1/"+path,{method,headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json",Prefer:"resolution=ignore-duplicates,return=representation"},body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok)throw Error("DATABASE_"+r.status+"_"+(await r.text()).slice(0,250));
 return r.status===204?[]:r.json();
}
const secs=s=>{const m=/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s||"");return m?(+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0):0};
const skip=/\b(shorts?|clips?|trailer|teaser|preview|highlights?|reaction|behind the scenes|promo|recap)\b/i;
const somalia=/somali|somalia|somaliland|mogadishu|hargeisa|hargeysa|muqdisho|puntland/i;
const turkishEpisode=/(?:episode|episod|ep\.?|bölüm|bolum|full episode|s\d+\s*e\d+)\s*[:#.-]?\s*\d+|\b\d+\s*(?:bölüm|bolum|episode)\b/i;
const epNumber=s=>{const m=s.match(/(?:episode|episod|ep\.?|bölüm|bolum)\s*[:#.-]?\s*(\d+)|\b(\d+)\s*(?:bölüm|bolum|episode)\b/i);return m?Number(m[1]||m[2]):null};
const seasonNumber=s=>{const m=s.match(/(?:season|sezon|s)\s*[:#.-]?\s*(\d+)/i);return m?Number(m[1]):null};
const videoLink=id=>"https://www.youtube.com/watch?v="+id;
async function allIds(channelId,uploads){
 const ids=[];let token;const pages=Number(process.env.BOT2_MAX_PAGES_PER_CHANNEL||"30");
 for(let i=0;i<Math.min(pages,200);i++){
  const result=await api("playlistItems",{part:"contentDetails",playlistId:uploads,maxResults:50,...(token?{pageToken:token}:{})});
  ids.push(...(result.items||[]).map(x=>x.contentDetails?.videoId).filter(Boolean));
  token=result.nextPageToken;if(!token)break;
 }
 return [...new Set(ids)];
}
async function existingIds(ids){
 const known=new Set();
 for(let i=0;i<ids.length;i+=60){
  const chunk=ids.slice(i,i+60).join(",");
  for(const [table,col] of [["islamic_video_registry","video_id"],["dw_videos","provider_video_id"]]){
   const rows=await db(table+"?select="+col+"&"+col+"=in.("+chunk+")");
   rows.forEach(r=>known.add(r[col]));
  }
 }
 return known;
}
async function main(){
 assertEnv();
 // Each source must resolve via YouTube's canonical forHandle API. No guessed IDs.
 const sources=[];
 for(const source of SOURCES){
  try{
   const result=await api("channels",{part:"snippet,contentDetails",forHandle:source.handle});
   const channel=result.items?.[0];
   if(!channel||!/^UC[A-Za-z0-9_-]{22}$/.test(channel.id)||!channel.contentDetails?.relatedPlaylists?.uploads)throw Error("CANONICAL_CHANNEL_NOT_FOUND");
   sources.push({...source,id:channel.id,title:channel.snippet.title,uploads:channel.contentDetails.relatedPlaylists.uploads});
   state.channels.push({handle:source.handle,id:channel.id,verified:true});
  }catch(e){state.failures.push({source:source.handle,stage:"channel-resolution",error:String(e)})}
 }
 if(sources.length!==SOURCES.length)throw Error("PREFLIGHT_CHANNEL_RESOLUTION_FAILED");
 // Register official IDs for admin visibility; never enable unrelated sources.
 for(const s of sources){
  await db("deepwatch_discovery_channels?on_conflict=channel_id","POST",[{channel_id:s.id,channel_title:s.title,channel_url:"https://www.youtube.com/channel/"+s.id,enabled:true,priority:s.group==="somali"?10:20}]);
 }
 // Keep quota accounting isolated from generic DeepWatch discovery.
 for(const group of ["somali","turkish"]){
  const records=await db("islamic_video_registry?select=video_id,source_query&source_query=like.bot2-"+group+"*");
  state.existing[group]=records.length;
 }
 for(const s of sources){
  if(state.existing[s.group]+state.staged[s.group]>=QUOTA)continue;
  try{
   const ids=await allIds(s.id,s.uploads);state.scanned+=ids.length;
   const known=await existingIds(ids);
   const candidates=[];
   for(let i=0;i<ids.length;i+=50){
    const details=await api("videos",{part:"snippet,contentDetails,status",id:ids.slice(i,i+50).join(",")});
    for(const v of details.items||[]){
     if(known.has(v.id)){state.duplicate++;continue}
     const title=v.snippet?.title||"",description=v.snippet?.description||"",d=secs(v.contentDetails?.duration);
     if(v.snippet?.channelId!==s.id||v.status?.privacyStatus!=="public"||v.status?.embeddable!==true||skip.test(title))continue;
     if(s.group==="turkish"&&(!turkishEpisode.test(title)||d<1200))continue;
     if(s.group==="somali"&&(d<480||(s.kind==="Food & Travel"&&!somalia.test(title+" "+description.slice(0,600)))))continue;
     // An official upload + embeddable=true does not establish external redistribution rights.
     const ep=epNumber(title),season=seasonNumber(title);
     const meta={source_handle:s.handle,source_channel_id:s.id,original_language:s.group==="turkish"?"tr":s.kind==="Food & Travel"?"en":"so",show_title:null,season,episode:ep,original_broadcast_number:null,official_url:videoLink(v.id),rights_review:"pending_manual_publisher_license_check",embedding_verified:true,availability:"public",published_at:v.snippet.publishedAt,review_note:"Official publisher upload; verify series, episode order and usage rights before approval."};
     candidates.push({video_id:v.id,title:title.slice(0,300),channel_id:s.id,channel_title:s.title,description:description.slice(0,4500),thumbnail_url:v.snippet?.thumbnails?.high?.url||null,duration_seconds:d,format:"full",language:meta.original_language,published_at:v.snippet.publishedAt,categories:s.group==="somali"?["Somali Entertainment",s.kind]:["Turkish Drama","Series"],source_query:"bot2-"+s.group+":"+s.id,status:"pending",bot_b_reason:JSON.stringify(meta)});
    }
   }
   state.eligible+=candidates.length;
   // Stable order by episode where present; otherwise broadcast date.
   candidates.sort((a,b)=>{const x=JSON.parse(a.bot_b_reason),y=JSON.parse(b.bot_b_reason);return (x.season??0)-(y.season??0)||(x.episode??99999)-(y.episode??99999)||String(a.published_at).localeCompare(String(b.published_at))});
   const room=Math.max(0,QUOTA-state.existing[s.group]-state.staged[s.group]);
   for(const row of candidates.slice(0,room)){
    const excluded=await db("admin_video_roster_exclusions?select=item_id&source=eq.islamic_video_registry&item_id=eq."+row.video_id);
    if(excluded.length){state.excluded++;continue}
    const result=await db("islamic_video_registry?on_conflict=video_id","POST",[row]);
    if(result.length)state.staged[s.group]++;
   }
  }catch(e){state.failures.push({source:s.handle,stage:"scan-or-stage",error:String(e)})}
 }
 if(state.failures.length)process.exitCode=1;
}
try{await main()}catch(e){state.failures.push({stage:"preflight-or-fatal",error:String(e)});process.exitCode=1}finally{report()}
