"use client";
import {useEffect,useState} from "react";
type Video={id:string;title:string;cover:string;url:string;embed:string;duration:number};
export default function ProfileTikTokGallery(){
 const [status,setStatus]=useState<{connected:boolean;profile?:{displayName:string;username:string;avatarUrl:string}|null}|null>(null);
 const [videos,setVideos]=useState<Video[]>([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [sharing,setSharing]=useState("");
 const [done,setDone]=useState("");
 const [preview,setPreview]=useState<string|null>(null);
 const [showSettings,setShowSettings]=useState(false);
 const refresh=async()=>{setLoading(true);setError("");try{
  const r=await fetch("/api/tiktok/status",{cache:"no-store"});const s=await r.json();setStatus(s);
  if(s.connected){const v=await fetch("/api/tiktok/videos",{cache:"no-store"});const data=await v.json();if(!v.ok)throw Error(data.error||"Video gallery unavailable");setVideos(data.videos||[])}
 }catch(e){setError(e instanceof Error?e.message:"Unable to load TikTok videos")}finally{setLoading(false)}};
 useEffect(()=>{void refresh()},[]);
 const share=async(v:Video)=>{if(!confirm("Share this public TikTok video to your 1Muslim Ummah feed?"))return;setSharing(v.id);setDone("");try{
  const r=await fetch("/api/tiktok/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:v.id,title:v.title,url:v.url})});
  const data=await r.json();if(!r.ok)throw Error(data.error||"Unable to share");setDone(data.alreadyShared?"Already shared to Ummah — no duplicate created.":"Shared to Ummah! The original TikTok video can play in the feed.");
 }catch(e){setError(e instanceof Error?e.message:"Unable to share")}finally{setSharing("")}};
 return <section className="ttInline" aria-label="TikTok account and videos">
  <header><span className="ttLabel">♪ TIKTOK × 1MUSLIM</span><button type="button" onClick={()=>void refresh()} disabled={loading}>↻ Refresh</button></header>
  {status?.connected?<><div className="ttAccount">{status.profile?.avatarUrl?<img src={status.profile.avatarUrl} alt="TikTok avatar" referrerPolicy="no-referrer"/>:<span className="ttAvatar">♪</span>}<div><strong>{status.profile?.displayName||"TikTok connected"}</strong><small>{status.profile?.username?"@"+status.profile.username:"Connected through TikTok"}</small></div><span className="ttVerified">✓ Connected</span></div>
  <div className="ttSub"><h3>My TikTok videos</h3><p>Choose a public video to preview or share with your Ummah. Videos remain hosted by TikTok.</p></div>
  {loading?<p>Loading your videos…</p>:videos.length?<div className="ttGrid">{videos.map(v=><article key={v.id}><button type="button" className="ttCover" onClick={()=>setPreview(preview===v.id?null:v.id)} aria-label={"Preview "+v.title}>{v.cover?<img src={v.cover} alt="" referrerPolicy="no-referrer"/>:<span>♪</span>}<b>▶</b></button><p>{v.title}</p><div className="ttActions"><button type="button" onClick={()=>void share(v)} disabled={!!sharing}>{sharing===v.id?"Sharing…":"✦ Share to Ummah"}</button><a href={v.url} target="_blank" rel="noopener noreferrer">TikTok ↗</a></div>{preview===v.id&&<div className="ttPreview">{v.embed&&/^https:\/\//.test(v.embed)?<iframe title={v.title} src={v.embed} allow="encrypted-media;fullscreen" allowFullScreen/>:<a href={v.url} target="_blank" rel="noopener noreferrer">Watch on TikTok ↗</a>}</div>}</article>)}</div>:!error?<p>No public videos available yet. TikTok may require the video.list scope to be approved.</p>:null}
  {done&&<p role="status" className="ttSuccess">{done}</p>}
  <button type="button" className="ttDisconnect" onClick={()=>setShowSettings(v=>!v)} aria-expanded={showSettings}>⚙ Connection settings {showSettings?"⌃":"⌄"}</button>
  {showSettings&&<div className="ttSettings"><p>Sharing is manual. Only public videos you select are posted to Ummah. No automatic synchronization is enabled.</p><button type="button" className="ttDisconnect" onClick={async()=>{if(!confirm("Disconnect your TikTok account?"))return;const r=await fetch("/api/tiktok/disconnect",{method:"POST"});if(r.ok){setStatus({connected:false});setVideos([])}else setError("Unable to disconnect TikTok.")}}>Disconnect TikTok</button></div>}
  </>:<div className="ttConnect"><p>Connect TikTok to show your public videos right here on your profile.</p><a href="/api/tiktok/connect">♪ Connect TikTok securely ↗</a></div>}
  {error&&<p role="alert" className="ttError">{error}</p>}
  <style jsx>{`
   .ttSettings{margin-top:12px;padding:14px;border-radius:14px;border:1px solid #ffffff29;background:#ffffff0a}.ttSettings p{color:#c4d9d0;font-size:12px;line-height:1.6}.ttInline{margin:24px 0;padding:20px;border:1px solid #8bdcc16b;border-radius:24px;background:linear-gradient(135deg,#102c2a,#0b131d);color:#f3fff9;box-shadow:0 15px 40px #0003}.ttInline header{display:flex;justify-content:space-between;align-items:center}.ttLabel{font-size:11px;letter-spacing:.17em;color:#a9e7d3;font-weight:800}.ttInline button{cursor:pointer}.ttInline header button,.ttDisconnect{border:1px solid #9ccbb666;border-radius:15px;padding:9px 13px;background:#ffffff0c;color:#dff5ec}.ttAccount{display:flex;align-items:center;gap:12px;margin:18px 0;padding:12px;border:1px solid #a1d8b644;border-radius:18px;background:#ffffff0a}.ttAccount img,.ttAvatar{height:48px;width:48px;object-fit:cover;border-radius:50%;background:#214d46;display:grid;place-items:center}.ttAccount strong,.ttAccount small{display:block}.ttAccount small{color:#a5c4b9;margin-top:4px}.ttVerified{margin-left:auto;font-size:11px;color:#a5eac3}.ttSub h3{font-size:24px;margin:16px 0 4px}.ttSub p,.ttConnect p{font-size:13px;color:#bdd3c9;line-height:1.6}.ttGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:13px;margin-top:20px}.ttGrid article{min-width:0;padding:9px;border:1px solid #ffffff25;border-radius:17px;background:#ffffff0b}.ttCover{width:100%;aspect-ratio:9/13;position:relative;overflow:hidden;border:0;border-radius:12px;background:#17352f;color:#fff}.ttCover img{width:100%;height:100%;object-fit:cover}.ttCover b{position:absolute;top:45%;left:45%;font-size:25px;text-shadow:0 2px 12px #000}.ttGrid article p{font-size:12px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ttActions{display:flex;flex-wrap:wrap;gap:6px}.ttActions button,.ttActions a,.ttConnect a{border:1px solid #9cdbc4;border-radius:12px;padding:9px;background:#c7f5df;color:#10271d;text-decoration:none;font-size:11px;font-weight:800}.ttPreview iframe{width:100%;height:300px;border:0;margin-top:10px}.ttSuccess{color:#b2ffcd}.ttError{color:#ffb8b8}.ttDisconnect{margin-top:20px}.ttConnect a{display:inline-block;margin-top:10px}@media(max-width:520px){.ttInline{padding:13px}.ttGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.ttVerified{font-size:9px}}
  `}</style>
 </section>
}
