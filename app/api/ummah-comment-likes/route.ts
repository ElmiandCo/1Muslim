import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers={"Cache-Control":"private, no-store"};

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)
  return NextResponse.json({error:"Invalid request origin"},{status:403,headers});

 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to like comments"},{status:401,headers});
 const {commentId}=await request.json().catch(()=>({}));
 if(typeof commentId!=="string"||!uuid.test(commentId))
  return NextResponse.json({error:"Invalid comment"},{status:400,headers});

 const {data:comment,error:commentError}=await db.from("ummah_post_comments")
  .select("id").eq("id",commentId).maybeSingle();
 if(commentError)return NextResponse.json({error:"Comments unavailable"},{status:503,headers});
 if(!comment)return NextResponse.json({error:"Comment not found"},{status:404,headers});

 const {data:existing,error:readError}=await db.from("ummah_comment_likes")
  .select("comment_id").eq("comment_id",commentId).eq("user_id",user.id).maybeSingle();
 if(readError)return NextResponse.json({error:"Likes unavailable"},{status:503,headers});
 const {error}=existing
  ?await db.from("ummah_comment_likes").delete().eq("comment_id",commentId).eq("user_id",user.id)
  :await db.from("ummah_comment_likes").insert({comment_id:commentId,user_id:user.id});
 if(error)return NextResponse.json({error:"Unable to update like"},{status:503,headers});
 return NextResponse.json({liked:!existing},{headers});
}
