// Hourly discovery: uses official YouTube Data API; never scrapes or invents IDs.
const {YOUTUBE_API_KEY:youtube,SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
if(!youtube||!url||!key){console.error("Missing YOUTUBE_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY GitHub Actions secrets");process.exitCode=1;}else{
const staticChannels=[process.env.DEEPWATCH_APPROVED_CHANNEL_IDS||"",process.env.DEEPWATCH_EXTRA_APPROVED_CHANNEL_IDS||""].join(",").split(",").map(x=>x.trim()).filter(x=>/^UC[\w-]{22}$/.test(x));
const selectedChannel=process.env.DEEPWATCH_SELECTED_CHANNEL_ID||"";
const approvedChannels=[...new Set([...staticChannels,...(selectedChannel?[selectedChannel]:[])])];

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
const quranMission=process.env.DEEPWATCH_QURAN_114==="true";
let managedChannels=[];let educationalChannelIds=new Set();
try{managedChannels=(await db("deepwatch_discovery_channels?select=channel_id,priority&enabled=eq.true&order=priority.asc")).map(x=>x.channel_id)}catch(e){console.warn("Managed channel list unavailable",String(e))}
// Resolve the requested QuranGuy1 channel using the official YouTube API at runtime.
try{
 const response=await api("channels",{part:"snippet",forHandle:"QuranGuy1"});
 const channel=response.items?.[0];
 if(channel&&/^UC[\\w-]{22}$/.test(channel.id)){
  const existing=await db("deepwatch_discovery_channels?select=channel_id&channel_id=eq."+channel.id);
  if(!existing.length)await db("deepwatch_discovery_channels?on_conflict=channel_id","POST",[{channel_id:channel.id,channel_title:channel.snippet?.title||"QuranGuy1",channel_url:"https://www.youtube.com/channel/"+channel.id,enabled:true}]);
  if(!managedChannels.includes(channel.id))managedChannels.push(channel.id);if(handle==="TPDossierYT")educationalChannelIds.add(channel.id);
  console.log("Verified QuranGuy1 discovery channel",channel.id);
 }else console.warn("QuranGuy1 channel could not be verified; skipping");
}catch(e){console.warn("QuranGuy1 registration failed",String(e))}
// Fluzen (@Fluzentv): discover the complete public, embeddable catalog on every run.
let fluzenChannelId="";
try {
 const response=await api("channels",{part:"snippet",forHandle:"Fluzentv"});
 const item=response.items?.[0];
 if(item&&/^UC[A-Za-z0-9_-]{22}$/.test(item.id)){
  fluzenChannelId=item.id;
  if(!managedChannels.includes(item.id))managedChannels.push(item.id);
  console.log("Verified Fluzen channel",item.id);
 }else console.warn("Fluzen handle could not be resolved");
}catch(e){console.warn("Fluzen lookup failed",String(e))}
const channelPool=[...new Set([...managedChannels,...approvedChannels])];
if(!channelPool.length)throw Error("No approved discovery channels configured");
const channelsToScan=[...new Set([...(selectedChannel?[selectedChannel]:quranMission?channelPool:channelPool.slice(0,3)),...(fluzenChannelId?[fluzenChannelId]:[])])];
const surahNames=["fatihah","baqarah","imran","nisa","maidah","anam","araf","anfal","tawbah","yunus","hud","yusuf","rad","ibrahim","hijr","nahl","isra","kahf","maryam","taha","anbiya","hajj","muminun","nur","furqan","shuara","naml","qasas","ankabut","rum","luqman","sajdah","ahzab","saba","fatir","yasin","saffat","sad","zumar","ghafir","fussilat","shura","zukhruf","dukhan","jathiyah","ahqaf","muhammad","fath","hujurat","qaf","dhariyat","tur","najm","qamar","rahman","waqiah","hadid","mujadila","hashr","mumtahanah","saff","jumuah","munafiqun","taghabun","talaq","tahrim","mulk","qalam","haqqah","maarij","nuh","jinn","muzzammil","muddaththir","qiyamah","insan","mursalat","naba","naziat","abasa","takwir","infitar","mutaffifin","inshiqaq","buruj","tariq","ala","ghashiyah","fajr","balad","shams","layl","duha","sharh","tin","alaq","qadr","bayyinah","zalzalah","adiyat","qariah","takathur","asr","humazah","fil","quraysh","maun","kawthar","kafirun","nasr","masad","ikhlas","falaq","nas"];
const normalizeSurah=s=>s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\\b(al|surah|surat|sura|chapter|the)\\b/g," ").replace(/\\s+/g," ").trim();
const matchSurah=title=>{const norm=normalizeSurah(title);const number=norm.match(/(?:^|\\s)(?:surah|chapter)?\\s*(\\d{1,3})(?:\\s|$)/);const name=surahNames.findIndex(n=>norm.split(" ").includes(n));if(name>=0)return name+1;if(number&&+number[1]>=1&&+number[1]<=114&&/surah|surat|sura|chapter/i.test(title))return +number[1];return null};
const quranMatches=new Set();
let inserted=0,eligible=0,scanned=0;
const runId=process.env.DEEPWATCH_DISCOVERY_RUN_ID;
const updateRun=async(status,message)=>{if(!runId)return;const payload={status,message,scanned,new_pending:inserted,...(["success","failure"].includes(status)?{finished_at:new Date().toISOString()}:{})};await db("deepwatch_discovery_runs?id=eq."+encodeURIComponent(runId),"PATCH",payload)};
await updateRun("running","Discovery started");
const seriesPattern=/ertugrul|ertuğrul|diriliş|dirilis|kuruluş|kurulus|osman|selçuklu|selcuklu|alparslan|abdülhamid|abdulhamid|payitaht|mehmed|fetihler|episode|episod|bölüm|bolum|season|\\bep\\.?\\s*\\d+|\\bs\\d+e\\d+|الحلقة\\s*[\\d٠-٩]+|مسلسل/i;
const religiousPattern=/islam|muslim|quran|qur.an|allah|hadith|seerah|prophet|salah|تفسير|القرآن|الإسلام|محمد|تلاوة/i;
for(const channelId of channelsToScan){
 try{
 const channel=await api("channels",{part:"contentDetails",id:channelId});
 const uploads=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
 if(!uploads){console.warn("Skipping inaccessible approved channel",channelId);continue}
 const ids=[];let pageToken;
 const fluzen=channelId===fluzenChannelId;const educational=educationalChannelIds.has(channelId);const offset=quranMission||educational?0:(Math.floor(hour/Math.ceil(channelPool.length/3))%5)*4;
 for(let page=0;page<(fluzen||educational?1000:offset+(quranMission?12:4));page++){
  const playlist=await api("playlistItems",{part:"contentDetails",playlistId:uploads,maxResults:50,...(pageToken?{pageToken}:{})});
  if(fluzen||page>=offset)ids.push(...(playlist.items||[]).map(x=>x.contentDetails?.videoId).filter(Boolean));
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
  if(v.snippet?.channelId!==channelId||(!educational&&!fluzen&&(d<120||d>14400||blacklist.test(title)))||v.status?.embeddable!==true||v.status?.privacyStatus!=="public")return[];
  const surah=quranMission?matchSurah(title):null;
  if(quranMission&&!fluzen&&(!surah||!/quran|qur.an|recitation|tilawah|تلاوة|سورة/i.test(title+" "+description.slice(0,200))))return[];
  if(quranMission&&!fluzen&&/part\\s*\\d+|verses?\\s*\\d+|ayat?\\s*\\d+|highlight|excerpt|portion/i.test(title))return[];
  if(surah)quranMatches.add(surah);
  if(!quranMission&&!educational&&!fluzen&&!religiousPattern.test(title+" "+description.slice(0,500))&&!seriesPattern.test(title))return[];
  return [{video_id:v.id,title:title.slice(0,300),channel_id:channelId,channel_title:channel.slice(0,250),description:description.slice(0,5000),thumbnail_url:v.snippet.thumbnails?.high?.url||null,duration_seconds:d,format:"full",language,published_at:v.snippet.publishedAt,view_count:Number(v.statistics?.viewCount||0),categories:fluzen?["Educational","Nature & Science"]:quranMission?["Qur’an","Surah "+String(surah).padStart(3,"0")]:educational?["Educational","TPDossierYT"]:[seriesPattern.test(title)?"Historical series":category],source_query:(fluzen?"approved-channel-fluzen:":quranMission?"quran-114:":"approved-channel:")+channelId,status:"pending",bot_b_reason:fluzen?"Fluzen full-channel import; pending admin review":quranMission?"Qur’an 114 candidate; full recitation and visual aesthetics require manual verification":educational?"Educational channel import; awaiting admin review":"Hourly YouTube discovery; awaiting approval"}];
 });
 eligible+=rows.length;
 // Check existing records first so reports count actual additions, not ignored duplicates.
 for(let i=0;i<rows.length;i+=100){
  const batch=rows.slice(i,i+100),blocked=await db("admin_video_roster_exclusions?select=item_id&source=eq.islamic_video_registry&item_id=in.("+rows.slice(i,i+100).map(x=>x.video_id).join(",")+")"),existing=await db("islamic_video_registry?select=video_id&video_id=in.("+batch.map(x=>x.video_id).join(",")+")");
  const known=new Set(existing.map(x=>x.video_id)),fresh=batch.filter(x=>!known.has(x.video_id));
  const safe=fresh.filter(x=>!blocked.some(b=>b.item_id===x.video_id));
  if(safe.length){await db("islamic_video_registry?on_conflict=video_id","POST",safe);inserted+=safe.length}
 }
 console.log("Channel",channelId,"scanned",uniqueIds.length,"eligible",rows.length);
 }catch(error){console.error("Channel scan failed",channelId,String(error));}
}
if(quranMission)console.log("Quran 114 mission candidate coverage:",JSON.stringify({candidate_surahs:[...quranMatches].sort((a,b)=>a-b),candidate_count:quranMatches.size,missing_candidate_surahs:Array.from({length:114},(_,i)=>i+1).filter(i=>!quranMatches.has(i)),note:"Candidates only; full recitation and aesthetics require admin review."}));
console.log("DeepWatch hourly discovery complete:",JSON.stringify({channels:channelsToScan.length,scanned,eligible,new_pending:inserted}));
await updateRun(scanned?"success":"failure",JSON.stringify({channels:channelsToScan.length,scanned,eligible,new_pending:inserted}));
if(!scanned)throw Error("All approved channel scans failed or returned no videos");
}
