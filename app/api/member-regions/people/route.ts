import {NextRequest,NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as serviceClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
const clean=(name:string)=>name.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const canonical=(name:string)=>{
 const value=clean(name);
 const aliases:Record<string,string>={
  "us":"united states","usa":"united states","america":"united states","united states of america":"united states",
  "uk":"united kingdom","u k":"united kingdom","great britain":"united kingdom",
  "turkey":"turkiye","turkiye":"turkiye","ksa":"saudi arabia","uae":"united arab emirates"
 };
 return aliases[value]||value;
};
type Consent={user_id:string;consented_at:string};
type Profile={id:string;display_name:string|null;username:string|null;hide_1muslim_id?:boolean|null;country:string|null;avatar_url:string|null;avatar_gender:string|null;avatar_config:Record<string,unknown>|null};

/** Country-only public member discovery, restricted to explicit map participants.
 * Never returns GPS, city, state, prayer location, masjid, email or private consent details.
 * "Recently on the map" means latest voluntary region share, not live presence.
 */
export async function GET(request:NextRequest){
 const country=request.nextUrl.searchParams.get("country")?.trim()||"";
 if(!country||country.length>80)return NextResponse.json({error:"Choose a country"},{status:400,headers});
 const auth=await createClient();
 const {data:{user}}=await auth.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to discover members"},{status:401,headers});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Member discovery unavailable"},{status:503,headers});
 const db=serviceClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const wanted=canonical(country);
 const found:Array<{id:string;name:string;username:string|null;avatar:string;joinedAt:string}>=[];
 try{
  // Latest explicit opt-ins first, with a hard ceiling to prevent unbounded work.
  for(let offset=0;offset<5000&&found.length<8;offset+=200){
   const {data:consents,error}=await db.from("member_region_preferences")
    .select("user_id,consented_at").eq("directory_visible",true).not("consented_at","is",null)
    .order("consented_at",{ascending:false}).range(offset,offset+199);
   if(error)throw error;
   const rows=(consents||[]) as Consent[];
   if(!rows.length)break;
   const ids=rows.map(row=>row.user_id).filter(Boolean);
   if(ids.length){
    const {data:profiles,error:profileError}=await db.from("profiles")
     .select("id,display_name,username,hide_1muslim_id,country,avatar_url,avatar_gender,avatar_config").in("id",ids);
    if(profileError)throw profileError;
    const byId=new Map(((profiles||[]) as Profile[]).map(p=>[p.id,p]));
    for(const row of rows){
     const profile=byId.get(row.user_id);
     if(!profile||canonical(profile.country||"")!==wanted)continue;
     const chosenAvatar=profile.avatar_config?.selectedAvatarUrl;
     const avatar=typeof chosenAvatar==="string"&&chosenAvatar.startsWith("/")||typeof chosenAvatar==="string"&&chosenAvatar.startsWith("https://")
      ? chosenAvatar as string : profile.avatar_url|| (profile.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");
     found.push({
      id:profile.id,
      name:(profile.display_name||(!profile.hide_1muslim_id?profile.username:null)||"Muslim member").slice(0,80),
      username:profile.hide_1muslim_id?null:profile.username,
      avatar,
      joinedAt:row.consented_at
     });
     if(found.length>=8)break;
    }
   }
   if(rows.length<200)break;
  }
  return NextResponse.json({country,members:found},{headers});
 }catch(error){
  console.error("Map country discovery unavailable",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"Unable to load members at the moment"},{status:503,headers});
 }
}
