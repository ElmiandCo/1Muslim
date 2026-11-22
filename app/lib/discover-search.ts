import { createClient } from "../../utils/supabase/server";

export type DiscoverKind = "Videos" | "Posts" | "People" | "Movies & Series" | "Qur’an" | "Comments" | "Lessons" | "Prayer" | "Live" | "Qibla";
export type DiscoverItem = {
  id: string; kind: DiscoverKind; title: string; description: string; href: string;
  image?: string; byline?: string; badge?: string; score: number; timestamp?: string; media?: "video" | "image" | "text";
};
export type DiscoverResponse = { query: string; groups: Record<DiscoverKind, DiscoverItem[]>; best: DiscoverItem[]; total: number; partial: boolean; suggestions: string[] };
export const DISCOVER_CATEGORIES: DiscoverKind[] = ["Videos","Posts","People","Movies & Series","Qur’an","Comments","Lessons","Prayer","Live","Qibla"];
type DB = Awaited<ReturnType<typeof createClient>>;
const compact = (value: unknown, max = 190) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const searchText = (query: string) => query.toLowerCase().replace(/^@/, "").trim();
function relevance(query: string, title: string, description: string, base = 0) {
  if (!query) return base + 10;
  const q = searchText(query), t = title.toLowerCase(), d = description.toLowerCase();
  if (t === q) return 100 + base;
  if (t.startsWith(q) || t.startsWith("@" + q)) return 87 + base;
  if (t.includes(q)) return 74 + base;
  if (d.includes(q)) return 48 + base;
  const words=q.split(/\s+/).filter(w=>w.length>1);
  return (words.length && words.every(w=>(t+" "+d).includes(w)) ? 35 : 10) + base;
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
    return results.map((x:{verse_key?:string;text?:string;highlighted?:string})=>({key:String(x.verse_key||""),text:compact(x.text||x.highlighted||"",310),source:"Qur’an.com · English search"}))
      .filter((x:{key:string;text:string})=>/^\d{1,3}:\d{1,3}$/.test(x.key)&&x.text.length>0);
  } catch { return []; }
}
async function quranChapters(q:string):Promise<Array<{id:number;title:string;translated:string;verses:number}>> {
  if(q.trim().length<2)return [];
  try {
    const response=await fetch("https://api.quran.com/api/v4/chapters?language=en",{signal:AbortSignal.timeout(4700),next:{revalidate:86400}});
    if(!response.ok)return [];
    const body=await response.json();
    const chapters=Array.isArray(body?.chapters)?body.chapters:[];
    const query=q.toLowerCase().replace(/^surah\s+/,"").trim();
    return chapters.filter((chapter:{id:number;name_simple:string;translated_name?:{name:string}})=>
      String(chapter.name_simple||"").toLowerCase().includes(query) ||
      String(chapter.translated_name?.name||"").toLowerCase().includes(query) ||
      (q.toLowerCase().startsWith("surah ")&&String(chapter.id)===query))
      .slice(0,12).map((chapter:{id:number;name_simple:string;translated_name?:{name:string};verses_count:number})=>({
        id:chapter.id,title:chapter.name_simple,translated:chapter.translated_name?.name||"",verses:chapter.verses_count
      }));
  }catch{return [];}
}
export async function searchDirectory(db:DB, rawQuery:string):Promise<DiscoverResponse> {
  const query=compact(rawQuery,90);
  const active=query.length>=2;
  const cleaned=query.replace(/[%,()\\@]/g," ").trim().slice(0,90);
  const words=cleaned.split(/\s+/).filter(Boolean);
  const generic=new Set(["show","find","search","me","my","the","for","with","about","what","where","who","when","why","how","can","you","please","videos","video","posts","post","films","movies","movie","series","of","on","in","to","a","an","is","are","i","want","need"]);
  const important=words.filter(w=>!generic.has(w.toLowerCase()));
  // Search intent often includes filler words; use the strongest term instead of matching a literal sentence.
  const term=words.length>2 || (words.length===2 && words.some(w=>generic.has(w.toLowerCase())))
    ? important.sort((a,b)=>b.length-a.length)[0]||cleaned : cleaned;
  const pattern="%"+term+"%";
  const base = () => ({data:[],error:null});
  // All tables use the caller's Supabase session and RLS. No service-role reads of private content.
  const tasks=await Promise.allSettled([
    active?db.from("ummah_feed_posts").select("id,author_id,body,created_at").ilike("body",pattern).order("created_at",{ascending:false}).limit(40):
      db.from("ummah_feed_posts").select("id,author_id,body,created_at").order("created_at",{ascending:false}).limit(16),
    active?db.from("profiles").select("id,display_name,username,avatar_url,bio,xp_total").or("display_name.ilike."+pattern+",username.ilike."+pattern+",bio.ilike."+pattern).limit(20):
      db.from("profiles").select("id,display_name,username,avatar_url,bio,xp_total").order("xp_total",{ascending:false}).limit(8),
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
    quranChapters(query)
  ]);
  const get=(i:number):any[]=>{
    const settled=tasks[i];if(!settled||settled.status!=="fulfilled")return [];
    const value=settled.value as any;
    return Array.isArray(value?.data)?value.data:Array.isArray(value)?value:[];
  };
  const groups=Object.fromEntries(DISCOVER_CATEGORIES.map(category=>[category,[] as DiscoverItem[]])) as unknown as Record<DiscoverKind,DiscoverItem[]>;
  const add=(item:DiscoverItem)=>{if(item.href.startsWith("/")&&!item.href.startsWith("//"))groups[item.kind].push(item);};
  const authors=get(1);
  const byAuthor=new Map(authors.map(p=>[p.id,p]));
  const posts=get(0), postIds=posts.map(p=>p.id);
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
      href:"/posts/story/"+encodeURIComponent(p.id),image,byline:author?.display_name||author?.username||"1Muslim creator",media:type,
      badge:isVideo?"VIDEO":type==="image"?"PHOTO":"POST",score:relevance(query,p.body||"","Ummah post",isVideo?8:3),timestamp:p.created_at});
  }
  for(const p of authors) add({id:p.id,kind:"People",title:compact(p.display_name||p.username||"1Muslim member",90),description:compact(p.bio||"1Muslim member",130),
    href:"/profile?member="+encodeURIComponent(p.id),image:publicLink(p.avatar_url),byline:p.username?"@"+p.username:"Member",
    badge:Number.isFinite(p.xp_total)?Number(p.xp_total).toLocaleString()+" XP":"MEMBER",score:relevance(query,p.display_name||p.username||"",p.username||"",4)});
  for(const v of get(2)) {
    const isSeries=v.content_type==="series"||v.content_type==="episode";
    add({id:v.video_id,kind:"Movies & Series",title:compact(v.title,130),description:compact(v.description,190),
      href:"/deepwatch?video="+encodeURIComponent(v.video_id),image:publicLink(v.cover_url)||publicLink(v.thumbnail_url)||"https://i.ytimg.com/vi/"+encodeURIComponent(v.video_id)+"/hqdefault.jpg",
      byline:v.channel_title||"DeepWatch",badge:isSeries?"SERIES":String(v.content_type||"VIDEO").toUpperCase(),
      media:"video",score:relevance(query,v.title||"",v.description||"",5),timestamp:v.published_at});
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
    href:"/elm-tent/quran?verse="+encodeURIComponent(verse.key),byline:verse.source,badge:"VERSE · ENGLISH",score:relevance(query,verse.text,verse.key,9),media:"text"});
  for(const chapter of get(10))add({id:"surah:"+chapter.id,kind:"Qur’an",title:"Surah "+chapter.title,description:chapter.translated+" · "+chapter.verses+" ayahs",
    href:"/elm-tent/quran?chapter="+encodeURIComponent(chapter.id),byline:"The Holy Qur’an",badge:"SURAH",score:relevance(query,chapter.title,chapter.translated,15),media:"text"});
  for(const guide of knowledgeResults(query))add(guide);
  const unique=new Set<string>();
  for(const category of DISCOVER_CATEGORIES) {
    groups[category]=groups[category].filter(item=>{
      const key=item.href+"|"+item.kind;
      if(unique.has(key))return false;unique.add(key);return true;
    }).sort((a,b)=>b.score-a.score).slice(0,22);
  }
  const best=DISCOVER_CATEGORIES.flatMap(kind=>groups[kind]).sort((a,b)=>b.score-a.score).slice(0,12);
  const suggestions=[...new Set([...best.slice(0,6).map(item=>item.title).filter(title=>title.length<44),...KNOWLEDGE.map(x=>x.title)])].slice(0,9);
  const partial=tasks.some((t,i)=> t.status==="rejected" || (i<9&&t.status==="fulfilled"&&Boolean((t.value as any)?.error)));
  return {query,groups,best,total:DISCOVER_CATEGORIES.reduce((sum,kind)=>sum+groups[kind].length,0),partial,suggestions};
}
