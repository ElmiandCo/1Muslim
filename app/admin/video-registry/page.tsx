import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "../../../utils/supabase/server";
import {videoRegistry,VIDEO_REGISTRY_CAPACITY} from "../../components/videoRegistry";
import RegistryManager from "./RegistryManager";
export const dynamic="force-dynamic";
export default async function Page(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/auth?next=/admin/video-registry");
 if(user.app_metadata?.role!=="admin"&&user.app_metadata?.is_admin!==true)return <main style={{minHeight:"100vh",background:"#071811",color:"white",padding:40}}><h1>Restricted area</h1><p>Administrator access required.</p><Link href="/">Return home</Link></main>;
 return <RegistryManager videos={videoRegistry} capacity={VIDEO_REGISTRY_CAPACITY}/>;
}