"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../../utils/supabase/client";
const draftKey="1muslim-home-community-draft";
const hasFWord=(value:string)=>/(^|[^a-z])f[\\W_]*u[\\W_]*c[\\W_]*k(?:[\\W_]*(?:s|e[\\W_]*d|i[\\W_]*n[\\W_]*g))?(?=$|[^a-z])/i.test(value.normalize("NFKC"));
export default function HomeCreatePost(){
 const router=useRouter();
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [posted,setPosted]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [expanded,setExpanded]=useState(false);
 const [daily,setDaily]=useState(false);
 const [dailyUsed,setDailyUsed]=useState(false);
 const [dailyEligible,setDailyEligible]=useState(false);
 const [dailyChecked,setDailyChecked]=useState(false);
 const [recentPosts,setRecentPosts]=useState<Array<{id:string;body:string;created_at:string}>>([]);
 const [floatingIndex,setFloatingIndex]=useState(0);
 const [badEgg,setBadEgg]=useState(false);
 const [warning,setWarning]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>{const handler=(e:Event)=>{const mode=(e as CustomEvent<{mode:string}>).detail?.mode;if(mode==="daily"&&dailyEligible){setDaily(true);setExpanded(true)}else if(mode==="regular"){setDaily(false);setExpanded(true)}document.getElementById("ummah-draft")?.focus();document.querySelector(".ummah-shell")?.scrollIntoView({behavior:"smooth",block:"center"})};window.addEventListener("hudhud-compose",handler);return()=>window.removeEventListener("hudhud-compose",handler)},[dailyEligible]);
 useEffect(()=>{let alive=true;
  const check=async()=>{try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!alive)return;
   if(!user){setDailyEligible(true);setDailyChecked(true);setDaily(true);return}
   const now=new Date();const midnight=new Date(now);midnight.setHours(0,0,0,0);
   const since24=new Date(now.getTime()-86400000);
   const {data,error:queryError}=await db.from("ummah_feed_posts").select("id,body,created_at").eq("author_id",user.id).gte("created_at",since24.toISOString()).order("created_at",{ascending:false}).limit(100);
   if(queryError)throw queryError;
   if(!alive)return;
   const posts=data||[];
   const used=posts.some(p=>new Date(p.created_at)>=midnight&&p.body?.startsWith("✦ DAILY UMMAH ✦\\n"));
   const postedSinceMidnight=posts.some(p=>new Date(p.created_at)>=midnight);
   const eligible=!postedSinceMidnight&&posts.length<2;
   setDailyUsed(used);setDailyEligible(eligible);setDailyChecked(true);setDaily(eligible);
   window.dispatchEvent(new CustomEvent("hudhud-daily-status",{detail:{used:!eligible}}));
  }catch{if(alive){setDailyChecked(true);setDailyEligible(false);setDaily(false)}}};
  void check();
  const refresh=()=>void check();
  const interval=setInterval(refresh,60000);
  window.addEventListener("1muslim:community-post-published",refresh);
  document.addEventListener("visibilitychange",refresh);
  return()=>{alive=false;clearInterval(interval);window.removeEventListener("1muslim:community-post-published",refresh);document.removeEventListener("visibilitychange",refresh)}
 },[posted]);
 useEffect(()=>{let alive=true;const load=async()=>{try{const db=createClient();const {data,error}=await db.from("ummah_feed_posts").select("id,body,created_at").order("created_at",{ascending:false}).limit(40);if(!error&&alive)setRecentPosts((data||[]).filter(p=>p.body?.trim()).slice(0,16))}catch{}};void load();const refresh=setInterval(()=>void load(),90000);window.addEventListener("1muslim:community-post-published",load);return()=>{alive=false;clearInterval(refresh);window.removeEventListener("1muslim:community-post-published",load)}},[]);
 useEffect(()=>{if(recentPosts.length<2)return;const timer=setInterval(()=>setFloatingIndex(i=>(i+1)%recentPosts.length),7000);return()=>clearInterval(timer)},[recentPosts.length]);
 useEffect(()=>{try{if(sessionStorage.getItem("1muslim-compose-mode")==="daily"){setExpanded(true);sessionStorage.removeItem("1muslim-compose-mode")}setDraft(sessionStorage.getItem(draftKey)||"");if(sessionStorage.getItem("1muslim-post-success")==="yes"){sessionStorage.removeItem("1muslim-post-success");setPosted(true);setNotice("✨ Your post was successfully shared with the community!")}}catch{}},[]);
 async function publish(e:React.FormEvent){
  e.preventDefault();const text=draft.trim();if(!text||busy||(daily&&(!dailyEligible||dailyUsed)))return;
  if(hasFWord(text)&&!confirmed){setWarning(true);return}
  setBusy(true);setError("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();
   if(!user){sessionStorage.setItem(draftKey,text);router.push("/auth?next="+encodeURIComponent("/?compose=1"));return}
   const response=await fetch("/api/community-posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:daily?"✦ DAILY UMMAH ✦\\n"+text:text})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Could not publish post");
   if(data.flagged&&data.removed){setBadEgg(true);setWarning(false);setNotice("🥚 We tried to include your content with ours, but it didn’t fit. Thanks for trying! Your post was removed and flagged for review.");setTimeout(()=>{setCollapsed(true);setDraft("");setConfirmed(false)},1750);setTimeout(()=>{setBadEgg(false);setCollapsed(false)},2450);return}
   sessionStorage.removeItem(draftKey);if(daily){setDailyEligible(false);setDailyUsed(true);window.dispatchEvent(new CustomEvent("hudhud-daily-status",{detail:{used:true}}))}setPosted(true);setDailyEligible(false);setNotice("✨ Your post was successfully shared with the community!");setDraft("");setExpanded(false);window.dispatchEvent(new Event("1muslim:community-post-published"));
  }catch(err){setError(err instanceof Error?err.message:"Could not publish your post")}finally{setBusy(false)}
 }
 return <div className="ummah-shell"><style>{`.badEggDrop{animation:badEggFall 1.75s ease-in forwards!important;transform-origin:50% 100%;overflow:hidden}.badEggDrop:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent,#ff1d3d88,transparent);z-index:15;pointer-events:none;animation:redScan .75s ease-in-out 2}@keyframes redScan{from{transform:translateX(-100%)}to{transform:translateX(100%)}}@keyframes badEggFall{0%{transform:translateY(0) scale(1);filter:none;opacity:1;max-height:1100px}32%{transform:translateY(3px) rotate(-3deg);filter:drop-shadow(0 0 22px #ff264c);opacity:1}70%{transform:translateY(90px) rotate(8deg) scale(.9);opacity:.8}100%{transform:translateY(110vh) rotate(14deg) scale(.65);opacity:0;max-height:0;padding:0;margin:0}}.badEggCollapse{max-height:0!important;overflow:hidden!important;opacity:0!important;margin:0!important;padding:0!important;transition:max-height .5s ease,margin .5s ease,padding .5s ease}.badEggWarning{padding:17px;border:1px solid #ff647a;border-radius:18px;background:#330d1bcc;color:#ffe8ec;margin:12px 0}.badEggWarning button{padding:10px 15px;border-radius:12px;margin:6px 8px 0 0;border:1px solid #ff8e9d;background:#3e1524;color:white;cursor:pointer}.badEggWarning button:first-of-type{background:#194632;border-color:#8ae8b5}`}</style><div role="status" aria-live="polite" className="ummah-notice">{notice}</div>{warning&&<div className="badEggWarning" role="alertdialog" aria-modal="true"><strong>⚠️ This language doesn't fit our community standards.</strong><p>You can edit your post, or choose to submit it anyway. Posts containing this language will be removed and may flag your account for review.</p><button type="button" onClick={()=>{setWarning(false);setConfirmed(false)}}>Edit my post</button><button type="button" onClick={()=>{setWarning(false);setConfirmed(true);setTimeout(()=>document.getElementById("ummah-confirmed-submit")?.click(),0)}}>Submit anyway</button></div>}{!posted&&<section className={"ummah-card "+(badEgg?"badEggDrop ":"")+(collapsed?"badEggCollapse ":"")+(daily?"ummah-daily":"ummah-regular")}><div className="ummah-heading"><div><span className="ummah-eyebrow">✦ 1MUSLIM · {daily?"DAILY UMMAH":"COMMUNITY POST"}</span><h2>{daily?"✨ Your Ummah Moment":"Share with the Ummah"}</h2><p>🔒 Private until you share</p></div><span className="ummah-star">✧</span></div><div className="ummah-mode" role="group" aria-label="Post type">{dailyEligible&&<button type="button" onClick={()=>setDaily(true)} aria-pressed={daily}>✦ Daily Post</button>}<button type="button" onClick={()=>setDaily(false)} aria-pressed={!daily}>Regular Post</button></div><div className="ummah-preview" onClick={()=>setExpanded(true)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter")setExpanded(true)}} aria-label="Expand reflection editor">{daily&&<div className="dailyLiveParticles" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{["--particle" as string]:i} as React.CSSProperties}/>)}</div>}<div className="ummah-halo"/><div className="ummah-geometry">۞</div><div className="ummah-preview-content"><span className="ummah-day">ON THIS DAY · {new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</span><div className="ummah-reflection">{draft.trim()||"A moment of reflection. A light for the Ummah."}</div><span className="ummah-preview-cta">{expanded?"✎ Editing reflection":"✎ Tap to write your reflection"}</span><span className="ummah-watermark">1Muslim ✦</span></div><div className="ummah-post-overlay" aria-label="Recent Ummah posts">{recentPosts.length>0&&<div key={recentPosts[floatingIndex%recentPosts.length].id} className="ummah-post-float"><span className="ummah-post-tag">✦ UMMAH · {new Date(recentPosts[floatingIndex%recentPosts.length].created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span><span className="ummah-post-text">{recentPosts[floatingIndex%recentPosts.length].body.replace(/^✦ DAILY UMMAH ✦\\n/,"").slice(0,145)}</span></div>}</div></div>{expanded&&<form onSubmit={e=>void publish(e)}><button id="ummah-confirmed-submit" type="submit" hidden aria-hidden="true" /><label className="ummah-label" htmlFor="ummah-draft">Your reflection</label><textarea id="ummah-draft" maxLength={2000} value={draft} onFocus={()=>setExpanded(true)} onChange={e=>{setDraft(e.target.value);setConfirmed(false)}} placeholder="What would you like to share with the Ummah today?" rows={expanded?5:2}/><div className="ummah-count">{draft.length}/2000</div><div className="ummah-actions"><button type="button" className="ummah-later" onClick={()=>{try{sessionStorage.setItem(draftKey,draft)}catch{}setExpanded(false);setNotice("Draft kept for later ✨")}}>Not now</button><button type="submit" className="ummah-share" disabled={!draft.trim()||busy}>{busy?"Sharing…":daily?"✨ Publish Daily Moment":"Share with Ummah"}</button></div></form>}{error&&<p role="alert" style={{color:"#ffaaa7"}}>{error}</p>}</section>}<style jsx>{`
/* Preview Canvas Post Studio: concise by default, editor only when requested. */
.ummah-post-overlay{position:absolute;bottom:9px;left:9px;right:9px;z-index:3;pointer-events:none;display:flex;justify-content:center}
.ummah-post-float{max-width:min(90%,420px);display:flex;flex-direction:column;gap:4px;padding:8px 13px;border:1px solid rgba(233,213,163,.36);border-radius:14px;background:rgba(5,35,29,.80);backdrop-filter:blur(9px);box-shadow:0 7px 20px rgba(0,0,0,.16);animation:ummahPostDrift 7s ease-in-out both}
.ummah-post-tag{font-size:9px;letter-spacing:.12em;color:#eed49b;font-weight:750}
.ummah-post-text{font-size:11px;line-height:1.3;color:#e4f5e9;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
@keyframes ummahPostDrift{0%{opacity:0;transform:translate3d(0,12px,0)}15%,75%{opacity:.88;transform:translate3d(0,0,0)}100%{opacity:0;transform:translate3d(0,-13px,0)}}
.ummah-preview-content{padding-bottom:65px!important}
@media(prefers-reduced-motion:reduce){.ummah-post-float{animation:none!important;opacity:.9}}

.ummah-mode{transition:opacity .35s ease,transform .35s ease}
.ummah-card{transition:border-color .45s ease,box-shadow .45s ease}
@media(prefers-reduced-motion:reduce){.ummah-mode,.ummah-card{transition:none!important}}
.ummah-shell{width:100%;max-width:none;margin:0 auto;padding:0;min-height:0}
.ummah-notice:empty{display:none}
.ummah-card{padding:clamp(12px,2.5vw,20px);border-radius:clamp(18px,3vw,26px);background:linear-gradient(150deg,rgba(8,35,29,.88),rgba(5,24,23,.83));box-shadow:inset 0 1px rgba(246,221,157,.12),0 12px 35px rgba(0,0,0,.18);animation:none}
.ummah-card:before{animation:none;inset:0;background:linear-gradient(115deg,transparent 25%,rgba(238,206,131,.045) 55%,transparent 85%)}
.ummah-heading{gap:8px}
.ummah-heading h2{font-size:clamp(17px,3.8vw,25px);margin:4px 0 2px}
.ummah-heading p{font-size:11px;margin:0 0 10px}
.ummah-eyebrow{font-size:9px;letter-spacing:.14em}
.ummah-star{font-size:23px}
.ummah-mode{margin:4px 0 11px;gap:7px}
.ummah-mode button{padding:9px 8px;font-size:clamp(10px,2.2vw,13px);font-weight:700;min-height:37px}
.ummah-preview,.ummah-regular .ummah-preview{min-height:clamp(135px,24dvh,215px);max-height:240px;align-items:stretch;background:linear-gradient(140deg,rgba(19,73,58,.76),rgba(6,29,27,.89))}
.ummah-preview-content{display:flex;flex-direction:column;justify-content:center;padding:clamp(13px,2.5vw,22px);background:linear-gradient(120deg,rgba(8,33,28,.32),rgba(6,28,27,.82))}
.ummah-day{font-size:clamp(9px,1.7vw,11px);letter-spacing:.12em}
.ummah-reflection{font-size:clamp(16px,3.5vw,23px);line-height:1.3;margin:9px 0 10px;-webkit-line-clamp:3}
.ummah-watermark{font-size:10px;opacity:.7}
.ummah-preview-cta{position:absolute;bottom:12px;right:15px;font-size:10px;color:#f2d9a3;letter-spacing:.04em}
.ummah-label{margin-top:12px}
.ummah-card textarea{min-height:110px;max-height:210px}
.ummah-actions button{padding:11px 9px}
.ummah-daily{box-shadow:inset 0 1px rgba(244,220,158,.17),0 0 20px rgba(199,175,107,.10)}
.dailyLiveParticles i{width:3px;height:3px;opacity:.22}
@media(max-width:600px){.ummah-card{padding:12px}.ummah-preview,.ummah-regular .ummah-preview{min-height:145px;max-height:185px}.ummah-heading h2{font-size:20px}.ummah-reflection{font-size:19px}.ummah-mode button{font-size:11px}}
@media(prefers-reduced-motion:reduce){.dailyLiveParticles i,.ummah-star{animation:none!important}}

.dailyLiveParticles{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2}.dailyLiveParticles i{position:absolute;left:calc(5% + (var(--particle) * 5%));bottom:-12px;width:5px;height:5px;border-radius:50%;background:#a8f9ff;box-shadow:0 0 9px 3px #4de5ff99,0 0 22px #bc83ff88;animation:dailyLiveRise calc(4s + var(--particle) * .21s) linear infinite;animation-delay:calc(var(--particle) * -.38s);opacity:0}@keyframes dailyLiveRise{0%{transform:translate3d(0,0,0) scale(.5);opacity:0}15%{opacity:.9}75%{opacity:.65}100%{transform:translate3d(24px,-340px,0) scale(1.4);opacity:0}}@media(prefers-reduced-motion:reduce){.dailyLiveParticles i{animation:none;opacity:.3;bottom:calc(var(--particle) * 5%)}}.ummah-mode{display:flex;gap:8px;margin:0 0 14px}.ummah-mode button{flex:1;border:1px solid #6b947d;border-radius:999px;background:#16271e;color:#d9ffeb;padding:10px 5px;font-size:12px;font-weight:750;cursor:pointer}.ummah-mode button[aria-pressed="true"]{background:#b4ffd2;color:#09281b}.ummah-mode button:disabled{opacity:.45;cursor:not-allowed}.ummah-regular .ummah-preview{min-height:160px;background:linear-gradient(145deg,#182f28,#101f2a)}.ummah-regular .ummah-halo,.ummah-regular .ummah-geometry{display:none}.ummah-regular:before{display:none}.ummah-daily{box-shadow:0 0 40px #ffe9a42a,0 0 28px #70ffb73d}.ummah-shell{margin:24px auto;max-width:640px}.ummah-notice{color:#91f6bc;font-weight:700;margin-bottom:8px}.ummah-card{position:relative;overflow:hidden;padding:22px;border-radius:32px;border:1px solid rgba(196,255,220,.28);background:linear-gradient(155deg,#17241f,#0a1413 55%,#1b2030);color:#fff;box-shadow:0 18px 55px #0007,0 0 38px #4aff9a18;animation:ummahEnter .65s both}.ummah-card:before{content:"";position:absolute;inset:-150%;pointer-events:none;background:linear-gradient(110deg,transparent 46%,#ffffff0c 49%,#9affd52b 50%,#ffffff0c 51%,transparent 54%);animation:ummahShine 7s linear infinite}.ummah-heading{position:relative;display:flex;justify-content:space-between;align-items:center}.ummah-eyebrow{color:#a6f5c4;font-size:10px;letter-spacing:2px;font-weight:800}.ummah-heading h2{font-size:clamp(23px,5vw,34px);margin:8px 0}.ummah-heading p{color:#b3c3bc;margin:0 0 16px}.ummah-star{font-size:40px;color:#f5d994;animation:ummahTwinkle 3s ease-in-out infinite}.ummah-preview{position:relative;isolation:isolate;min-height:310px;border-radius:26px;overflow:hidden;cursor:pointer;border:1px solid #a9ffc64d;background:radial-gradient(ellipse at 50% 65%,#245d4b 0%,#122d2a 36%,#0b1721 75%);display:flex;align-items:end}.ummah-halo{position:absolute;inset:12%;border:1px solid #e2d79a52;border-radius:50%;box-shadow:0 0 40px #9cff8e40,inset 0 0 60px #8cf9ac22;animation:ummahPulse 5s ease-in-out infinite}.ummah-geometry{position:absolute;top:4%;left:50%;transform:translateX(-50%);font-size:220px;line-height:1;color:#d6b87938;text-shadow:0 0 50px #d8bf8266;animation:ummahFloat 8s ease-in-out infinite}.ummah-preview-content{position:relative;z-index:1;width:100%;padding:24px;background:linear-gradient(transparent,#071810e8)}.ummah-day{font-size:11px;letter-spacing:2px;color:#f6dc96;font-weight:800}.ummah-reflection{font-size:clamp(21px,5vw,30px);font-weight:750;line-height:1.35;margin:12px 0 24px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 16px #000}.ummah-watermark{color:#b3f4d0;font-size:13px}.ummah-label{display:block;font-size:13px;font-weight:700;color:#c4f7d8;margin:18px 0 8px}.ummah-card textarea{box-sizing:border-box;width:100%;resize:vertical;border:1px solid #5a9278;border-radius:16px;background:#071710;color:#fff;font:inherit;padding:14px;outline:none}.ummah-card textarea:focus{border-color:#a1ffd0;box-shadow:0 0 0 3px #5cff9922}.ummah-count{text-align:right;font-size:11px;color:#9cb7a9}.ummah-actions{display:flex;gap:12px;margin-top:12px}.ummah-actions button{flex:1;border:0;border-radius:999px;padding:15px 10px;font-weight:800;cursor:pointer}.ummah-later{background:#ffffff1a;color:#d6e3da}.ummah-share{position:relative;overflow:hidden;background:linear-gradient(110deg,#73e8a3,#d9ffac,#69e6ad);color:#082719;box-shadow:0 0 22px #6ef6a44d}.ummah-share:disabled{opacity:.5;cursor:not-allowed}@keyframes ummahEnter{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:none}}@keyframes ummahShine{from{transform:translateX(-35%)}to{transform:translateX(35%)}}@keyframes ummahTwinkle{50%{opacity:.45;transform:scale(.85) rotate(20deg)}}@keyframes ummahPulse{50%{transform:scale(1.07);opacity:.6}}@keyframes ummahFloat{50%{transform:translate(-50%,12px) rotate(8deg)}}@media(prefers-reduced-motion:reduce){.ummah-card,.ummah-card:before,.ummah-star,.ummah-halo,.ummah-geometry{animation:none!important}}@media(max-width:420px){.ummah-card{padding:14px;border-radius:24px}.ummah-preview{min-height:270px}.ummah-actions button{font-size:12px}}
`}</style></div>;
}
