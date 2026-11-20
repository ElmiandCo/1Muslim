// DeepWatch Bot 1: zero-filter discovery, pending-only staging.
const handles=['SalamMedia-English','muslimi','DeenStoriesTV','FreeQuranEducation','MovieMarathon-hu7nr','BoundOfficialTV','MusaFamCartoon','Ifinite-c5h','AumSum','smiletojannah','Windowsofislam','Murph-b5y','TheHistorianProfessor'];
const {YOUTUBE_API_KEY:yt,SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
if(!yt||!url||!key)throw Error('Missing YouTube or Supabase GitHub Actions secrets');
const limit=Number(process.env.BOT1_TARGET||250);
const api=async(endpoint,params)=>{const u=new URL('https://www.googleapis.com/youtube/v3/'+endpoint);for(const [k,v] of Object.entries({...params,key:yt}))u.searchParams.set(k,String(v));const r=await fetch(u);if(!r.ok)throw Error('YouTube '+r.status+' '+(await r.text()).slice(0,200));return r.json()};
const db=async(path,options={})=>{const r=await fetch(url.replace(/\/$/,'')+'/rest/v1/'+path,{...options,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation',...(options.headers||{})}});if(!r.ok)throw Error('Supabase '+r.status+' '+(await r.text()).slice(0,300));return r.json()};
const duration=s=>{const m=/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s||'');return m?(+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0):null};
const classify=t=>/\b(episode|ep\.?\s*\d+|part\s*\d+|season|s\d+e\d+)\b|الحلقة/i.test(t)?'series':/\b(shorts?)\b/i.test(t)?'short':/\b(documentary)\b/i.test(t)?'documentary':/\b(cartoon|kids|children|animated)\b/i.test(t)?'kids':/\b(movie|film)\b/i.test(t)?'movie':/\b(quran|qur.an|surah|سورة)\b/i.test(t)?'quran':/\b(history|historical)\b/i.test(t)?'history':'education';
const counts={enumerated:0,inserted:0,duplicates:0,errors:[],channels:[]};
const channelRecords=[];
for(const handle of handles){
 try{const r=await api('channels',{part:'snippet,contentDetails',forHandle:handle});const c=r.items?.[0];if(!c){counts.errors.push('Unresolved handle @'+handle);continue}channelRecords.push({handle,id:c.id,title:c.snippet.title,uploads:c.contentDetails.relatedPlaylists.uploads});}
 catch(e){counts.errors.push('@'+handle+': '+String(e))}
}
if(!channelRecords.length)throw Error('No approved channels resolved: '+JSON.stringify(counts.errors));
const ids=new Map();
for(const c of channelRecords){
 let token;let pages=0;let found=0;
 try{do{const r=await api('playlistItems',{part:'contentDetails',playlistId:c.uploads,maxResults:50,...(token?{pageToken:token}:{})});for(const v of r.items||[]){const id=v.contentDetails?.videoId;if(id&&!ids.has(id)){ids.set(id,c);found++}}token=r.nextPageToken;pages++;}while(token&&pages<30&&ids.size<limit*3)}
 catch(e){counts.errors.push('@'+c.handle+' uploads: '+String(e))}
 counts.channels.push({handle:c.handle,channel_id:c.id,enumerated:found});if(ids.size>=limit*3)break;
}
const list=[...ids.keys()];counts.enumerated=list.length;
const registry=new Set(),queue=new Set(),dw=new Set();
for(let i=0;i<list.length;i+=80){
 const chunk=list.slice(i,i+80);
 const filter=chunk.map(x=>'"'+x+'"').join(',');
 for(const [table,column,set] of [['islamic_video_registry','video_id',registry],['dw_videos','youtube_id',dw]]){
  try{const rows=await db(table+'?select='+column+'&'+column+'=in.('+filter+')');for(const row of rows)set.add(row[column])}
  catch(e){counts.errors.push('Dedup '+table+': '+String(e));throw e}
 }
 const sources=chunk.map(id=>encodeURIComponent('https://www.youtube.com/watch?v='+id)).join(',');
 // Acquisition queue has no unique video ID; use existing source URLs for dedup.
 try{const rows=await db('deepwatch_movie_acquisition_queue?select=source_url&source_url=in.('+sources+')');for(const row of rows){const id=new URL(row.source_url).searchParams.get('v');if(id)queue.add(id)}}
 catch(e){counts.errors.push('Dedup queue: '+String(e));throw e}
}
const existing=new Set([...registry,...queue,...dw]);
const candidates=list.filter(id=>!existing.has(id));counts.duplicates=list.length-candidates.length;
for(let i=0;i<candidates.length&&counts.inserted<limit;i+=50){
 const batch=candidates.slice(i,i+50);let videos;
 try{videos=(await api('videos',{part:'snippet,contentDetails,status',id:batch.join(',')})).items||[]}
 catch(e){counts.errors.push('Video metadata: '+String(e));continue}
 const rows=videos.filter(v=>ids.get(v.id)?.id===v.snippet?.channelId).map(v=>{
  const type=classify(v.snippet.title||'');
  const ep=(v.snippet.title||'').match(/(?:episode|ep\.?|part|الحلقة)\s*#?\s*(\d+)/i);
  return {video_id:v.id,title:(v.snippet.title||'Untitled').slice(0,300),channel_id:v.snippet.channelId,channel_title:v.snippet.channelTitle||'',description:(v.snippet.description||'').slice(0,5000),thumbnail_url:v.snippet.thumbnails?.high?.url||null,duration_seconds:duration(v.contentDetails?.duration),format:type==='short'?'short':'full',language:v.snippet.defaultAudioLanguage||v.snippet.defaultLanguage||null,published_at:v.snippet.publishedAt||null,categories:[type],source_query:'bot1-zero-filter-2026-11-20',status:'pending',content_type:type,original_title:v.snippet.title,episode_number:ep?Number(ep[1]):null,metadata_review_status:'unreviewed'};
 });
 try{const inserted=await db('islamic_video_registry?on_conflict=video_id',{method:'POST',body:JSON.stringify(rows)});counts.inserted+=inserted.length}
 catch(e){counts.errors.push('Insert batch: '+String(e));throw e}
}
console.log(JSON.stringify(counts,null,2));
if(counts.inserted<20)process.exitCode=2;
