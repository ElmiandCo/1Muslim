import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export const maxDuration=120;
type Kind="article"|"newsletter";
const topics:{kind:Kind;title:string;angle:string}[]=[
 {kind:"article",title:"The Most Famous Muslim on Earth vs. the Most Famous Muslim in Jannah",angle:"Reflect on fame versus sincerity. Do not assert who is most famous in Jannah or anyone's unseen rank."},
 {kind:"article",title:"The Muslim Scientist Who Changed How We See the World",angle:"Choose a documented historical figure and verify dates, works, and contributions."},
 {kind:"article",title:"When a Quiet Act Becomes a Great Legacy",angle:"Explore verified Quranic and authentic hadith teachings on sincerity, avoiding fabricated anecdotes."},
 {kind:"newsletter",title:"Muslim Education and Technology: A Research Briefing",angle:"Investigate documented developments and implications for Muslim educators."},
 {kind:"newsletter",title:"Islamic Finance: What the Evidence Shows",angle:"Report sourced trends and distinguish regulatory facts from commentary."},
 {kind:"newsletter",title:"The Muslim World This Week: Verified Developments",angle:"Select current independently verifiable developments with dates and reliable primary sources."}
];
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})}
async function run(req:NextRequest){
 const token=req.headers.get("authorization")?.replace(/^Bearer\\s+/i,"");
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
 const candidates=topics.filter(t=>t.kind===kind);
 const {data:recent,error:historyError}=await db.from("qibla_submissions").select("title").order("created_at",{ascending:false}).limit(100);
 if(historyError)return json({error:"Cannot check duplicate stories"},503);
 const taken=new Set((recent||[]).map(x=>x.title.toLowerCase().trim()));
 const pick=candidates.find(t=>!taken.has(t.title.toLowerCase()))||null;
 if(!pick)return json({error:"Topic queue exhausted; add new researched topics before generating"},409);
 const instruction=`You are 1Muslim Editor, drafting for Qibla ${kind==="article"?"Magazine":"Newsletter"}. Research this topic with web search. Return a JSON object with keys title,subtitle,body,sources (array of objects with title,url). Cite at least 3 trustworthy independent sources with URLs and dates where applicable. Do not invent Quran verses, hadith, scholarly rulings, quotes, historical claims, or source URLs. If a claim cannot be verified, exclude it. No fatwas. Use engaging but factual prose. Magazine: narrative and cinematic headline, 900-1500 words. Newsletter: clear searchable headline, 400-700 words, dated context. Write in plain text with section headings. Never claim knowledge of the unseen. Topic: ${pick.title}. Angle: ${pick.angle}.`;
 const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.QIBLA_AI_MODEL||"gpt-4.1",tools:[{type:"web_search_preview"}],input:instruction+" Respond ONLY with valid JSON; do not wrap in markdown.",max_output_tokens:5000}),signal:AbortSignal.timeout(100000)}).catch(()=>null);
 if(!ai?.ok)return json({error:"AI research unavailable",details:ai?.status||"timeout"},502);
 const payload=await ai.json();
 const output=(payload.output||[]).flatMap((o:{content?:{type:string;text?:string}[]})=>o.content||[]).filter((x:{type:string})=>x.type==="output_text").map((x:{text?:string})=>x.text||"").join("");
 let draft:{title?:string;subtitle?:string;body?:string;sources?:{title:string;url:string}[]};
 try{draft=JSON.parse(output.replace(/^```json\s*|\s*```$/g,""))}catch{return json({error:"AI response requires editorial regeneration"},502)}
 const sources=(draft.sources||[]).filter(s=>typeof s.url==="string"&&/^https:\/\//.test(s.url)&&typeof s.title==="string");
 if(!draft.title||!draft.body||draft.body.length<900||sources.length<3)return json({error:"Insufficient article content or research references; nothing submitted"},422);
 const body="Written by 1Muslim Editor\n\n"+draft.body+"\n\nSources for editorial verification:\n"+sources.map(s=>"- "+s.title+": "+s.url).join("\n");
 const {data,error}=await db.from("qibla_submissions").insert({author_id:userId,title:draft.title.slice(0,200),kind,subtitle:(draft.subtitle||"").slice(0,500),body,cover_url:"",status:"submitted",submitted_at:new Date().toISOString(),review_note:"AI-generated editorial draft. Verify every source, religious claim and quotation. Approval required before publication."}).select("id,title,kind,status").single();
 if(error)return json({error:"Could not queue editorial draft",detail:error.message},500);
 return json({ok:true,submission:data,approvalUrl:"/qibla/command",note:"Pending human editorial approval; no public publishing."});
}
export async function POST(req:NextRequest){return run(req)}
export async function GET(req:NextRequest){return run(req)}
