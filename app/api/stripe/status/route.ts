import {NextResponse} from "next/server";
import {authenticatedUser} from "../../../../lib/stripe-unlocked";
import {createClient} from "../../../../utils/supabase/server";
export async function GET(){
 const user=await authenticatedUser();if(!user)return NextResponse.json({unlocked:false},{status:401});
 const db=await createClient();const {data,error}=await db.rpc("has_1muslim_unlocked");
 if(error)return NextResponse.json({error:"Status unavailable"},{status:500});
 return NextResponse.json({unlocked:data===true},{headers:{"Cache-Control":"no-store"}});
}
