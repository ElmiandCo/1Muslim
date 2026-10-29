import {NextResponse} from "next/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {createClient} from "../../../../utils/supabase/server";

const ADMIN_EMAIL="hudhudbyelmi@gmail.com";
export async function DELETE(request:Request){
 const session=await createClient();
 const {data:{user},error:authError}=await session.auth.getUser();
 if(authError||!user||user.email?.trim().toLowerCase()!==ADMIN_EMAIL)return NextResponse.json({error:"Not authorized"},{status:403});
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!key||!url)return NextResponse.json({error:"Admin deletion is not configured"},{status:503});
 const {mediaId,confirmation}=await request.json().catch(()=>({}));
 if(typeof mediaId!=="string"||!mediaId||confirmation!=="DELETE")return NextResponse.json({error:"Deletion confirmation required"},{status:400});
 const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:media,error:lookupError}=await admin.from("post_media").select("id,post_id,storage_path,mime_type").eq("id",mediaId).single();
 if(lookupError||!media||!String(media.mime_type).startsWith("video/"))return NextResponse.json({error:"Video not found"},{status:404});
 // Remove the original file before removing its database record. Never delete other media attached to the post.
 const {error:storageError}=await admin.storage.from("community-media").remove([media.storage_path]);
 if(storageError)return NextResponse.json({error:"Could not delete original video file"},{status:502});
 const {error:deleteError}=await admin.from("post_media").delete().eq("id",media.id);
 if(deleteError)return NextResponse.json({error:"Video file removed, but database cleanup needs administrator attention"},{status:500});
 const {data:remaining,error:remainingError}=await admin.from("post_media").select("id").eq("post_id",media.post_id).limit(1);
 if(!remainingError&&remaining?.length===0){
   // A media-only post can be removed after its last attachment is deleted.
   await admin.from("video_views").delete().eq("post_id",media.post_id);
   await admin.from("posts").delete().eq("id",media.post_id);
 }
 return NextResponse.json({deleted:true,mediaId:media.id});
}
