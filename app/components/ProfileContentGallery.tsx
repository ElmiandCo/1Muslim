"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Item={id:string;post_id:string;url:string;mime_type:string;created_at:string;body:string;kind:"video"|"image"|"verse";likes:number;thumbnail?:string};
type Category="All"|"Videos"|"Images"|"Qur’an Verses";
const categories:Category[]=["All","Videos","Images","Qur’an Verses"];
const dateLabel=(iso:string)=>{const days=Math.floor((Date.now()-new Date(iso).getTime())/86400000);return days<1?"Today":days<2?"Yesterday":days<7?"This Week":days<31?"This Month":new Date(iso).toLocaleDateString(undefined,{month:"long",year:"numeric"})};
export default function ProfileContentGallery(){
 const [items,setItems]=useState<Item[]>([]),[category,setCategory]=useState<Category>("All"),[query,setQuery]=useState(""),[sort,setSort]=useState("newest"),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[editing,setEditing]=useState<string|null>(null);
 useEffect(()=>{let live=true;void(async()=>{try{
  const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)return;
  const {data:media,error}=await db.from("post_media").select("id,post_id,storage_path,mime_type,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(500);
  if(error)throw error;
  const ids=[...new Set((media||[]).map(m=>m.post_id))];
  const [{data:posts},{data:urls},{data:likes}]=await Promise.all([
   ids.length?db.from("posts").select("id,body,created_at").in("id",ids):Promise.resolve({data:[]}),
   media?.length?db.storage.from("community-media").createSignedUrls(media.map(m=>m.storage_path),3600):Promise.resolve({data:[]}),
   ids.length?db.from("post_likes").select("post_id").in("post_id",ids):Promise.resolve({data:[]})
  ]);
  const byPost=new Map((posts||[]).map(p=>[p.id,p]));const counts=new Map<string,number>();for(const l of likes||[])counts.set(l.post_id,(counts.get(l.post_id)||0)+1);
  const result:Item[]=(media||[]).map((m,i)=>{const post=byPost.get(m.post_id);const body=post?.body||"";const kind=/video\//.test(m.mime_type)?"video":/Qur[’']?an\s+\d+:\d+/i.test(body)?"verse":"image";return {id:m.id,post_id:m.post_id,url:urls?.[i]?.signedUrl||"",mime_type:m.mime_type,created_at:m.created_at,body,kind,likes:counts.get(m.post_id)||0}}).filter(m=>m.url);
  // Verse-only posts are included even when they contain no uploaded media.
  const {data:versePosts}=await db.from("posts").select("id,body,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(500);
  for(const p of versePosts||[]){if(/Qur[’']?an\s+\d+:\d+/i.test(p.body||"")&&!result.some(m=>m.post_id===p.id&&m.kind==="verse"))result.push({id:"verse-"+p.id,post_id:p.id,url:"",mime_type:"text/plain",created_at:p.created_at,body:p.body||"",kind:"verse",likes:counts.get(p.id)||0})}
  if(live)setItems(result);
 }catch{if(live)setNotice("Could not load your gallery.")}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
 const filtered=useMemo(()=>items.filter(x=>(category==="All"||category==="Videos"&&x.kind==="video"||category==="Images"&&x.kind==="image"||category==="Qur’an Verses"&&x.kind==="verse")&&(!query||x.body.toLowerCase().includes(query.toLowerCase())||x.created_at.includes(query))).sort((a,b)=>sort==="oldest"?a.created_at.localeCompare(b.created_at):sort==="likes"?b.likes-a.likes:b.created_at.localeCompare(a.created_at)),[items,category,query,sort]);
 const groups=useMemo(()=>{const map=new Map<string,Item[]>();for(const x of filtered){const label=sort==="likes"?"Most liked":dateLabel(x.created_at);map.set(label,[...(map.get(label)||[]),x])}return [...map.entries()]},[filtered,sort]);
 const editCaption=async(item:Item)=>{const value=window.prompt("Edit post caption",item.body);if(value===null||value===item.body)return;const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)return;const {error}=await db.from("posts").update({body:value}).eq("id",item.post_id).eq("user_id",user.id);if(error){setNotice("Caption could not be saved.");return}setItems(old=>old.map(x=>x.post_id===item.post_id?{...x,body:value}:x));setNotice("Caption updated.")};
 const removePost=async(item:Item)=>{if(!window.confirm("Remove this post and its media permanently?"))return;const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)return;const {error}=await db.from("posts").delete().eq("id",item.post_id).eq("user_id",user.id);if(error){setNotice("Could not remove post.");return}setItems(old=>old.filter(x=>x.post_id!==item.post_id));setNotice("Post removed.")};
 const addMore=()=>window.dispatchEvent(new Event("1muslim:open-community-posts"));
 return <section className="profile-content-gallery" aria-label="My content gallery">
 <style>{`
 .profile-content-gallery{color:#f5ecd5;min-height:200px}.profile-content-filters{display:flex;gap:6px;overflow-x:auto;padding:6px 0 10px}.profile-content-filters button,.profile-content-gallery select{border:1px solid var(--theme-edge,#a7b9a3);background:rgba(8,48,42,.48);color:inherit;border-radius:16px;padding:8px 10px;white-space:nowrap;font-size:12px}.profile-content-filters button[aria-selected=true]{background:color-mix(in srgb,var(--theme-edge,#57a889) 28%,transparent)}.profile-content-tools{display:flex;gap:8px;margin-bottom:12px}.profile-content-tools input{flex:1;min-width:0;border:1px solid var(--theme-edge,#a7b9a3);border-radius:12px;padding:10px;background:rgba(8,48,42,.35);color:inherit}.profile-content-masonry{columns:2;column-gap:9px}.profile-content-card{break-inside:avoid;margin:0 0 9px;border:1px solid color-mix(in srgb,var(--theme-edge,#7ba68f) 40%,transparent);border-radius:14px;background:rgba(9,40,37,.45);backdrop-filter:blur(14px);overflow:hidden}.profile-content-card img,.profile-content-card video{width:100%;height:auto;display:block;object-fit:cover}.profile-content-card:nth-child(3n+2) video{aspect-ratio:3/4}.profile-content-card:nth-child(3n+1) video{aspect-ratio:4/5}.profile-content-card figcaption{padding:8px;font-size:11px}.profile-content-card summary{cursor:pointer}.profile-content-card button{font-size:11px;border:0;background:transparent;color:inherit;padding:6px}.profile-content-add{width:100%;padding:15px;border:1px dashed var(--theme-edge,#a7b9a3);border-radius:16px;background:rgba(8,48,42,.35);color:inherit;cursor:pointer}.profile-content-scroll{max-height:60dvh;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}@media(min-width:680px){.profile-content-masonry{columns:3}}@media(min-width:1000px){.profile-content-masonry{columns:5}}@media(prefers-reduced-motion:no-preference){.profile-content-card{transition:transform .25s ease}.profile-content-card:hover{transform:translateY(-3px)}}`}</style>
 <nav className="profile-content-filters" aria-label="Content categories">{categories.map(c=><button key={c} type="button" aria-selected={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
 <div className="profile-content-tools"><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your posts…" aria-label="Search posts"/><select aria-label="Sort content" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="likes">Most liked</option></select></div>
 {notice&&<p role="status">{notice}</p>}
 <div className="profile-content-scroll">{loading?<p>Loading content…</p>:groups.length?groups.map(([date,group])=><div key={date}><h3 style={{fontSize:12,opacity:.75,margin:"12px 0 8px"}}>{date}</h3><div className="profile-content-masonry">{group.map(item=><figure key={item.id} className="profile-content-card">
 {item.kind==="video"?<video src={item.url} controls playsInline preload="metadata" aria-label={item.body||"Your video"}/>:item.url?<img src={item.url} alt={item.body||"Post image"} loading="lazy"/>:<div style={{padding:14,whiteSpace:"pre-wrap"}}>{item.body}</div>}
 <figcaption><div style={{overflowWrap:"anywhere"}}>{item.body.slice(0,90)||"Your post"}</div><small>♥ {item.likes}</small><details><summary aria-label="Post actions">•••</summary><button type="button" onClick={()=>void editCaption(item)}>Edit subtitle / caption</button><button type="button" onClick={()=>void removePost(item)}>Remove post</button></details></figcaption>
 </figure>)}</div></div>):<p style={{opacity:.8,fontSize:13}}>No posts in this category yet.</p>}
 <button type="button" className="profile-content-add" onClick={addMore}>＋ Add More</button></div></section>;
}
