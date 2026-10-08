import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
const lessons=new Set(["bismillah","salam","alhamdulillah","tawhid"]);
export async function GET(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({signedIn:false,completed:[],xp:0});
 const {data,error}=await db.from("discovery_rewards").select("lesson_id").eq("user_id",user.id);
 if(error)return NextResponse.json({error:"Discovery rewards are not configured yet."},{status:503});
 const completed=(data??[]).map(x=>x.lesson_id);
 return NextResponse.json({signedIn:true,completed,xp:completed.length*25,document:completed.length>=2,avatar:completed.length>=4});
}
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to save rewards."},{status:401});
 const body=await request.json().catch(()=>({}));
 if(typeof body.lesson!=="string"||!lessons.has(body.lesson))return NextResponse.json({error:"Invalid lesson."},{status:400});
 const {data,error}=await db.rpc("claim_discovery_reward",{p_lesson:body.lesson});
 if(error)return NextResponse.json({error:"Rewards are not ready yet."},{status:503});
 return NextResponse.json(data?.[0]??{awarded:false});
}
