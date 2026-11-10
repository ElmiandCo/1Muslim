// Hourly discovery: uses official YouTube Data API; never scrapes or invents IDs.
const {YOUTUBE_API_KEY:youtube,SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
if(!youtube||!url||!key){console.error("Missing YOUTUBE_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY GitHub Actions secrets");process.exitCode=1;}else{
const approvedChannels=(process.env.DEEPWATCH_APPROVED_CHANNEL_IDS||"").split(",").map(x=>x.trim()).filter(x=>/^UC[\w-]{22}$/.test(x));
if(!approvedChannels.length){console.error("No approved channel IDs configured: set DEEPWATCH_APPROVED_CHANNEL_IDS. Discovery will not search arbitrary channels.");process.exit(1)}
const niches=[
["Qur'an recitation","Mishary Alafasy Quran recitation full"],
["Qur'an tafsir","Nouman Ali Khan Quran tafsir full lecture"],
["Seerah","Prophet Muhammad seerah full lecture authentic"],
["Hadith","Sahih Bukhari hadith explanation lecture"],
["Aqeedah","Islamic aqeedah tawheed full lecture"],
["Dawah","Islam Christianity debate Muslim full discussion"],
["Islamic history","Islamic history documentary full"],
["Family & character","Islamic marriage family manners full lecture"],
["Arabic Quran","تلاوة القرآن الكريم كاملة"],
["Arabic tafsir","تفسير القرآن الكريم محاضرة كاملة"],
["Prayer & worship","how to pray salah islam full explanation"],
["Youth & spirituality","Muslim youth spirituality full lecture"]
];
const api=async(path,params)=>{const u=new URL("https://www.googleapis.com/youtube/v3/"+path);Object.entries({...params,key:youtube}).forEach(([k,v])=>u.searchParams.set(k,String(v)));const r=await fetch(u);if(!r.ok)throw Error("YouTube "+r.status+" "+(await r.text()).slice(0,150));return r.json()};
const db=async(path,method="GET",body)=>{const r=await fetch(url.replace(/\/$/,"")+"/rest/v1/"+path,{method,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=ignore-duplicates,return=minimal"},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error("Supabase "+r.status+" "+(await r.text()).slice(0,250));return method==="GET"?r.json():null};
const duration=s=>{const m=/^P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?$/.exec(s||"");return m?(+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0):0};
const blacklist=/\b(shorts?|clips?|tiktok|reels?|reaction|music video|nasheed remix|trailer|preview)\b/i;
const now=new Date();const niche=niches[now.getUTCHours()%niches.length];const [category,query]=niche;
// Rotate three channels per hour; offset the scan window so older episodes are reached.
const hour=Math.floor(Date.now()/3600000);
const channelsToScan=[...new Set(Array.from({length:Math.min(3,approvedChannels.length)},(_,i)=>approvedChannels[(hour*3+i)%approvedChannels.length]))];
let inserted=0,eligible=0,scanned=0;
const seriesPattern=/ertugrul|ertuğrul|diriliş|dirilis|kuruluş|kurulus|osman|selçuklu|selcuklu|alparslan|abdülhamid|abdulhamid|payitaht|mehmed|fetihler|episode|episod|bölüm|bolum|season|\\bep\\.?\\s*\\d+|\\bs\\d+e\\d+|الحلقة\\s*[\\d٠-٩]+|مسلسل/i;
const religiousPattern=/islam|muslim|quran|qur.an|allah|hadith|seerah|prophet|salah|تفسير|القرآن|الإسلام|محمد|تلاوة/i;
for(const channelId of channelsToScan){
 try{
 const channel=await api("channels",{part:"contentDetails",id:channelId});
 const uploads=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
 if(!uploads){console.warn("Skipping inaccessible approved channel",channelId);continue}
 const ids=[];let pageToken;
 const offset=(Math.floor(hour/Math.ceil(approvedChannels.length/3))%5)*4;
 for(let page=0;page<offset+4;page++){
  const playlist=await api("playlistItems",{part:"contentDetails",playlistId:uploads,maxResults:50,...(pageToken?{pageToken}:{})});
  if(page>=offset)ids.push(...(playlist.items||[]).map(x=>x.contentDetails?.videoId).filter(Boolean));
  pageToken=playlist.nextPageToken;if(!pageToken)break;
 }
 const uniqueIds=[...new Set(ids)];scanned+=uniqueIds.length;
 if(!uniqueIds.length)continue;
 const videoItems=[];
 for(let i=0;i<uniqueIds.length;i+=50){
  const details=await api("videos",{part:"snippet,contentDetails,status,statistics",id:uniqueIds.slice(i,i+50).join(",")});
  videoItems.push(...(details.items||[]));
 }
 const rows=videoItems.flatMap(v=>{
  const d=duration(v.contentDetails?.duration),title=v.snippet?.title||"",description=v.snippet?.description||"",channel=v.snippet?.channelTitle||"",language=v.snippet?.defaultAudioLanguage||v.snippet?.defaultLanguage||null;
  if(v.snippet?.channelId!==channelId||d<120||d>14400||blacklist.test(title)||v.status?.embeddable!==true||v.status?.privacyStatus!=="public")return[];
  if(!religiousPattern.test(title+" "+description.slice(0,500))&&!seriesPattern.test(title))return[];
  return [{video_id:v.id,title:title.slice(0,300),channel_id:channelId,channel_title:channel.slice(0,250),description:description.slice(0,5000),thumbnail_url:v.snippet.thumbnails?.high?.url||null,duration_seconds:d,format:"full",language,published_at:v.snippet.publishedAt,view_count:Number(v.statistics?.viewCount||0),categories:[seriesPattern.test(title)?"Historical series":category],source_query:"approved-channel:"+channelId,status:"pending",bot_b_reason:"Hourly YouTube discovery; awaiting approval"}];
 });
 eligible+=rows.length;
 // Check existing records first so reports count actual additions, not ignored duplicates.
 for(let i=0;i<rows.length;i+=100){
  const batch=rows.slice(i,i+100),existing=await db("islamic_video_registry?select=video_id&video_id=in.("+batch.map(x=>x.video_id).join(",")+")");
  const known=new Set(existing.map(x=>x.video_id)),fresh=batch.filter(x=>!known.has(x.video_id));
  if(fresh.length){await db("islamic_video_registry?on_conflict=video_id","POST",fresh);inserted+=fresh.length}
 }
 console.log("Channel",channelId,"scanned",uniqueIds.length,"eligible",rows.length);
 }catch(error){console.error("Channel scan failed",channelId,String(error));}
}
console.log("DeepWatch hourly discovery complete:",JSON.stringify({channels:channelsToScan.length,scanned,eligible,new_pending:inserted}));
if(!scanned)throw Error("All approved channel scans failed or returned no videos");
}
