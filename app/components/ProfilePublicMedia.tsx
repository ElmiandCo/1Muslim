"use client";
import {safeMediaUrl,youtubeEmbed,type MemberMediaKind} from "./profile-member-media";

export default function ProfilePublicMedia({url,kind,title,className=""}:{url:string;kind:MemberMediaKind;title:string;className?:string}){
 const safe=safeMediaUrl(url);
 if(!safe)return <p role="note">Media link unavailable.</p>;
 if(kind==="image")return <img className={className} src={safe} alt={title||"Page post image"} loading="lazy" decoding="async"/>;
 const youtube=youtubeEmbed(safe);
 if(youtube)return <iframe className={className} src={youtube} title={title||"Member video"} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy"/>;
 try{
  const pathname=new URL(safe).pathname;
  if(/\.(mp4|webm|mov|m4v)$/i.test(pathname)||pathname.includes("/storage/v1/object/public/")){
   return <video className={className} controls preload="metadata" playsInline src={safe} aria-label={title||"Member video"}/>;
  }
 }catch{}
 return <a className={className} href={safe} target="_blank" rel="noopener noreferrer" style={{display:"grid",placeItems:"center",minHeight:120,textAlign:"center",background:"#122a3d",color:"#f4e8cd",borderRadius:12,textDecoration:"none",padding:18}}>▶ Open shared video ↗</a>;
}
