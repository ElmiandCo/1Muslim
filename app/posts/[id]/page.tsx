"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import ModerationActions from "../../components/ModerationActions";
import {createClient} from "../../../utils/supabase/client";
type Post={id:string;body:string;created_at:string;user_id:string};
export default function PostDetail(){
 const params=useParams();const id=String(params.id||"");const [post,setPost]=useState<Post|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{if(!/^[0-9a-f-]{36}$/i.test(id)){setLoading(false);setError("Invalid post link.");return}let alive=true;const db=createClient();void db.from("posts").select("id,body,created_at,user_id").eq("id",id).maybeSingle().then(({data,error})=>{if(!alive)return;setPost(data);setError(error?.message||(!data?"This post is unavailable.":""));setLoading(false)});return()=>{alive=false}},[id]);
 const share=async()=>{try{if(navigator.share)await navigator.share({title:"1Muslim post",text:post?.body||"",url:location.href});else await navigator.clipboard.writeText(location.href)}catch{}};
 return <main style={{minHeight:"100dvh",background:"var(--bg)",color:"var(--text)"}}><SiteNav/><section style={{maxWidth:690,margin:"auto",padding:"35px 18px"}}><Link href="/community" style={{color:"var(--accent)"}}>← Community</Link><h1 style={{fontSize:32,margin:"20px 0"}}>Post ✨</h1>{loading?<p>Loading post…</p>:error?<p role="status">{error}</p>:post&&<article style={{padding:24,borderRadius:24,border:"1px solid #b99c5588",background:"var(--panel2)",boxShadow:"0 15px 55px #0003"}}><Link href={"/profile/"+post.user_id} style={{color:"var(--accent)",fontWeight:800}}>View creator profile ↗</Link><p style={{fontSize:12,opacity:.7}}>{new Date(post.created_at).toLocaleString()}</p><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:21,lineHeight:1.6}}>{post.body}</p><ModerationActions targetType="post" targetId={post.id} onDeleted={()=>{setPost(null);setError("This post was permanently deleted.")}}/><button onClick={()=>void share()} style={{border:"1px solid #b99c55",borderRadius:999,padding:"11px 18px",background:"#244532",color:"white"}}>↗ Share post</button></article>}</section></main>;
}