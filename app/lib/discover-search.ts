import { createClient } from "../../utils/supabase/server";
import {publicMemberId,publicMemberName} from "./member-id-visibility";

export type DiscoverKind = "Videos" | "Posts" | "People" | "Movies & Series" | "Qur’an" | "Comments" | "Lessons" | "Prayer" | "Live" | "Qibla";
export type DiscoverItem = {
  id: string; kind: DiscoverKind; title: string; description: string; href: string;
  image?: string; byline?: string; badge?: string; score: number; timestamp?: string; media?: "video" | "image" | "text";
};
export type DiscoverResponse = { query: string; groups: Record<DiscoverKind, DiscoverItem[]>; best: DiscoverItem[]; total: number; partial: boolean; suggestions: string[] };
export const DISCOVER_CATEGORIES: DiscoverKind[] = ["Videos","Posts","People","Movies & Series","Qur’an","Comments","Lessons","Prayer","Live","Qibla"];
type DB = Awaited<ReturnType<typeof createClient>>;
const compact = (value: unknown, max = 190) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const GENERIC_SEARCH_WORDS = new Set(["show","find","search","me","my","the","for","with","about","what","where","who","when","why","how","can","you","please","videos","video","posts","post","films","movies","movie","series","of","on","in","to","a","an","is","are","i","want","need"]);
const normalizeSearch = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[-_'’]+/g," ").replace(/\s+/g," ").trim();
function meaningfulTerm(query:string) {
  const cleaned = query.replace(/[%,()\\@]/g," ").trim().slice(0,90);
  const words=cleaned.split(/\s+/).filter(Boolean);
  const important=words.filter(word=>!GENERIC_SEARCH_WORDS.has(word.toLowerCase()));
  return words.length>2||(words.length===2&&words.some(word=>GENERIC_SEARCH_WORDS.has(word.toLowerCase())))
    ? important.sort((a,b)=>b.length-a.length)[0]||cleaned : cleaned;
}
// Avoid matching 'cat' in 'education', or 'ai' in 'said'. Short queries must match whole words.
function termMatches(value:string,term:string) {
  const haystack=normalizeSearch(value);
  const needle=normalizeSearch(term);
  if(!needle)return true;
  if(needle.length<=3 && /^[a-z0-9]+$/.test(needle)){
    return haystack.split(/[^a-z0-9]+/).some(word=>word===needle||word===needle+"s");
  }
  return haystack.includes(needle);
}
function relevance(query: string, title: string, description: string, base = 0) {
  if(!query)return base+10;
  const q=meaningfulTerm(query),t=normalizeSearch(title),needle=normalizeSearch(q);
  if(t===needle)return 100+base;
  if(t.startsWith(needle)&&termMatches(title,q))return 87+base;
  if(termMatches(title,q))return 74+base;
  if(termMatches(description,q))return 48+base;
  return base+4;
}
const publicLink=(path:unknown) => typeof path==="string" && (/^https:\/\//.test(path)||path.startsWith("/assets/")) ? path : undefined;

const KNOWLEDGE: Array<{tokens:string[];title:string;description:string;href:string}> = [
  {tokens:["salah","salat","prayer","pray","prayers","adhan","athan","namaz","daily"],title:"Prayer Times & Adhan",description:"Prayer times based on your saved city and personal Adhan reminders.",href:"/widget-tools/prayer"},
  {tokens:["salah","salat","prayer","learn","rakats","rakah","wudu","ablution","prostration"],title:"Learn Salah",description:"A step-by-step guide to the positions and recitations of Salah.",href:"/widget-tools/prayer/learn"},
  {tokens:["salah","salat","prayer","isra","miraj","night journey","story"],title:"The Story of Salah",description:"Discover the Night Journey and the story behind the five daily prayers.",href:"/widget-tools/prayer/story"},
  {tokens:["quran","qur'an","qur’an","surah","ayah","verse","recite","read"],title:"The Holy Qur’an",description:"Explore 114 surahs, verses, recitations and English translations.",href:"/quran-library"},
  {tokens:["arabic","letters","alphabet","lesson","learn"],title:"Arabic Lessons",description:"Learn Arabic letters, recitation and reading fundamentals.",href:"/elm-tent/lessons"},
  {tokens:["movies","films","shows","tv","series","deepwatch","documentary"],title:"DeepWatch",description:"Explore movies, series, documentaries and family entertainment.",href:"/deepwatch"},
  {tokens:["live","stream","streaming","broadcast"],title:"Live on 1Muslim",description:"Find live streams and join the conversation.",href:"/streaming"}
];
function knowledgeResults(q:string): DiscoverItem[] {
  const term=q.toLowerCase(), words=term.split(/\s+/).filter(Boolean);
  return KNOWLEDGE.filter(row => !term || row.tokens.some(token=>token.includes(term)||term.includes(token)||(words.length>1&&words.includes(token))))
    .map(row=>({id:"guide:"+row.href,kind:row.href.includes("prayer")?"Prayer":row.href.includes("quran")?"Qur’an":"Lessons",title:row.title,description:row.description,href:row.href,score:relevance(q,row.title,row.description,5),media:"text"}));
}
async function quranTranslations(q:string): Promise<{key:string;text:string;source:string}[]> {
  if (q.trim().length<2) return [];
  const direct=/\b(\d{1,3}):(\d{1,3})\b/.exec(q);
  if(direct&&Number(direct[1])>=1&&Number(direct[1])<=114&&Number(direct[2])>=1) {
    try{
      const key=direct[1]+":"+direct[2];
      const r=await fetch("https://api.alquran.cloud/v1/ayah/"+key+"/en.asad",{signal:AbortSignal.timeout(4800),next:{revalidate:86400}});
      if(r.ok){
        const data=await r.json();
        if(data?.code===200&&typeof data.data?.text==="string")
          return [{key,text:compact(data.data.text,310),source:"Muhammad Asad · English translation"}];
      }
    }catch{}
  }
  try {
    const url="https://api.quran.com/api/v4/search?"+new URLSearchParams({q,language:"en",size:"14",page:"1"});
    const response=await fetch(url,{signal:AbortSignal.timeout(5500),next:{revalidate:600}});
    if(!response.ok) return [];
    const body=await response.json();
    const results=Array.isArray(body?.search?.results)?body.search.results:[];
    // Quran.com search returns original Arabic for many English queries.
    // Resolve verified English translations by verse key; never label Arabic as English.
    const keys=[...new Set(results.map((x:{verse_key?:string})=>String(x.verse_key||""))
      .filter((key:string)=>/^\d{1,3}:\d{1,3}$/.test(key)))].slice(0,10);
    const translated=await Promise.all(keys.map(async key=>{
      try{
        const r=await fetch("https://api.alquran.cloud/v1/ayah/"+key+"/en.asad",
          {signal:AbortSignal.timeout(4500),next:{revalidate:86400}});
        if(!r.ok)return null;
        const data=await r.json();
        const text=typeof data?.data?.text==="string"&&data.code===200?compact(data.data.text,310):"";
        return text?{key,text,source:"Muhammad Asad · English translation"}:null;
      }catch{return null;}
    }));
    return translated.filter((item):item is {key:string;text:string;source:string}=>item!==null);
  } catch { return []; }
}
async function quranChapters(q:string):Promise<Array<{id:number;title:string;translated:string;verses:number}>> {
  if(q.trim().length<2)return [];
  try {
    const response=await fetch("https://api.quran.com/api/v4/chapters?language=en",{signal:AbortSignal.timeout(4700),next:{revalidate:86400}});
    if(!response.ok)return [];
    const body=await response.json();
    const chapters=Array.isArray(body?.chapters)?body.chapters:[];
    const normalize=(value:string)=>value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[-_'’]/g," ").replace(/\s+/g," ").trim();
    const query=normalize(q.replace(/^surah\s+/i,""));
    return chapters.filter((chapter:{id:number;name_simple:string;translated_name?:{name:string}})=>
      normalize(String(chapter.name_simple||"")).includes(query) ||
      normalize(String(chapter.translated_name?.name||"")).includes(query) ||
      (q.toLowerCase().startsWith("surah ")&&String(chapter.id)===query))
      .slice(0,12).map((chapter:{id:number;name_simple:string;translated_name?:{name:string};verses_count:number})=>({
        id:chapter.id,title:chapter.name_simple,translated:chapter.translated_name?.name||"",verses:chapter.verses_count
      }));
  }catch{return [];}
}
export async function searchDirectory(db:DB, rawQuery:string):Promise<DiscoverResponse> {
  const query=compact(rawQuery,90);
  const active=query.length>=2;
  const term=meaningfulTerm(query);
  const pattern="%"+term+"%";
  const base = () => ({data:[],error:null});
  // All tables use the caller's Supabase session and RLS. No service-role reads of private content.
  const tasks=await Promise.allSettled([
    active?db.from("ummah_feed_posts").select("id,author_id,body,created_at").ilike("body",pattern).order("created_at",{ascending:false}).limit(40):
      db.from("ummah_feed_posts").select("id,author_id,body,created_at").order("created_at",{ascending:false}).limit(16),
    active?db.from("profiles").select("id,display_name,username,hide_1muslim_id,avatar_url,bio,xp_total").or("display_name.ilike."+pattern+",username.ilike."+pattern+",bio.ilike."+pattern).limit(20):
      db.from("profiles").select("id,display_name,username,hide_1muslim_id,avatar_url,bio,xp_total").order("xp_total",{ascending:false}).limit(8),
    active?db.from("islamic_video_registry").select("video_id,title,description,channel_title,thumbnail_url,content_type,series_id,cover_url,categories,published_at").eq("status","approved").or("title.ilike."+pattern+",description.ilike."+pattern+",channel_title.ilike."+pattern+",canonical_title.ilike."+pattern).limit(35):
      db.from("islamic_video_registry").select("video_id,title,description,channel_title,thumbnail_url,content_type,series_id,cover_url,categories,published_at").eq("status","approved").order("discovered_at",{ascending:false}).limit(18),
    active?db.from("deepwatch_series").select("id,canonical_title,synopsis,cover_url,language").eq("status","approved").or("canonical_title.ilike."+pattern+",synopsis.ilike."+pattern).limit(16):Promise.resolve(base()),
    active?db.from("ummah_post_comments").select("id,post_id,body,created_at").ilike("body",pattern).order("created_at",{ascending:false}).limit(22):Promise.resolve(base()),
    active?db.from("lessons").select("id,slug,title,description").eq("active",true).or("title.ilike."+pattern+",description.ilike."+pattern).limit(12):Promise.resolve(base()),
    active?db.from("newsletter_articles").select("id,title,excerpt,slug,category").eq("published",true).or("title.ilike."+pattern+",excerpt.ilike."+pattern).limit(12):Promise.resolve(base()),
    active?db.from("qibla_pages").select("id,title,hero_media_path,template_type").eq("published",true).ilike("title",pattern).limit(12):Promise.resolve(base()),
    active?db.from("live_streams").select("id,title,category,status,created_at").eq("visibility","public").eq("status","live").or("title.ilike."+pattern+",category.ilike."+pattern).limit(10):
      db.from("live_streams").select("id,title,category,status,created_at").eq("visibility","public").eq("status","live").order("created_at",{ascending:false}).limit(8),
    quranTranslations(query),
    quranChapters(query),
    (async()=>{
      // Discover categories are metadata, not necessarily words in a video's title.
      // Search approved categories directly so Somali or Turkish titles remain discoverable.
      const intent=normalizeSearch(term);
      const lookup:Record<string,string[]> = {
        somali:["Somali Entertainment","Somalia"],turkish:["Turkish Drama"],
        kids:["kids","Animated"],children:["kids","Animated"],
        movies:["Movies"],movie:["Movies"],film:["Movies"],
        series:["Series","series","Historical series"],
        documentary:["Historical"],history:["Historical","Historical series"],
        prophets:["Prophets"],prophet:["Prophets"],prayer:["Prayer & worship"],
        seerah:["Seerah"],arabic:["Arabic tafsir"],quran:["Qur’an","quran"],
        islam:["Islam","Islamic Programs"],nature:["Nature & Science"]
      };
      const labels=lookup[intent]||[];
      if(!active||labels.length===0)return base();
      const data=await Promise.all(labels.map(category=>db.from("islamic_video_registry")
        .select("video_id,title,description,channel_title,thumbnail_url,content_type,series_id,cover_url,categories,published_at")
        .eq("status","approved").contains("categories",[category]).order("discovered_at",{ascending:false}).limit(22)));
      return {data:data.flatMap(result=>result.data||[]),error:data.find(result=>result.error)?.error||null};
    })()
  ]);
  const get=(i:number):any[]=>{
    const settled=tasks[i];if(!settled||settled.status!=="fulfilled")return [];
    const value=settled.value as any;
    return Array.isArray(value?.data)?value.data:Array.isArray(value)?value:[];
  };
  const groups=Object.fromEntries(DISCOVER_CATEGORIES.map(category=>[category,[] as DiscoverItem[]])) as unknown as Record<DiscoverKind,DiscoverItem[]>;
  const add=(item:DiscoverItem)=>{
    if(!item.href.startsWith("/")||item.href.startsWith("//"))return;
    if(active&&term.length<=3&&!termMatches([item.title,item.description,item.byline||""].join(" "),term))return;
    groups[item.kind].push(item);
  };
  const authors=get(1);
  const posts=get(0), postIds=posts.map(p=>p.id);
  // Populate author names for matching posts even when the creator's name wasn't part of the query.
  const missingAuthorIds=[...new Set(posts.map(p=>p.author_id).filter((id:string)=>!!id&&!authors.some(a=>a.id===id)))];
  const extraAuthors=missingAuthorIds.length?await db.from("profiles").select("id,display_name,username,hide_1muslim_id,avatar_url").in("id",missingAuthorIds.slice(0,40)):base();
  const byAuthor=new Map([...authors,...(extraAuthors.data||[])].map(p=>[p.id,p]));
  const mediaQuery=postIds.length ? await db.from("post_media").select("post_id,community_post_id,storage_path,mime_type").in("community_post_id",postIds).limit(120):base();
  const byMedia=new Map<string,{storage_path:string;mime_type:string}>();
  for(const media of mediaQuery.data||[]) if(media.community_post_id&&!byMedia.has(media.community_post_id))byMedia.set(media.community_post_id,media);
  const storage=db.storage.from("community-media");
  for(const p of posts){
    const m=byMedia.get(p.id);
    const image=m?.mime_type?.startsWith("image/")?storage.getPublicUrl(m.storage_path).data.publicUrl:undefined;
    const type=m?.mime_type?.startsWith("video/")?"video":m?.mime_type?.startsWith("image/")?"image":"text";
    const isVideo=type==="video"||/youtu(?:\.be|be\.com)/i.test(p.body||"");
    const author=byAuthor.get(p.author_id);
    add({id:p.id,kind:isVideo?"Videos":"Posts",title:compact(p.body,105)||"Ummah post",description:compact(p.body,240)||"Shared with the Ummah",
      href:"/posts/story/"+encodeURIComponent(p.id),image,byline:publicMemberName(author),media:type,
      badge:isVideo?"VIDEO":type==="image"?"PHOTO":"POST",score:relevance(query,p.body||"","Ummah post",isVideo?8:3),timestamp:p.created_at});
  }
  for(const p of authors) {
    // Searching for an opted-out handle must not reveal or locate that ID.
    const searchable=(p.display_name||"")+" "+(p.hide_1muslim_id?"":p.username||"")+" "+(p.bio||"");
    if(active&&!termMatches(searchable,term))continue;
    add({id:p.id,kind:"People",title:compact(publicMemberName(p),90),description:compact(p.bio||"1Muslim member",130),
      href:"/profile?member="+encodeURIComponent(p.id),image:publicLink(p.avatar_url),byline:publicMemberId(p)||"Member",
      badge:Number.isFinite(p.xp_total)?Number(p.xp_total).toLocaleString()+" XP":"MEMBER",score:relevance(query,publicMemberName(p),p.hide_1muslim_id?"":p.username||"",4)});
  }
  const discoveredVideos=[...get(2),...get(11)];
  const seenVideos=new Set<string>();
  for(const v of discoveredVideos) {
    if(seenVideos.has(v.video_id))continue;
    seenVideos.add(v.video_id);
    const mediaType=String(v.content_type||"video").toLowerCase();
    const categories=(Array.isArray(v.categories)?v.categories:[]).map((x:unknown)=>String(x));
    const showCategory=categories.some((category:string)=>/\b(movies|series|drama|game shows)\b/i.test(category));
    const showTitle=/\b(movie|series|season|episode|full film|documentary)\b/i.test(String(v.title||""));
    const isShow=["movie","film","series","episode","show","documentary"].includes(mediaType)||Boolean(v.series_id)||showCategory||showTitle;
    const categoryMatch=categories.some((category:string)=>termMatches(category,term));
    add({id:v.video_id,kind:isShow?"Movies & Series":"Videos",title:compact(v.title,130),description:compact(v.description,190),
      href:"/deepwatch?video="+encodeURIComponent(v.video_id),image:publicLink(v.cover_url)||publicLink(v.thumbnail_url)||"https://i.ytimg.com/vi/"+encodeURIComponent(v.video_id)+"/hqdefault.jpg",
      byline:v.channel_title||"DeepWatch",badge:isShow?(mediaType==="video"?"SHOW / SERIES":mediaType.toUpperCase()):"DEEPWATCH · VIDEO",
      media:"video",score:Math.max(relevance(query,v.title||"",v.description||"",isShow?7:5),categoryMatch?47:0),timestamp:v.published_at});
  }
  const series=get(3), seriesIds=series.map(x=>x.id);
  const episodeRows=seriesIds.length?await db.from("islamic_video_registry").select("series_id,video_id").eq("status","approved").in("series_id",seriesIds).order("episode_number",{ascending:true}).limit(60):base();
  const firstEpisode=new Map<string,string>();
  for(const episode of episodeRows.data||[])if(episode.series_id&&!firstEpisode.has(episode.series_id))firstEpisode.set(episode.series_id,episode.video_id);
  for(const s of series) add({id:"series:"+s.id,kind:"Movies & Series",title:compact(s.canonical_title,130),description:compact(s.synopsis,200),
    href:firstEpisode.has(s.id)?"/deepwatch?video="+encodeURIComponent(firstEpisode.get(s.id)!):"/deepwatch",
    image:publicLink(s.cover_url),byline:s.language||"DeepWatch series",badge:"SERIES",media:"video",score:relevance(query,s.canonical_title||"",s.synopsis||"",12)});
  for(const c of get(4))add({id:c.id,kind:"Comments",title:compact(c.body,120),description:compact(c.body,230),
    href:"/posts/story/"+encodeURIComponent(c.post_id)+"?comment="+encodeURIComponent(c.id),badge:"DISCUSSION",
    score:relevance(query,c.body||"","Comment on an Ummah post",2),timestamp:c.created_at,media:"text"});
  for(const lesson of get(5))add({id:lesson.id,kind:"Lessons",title:compact(lesson.title,120),description:compact(lesson.description,190),
    href:"/elm-tent/lessons",byline:"1Muslim Learning",badge:"LESSON",score:relevance(query,lesson.title||"",lesson.description||"",6),media:"text"});
  for(const article of get(6))add({id:article.id,kind:"Qibla",title:compact(article.title,120),description:compact(article.excerpt,190),
    href:"/newsletter/"+encodeURIComponent(article.slug),byline:article.category||"Qibla",badge:"ARTICLE",score:relevance(query,article.title||"",article.excerpt||"",6)});
  for(const article of get(7))add({id:article.id,kind:"Qibla",title:compact(article.title,120),description:"Qibla editorial",href:"/qibla/newsroom/"+encodeURIComponent(article.id),
    image:publicLink(article.hero_media_path),badge:"MAGAZINE",score:relevance(query,article.title||"","Qibla editorial",7)});
  for(const live of get(8))add({id:live.id,kind:"Live",title:compact(live.title,120),description:compact(live.category||"Join the conversation",190),
    href:"/streaming/live/"+encodeURIComponent(live.id),badge:"● LIVE",score:relevance(query,live.title||"",live.category||"",11),timestamp:live.created_at});
  for(const verse of get(9))add({id:verse.key,kind:"Qur’an",title:"Qur’an "+verse.key,description:verse.text,
    href:"/elm-tent/quran?verse="+encodeURIComponent(verse.key),byline:verse.source,badge:"VERSE · ENGLISH",score:relevance(query,"Qur’an "+verse.key,verse.text,18),media:"text"});
  for(const chapter of get(10))add({id:"surah:"+chapter.id,kind:"Qur’an",title:"Surah "+chapter.title,description:chapter.translated+" · "+chapter.verses+" ayahs",
    href:"/elm-tent/quran?chapter="+encodeURIComponent(chapter.id),byline:"The Holy Qur’an",badge:"SURAH",score:relevance(query,"Surah "+chapter.title,chapter.translated,15),media:"text"});
  for(const guide of knowledgeResults(query))add(guide);
  const unique=new Set<string>();
  for(const category of DISCOVER_CATEGORIES) {
    groups[category]=groups[category].filter(item=>{
      const key=item.href+"|"+item.kind;
      if(unique.has(key))return false;unique.add(key);return true;
    }).sort((a,b)=>b.score-a.score).slice(0,22);
  }
  const seenBest=new Set<string>();
  const best=DISCOVER_CATEGORIES.flatMap(kind=>groups[kind]).sort((a,b)=>b.score-a.score).filter(item=>{
    if(seenBest.has(item.href))return false;seenBest.add(item.href);return true;
  }).slice(0,12);
  const suggestions=[...new Set([...best.slice(0,6).map(item=>item.title).filter(title=>title.length<44),...KNOWLEDGE.map(x=>x.title)])].slice(0,9);
  const partial=tasks.some((t,i)=> t.status==="rejected" || ((i<9||i===11)&&t.status==="fulfilled"&&Boolean((t.value as any)?.error)));
  return {query,groups,best,total:DISCOVER_CATEGORIES.reduce((sum,kind)=>sum+groups[kind].length,0),partial,suggestions};
}
