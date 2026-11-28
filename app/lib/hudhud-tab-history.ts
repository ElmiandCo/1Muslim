import type {HudHudLine} from "../hudhud/HudHudFocusStage";

export type HudHudTabSession={id:string;title:string;lines:HudHudLine[]};
export type HudHudTabHistory={sessions:HudHudTabSession[];activeId:string};
const KEY="1muslim:hudhud:tab-chat:v1";
const LIFE_MS=4*60*60*1000;
const MAX_BYTES=180_000;

export function isSafeHudHudWebsiteUrl(candidate:unknown):candidate is string{
 if(typeof candidate!=="string"||candidate.length>2048)return false;
 try{
  const url=new URL(candidate);
  return url.protocol==="https:"&&!url.username&&!url.password
   &&url.hostname!=="localhost"&&!url.hostname.endsWith(".localhost")
   &&!url.hostname.endsWith(".local");
 }catch{return false}
}

/** Follow-up only: never navigate to a guessed or model-generated website. */
export function isHudHudOpenSelectedWebsiteCommand(input:string):boolean{
 return /^(?:please\s+)?(?:(?:open|visit|navigate\s+to|go\s+to|take\s+me\s+to)\s+(?:(?:that|this|the|first|top|selected)\s+)?(?:website|site|webpage|web\s+page|link|result)|(?:open|visit|go\s+there))\s*[.!?]*$/i.test(input.trim());
}

function validLine(value:unknown):HudHudLine|null{
 if(!value||typeof value!=="object")return null;
 const source=value as Record<string,unknown>;
 const role=source.role;
 if(role!=="assistant"&&role!=="user")return null;
 if(typeof source.content!=="string"||source.content.length>3000)return null;
 const line:HudHudLine={role,content:source.content};
 if(role!=="assistant")return line;
 const presentation=source.presentation as Record<string,unknown>|null;
 if(presentation?.kind==="verse"&&typeof presentation.verseKey==="string"
    &&/^\d{1,3}:\d{1,3}$/.test(presentation.verseKey)){
  line.presentation={kind:"verse",verseKey:presentation.verseKey};
  if(Array.isArray(source.verses)){
   const v=source.verses[0] as Record<string,unknown>|undefined;
   if(v&&typeof v.key==="string"&&v.key===presentation.verseKey
      &&typeof v.arabic==="string"&&v.arabic.length<2500
      &&typeof v.english==="string"&&v.english.length<3500
      &&typeof v.translation==="string"&&v.translation.length<200){
    line.verses=[{key:v.key,arabic:v.arabic,english:v.english,translation:v.translation,
      ...(typeof v.source==="string"?{source:v.source.slice(0,180)}:{})}];
   }
  }
 }else if(presentation?.kind==="image"&&typeof presentation.query==="string"&&presentation.query.length<=110){
  line.presentation={kind:"image",query:presentation.query};
  if(Array.isArray(source.images)){
   const img=source.images[0] as Record<string,unknown>|undefined;
   if(img&&isSafeHudHudWebsiteUrl(img.imageUrl)&&isSafeHudHudWebsiteUrl(img.thumbnailUrl)
      &&isSafeHudHudWebsiteUrl(img.pageUrl)&&typeof img.title==="string"&&typeof img.source==="string"){
    line.images=[{imageUrl:img.imageUrl,thumbnailUrl:img.thumbnailUrl,pageUrl:img.pageUrl,
      title:img.title.slice(0,160),source:img.source.slice(0,120)}];
   }
  }
 }else if(presentation?.kind==="results")line.presentation={kind:"results"};
 else if(presentation?.kind==="text")line.presentation={kind:"text"};
 const web=source.webResult as Record<string,unknown>|undefined;
 if(web&&isSafeHudHudWebsiteUrl(web.url)&&typeof web.title==="string"
   &&web.title.length<=220&&typeof web.source==="string"&&web.source.length<=160){
  line.webResult={url:web.url,title:web.title,source:web.source,
    description:typeof web.description==="string"?web.description.slice(0,450):"",
    thumbnailUrl:isSafeHudHudWebsiteUrl(web.thumbnailUrl)?web.thumbnailUrl:undefined};
 }
 if(Array.isArray(source.matches)){
  line.matches=source.matches.slice(0,5).flatMap((raw:unknown)=>{
   if(!raw||typeof raw!=="object")return [];
   const m=raw as Record<string,unknown>;
   if(typeof m.id!=="string"||typeof m.kind!=="string"||typeof m.title!=="string"||typeof m.href!=="string")return [];
   if(!((m.href.startsWith("/")&&!m.href.startsWith("//")&&!m.href.includes("\\"))
       ||isSafeHudHudWebsiteUrl(m.href)))return [];
   return [{id:m.id.slice(0,120),kind:m.kind.slice(0,70),title:m.title.slice(0,220),
     href:m.href,description:typeof m.description==="string"?m.description.slice(0,260):undefined,
     image:isSafeHudHudWebsiteUrl(m.image)?m.image:undefined}];
  });
 }
 return line;
}
function normalizeSessions(value:unknown):HudHudTabSession[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,15).flatMap((raw:unknown)=>{
  if(!raw||typeof raw!=="object")return [];
  const s=raw as Record<string,unknown>;
  if(typeof s.id!=="string"||!/^[a-zA-Z0-9-]{1,64}$/.test(s.id)
   ||typeof s.title!=="string"||!Array.isArray(s.lines))return [];
  const lines=s.lines.slice(-40).map(validLine).filter((line):line is HudHudLine=>line!==null);
  return [{id:s.id,title:s.title.slice(0,100),lines}];
 });
}

/** SessionStorage stays in this browser tab; never mix guest and account chats. */
export function readHudHudTabHistory(storage:Pick<Storage,"getItem"|"removeItem">,owner:string,now=Date.now()):HudHudTabHistory|null{
 try{
  const raw=storage.getItem(KEY);
  if(!raw)return null;
  if(raw.length>MAX_BYTES){storage.removeItem(KEY);return null}
  const parsed=JSON.parse(raw) as Record<string,unknown>;
  if(parsed.version!==1||parsed.owner!==owner||typeof parsed.savedAt!=="number"
    ||parsed.savedAt>now+60_000||now-parsed.savedAt>LIFE_MS){
   storage.removeItem(KEY);return null;
  }
  const sessions=normalizeSessions(parsed.sessions);
  if(!sessions.length)return null;
  const activeId=typeof parsed.activeId==="string"&&sessions.some(s=>s.id===parsed.activeId)
    ?parsed.activeId:sessions[0].id;
  return {sessions,activeId};
 }catch{return null}
}

export function writeHudHudTabHistory(storage:Pick<Storage,"setItem">,owner:string,history:HudHudTabHistory,now=Date.now()):boolean{
 if(!owner||owner.length>100)return false;
 const sessions=normalizeSessions(history.sessions);
 if(!sessions.length)return false;
 let record=JSON.stringify({version:1,owner,savedAt:now,activeId:history.activeId,sessions});
 while(record.length>MAX_BYTES&&sessions.length>1){
  sessions.pop();
  record=JSON.stringify({version:1,owner,savedAt:now,activeId:history.activeId,sessions});
 }
 if(record.length>MAX_BYTES)return false;
 try{storage.setItem(KEY,record);return true}catch{return false}
}
export function clearHudHudTabHistory(storage:Pick<Storage,"removeItem">):void{
 try{storage.removeItem(KEY)}catch{}
}
