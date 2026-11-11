"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
type Stat={label:string;value:number|null};
type Group={name:string;subtitle:string;stats:Stat[]};
const countFormat=(n:number|null)=>n===null?"—":n.toLocaleString();
function membershipLabel(created:string|null){
 if(!created)return "—";
 const days=Math.max(0,Math.floor((Date.now()-new Date(created).getTime())/86400000));
 if(days<7)return days===1?"Day 1":`Day ${days+1}`;
 if(days<35)return `Week ${Math.floor(days/7)+1}`;
 if(days<365)return `Month ${Math.floor(days/30.4375)+1}`;
 return `Year ${Math.floor(days/365.25)+1}`;
}
export default function ProfileMemberStats({userId}:{userId:string}){
 const [groups,setGroups]=useState<Group[]>([]),[memberSince,setMemberSince]=useState<string|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const db=createClient();
 const count=async(table:string,column:string,value:string):Promise<number|null>=>{
  const {count,error}=await db.from(table).select("*",{count:"exact",head:true}).eq(column,value);
  return error?null:count??0;
 };
 const load=async()=>{
  const keys:[string,string,string][]=[
   ["messages","messages","sender_id"],["groupMessages","dm_group_messages","sender_id"],["dmMessages","dm_messages","sender_id"],
   ["comments","comments","user_id"],["posts","posts","user_id"],["communityPosts","community_posts","author_id"],
   ["images","post_media","user_id"],["likes","post_likes","user_id"],["reactions","post_reactions","user_id"],
   ["articles","newsletter_articles","author_id"],["lives","live_streams","host_id"],["followers","profile_follows","following_id"],["following","profile_follows","follower_id"]
  ];
  const result=await Promise.all(keys.map(async([key,table,col])=>[key,await count(table,col,userId)] as const));
  const values=Object.fromEntries(result) as Record<string,number|null>;
  const [profile,media,ownedPosts,receivedMessages]=await Promise.all([
   db.from("profiles").select("created_at").eq("id",userId).maybeSingle(),
   db.from("post_media").select("mime_type").eq("user_id",userId).limit(10000),
   db.from("posts").select("id").eq("user_id",userId).limit(10000),
   db.from("messages").select("id,conversation_id").neq("sender_id",userId).limit(1)
  ]);
  const ownIds=(ownedPosts.data||[]).map(p=>p.id);
  let receivedLikes:number|null=0;
  if(ownedPosts.error)receivedLikes=null;
  else if(ownIds.length){
   const chunks=[];for(let i=0;i<ownIds.length;i+=100)chunks.push(ownIds.slice(i,i+100));
   const counts=await Promise.all(chunks.map(ids=>db.from("post_likes").select("*",{count:"exact",head:true}).in("post_id",ids)));
   receivedLikes=counts.some(x=>x.error)?null:counts.reduce((n,x)=>n+(x.count||0),0);
  }
  const imageCount=media.error?null:(media.data||[]).filter(x=>x.mime_type?.startsWith("image/")).length;
  const videoCount=media.error?null:(media.data||[]).filter(x=>x.mime_type?.startsWith("video/")).length;
  const add=(a:number|null,b:number|null)=>a===null||b===null?null:a+b;
  const next:Group[]=[
   {name:"Membership",subtitle:"Your 1Muslim journey",stats:[{label:"Member since",value:null},{label:"Followers",value:values.followers},{label:"Following",value:values.following}]},
   {name:"Community",subtitle:"Messages and conversations",stats:[{label:"Messages sent",value:add(values.messages,add(values.dmMessages,values.groupMessages))},{label:"Comments posted",value:values.comments},{label:"Likes given",value:add(values.likes,values.reactions)}]},
   {name:"Content",subtitle:"What you've shared",stats:[{label:"Posts",value:add(values.posts,values.communityPosts)},{label:"Images",value:imageCount},{label:"Videos",value:videoCount},{label:"Likes received",value:receivedLikes}]},
   {name:"Qibla & Live",subtitle:"Publishing and broadcasting",stats:[{label:"Articles published",value:values.articles},{label:"Live sessions hosted",value:values.lives}]}
  ];
  if(active){setGroups(next);setMemberSince(profile.data?.created_at||null);setLoading(false)}
 };
 void load();return()=>{active=false};
 },[userId]);
 return <section className="profileMemberInsights" aria-label="Member activity statistics"><div className="profileMemberInsightsHeading"><div><small>MEMBER INSIGHTS</small><h2>Your 1Muslim journey</h2></div><span>Swipe to explore →</span></div>
 <div className="profileMemberInsightsRail">{(loading?Array.from({length:4},(_,i)=>({name:["Membership","Community","Content","Qibla & Live"][i],subtitle:"Loading your activity",stats:[]})):groups).map(g=><article className="profileMemberInsightsCard" key={g.name}><div className="profileMemberInsightsCardHead"><h3>{g.name}</h3><p>{g.subtitle}</p></div><div className="profileMemberInsightsStats">{g.stats.map(st=><div key={st.label}><strong>{st.label==="Member since"?membershipLabel(memberSince):countFormat(st.value)}</strong><span>{st.label}</span></div>)}{loading&&<p>Loading verified totals…</p>}</div></article>)}</div>
 <p className="profileMemberInsightsFoot">Counts use available 1Muslim records. Unavailable metrics show — rather than an estimated number.</p>
 <style>{`.profileMemberInsights{min-width:0;padding:4px 0 16px}.profileMemberInsightsHeading{display:flex;align-items:end;justify-content:space-between;gap:10px;padding:8px 18px 14px}.profileMemberInsightsHeading small{font-size:10px;letter-spacing:.17em;color:#77899d;font-weight:800}.profileMemberInsightsHeading h2{font-size:23px;margin:4px 0;color:#172d47}.profileMemberInsightsHeading>span{font-size:11px;color:#62758c;white-space:nowrap}.profileMemberInsightsRail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;padding:4px 18px 18px;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin}.profileMemberInsightsCard{flex:0 0 min(86vw,390px);scroll-snap-align:center;border-radius:24px;background:linear-gradient(155deg,#fff,#f0f5fb);color:#172d47;border:1px solid #dbe5f0;box-shadow:0 8px 24px #12294415;min-height:220px;padding:21px;box-sizing:border-box}.profileMemberInsightsCardHead h3{font-size:23px;margin:0}.profileMemberInsightsCardHead p{font-size:12px;color:#71829a;margin:6px 0 18px}.profileMemberInsightsStats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.profileMemberInsightsStats>div{border-top:1px solid #dbe5ef;padding-top:12px;min-width:0}.profileMemberInsightsStats strong{display:block;font-size:clamp(20px,5vw,28px);line-height:1.2;overflow-wrap:anywhere}.profileMemberInsightsStats span{font-size:12px;color:#63768b}.profileMemberInsightsFoot{font-size:11px;color:#73849a;padding:0 18px;line-height:1.5}`}</style></section>;
}
