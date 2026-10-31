import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(request:Request){
 const q=(new URL(request.url).searchParams.get("q")||"").trim().slice(0,90);
 if(q.length<2)return NextResponse.json({results:[]});
 const db=await createClient();
 const safe=q.replace(/[%,()]/g," ").trim();
 if(!safe)return NextResponse.json({results:[]});
 const pattern="%"+safe+"%";
 const [posts,lessons,lives,people,quran,messages]=await Promise.all([
 db.from("ummah_feed_posts").select("id,body,created_at").ilike("body",pattern).order("created_at",{ascending:false}).limit(8),
 db.from("lessons").select("id,slug,title,description").eq("active",true).or("title.ilike."+pattern+",description.ilike."+pattern).limit(8),
 db.from("live_streams").select("id,title,category,status,viewer_count,created_at").eq("visibility","public").or("title.ilike."+pattern+",category.ilike."+pattern).order("created_at",{ascending:false}).limit(8),
 db.from("profiles").select("id,display_name,username").or("display_name.ilike."+pattern+",username.ilike."+pattern).limit(12),
 (async()=>{try{const response=await fetch("https://api.quran.com/api/v4/search?"+new URLSearchParams({q,language:"en",size:"10",page:"1"}),{signal:AbortSignal.timeout(4500),next:{revalidate:1800}});if(!response.ok)return {items:[],error:true};const data=await response.json();return {items:(Array.isArray(data?.search?.results)?data.search.results:[]) as {verse_key?:string;text?:string;highlighted?:string}[],error:false};}catch{return {items:[],error:true}}})()
 ,(async()=>{const {data:{user}}=await db.auth.getUser();if(!user)return {data:[] as {id:string;conversation_id:string;body:string}[]};const {data:parts}=await db.from("dm_participants").select("conversation_id").eq("user_id",user.id).limit(150);const ids=(parts??[]).map(x=>x.conversation_id);if(!ids.length)return {data:[] as {id:string;conversation_id:string;body:string}[]};return db.from("dm_messages").select("id,conversation_id,body").in("conversation_id",ids).ilike("body",pattern).is("deleted_at",null).limit(8)})()
 ]);
 const results=[
 ...(people.data||[]).map(x=>({id:String(x.id),kind:"Person",title:x.display_name||x.username||"1Muslim member",subtitle:x.username?"@"+x.username:"1Muslim member",href:"/messages?to="+encodeURIComponent(x.id)})),
 ...(messages.data||[]).map(x=>({id:String(x.id),kind:"Message",title:x.body?.slice(0,140)||"Message",subtitle:"Matching conversation",href:"/messages?conversation="+encodeURIComponent(x.conversation_id)+"&message="+encodeURIComponent(x.id)})),
 ...quran.items.map((x:{verse_key?:string;text?:string;highlighted?:string})=>({id:String(x.verse_key||""),kind:"Qur’an",title:String(x.text||x.highlighted||"Qur’an verse").replace(/<[^>]*>/g,"").slice(0,200),subtitle:"Surah : Ayah "+String(x.verse_key||""),href:"/elm-tent/quran?verse="+encodeURIComponent(x.verse_key||"")})).filter(x=>x.id),
 ...(lives.data||[]).map(x=>({id:String(x.id),kind:"Live",title:x.title||"Live stream",subtitle:(x.status==="live"?"🔴 LIVE · ":"")+String(x.category||"Live"),href:"/streaming/watch/"+encodeURIComponent(x.id)})),
 ...(lessons.data||[]).map(x=>({id:String(x.id),kind:"Lesson",title:x.title||"Lesson",subtitle:x.description||"Learn",href:"/elm-tent/lessons"})),
 ...(posts.data||[]).map(x=>({id:String(x.id),kind:"Post",title:x.body?.slice(0,115)||"Community post",subtitle:"Ummah community",href:"/community"}))
 ];
 return NextResponse.json({results,partialErrors:[posts.error&&"posts",lessons.error&&"lessons",lives.error&&"lives",quran.error&&"quran",people.error&&"people"].filter(Boolean)},{headers:{"Cache-Control":"no-store"}});
}