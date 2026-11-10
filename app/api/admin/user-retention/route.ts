import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
import {createClient as adminClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Account={id:string;created_at:string;last_sign_in_at?:string|null;email?:string|null};
export async function GET(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user||user.email?.toLowerCase()!=="hudhudbyelmi@gmail.com")return NextResponse.json({error:"Forbidden"},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Unavailable"},{status:503});
 const db=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const accounts:Account[]=[];let capped=false;
 for(let page=1;page<=20;page++){const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)return NextResponse.json({error:"Account directory unavailable"},{status:503});accounts.push(...data.users);if(data.users.length<1000)break;if(page===20)capped=true}
 const now=new Date(),today=now.toISOString().slice(0,10),since=new Date(Date.now()-60*86400000).toISOString().slice(0,10);
 const activity=new Map<string,Set<string>>();let activityCapped=false;
 for(let offset=0;offset<200000;offset+=1000){
  const {data,error}=await db.from("user_activity_days").select("user_id,activity_date").gte("activity_date",since).order("activity_date",{ascending:true}).range(offset,offset+999);
  if(error)return NextResponse.json({error:"Retention activity table unavailable. Apply migration 20261110090000_user_activity_days.sql."},{status:503});
  for(const row of data||[]){const set=activity.get(row.user_id)||new Set<string>();set.add(row.activity_date);activity.set(row.user_id,set)}
  if(!data||data.length<1000)break;if(offset+1000>=200000)activityCapped=true;
 }
 const datePlus=(day:string,offset:number)=>{const d=new Date(day+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)};
 const eligible=(a:Account,days:number)=>datePlus(a.created_at.slice(0,10),days)<=today;
 const cohort=(days:number)=>{const group=accounts.filter(a=>eligible(a,days)&&a.created_at.slice(0,10)>=since);const retained=group.filter(a=>activity.get(a.id)?.has(datePlus(a.created_at.slice(0,10),days))).length;return{eligible:group.length,retained,rate:group.length?Math.round(retained/group.length*1000)/10:null}};
 const activeWithin=(days:number)=>accounts.filter(a=>[...(activity.get(a.id)||[])].some(d=>d>=datePlus(today,-(days-1)))).length;
 const returned=accounts.filter(a=>(activity.get(a.id)?.size||0)>=2).length;
 const ids=accounts.map(a=>a.id),profiles=new Map<string,{username?:string|null;display_name?:string|null}>();
 for(let i=0;i<ids.length;i+=250){const {data}=await db.from("profiles").select("id,username,display_name").in("id",ids.slice(i,i+250));for(const p of data||[])profiles.set(p.id,p)}
 const members=accounts.filter(a=>a.email?.toLowerCase()!=="hudhudbyelmi@gmail.com").map(a=>{const days=[...(activity.get(a.id)||[])].sort(),last=days[days.length-1]||null,age=last?Math.floor((Date.parse(today+"T00:00:00Z")-Date.parse(last+"T00:00:00Z"))/86400000):null;return{id:a.id,name:profiles.get(a.id)?.username||profiles.get(a.id)?.display_name||"Member",joined:a.created_at.slice(0,10),lastActivity:last,activeDays:days.length,status:!last?"Not yet measured":age===0?"Active":age<=7?"Returning":age<=14?"At risk":"Dormant"}}).sort((a,b)=>(b.lastActivity||"").localeCompare(a.lastActivity||"")).slice(0,100);
 const counts={registered:accounts.length,returning:returned,dau:activeWithin(1),wau:activeWithin(7),mau:activeWithin(30)};
 return NextResponse.json({counts,cohorts:{d1:cohort(1),d7:cohort(7),d30:cohort(30)},members,periodStart:since,updatedAt:new Date().toISOString(),capped:capped||activityCapped,method:"Activity from authenticated interactions recorded after retention instrumentation; earlier activity is not backfilled. Cohorts include eligible signup dates within the recorded window; unmeasured days must not be interpreted as confirmed churn."},{headers:{"Cache-Control":"private,no-store"}});
}
