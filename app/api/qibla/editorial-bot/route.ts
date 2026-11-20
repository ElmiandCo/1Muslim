import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export const maxDuration=120;
type Kind="article"|"newsletter";
const lanes:Record<Kind,string[]>={
 article:["Muslim youth and belonging","Faith and identity","Muslim arts and culture","Generational debates","Science and history","Relationships and community","Everyday Muslim life","Technology and ethics"],
 newsletter:["World affairs and geopolitics","Muslim communities and policy","Education and technology","Economics and Islamic finance","Humanitarian developments","Public health and science","International diplomacy","Civic rights and law"]
};
const normalize=(value:string)=>value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const words=(value:string)=>new Set(normalize(value).split(" ").filter(w=>w.length>3&&!["muslim","islamic","world","today","report","latest","newsletter","magazine"].includes(w)));
function tooSimilar(title:string,existing:string[]){const key=normalize(title);const a=words(title);return existing.some(old=>{const b=words(old);const overlap=[...a].filter(w=>b.has(w)).length;return key===normalize(old)||(a.size>=3&&b.size>=3&&overlap/Math.min(a.size,b.size)>=0.72)})}
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})}
async function run(req:NextRequest){
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
 const scheduled=!!process.env.CRON_SECRET&&token===process.env.CRON_SECRET;
 let userId:string|null=null;
 if(!scheduled){
  const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
  if(user?.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return json({error:"Super Admin only"},403);
  userId=user.id;
 }
 const key=process.env.OPENAI_API_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!url||!service)return json({error:"Configure OPENAI_API_KEY and Supabase service credentials"},503);
 const db=adminClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 if(!userId){
  const {data:admins,error}=await db.from("admin_users").select("user_id").limit(100);
  if(error)return json({error:"Admin lookup unavailable"},503);
  const {data:{users}}=await db.auth.admin.listUsers({perPage:1000});
  const owner=users.find(u=>u.email?.toLowerCase()==="hudhudbyelmi@gmail.com"&&admins?.some(a=>a.user_id===u.id));
  if(!owner)return json({error:"Editorial author account unavailable"},503);
  userId=owner.id;
 }
 const kindParam=req.nextUrl.searchParams.get("kind");
 const kind:Kind=kindParam==="newsletter"?"newsletter":"article";
 const subject=(scheduled?"":String((await req.clone().json().catch(()=>({}))).subject||"")).trim().slice(0,240);
 const generateImages=!scheduled && Boolean((await req.clone().json().catch(()=>({}))).generateImages);
 const {data:recent,error:historyError}=await db.from("qibla_submissions").select("title,kind").order("created_at",{ascending:false}).limit(500);
 if(historyError)return json({error:"Cannot check duplicate stories"},503);
 const previous=(recent||[]).map(x=>x.title).filter(Boolean);
 const sameKind=(recent||[]).filter(x=>x.kind===kind).map(x=>x.title);
 const laneOptions=lanes[kind];
 const lane=laneOptions[Math.floor(Date.now()/3600000+sameKind.length)%laneOptions.length];
 const instruction=`You are 1Muslim Editor for Qibla ${kind==="article"?"Magazine (youth, faith, identity, culture, thoughtful debates)":"Newsletter (serious, international affairs, politics, important developments)"}. Discover a genuinely NEW, verifiable and engaging story using web search; do not recycle a generic technology-in-education essay. ${subject?`The editor explicitly requests this subject or keywords: "${subject}". Focus on this subject, not the rotating beat; find an original and factual angle.`:`Preferred beat: ${lane}, but choose another compelling story if better.`} Research with at least three trustworthy independent primary or reputable sources. Return JSON with title,subtitle,body,sources [{title,url}]. Do not fabricate sources, quotes, Quran verses, hadith or religious rulings. Never claim knowledge of the unseen. Magazine: 900-1500 words, accessible, vivid, thought-provoking, age-appropriate. Newsletter: 400-700 words, clear factual reporting with dates and balanced context. Cite dates for time-sensitive claims. Avoid topics or substantially similar angles to these previously submitted stories: ${JSON.stringify(sameKind.slice(0,65))}. Only respond with a JSON object, no markdown.`;
 let draft:{title?:string;subtitle?:string;body?:string;sources?:{title:string;url:string}[]}={};
 for(let attempt=0;attempt<3;attempt++){
  const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.QIBLA_AI_MODEL||"gpt-4.1",tools:[{type:"web_search_preview"}],input:instruction+(attempt?" IMPORTANT: Prior candidate was too similar to an existing publication. Pick a completely different event, person or subject; avoid all prior headlines.":""),max_output_tokens:5000}),signal:AbortSignal.timeout(100000)}).catch(()=>null);
  if(!ai?.ok)return json({error:"AI research unavailable",details:ai?.status||"timeout"},502);
  const payload=await ai.json();
  const output=(payload.output||[]).flatMap((o:{content?:{type:string;text?:string}[]})=>o.content||[]).filter((x:{type:string})=>x.type==="output_text").map((x:{text?:string})=>x.text||"").join("");
  try{draft=JSON.parse(output.replace(/^```json\s*|\s*```$/g,""))}catch{return json({error:"AI response requires editorial regeneration"},502)}
  if(draft.title&&!tooSimilar(draft.title,previous))break;
  if(attempt===2)return json({error:"Could not find a sufficiently original topic after three attempts. No duplicate submitted."},409);
 }
 const sources=(draft.sources||[]).filter(s=>typeof s.url==="string"&&/^https:\/\//.test(s.url)&&typeof s.title==="string");
 if(!draft.title||!draft.body||draft.body.length<900||sources.length<3)return json({error:"Insufficient article content or research references; nothing submitted"},422);
 let coverUrl="";let midUrl="";const imageWarnings:string[]=[];
 if(generateImages){
  for(const placement of ["cover","mid"] as const){
   try{
    const prompt=`Create a professional, respectful, editorial ${placement==="cover"?"cover":"mid-article supporting"} image for a 1Muslim Qibla ${kind==="article"?"Magazine":"Newsletter"} story titled "${draft.title}". ${placement==="cover"?"Wide cinematic hero composition.":"Different scene from the cover; support a secondary idea from the story."} ${kind==="article"?"Magazine visual identity: muted plum, warm light, sophisticated magazine photography.":"Newsletter visual identity: deep blue, documentary news photography."} No invented real people, fabricated evidence, misleading documentary photographs, text or logos. Reserve bottom-right 15% clean for a 1Muslim logo watermark that will be added separately.`;
    const imageResponse=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-image-1",prompt,size:"1536x1024",quality:"medium"}),signal:AbortSignal.timeout(110000)});
    if(!imageResponse.ok)throw Error("Image generation unavailable ("+imageResponse.status+")");
    const imageData=await imageResponse.json();const b64=imageData.data?.[0]?.b64_json;
    if(!b64)throw Error("Image response contained no image");
    const bytes=Uint8Array.from(atob(b64),(c:string)=>c.charCodeAt(0));
    const filePath=`${userId}/ai-${Date.now()}-${placement}-${crypto.randomUUID()}.png`;
    const {error:uploadError}=await db.storage.from("qibla-editorial-media").upload(filePath,bytes,{contentType:"image/png",cacheControl:"3600",upsert:false});
    if(uploadError)throw uploadError;
    const {data:publicData}=db.storage.from("qibla-editorial-media").getPublicUrl(filePath);
    if(placement==="cover")coverUrl=publicData.publicUrl;else midUrl=publicData.publicUrl;
   }catch(error){imageWarnings.push(`${placement} image: ${error instanceof Error?error.message:"generation failed"}`)}
  }
 }
 const paragraphs=draft.body.split(/\n\s*\n/);if(midUrl){const middle=Math.max(1,Math.floor(paragraphs.length/2));paragraphs.splice(middle,0,`![AI-generated editorial illustration for ${draft.title}](${midUrl})\n\n1Muslim Qibla · AI-generated illustration`)}
 const body="Written by 1Muslim Editor\n\n"+paragraphs.join("\n\n")+"\n\nSources for editorial verification:\n"+sources.map(s=>"- "+s.title+": "+s.url).join("\n");
 const {data,error}=await db.from("qibla_submissions").insert({author_id:userId,title:draft.title.slice(0,200),kind,subtitle:(draft.subtitle||"").slice(0,500),body,cover_url:coverUrl,status:"submitted",submitted_at:new Date().toISOString(),review_note:"AI-generated editorial draft. Verify every source, religious claim and quotation. Approval required before publication."+(midUrl?" Mid-body supporting image: "+midUrl:"")+(imageWarnings.length?" Image warnings: "+imageWarnings.join("; "):"")}).select("id,title,kind,status").single();
 if(error)return json({error:"Could not queue editorial draft",detail:error.message},500);
 return json({ok:true,submission:data,images:{cover:coverUrl,midBody:midUrl},imageWarnings,approvalUrl:"/qibla/command",note:"Pending human editorial approval; no public publishing."});
}
export async function POST(req:NextRequest){return run(req)}
export async function GET(req:NextRequest){return run(req)}
