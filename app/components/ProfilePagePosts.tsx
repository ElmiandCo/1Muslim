"use client";

import {useCallback,useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import ProfilePublicMedia from "./ProfilePublicMedia";
import {safeMediaUrl,youtubeEmbed,isDirectVideo,uploadMemberMedia,type MemberMediaKind} from "./profile-member-media";
import "./ProfilePagePosts.css";

type PagePost={id:string;profile_id:string;author_id:string;body:string;media_url:string|null;media_kind:"none"|MemberMediaKind;created_at:string};
type PageComment={id:string;post_id:string;author_id:string;body:string;created_at:string};
type PageReaction={post_id:string;user_id:string;reaction:"like"|"heart"};
type Author={id:string;display_name:string|null;username:string|null;avatar_url:string|null;avatar_gender:string|null;avatar_config:Record<string,unknown>|null};
const profilePicture=(user?:Author)=>{
 const selected=user?.avatar_config?.selectedAvatarUrl;
 return typeof selected==="string"&&selected.trim()?selected:user?.avatar_url||(user?.avatar_gender==="female"?"/assets/avatars/Default-women.png":"/assets/avatars/default-male.jpg");
};
const displayName=(user?:Author)=>user?.display_name||user?.username||"1Muslim member";
const when=(iso:string)=>new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"});
const unique=(values:string[])=>Array.from(new Set(values.filter(Boolean)));

export default function ProfilePagePosts({profileId,isOwner=false}:{profileId:string;isOwner?:boolean}){
 const [viewerId,setViewerId]=useState<string|null>(null),[posts,setPosts]=useState<PagePost[]>([]);
 const [authors,setAuthors]=useState<Record<string,Author>>({}),[reactions,setReactions]=useState<PageReaction[]>([]);
 const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
 const [comments,setComments]=useState<Record<string,PageComment[]>>({});
 const [commentPages,setCommentPages]=useState<Record<string,number>>({}),[olderComments,setOlderComments]=useState<Record<string,boolean>>({});
 const [openComments,setOpenComments]=useState<string|null>(null),[commentDraft,setCommentDraft]=useState("");
 const [expanded,setExpanded]=useState(false),[draft,setDraft]=useState(""),[mediaUrl,setMediaUrl]=useState("");
 const [mediaKind,setMediaKind]=useState<MemberMediaKind>("image"),[file,setFile]=useState<File|null>(null);
 const [saving,setSaving]=useState(false),[busyComment,setBusyComment]=useState(false),[status,setStatus]=useState(""),[loading,setLoading]=useState(true);
 const [hasMore,setHasMore]=useState(false),[limit,setLimit]=useState(12);
 useEffect(()=>{let live=true;void createClient().auth.getUser().then(({data})=>{if(live)setViewerId(data.user?.id||null)});return()=>{live=false}},[]);
 const load=useCallback(async()=>{
  const db=createClient();
  const {data:postData,error}=await db.from("profile_page_posts").select("id,profile_id,author_id,body,media_url,media_kind,created_at").eq("profile_id",profileId).order("created_at",{ascending:false}).limit(limit+1);
  if(error){setStatus("Page posts are temporarily unavailable.");setLoading(false);return}
  const rows=(postData||[]).slice(0,limit) as PagePost[];
  setHasMore((postData||[]).length>limit);setPosts(rows);setLoading(false);
  if(!rows.length){setReactions([]);setCommentCounts({});return}
  const ids=rows.map(p=>p.id);
  const [people,reacts,commentList]=await Promise.all([
   db.from("profiles").select("id,display_name,username,avatar_url,avatar_gender,avatar_config").in("id",unique(rows.map(x=>x.author_id))),
   db.from("profile_page_post_reactions").select("post_id,user_id,reaction").in("post_id",ids),
   db.from("profile_page_post_comments").select("post_id").in("post_id",ids).limit(3000)
  ]);
  if(people.data)setAuthors(current=>({...current,...Object.fromEntries((people.data as Author[]).map(p=>[p.id,p]))}));
  if(reacts.data)setReactions(reacts.data as PageReaction[]);
  if(commentList.data){const counts:Record<string,number>={};for(const c of commentList.data)counts[c.post_id]=(counts[c.post_id]||0)+1;setCommentCounts(counts)}
 },[profileId,limit]);
 useEffect(()=>{void load();const onFocus=()=>{if(document.visibilityState==="visible")void load()};document.addEventListener("visibilitychange",onFocus);const timer=setInterval(()=>{if(document.visibilityState==="visible")void load()},60000);return()=>{document.removeEventListener("visibilitychange",onFocus);clearInterval(timer)}},[load]);

 const publish=async()=>{
  if(!viewerId||viewerId===profileId){setStatus("Page posts can only be left on another member's page.");return}
  if(!draft.trim()&&!file&&!mediaUrl.trim()){setStatus("Write a note or attach media to post.");return}
  setSaving(true);setStatus("");
  try{
   let url:string|null=null,kind:"none"|MemberMediaKind="none";
   if(file){const uploaded=await uploadMemberMedia(file,viewerId);url=uploaded.url;kind=uploaded.kind}
   else if(mediaUrl.trim()){url=safeMediaUrl(mediaUrl);if(!url)throw Error("Please enter a valid https:// media link.");kind=youtubeEmbed(url)||isDirectVideo(url)?"video":mediaKind}
   const db=createClient();
   const {error}=await db.from("profile_page_posts").insert({profile_id:profileId,author_id:viewerId,body:draft.trim(),media_url:url,media_kind:kind});
   if(error)throw Error(error.message);
   setDraft("");setMediaUrl("");setFile(null);setExpanded(false);setStatus("✓ Your page post is now visible.");setLimit(x=>Math.max(12,x));await load();
  }catch(e){setStatus(e instanceof Error?e.message:"Unable to publish page post")}finally{setSaving(false)}
 };
 const erasePost=async(row:PagePost)=>{
  if(!viewerId||(viewerId!==row.author_id&&viewerId!==row.profile_id))return;
  if(!window.confirm("Remove this page post and all its comments and reactions?"))return;
  setStatus("");
  const {error}=await createClient().from("profile_page_posts").delete().eq("id",row.id);
  if(error){setStatus(error.message);return}
  setPosts(prev=>prev.filter(p=>p.id!==row.id));setStatus("Page post removed.");void load();
 };
 const react=async(postId:string,kind:"like"|"heart")=>{
  if(!viewerId){setStatus("Sign in to react to page posts.");return}
  const exists=reactions.some(r=>r.post_id===postId&&r.user_id===viewerId&&r.reaction===kind);
  setReactions(prev=>exists?prev.filter(r=>!(r.post_id===postId&&r.user_id===viewerId&&r.reaction===kind)):[...prev,{post_id:postId,user_id:viewerId,reaction:kind}]);
  const db=createClient();
  const result=exists?await db.from("profile_page_post_reactions").delete().eq("post_id",postId).eq("user_id",viewerId).eq("reaction",kind):await db.from("profile_page_post_reactions").insert({post_id:postId,user_id:viewerId,reaction:kind});
  if(result.error){setStatus("Could not save your reaction.");void load()}
 };
 const loadComments=async(postId:string,pageSize?:number)=>{
  const size=pageSize||commentPages[postId]||50;
  const db=createClient();
  // Newest first before reversing to chronological display, so no new comment disappears after 100.
  const {data,error}=await db.from("profile_page_post_comments").select("id,post_id,author_id,body,created_at").eq("post_id",postId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(size+1);
  if(error){setStatus("Comments are temporarily unavailable.");return}
  setOlderComments(v=>({...v,[postId]:(data||[]).length>size}));
  setCommentPages(v=>({...v,[postId]:size}));
  const rows=((data||[]).slice(0,size) as PageComment[]).reverse();setComments(v=>({...v,[postId]:rows}));
  const missing=unique(rows.map(c=>c.author_id)).filter(id=>!authors[id]);
  if(missing.length){const {data:people}=await db.from("profiles").select("id,display_name,username,avatar_url,avatar_gender,avatar_config").in("id",missing);if(people)setAuthors(v=>({...v,...Object.fromEntries((people as Author[]).map(p=>[p.id,p]))}))}
 };
 const toggleComments=(id:string)=>{if(openComments===id){setOpenComments(null);return}setOpenComments(id);setCommentDraft("");void loadComments(id)};
 const loadOlder=(id:string)=>{const size=(commentPages[id]||50)+50;void loadComments(id,size)};
 const sendComment=async(postId:string)=>{
  if(!viewerId){setStatus("Sign in to comment.");return}
  const body=commentDraft.trim();if(!body||body.length>500)return;
  setBusyComment(true);const {error}=await createClient().from("profile_page_post_comments").insert({post_id:postId,author_id:viewerId,body});
  setBusyComment(false);
  if(error){setStatus(error.message);return}
  setCommentDraft("");setCommentCounts(prev=>({...prev,[postId]:(prev[postId]||0)+1}));void loadComments(postId);
 };
 const eraseComment=async(comment:PageComment,post:PagePost)=>{
  if(!viewerId||(viewerId!==comment.author_id&&viewerId!==post.profile_id))return;
  const {error}=await createClient().from("profile_page_post_comments").delete().eq("id",comment.id);
  if(error){setStatus(error.message);return}
  setCommentCounts(prev=>({...prev,[post.id]:Math.max(0,(prev[post.id]||0)-1)}));void loadComments(post.id);
 };
 return <section className="memberPagePosts" aria-label="Page Posts" id={"page-posts-"+profileId}>
  <div className="memberPagePostsHeading"><div><span className="memberPagePostsEyebrow">THEIR PAGE · YOUR WORDS</span><h2>✎ Page Posts <small>{posts.length?posts.length+(hasMore?"+":""):""}</small></h2></div><span className="memberPagePostsLabel">From the Ummah ✧</span></div>
  {!isOwner&&viewerId!==profileId&&<div className="memberPageComposer">
   <button className="memberPageComposerToggle" type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}><span className="memberPageComposerPlus">✚</span><span>{viewerId?"Leave a page post…":"Sign in to leave a page post"}</span><span aria-hidden="true">{expanded?"⌃":"↗"}</span></button>
   {expanded&&<div className="memberPageComposeFields"><textarea rows={3} maxLength={1200} placeholder="Leave a message on their page…" value={draft} onChange={e=>setDraft(e.target.value)} aria-label="Your page post message"/><div className="memberPageComposeMedia"><label>↥ Upload image or video<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={e=>{setFile(e.target.files?.[0]||null);e.currentTarget.value=""}}/></label><span>or</span><input type="url" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} disabled={!!file} placeholder="YouTube or media URL (https://)" aria-label="Page post media URL"/><select value={mediaKind} onChange={e=>setMediaKind(e.target.value as MemberMediaKind)} disabled={!!file} aria-label="Link media type"><option value="image">Image</option><option value="video">Video</option></select></div>{file&&<p className="memberPageFile">✓ {file.name} <button type="button" onClick={()=>setFile(null)} aria-label="Remove selected file">×</button></p>}<button className="memberPageSubmit" type="button" disabled={!viewerId||saving||(!draft.trim()&&!file&&!mediaUrl.trim())} onClick={()=>void publish()}>{saving?"Posting…":"Post to their page ↗"}</button></div>}
  </div>}
  {loading?<div className="memberPagePostsEmpty">Loading page posts…</div>:posts.length?<div className="memberPagePostsGrid">{posts.map(post=>{
   const author=authors[post.author_id];
   const likes=reactions.filter(r=>r.post_id===post.id&&r.reaction==="like");
   const hearts=reactions.filter(r=>r.post_id===post.id&&r.reaction==="heart");
   const isVideo=post.media_kind==="video",isImage=post.media_kind==="image";
   const type=isVideo?"video":isImage?"image":"text";
   return <article className={"memberPagePost memberPagePost-"+type} key={post.id}>
    <div className="memberPagePostAuthor"><img src={profilePicture(author)} alt="" loading="lazy"/><div><strong>{displayName(author)}</strong><small>{when(post.created_at)}</small></div>{viewerId&&(viewerId===post.author_id||viewerId===profileId)&&<button type="button" className="memberPagePostDelete" title="Remove page post" aria-label={"Remove page post by "+displayName(author)} onClick={()=>void erasePost(post)}>×</button>}</div>
    {post.body?.trim()&&<p className="memberPagePostBody">{post.body}</p>}
    {post.media_url&&post.media_kind!=="none"&&<div className="memberPagePostMedia"><ProfilePublicMedia kind={post.media_kind} url={post.media_url} title={"Page post from "+displayName(author)} /></div>}
    <div className="memberPagePostActions"><button type="button" aria-pressed={likes.some(r=>r.user_id===viewerId)} onClick={()=>void react(post.id,"like")} title="Like this page post"><span aria-hidden="true">👍</span> {likes.length||""}</button><button type="button" aria-pressed={hearts.some(r=>r.user_id===viewerId)} onClick={()=>void react(post.id,"heart")} title="Love this page post"><span aria-hidden="true">♡</span> {hearts.length||""}</button><button type="button" aria-expanded={openComments===post.id} onClick={()=>toggleComments(post.id)} title="Read or leave a comment"><span aria-hidden="true">▤</span> {commentCounts[post.id]||""}</button></div>
    {openComments===post.id&&<div className="memberPageComments"><div className="memberPageCommentList">{(comments[post.id]||[]).map(c=><div className="memberPageComment" key={c.id}><img src={profilePicture(authors[c.author_id])} alt=""/><p><strong>{displayName(authors[c.author_id])}</strong> {c.body}</p>{viewerId&&(viewerId===c.author_id||viewerId===profileId)&&<button type="button" title="Delete comment" aria-label="Delete comment" onClick={()=>void eraseComment(c,post)}>×</button>}</div>)}{!comments[post.id]?.length&&<small>Be the first to comment.</small>}</div>{olderComments[post.id]&&<button type="button" className="memberPageCommentsMore" onClick={()=>loadOlder(post.id)}>Show earlier comments ↑</button>}{viewerId&&<form onSubmit={e=>{e.preventDefault();void sendComment(post.id)}}><input aria-label="Your comment" value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} maxLength={500} placeholder="Write a comment…"/><button type="submit" disabled={!commentDraft.trim()||busyComment}>↗</button></form>}</div>}
   </article>
  })}</div>:<div className="memberPagePostsEmpty">{isOwner?"Your visitors' page posts will appear here.":"No page posts yet. Leave the first one! ✨"}</div>}
  {hasMore&&<button className="memberPagePostsMore" type="button" onClick={()=>setLimit(n=>n+12)}>View more page posts ↓</button>}
  {status&&<p className="memberPagePostsStatus" role="status">{status}</p>}
 </section>;
}
