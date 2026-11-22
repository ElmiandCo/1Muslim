import {NextResponse} from "next/server";
import {createClient as privilegedClient} from "@supabase/supabase-js";
import {createClient as sessionClient} from "../../../utils/supabase/server";

export const dynamic="force-dynamic";
const idPattern=/^[0-9a-f-]{36}$/i;
type Score={likes:number;comments:number;shares:number;saves:number;score:number};
// Returns measured community engagement, never invented or randomized rankings.
// The requested ids must come from the public feed; we verify those ids server-side.
export async function POST(request:Request){
 const input=await request.json().catch(()=>({}));
 if(!Array.isArray(input?.ids)||input.ids.length>100||input.ids.some((id:unknown)=>!idPattern.test(String(id)))){
  return NextResponse.json({error:"Invalid posts"},{status:400});
 }
 const ids=[...new Set(input.ids as string[])];
 if(ids.length===0)return NextResponse.json({scores:{}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Popularity statistics unavailable"},{status:503});
 const db=privilegedClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  // Do not expose privileged credentials or user identifiers to the browser.
  const {data:published,error:publishedError}=await (await sessionClient()).from("ummah_feed_posts").select("id").in("id",ids);
  if(publishedError)throw publishedError;
  const allowed=(published||[]).map(p=>p.id as string);
  const scores:Record<string,Score>={};
  for(const id of allowed)scores[id]={likes:0,comments:0,shares:0,saves:0,score:0};
  if(allowed.length===0)return NextResponse.json({scores});
  const countRows=async (table:"ummah_post_reactions"|"ummah_post_comments"|"ummah_post_shares",
                         includeKind:boolean):Promise<Array<{post_id:string;kind?:string}>>=>{
   const all:Array<{post_id:string;kind?:string}>=[];
   // PostgREST pages at 1,000 rows by default. Paginate so high-engagement posts
   // are not silently counted as only their first thousand reactions.
   for(let offset=0;offset<30000;offset+=1000){
    const {data,error}=await db.from(table).select(includeKind?"post_id,kind":"post_id")
     .in("post_id",allowed).range(offset,offset+999);
    if(error)throw error;
    const rows=(data||[]) as unknown as Array<{post_id:string;kind?:string}>;
    all.push(...rows);
    if(rows.length<1000)break;
   }
   return all;
  };
  const [reactions,comments,shares]=await Promise.all([
   countRows("ummah_post_reactions",true),
   countRows("ummah_post_comments",false),
   countRows("ummah_post_shares",false)
  ]);
  for(const row of reactions){const s=scores[row.post_id];if(!s)continue;if(row.kind==="like")s.likes++;if(row.kind==="save")s.saves++}
  for(const row of comments)if(scores[row.post_id])scores[row.post_id].comments++;
  for(const row of shares)if(scores[row.post_id])scores[row.post_id].shares++;
  for(const s of Object.values(scores))s.score=s.likes*3+s.comments*4+s.shares*5+s.saves*2;
  return NextResponse.json({scores},{headers:{"cache-control":"private, no-store"}});
 }catch{
  return NextResponse.json({error:"Popularity statistics temporarily unavailable"},{status:503});
 }
}
