"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import ProfileAvatar from "./ProfileAvatar";
import "./canvas-profile-premium.css";

type Member={id:string;display_name:string|null;username:string|null;bio:string|null;xp_total:number|null;gender?:string|null;avatar_gender?:string|null;avatar_package?:string|null;avatar_config?:Record<string,unknown>|null;profile_accent?:string|null;shahada_verified_at?:string|null};
type Post={id:string;body:string|null;created_at:string|null};
const tabs=[["posts","▦","Posts"],["live","▣","Lives"],["reposts","↻","Reposts"],["saved","♧","Saved"],["liked","♡","Liked"]] as const;
export default function CanvasProfilePremium({active}:{active:boolean}){
 const [profile,setProfile]=useState<Member|null>(null);
 const [loading,setLoading]=useState(true);
 const [posts,setPosts]=useState<Post[]>([]);
 const [tab,setTab]=useState<(typeof tabs)[number][0]>("posts");
 const [error,setError]=useState("");
 useEffect(()=>{if(!active)return;let alive=true;const db=createClient();setLoading(true);
 (async()=>{try{const {data:{user}}=await db.auth.getUser();if(!alive)return;
 if(!user){setProfile(null);setPosts([]);setLoading(false);return}
 const [p,personal,community]=await Promise.all([
 db.from("profiles").select("id,display_name,username,bio,xp_total,gender,avatar_gender,avatar_package,avatar_config,profile_accent,shahada_verified_at").eq("id",user.id).maybeSingle(),
 db.from("posts").select("id,body,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
 db.from("community_posts").select("id,body,created_at").eq("author_id",user.id).order("created_at",{ascending:false}).limit(30)
 ]);
 if(!alive)return;
 if(p.error){setError("Your profile is temporarily unavailable.");setProfile(null)}else{setProfile(p.data as Member|null);setError("")}
 setPosts([...(personal.data||[]),...(community.data||[])].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,30) as Post[]);
 }catch{if(alive)setError("Unable to load your profile.")}finally{if(alive)setLoading(false)}})();
 return()=>{alive=false}},[active]);
 return <section className="cp-profile" aria-label="My 1Muslim profile">
  <div className="cp-cover">
   <div className="cp-cover-actions"><Link href="/find" aria-label="Find people">↗</Link><Link href="/profile" aria-label="Profile options">⋮</Link></div>
   <div className="cp-identity">
    <div className="cp-avatar-ring">{profile?<ProfileAvatar name={profile.display_name||"Member"} gender={profile.gender||undefined} avatarGender={profile.avatar_gender||undefined} avatarPackage={profile.avatar_package||undefined} avatarConfig={profile.avatar_config||{}} accent={profile.profile_accent||undefined} size="lg"/>:<span className="cp-guest-avatar">☪</span>}<Link href="/profile?tab=avatar" className="cp-avatar-add" aria-label="Change profile avatar" title="Change avatar">+</Link></div>
    {profile?<><strong>{profile.display_name||"Member"} {profile.shahada_verified_at?<span title="Shahada verified">✦</span>:null}</strong><span className="cp-handle">@{profile.username||"member"}</span></>:<><strong>Welcome to 1Muslim</strong><span className="cp-handle">Your journey starts here</span></>}
   </div>
   {profile?<Link className="cp-edit" href="/profile">✎ Edit profile</Link>:<Link className="cp-edit" href="/login">Sign in ↗</Link>}
  </div>
  {loading?<p className="cp-empty" role="status">Loading your profile…</p>:error?<p className="cp-empty" role="alert">{error}</p>:profile?<>
   <div className="cp-stats"><div><strong>{posts.length}{posts.length===30?"+":""}</strong><span>Posts</span></div><div><strong>{(profile.xp_total||0).toLocaleString()}</strong><span>XP earned</span></div><div><strong>{profile.shahada_verified_at?"✓":"—"}</strong><span>Shahada</span></div></div>
   <p className="cp-bio">{profile.bio||"Connect. Learn. Reflect. Together."}</p>
   <div className="cp-actions"><Link href="/profile">✦ Badges</Link><Link href="/find">♧ Ashab</Link><Link href="/settings">⚙ Settings</Link></div>
   <nav className="cp-tabs" aria-label="Profile content">{tabs.map(([key,icon,label])=><button type="button" key={key} aria-label={label} aria-current={tab===key?"page":undefined} onClick={()=>setTab(key)}><span aria-hidden="true">{icon}</span><small>{label}</small></button>)}</nav>
   {tab==="posts"?<div className="cp-post-grid">{posts.length?posts.map((post,i)=><Link href="/community" key={post.id} className="cp-post-tile"><span className="cp-post-shimmer" aria-hidden="true"/><span className="cp-post-number">✦ {String(i+1).padStart(2,"0")}</span><span className="cp-post-text">{post.body||"Community reflection"}</span><span className="cp-post-date">{post.created_at?new Date(post.created_at).toLocaleDateString():"Ummah"} ↗</span></Link>):<div className="cp-grid-empty"><span>✦</span><p>Your first post belongs here.</p><Link href="/community">Share a reflection ↗</Link></div>}</div>:<div className="cp-grid-empty"><span>✦</span><p>{tab==="live"?"Your live recordings will appear here.":tab==="reposts"?"Your reposts will appear here.":tab==="saved"?"Saved posts are available in your full profile.":"Liked posts are available in your full profile."}</p><Link href="/profile">Open {tabs.find(t=>t[0]===tab)?.[2]} ↗</Link></div>}
  </>:<div className="cp-guest"><p>Sign in to see your avatar, achievements, and posts inside the Canvas.</p><Link href="/login">Sign in ↗</Link><Link href="/welcome">New to 1Muslim? Join us ✦</Link></div>}
 </section>
}
