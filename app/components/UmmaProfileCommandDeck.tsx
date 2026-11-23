"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
import "./umma-profile-command-deck.css";
type Person={display_name?:string|null;username?:string|null;bio?:string|null;xp_total?:number|null;avatar_config?:Record<string,unknown>|null};
export default function UmmaProfileCommandDeck({onClose}:{onClose:()=>void}){
 const [person,setPerson]=useState<Person|null>(null),[postCount,setPostCount]=useState<number|null>(null),[status,setStatus]=useState("Loading your profile…");
 useEffect(()=>{let alive=true;const load=async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!alive)return;if(!user){setStatus("Sign in to see your personal dashboard.");return}const {data,error}=await db.from("profiles").select("display_name,username,bio,xp_total,avatar_config").eq("id",user.id).maybeSingle();if(!alive)return;if(error){setStatus("Profile unavailable.");return}setPerson(data);setStatus("");const posts=await db.from("community_posts").select("id",{count:"exact",head:true}).eq("user_id",user.id);if(alive&&!posts.error)setPostCount(posts.count??0)};void load();return()=>{alive=false}},[]);
 const avatar=typeof person?.avatar_config?.selectedAvatarUrl==="string"?person.avatar_config.selectedAvatarUrl:"";
 return <section className="upcd" role="dialog" aria-modal="true" aria-label="1Umma profile command deck"><div className="upcd-world" aria-hidden="true"><div className="upcd-grid"/><div className="upcd-horizon"/><div className="upcd-orbit upcd-orbit-a"/><div className="upcd-orbit upcd-orbit-b"/></div>
 <header className="upcd-header"><div><small>1MUSLIM / 1UMMA</small><strong>PERSONAL COMMAND DECK</strong></div><button type="button" onClick={onClose} aria-label="Close profile dashboard">✕</button></header>
 <aside className="upcd-panel upcd-left"><div className="upcd-kicker">01 / IDENTITY</div><div className="upcd-person">{avatar?<img src={avatar} alt="" />:<div className="upcd-avatar">1M</div>}<div><strong>{person?.display_name||"Your Profile"}</strong><span>{person?.username?"@"+person.username:status||"1Muslim Member"}</span></div></div><p className="upcd-bio">{person?.bio||"Your story begins here."}</p><div className="upcd-stats"><div><strong>{person?.xp_total?.toLocaleString()??"—"}</strong><small>XP</small></div><div><strong>{postCount??"—"}</strong><small>POSTS</small></div></div><Link href="/profile">Edit profile ↗</Link></aside>
 <div className="upcd-center" aria-label="Reserved virtual world space"><div className="upcd-center-label">1UMMA <span>VIRTUAL WORLD</span></div><div className="upcd-center-note">Your world is taking shape</div></div>
 <aside className="upcd-panel upcd-right"><div className="upcd-kicker">02 / YOUR SPACE</div><Link href="/profile">My posts <span>↗</span></Link><Link href="/profile">Profile editor <span>↗</span></Link><Link href="/messages">Messages <span>↗</span></Link><Link href="/profile">Settings <span>↗</span></Link><Link href="/elm-tent/quran">Qur’an Studio <span>↗</span></Link></aside>
 <footer className="upcd-footer"><span>1UMMA · CONNECTED WORLDS</span><span>PROFILE / SOCIAL / SETTINGS</span></footer></section>;
}
