"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "../../utils/supabase/client";
type Post={id:string;body:string;created_at:string;media?:string;video?:boolean};
export default function ProfileMagazinePosts(){
 const [editMode,setEditMode]=useState(false);const [posts,setPosts]=useState<Post[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState(""),[busy,setBusy]=useState<string|null>(null),[notice,setNotice]=useState("");
 const editPost=(post:Post)=>{setEditing(post.id);setDraft(post.body);setNotice("")};
 const saveText=async(post:Post)=>{if(busy)return;setBusy(post.id);setNotice("");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sign in required");const {data,error}=await db.from("posts").update({body:draft}).eq("id",post.id).eq("user_id",user.id).select("id").single();if(error||!data)throw Error("Update was not permitted");setPosts(rows=>rows.map(row=>row.id===post.id?{...row,body:draft}:row));setEditing(null);setNotice("Post text saved. Photos and videos were not changed.")}catch{setNotice("Could not update this post. Please retry.")}finally{setBusy(null)}};
 const deletePost=async(post:Post)=>{if(busy||!window.confirm("Permanently delete this post and its attached photos or videos? This cannot be undone."))return;setBusy(post.id);setNotice("");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sign in required");const {data,error}=await db.from("posts").delete().eq("id",post.id).eq("user_id",user.id).select("id").single();if(error||!data)throw Error("Deletion was not permitted");setPosts(rows=>rows.filter(row=>row.id!==post.id));setNotice("Post deleted.")}catch{setNotice("Could not delete this post. Please retry.")}finally{setBusy(null)}};
 useEffect(()=>{let alive=true;void(async()=>{try{
 const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){if(alive)setError("Sign in to view your posts.");return}
 const {data,error:postsError}=await db.from("posts").select("id,body,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(60);if(postsError)throw postsError;
 const rows:Post[]=(data||[]).map(p=>({id:p.id,body:p.body||"",created_at:p.created_at||""}));
 if(rows.length){const {data:media}=await db.from("post_media").select("post_id,storage_path,mime_type").in("post_id",rows.map(p=>p.id));if(media?.length){const {data:urls}=await db.storage.from("community-media").createSignedUrls(media.map(m=>m.storage_path||""),3600);for(let i=0;i<media.length;i++){const row=rows.find(p=>p.id===media[i].post_id);if(row&&!row.media&&urls?.[i]?.signedUrl){row.media=urls[i].signedUrl??undefined;row.video=media[i].mime_type?.startsWith("video/")??false}}}}
 if(alive)setPosts(rows);
 }catch{if(alive)setError("Posts could not be loaded. Please try again.");}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[]);
 return <section className="profileMagazine" aria-label="My published posts">
 <style>{`
.profileMagazine{color:#211c1e!important;background:#f8f5ee!important;border-radius:4px;padding:clamp(15px,3vw,28px);min-height:320px;position:relative;font-family:Arial,sans-serif}
.profileMagazine .pmHead{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #301b29;padding-bottom:15px;margin-bottom:18px;gap:10px}
.profileMagazine .pmHead h3{font:700 clamp(26px,5vw,44px) Georgia,serif;letter-spacing:-.055em;margin:0;color:#271c22}
.profileMagazine .pmToggle{height:38px;min-width:38px;border:1px solid #3d2935;border-radius:50%;background:#fff;color:#392333;cursor:pointer;font-size:18px;box-shadow:0 4px 13px #0001;transition:transform .3s,background .3s}
.profileMagazine .pmToggle[aria-pressed=true]{background:#392333;color:#fff;transform:rotate(-12deg)}
.profileMagazine .pmCount{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#72525f;margin:0 0 20px}
.profileMagazine .pmGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(12px,3vw,24px);align-items:start}
.profileMagazine .pmPost{min-width:0;position:relative;background:#fff;color:#211a20;border:1px solid #e3d9d4;box-shadow:0 12px 24px #26162224,0 3px 5px #00000012;border-radius:3px;padding:0 0 14px;overflow:hidden;animation:pmFloat 8s ease-in-out infinite;transition:box-shadow .4s,transform .4s}
.profileMagazine .pmPost:nth-child(3n+2){animation-delay:-2.4s;animation-duration:9.5s}
.profileMagazine .pmPost:nth-child(3n){animation-delay:-5s;animation-duration:10s}
.profileMagazine .pmPost:hover{box-shadow:0 18px 35px #26162235}
.profileMagazine .pmGrid.pmEditing .pmPost{animation:pmWiggle .48s ease-in-out infinite alternate;cursor:pointer}
.profileMagazine .pmGrid.pmEditing .pmPost:nth-child(even){animation-delay:-.24s;animation-direction:alternate-reverse}
.profileMagazine .pmCover{width:100%;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(130deg,#ede6e0,#cbb8bf);display:grid;place-items:center}
.profileMagazine .pmCover img,.profileMagazine .pmCover video{width:100%;height:100%;object-fit:cover}
.profileMagazine .pmTextCover{font:700 clamp(15px,2.7vw,25px) Georgia,serif;text-align:center;padding:14px;overflow-wrap:anywhere;color:#3b2431}
.profileMagazine .pmInfo{padding:12px 13px 0}
.profileMagazine .pmTitle{font:700 clamp(17px,2.9vw,27px)/1.14 Georgia,serif;margin:0 0 8px;overflow-wrap:anywhere}
.profileMagazine .pmDate{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#936576}
.profileMagazine .pmExcerpt{font-size:12px;line-height:1.5;color:#6c5d60;margin:8px 0}
.profileMagazine .pmRead{display:inline-block;font-size:11px;letter-spacing:.05em;color:#4a293a;text-decoration:none;border-bottom:1px solid #4a293a;margin-top:12px}
.profileMagazine .pmDelete{position:absolute;top:7px;right:7px;z-index:2;border:1px solid #e4b8bd;background:#fff;color:#a2263a;border-radius:50%;width:29px;height:29px;cursor:pointer;box-shadow:0 2px 8px #0004;font-size:17px}
.profileMagazine .pmEmpty{border:1px solid #d6c4c9;padding:25px;color:#4c3941}
.profileMagazine .pmEditorBackdrop{position:fixed;inset:0;z-index:2147483000;background:#120e12a8;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(9px)}
.profileMagazine .pmEditor{width:min(100%,620px);max-height:90dvh;overflow:auto;background:#f8f5ee;color:#241820;border-radius:4px;padding:clamp(18px,4vw,32px);box-shadow:0 28px 100px #0008;border-top:6px solid #412637}
.profileMagazine .pmEditor h3{font:700 30px Georgia,serif;margin:0 0 8px}
.profileMagazine .pmEdit{display:block;width:100%;box-sizing:border-box;min-height:230px;padding:16px;border:1px solid #bca8af;background:#fff;color:#271d22;font:16px/1.6 Georgia,serif;resize:vertical;margin-top:20px}
.profileMagazine .pmActions{display:flex;gap:12px;margin-top:18px;justify-content:flex-end}
.profileMagazine .pmActions button{border:1px solid #4a303c;background:#fff;color:#382431;padding:11px 17px;border-radius:2px;cursor:pointer;font-weight:700}
.profileMagazine .pmActions button:first-child{background:#3b2633;color:#fff}
.profileMagazine button:disabled{opacity:.5;cursor:wait}
@keyframes pmFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes pmWiggle{0%{transform:rotate(-.65deg) translateY(-1px)}100%{transform:rotate(.65deg) translateY(1px)}}
@media(min-width:780px){.profileMagazine .pmGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(prefers-reduced-motion:reduce){.profileMagazine .pmPost,.profileMagazine .pmGrid.pmEditing .pmPost{animation:none}}
`}</style>
 <header className="pmHead"><h3>THE COLLECTION</h3><button className="pmToggle" type="button" aria-label={editMode?"Finish editing posts":"Edit posts"} title={editMode?"Done":"Edit posts"} aria-pressed={editMode} onClick={()=>{setEditMode(v=>!v);setEditing(null)}}>{editMode?"✓":"✎"}</button></header>
 {notice&&<p role="status" style={{fontSize:13,color:"#754455"}}>{notice}</p>}
 {loading?<p>Loading your published posts…</p>:error?<p role="alert">{error}</p>:posts.length===0?<div className="pmEmpty">Your published stories will appear here.</div>:<>
 <p className="pmCount">{posts.length} published {posts.length===1?"story":"stories"} · {editMode?"SELECT A STORY TO EDIT":"YOUR STORIES"}</p>
 <div className={`pmGrid ${editMode?"pmEditing":""}`}>{posts.map(post=>{const content=post.body.trim()||"Untitled story";const [first,...rest]=content.split("\n").filter(Boolean);const title=first.slice(0,130);return <article className="pmPost" key={post.id} onClick={()=>{if(editMode)editPost(post)}} onKeyDown={e=>{if(editMode&&(e.key==="Enter"||e.key===" ")){e.preventDefault();editPost(post)}}} role={editMode?"button":undefined} tabIndex={editMode?0:undefined} aria-label={editMode?`Edit ${title}`:undefined}>
 {editMode&&<button type="button" className="pmDelete" aria-label={`Delete ${title}`} disabled={!!busy} onClick={e=>{e.stopPropagation();void deletePost(post)}}>×</button>}
 <div className="pmCover">{post.media?(post.video?<video src={post.media} muted playsInline preload="metadata"/>:<img src={post.media} alt="" loading="lazy"/>):<div className="pmTextCover">{title}</div>}</div>
 <div className="pmInfo"><h4 className="pmTitle">{title}</h4><div className="pmDate">{new Date(post.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</div>{rest.length>0&&<p className="pmExcerpt">{rest.join(" ").slice(0,110)}</p>}{!editMode&&<Link className="pmRead" href={`/posts/story/${post.id}`}>READ STORY ↗</Link>}</div></article>})}</div></>}
 {editing&&<div className="pmEditorBackdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><div className="pmEditor" role="dialog" aria-modal="true" aria-label="Edit published story"><div className="pmDate">1MUSLIM · EDITORIAL STUDIO</div><h3>Edit your story</h3><p style={{fontSize:13,color:"#6e5b61"}}>Update the text. Existing images and videos stay unchanged.</p><label htmlFor="pm-story-edit">Story text</label><textarea id="pm-story-edit" className="pmEdit" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={20000} autoFocus/><div className="pmActions"><button type="button" disabled={!!busy} onClick={()=>{const post=posts.find(p=>p.id===editing);if(post)void saveText(post)}}>Save changes</button><button type="button" disabled={!!busy} onClick={()=>setEditing(null)}>Cancel</button></div></div></div>}
 </section>
}
