import {NextResponse} from "next/server";
import {createClient} from "../../../utils/supabase/server";
export async function GET(request:Request){
 const db=await createClient();const url=new URL(request.url);const postId=url.searchParams.get("postId");
 let query=db.from("ummah_post_comments").select("id,post_id,author_id,parent_id,body,image_path,created_at").order("created_at",{ascending:true}).limit(500);
 if(postId)query=query.eq("post_id",postId);
 const {data,error}=await query;if(error)return NextResponse.json({error:"Comments unavailable"},{status:503});
 const ids=[...new Set((data||[]).map(x=>x.author_id))];
 const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,username,avatar_config").in("id",ids):{data:[]};
 const names=new Map((profiles||[]).map(p=>[p.id,p.display_name||p.username||"Member"]));
 const avatarMap=new Map((profiles||[]).map(p=>{const c=p.avatar_config as {selectedAvatarUrl?:string;adminAvatarUrl?:string}|null;const url=c?.selectedAvatarUrl||c?.adminAvatarUrl||"";return [p.id,/^(https:\/\/|\/assets\/avatars\/)/.test(url)?url:null]}));
 const commentIds=(data||[]).map(x=>x.id);
 const {data:likes}=commentIds.length?await db.from("ummah_comment_likes").select("comment_id,user_id").in("comment_id",commentIds):{data:[]};
 const {data:dislikes}=commentIds.length?await db.from("ummah_comment_dislikes").select("comment_id,user_id").in("comment_id",commentIds):{data:[]};
 const paths=(data||[]).map(c=>c.image_path).filter((x):x is string=>!!x);
 const imageUrls=new Map<string,string>();await Promise.all(paths.map(async path=>{const {data:link}=await db.storage.from("community-media").createSignedUrl(path,3600);if(link?.signedUrl)imageUrls.set(path,link.signedUrl)}));
 const {data:{user}}=await db.auth.getUser();
 return NextResponse.json({comments:(data||[]).map(c=>({...c,name:names.get(c.author_id)||"Community member",avatar_url:avatarMap.get(c.author_id)||null,likes:(likes||[]).filter(l=>l.comment_id===c.id).length,liked:(likes||[]).some(l=>l.comment_id===c.id&&l.user_id===user?.id),dislikes:(dislikes||[]).filter(l=>l.comment_id===c.id).length,disliked:(dislikes||[]).some(l=>l.comment_id===c.id&&l.user_id===user?.id),image_url:c.image_path?imageUrls.get(c.image_path)||null:null}))});
}
export async function POST(request:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Sign in to comment"},{status:401});
 const payload=await request.json().catch(()=>({}));const body=typeof payload.body==="string"?payload.body.trim():"";
 if(body.length>1500||typeof payload.postId!=="string")return NextResponse.json({error:"Invalid comment"},{status:400});
 const imagePath=typeof payload.imagePath==="string"?payload.imagePath:"";if(imagePath&&(!imagePath.startsWith(user.id+"/comments/")||!/^[-a-zA-Z0-9_/.]+$/.test(imagePath)||!imagePath.match(/\.(png|jpe?g|webp|gif)$/i)))return NextResponse.json({error:"Invalid image path"},{status:400});
 if(!body&&!imagePath)return NextResponse.json({error:"Add a comment or image"},{status:400});
 const {data:post}=await db.from("ummah_feed_posts").select("id,author_id").eq("id",payload.postId).maybeSingle();
 if(!post)return NextResponse.json({error:"Post not found"},{status:404});
 if(payload.parentId){const {data:parent}=await db.from("ummah_post_comments").select("id").eq("id",payload.parentId).eq("post_id",post.id).maybeSingle();if(!parent)return NextResponse.json({error:"Reply target not found"},{status:400})}
 const {data,error}=await db.from("ummah_post_comments").insert({post_id:post.id,author_id:user.id,parent_id:payload.parentId||null,body,image_path:imagePath||null}).select("id,post_id,author_id,parent_id,body,created_at").single();
 if(error)return NextResponse.json({error:"Unable to save comment"},{status:503});
 if(post.author_id&&post.author_id!==user.id){await db.from("notifications").insert({recipient_id:post.author_id,actor_id:user.id,type:"post_comment",title:"New comment on your post",body:body.slice(0,180),entity_type:"ummah_post",entity_id:post.id}).then(()=>{});}
 return NextResponse.json({comment:{...data,name:user.user_metadata?.display_name||"You",likes:0,liked:false}},{status:201});
}
