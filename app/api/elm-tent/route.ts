import {NextResponse} from "next/server";
import {createClient as serverClient} from "../../../utils/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {questions,lessonNames} from "../../../lib/elmTentCurriculum";
export const runtime="nodejs";
export async function GET(){
 const db=await serverClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({signedIn:false,completed:0,certified:false,lessons:lessonNames});
 const {data,error}=await db.from("elm_tent_progress").select("lesson").eq("user_id",user.id);
 if(error)return NextResponse.json({error:"Curriculum database not configured"},{status:503});
 const completed=data?.length??0;
 return NextResponse.json({signedIn:true,completed,certified:completed===12,lessons:lessonNames});
}
export async function POST(request:Request){
 const db=await serverClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to earn certification"},{status:401});
 const body=await request.json().catch(()=>({}));
 const lesson=Number(body.lesson),choice=body.choice;
 if(!Number.isInteger(lesson)||typeof choice!=="string")return NextResponse.json({error:"Invalid answer"},{status:400});
 const question=questions.find(q=>q.lesson===lesson);
 if(!question)return NextResponse.json({error:"Unknown lesson"},{status:400});
 const {data:progress,error:progressError}=await db.from("elm_tent_progress").select("lesson").eq("user_id",user.id);
 if(progressError)return NextResponse.json({error:"Curriculum database not configured"},{status:503});
 const completed=progress?.length??0;
 if(lesson!==completed+1)return NextResponse.json({error:"Complete lessons in order"},{status:409});
 const correct=choice===question.choices[question.answer];
 if(!correct)return NextResponse.json({correct:false,explanation:question.explanation,source:question.source,xp:0});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Reward service not configured"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 // The privileged RPC uses auth.uid(); service-role sessions have no end-user auth context.
 // Store progression server-side only after verified answer, with unique constraint and order check above.
 const {error:insertError}=await admin.from("elm_tent_progress").insert({user_id:user.id,lesson});
 if(insertError)return NextResponse.json({error:"Could not save progress; please retry"},{status:409});
 return NextResponse.json({correct:true,explanation:question.explanation,source:question.source,xp:lesson*10,completed:lesson,certified:lesson===12});
}
