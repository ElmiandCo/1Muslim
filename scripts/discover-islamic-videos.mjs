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
const quranMission=process.env.DEEPWATCH_QURAN_114==="true";
const channelsToScan=quranMission?approvedChannels:[...new Set(Array.from({length:Math.min(3,approvedChannels.length)},(_,i)=>approvedChannels[(hour*3+i)%approvedChannels.length]))];
const surahNames=["fatihah","baqarah","imran","nisa","maidah","anam","araf","anfal","tawbah","yunus","hud","yusuf","rad","ibrahim","hijr","nahl","isra","kahf","maryam","taha","anbiya","hajj","muminun","nur","furqan","shuara","naml","qasas","ankabut","rum","luqman","sajdah","ahzab","saba","fatir","yasin","saffat","sad","zumar","ghafir","fussilat","shura","zukhruf","dukhan","jathiyah","ahqaf","muhammad","fath","hujurat","qaf","dhariyat","tur","najm","qamar","rahman","waqiah","hadid","mujadila","hashr","mumtahanah","saff","jumuah","munafiqun","taghabun","talaq","tahrim","mulk","qalam","haqqah","maarij","nuh","jinn","muzzammil","muddaththir","qiyamah","insan","mursalat","naba","naziat","abasa","takwir","infitar","mutaffifin","inshiqaq","buruj","tariq","ala","ghashiyah","fajr","balad","shams","layl","duha","sharh","tin","alaq","qadr","bayyinah","zalzalah","adiyat","qariah","takathur","asr","humazah","fil","quraysh","maun","kawthar","kafirun","nasr","masad","ikhlas","falaq","nas"];
const normalizeSurah=s=>s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\\b(al|surah|surat|sura|chapter|the)\\b/g," ").replace(/\\s+/g," ").trim();
const matchSurah=title=>{const norm=normalizeSurah(title);const number=norm.match(/(?:^|\\s)(?:surah|chapter)?\\s*(\\d{1,3})(?:\\s|$)/);const name=surahNames.findIndex(n=>norm.split(" ").includes(n));if(name>=0)return name+1;if(number&&+number[1]>=1&&+number[1]<=114&&/surah|surat|sura|chapter/i.test(title))return +number[1];return null};
const quranMatches=new Set();
let inserted=0,eligible=0,scanned=0;
const seriesPattern=/ertugrul|ertuğrul|diriliş|dirilis|kuruluş|kurulus|osman|selçuklu|selcuklu|alparslan|abdülhamid|abdulhamid|payitaht|mehmed|fetihler|episode|episod|bölüm|bolum|season|\\bep\\.?\\s*\\d+|\\bs\\d+e\\d+|الحلقة\\s*[\\d٠-٩]+|مسلسل/i;
const religiousPattern=/islam|muslim|quran|qur.an|allah|hadith|seerah|prophet|salah|تفسير|القرآن|الإسلام|محمد|تلاوة/i;
for(const channelId of channelsToScan){
 try{
 const channel=await api("channels",{part:"contentDetails",id:channelId});
 const uploads=channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
 if(!uploads){console.warn("Skipping inaccessible approved channel",channelId);continue}
 const ids=[];let pageToken;
 const offset=quranMission?0:(Math.floor(hour/Math.ceil(approvedChannels.length/3))%5)*4;
 for(let page=0;page<offset+(quranMission?12:4);page++){
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
  const surah=quranMission?matchSurah(title):null;
  if(quranMission&&(!surah||!/quran|qur.an|recitation|tilawah|تلاوة|سورة/i.test(title+" "+description.slice(0,200))))return[];
  if(quranMission&&/part\\s*\\d+|verses?\\s*\\d+|ayat?\\s*\\d+|highlight|excerpt|portion/i.test(title))return[];
  if(surah)quranMatches.add(surah);
  if(!quranMission&&!religiousPattern.test(title+" "+description.slice(0,500))&&!seriesPattern.test(title))return[];
  return [{video_id:v.id,title:title.slice(0,300),channel_id:channelId,channel_title:channel.slice(0,250),description:description.slice(0,5000),thumbnail_url:v.snippet.thumbnails?.high?.url||null,duration_seconds:d,format:"full",language,published_at:v.snippet.publishedAt,view_count:Number(v.statistics?.viewCount||0),categories:quranMission?["Qur’an","Surah "+String(surah).padStart(3,"0")]:[seriesPattern.test(title)?"Historical series":category],source_query:(quranMission?"quran-114:":"approved-channel:")+channelId,status:"pending",bot_b_reason:quranMission?"Qur’an 114 candidate; full recitation and visual aesthetics require manual verification":"Hourly YouTube discovery; awaiting approval"}];
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
if(quranMission)console.log("Quran 114 mission candidate coverage:",JSON.stringify({candidate_surahs:[...quranMatches].sort((a,b)=>a-b),candidate_count:quranMatches.size,missing_candidate_surahs:Array.from({length:114},(_,i)=>i+1).filter(i=>!quranMatches.has(i)),note:"Candidates only; full recitation and aesthetics require admin review."}));
console.log("DeepWatch hourly discovery complete:",JSON.stringify({channels:channelsToScan.length,scanned,eligible,new_pending:inserted}));
if(!scanned)throw Error("All approved channel scans failed or returned no videos");
}
