"use client";
import {useEffect,useState} from "react";
import {createClient} from "../../utils/supabase/client";
type Media={id:string;post_id:string;user_id:string;storage_path:string;created_at:string;url:string;title:string;views:number};
export default function CommunityMediaGallery({userId}:{userId?:string}){
 const [items,setItems]=useState<Media[]>([]),[loading,setLoading]=useState(true),[query,setQuery]=useState("");
 useEffect(()=>{let alive=true;setLoading(true);void(async()=>{try{
 const db=createClient();let request=db.from("post_media").select("id,post_id,user_id,storage_path,created_at").ilike("mime_type","video/%").order("created_at",{ascending:false}).limit(100);
 if(userId)request=request.eq("user_id",userId);
 const {data:media}=await request;if(!media?.length){if(alive)setItems([]);return}
 const ids=[...new Set(media.map(x=>x.post_id))];const [{data:posts},{data:urls},{data:views}]=await Promise.all([db.from("posts").select("id,user_id,body").in("id",ids),db.storage.from("community-media").createSignedUrls(media.map(x=>x.storage_path),3600),db.from("video_views").select("post_id").in("post_id",ids)]);
 const byId=new Map((posts||[]).map(x=>[x.id,x]));const counts:Record<string,number>={};for(const v of views||[])counts[v.post_id]=(counts[v.post_id]||0)+1;
 const found=media.flatMap((m,i)=>{const post=byId.get(m.post_id),url=urls?.[i]?.signedUrl;if(!post||post.user_id!==m.user_id||!url)return [];return [{...m,url,title:post.body||"Video",views:counts[m.post_id]||0}]});
 if(alive)setItems(found)
 }catch{if(alive)setItems([])}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[userId]);
 const filtered=items.filter(x=>x.title.toLowerCase().includes(query.toLowerCase()));
 return <section aria-label={userId?"Member videos":"All community videos"} style={{width:"100%",minWidth:0}}>
 {!userId&&<input aria-label="Search videos" placeholder="🔎 Search videos" value={query} onChange={e=>setQuery(e.target.value)} style={{boxSizing:"border-box",width:"100%",margin:"8px 0 14px",padding:12,borderRadius:12,border:"1px solid #d7b97677",background:"#092d25",color:"white"}}/>}
 {loading?<p>Loading videos…</p>:!filtered.length?<p style={{opacity:.8}}>No videos found.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:9}}>
 {filtered.map(v=><article key={v.id} style={{minWidth:0,overflow:"hidden",border:"1px solid #d7b97699",borderRadius:14,background:"linear-gradient(160deg,#194b3d,#082a23)"}}><video src={v.url} controls playsInline preload="metadata" style={{display:"block",width:"100%",aspectRatio:"9/16",objectFit:"cover",background:"#00100b"}}/><div style={{padding:"6px 7px",fontSize:11}}><div title={v.title} style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div><span style={{opacity:.8}}>◉ {v.views} views</span></div></article>)}
 </div>}</section>
}
