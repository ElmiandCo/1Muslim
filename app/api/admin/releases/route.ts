import {NextResponse} from "next/server";
import {createClient} from "../../../../utils/supabase/server";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"};
async function authorized(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 const emails=(process.env.ONE_MUSLIM_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 return !!user && (user.app_metadata?.role==="admin" || emails.includes(user.email?.toLowerCase()||""));
}
export async function GET(){
 if(!await authorized())return NextResponse.json({error:"Admin access required"},{status:403,headers:noStore});
 const token=process.env.VERCEL_API_TOKEN;
 if(!token)return NextResponse.json({configured:false,deployments:[],message:"Set VERCEL_API_TOKEN and VERCEL_PROJECT_ID in server environment to load deployments."},{headers:noStore});
 const project=process.env.VERCEL_PROJECT_ID||"1muslim";
 const team=process.env.VERCEL_TEAM_ID;
 const url=new URL("https://api.vercel.com/v6/deployments");
 url.searchParams.set("projectId",project);url.searchParams.set("limit","50");
 if(team)url.searchParams.set("teamId",team);
 try{
  const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  if(!res.ok)return NextResponse.json({error:"Vercel deployment lookup failed",status:res.status},{status:502,headers:noStore});
  const data=await res.json();
  const deployments=(Array.isArray(data.deployments)?data.deployments:[]).map((d:any)=>({
   id:d.uid||d.id, url:d.url, state:d.readyState||d.state, target:d.target||"preview",
   branch:d.meta?.githubCommitRef||"",sha:d.meta?.githubCommitSha||"",message:d.meta?.githubCommitMessage||"",
   created:d.created||d.createdAt||0
  }));
  return NextResponse.json({configured:true,deployments},{headers:noStore});
 }catch{return NextResponse.json({error:"Could not reach deployment provider"},{status:502,headers:noStore})}
}
export async function POST(){
 if(!await authorized())return NextResponse.json({error:"Admin access required"},{status:403,headers:noStore});
 return NextResponse.json({error:"Automated production scheduling is not enabled. No release was scheduled or promoted."},{status:501,headers:noStore});
}
