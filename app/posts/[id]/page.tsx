"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import ModerationActions from "../../components/ModerationActions";
import PostViewer,{type ViewerPost,type ViewerAuthor,type ViewerMedia} from "../../components/PostViewer";
import {createClient} from "../../../utils/supabase/client";
export default function PostDetail(){
 const params=useParams();const id=String(params.id||"");
 const [post,setPost]=useState<ViewerPost|null>(null);
 const [author,setAuthor]=useState<ViewerAuthor|null>(null);
 const [media,setMedia]=useState<ViewerMedia[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{if(!/^[0-9a-f-]{36}$/i.test(id)){setLoading(false);setError("Invalid post link.");return}
 let alive=true;const db=createClient();
 void (async()=>{const {data,error}=await db.from("posts").select("id,body,created_at,user_id").eq("id",id).maybeSingle();if(!alive)return;
 setPost(data);setError(error?.message||(!data?"This post is unavailable.":""));setLoading(false);
 if(data?.id){const {data:files}=await db.from("post_media").select("id,storage_path,file_name,mime_type").eq("post_id",data.id).order("created_at",{ascending:true});if(alive&&files?.length){const paths=files.map(f=>f.storage_path);const {data:urls}=await db.storage.from("community-media").createSignedUrls(paths,3600);if(alive)setMedia(files.flatMap((f,i)=>urls?.[i]?.signedUrl?[{id:String(f.id),url:urls[i].signedUrl,mime_type:String(f.mime_type||""),file_name:f.file_name||null}]:[]))}}
 if(data?.user_id){const {data:profile}=await db.from("profiles").select("display_name,username,avatar_url").eq("id",data.user_id).maybeSingle();if(alive)setAuthor(profile)}
 })();return()=>{alive=false}},[id]);
 const share=async()=>{try{if(navigator.share)await navigator.share({title:"1Muslim post",text:post?.body||"",url:location.href});else await navigator.clipboard.writeText(location.href)}catch{}};
 return <main style={{minHeight:"100dvh",background:"var(--bg)",color:"var(--text)"}}><SiteNav/>
 <section style={{width:"min(100% - 24px,820px)",margin:"auto",padding:"clamp(20px,4vw,36px) 0 130px"}}>
 <Link href="/community" style={{display:"inline-flex",alignItems:"center",gap:8,color:"var(--accent)",textDecoration:"none",marginBottom:18,fontSize:14}}>← Back to Ummah</Link>
 {loading?<p role="status">Loading post…</p>:error?<p role="status">{error}</p>:post&&<PostViewer post={post} author={author} media={media} share={()=>void share()} actions={<ModerationActions targetType="post" targetId={post.id} ownerId={post.user_id} onDeleted={()=>{setPost(null);setError("This post was permanently deleted.")}}/>}/>}
 </section></main>
}
