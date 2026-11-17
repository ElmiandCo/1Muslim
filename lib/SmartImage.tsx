"use client";
import {useEffect,useState,type ImgHTMLAttributes} from "react";
import {cachePublicImage,cachedPublicImage,enablePublicMediaCache} from "./smart-media";

type Props=ImgHTMLAttributes<HTMLImageElement> & {src:string};
/** Cache Storage-backed public image renderer; signed/private URLs use the original src. */
export default function SmartImage({src,onError,...props}:Props){
 const [cached,setCached]=useState<string|null>(null);
 useEffect(()=>{
  let alive=true,objectUrl:string|null=null;
  setCached(null);
  enablePublicMediaCache();
  void cachedPublicImage(src).then(result=>{
   if(!result)return;
   if(!alive){URL.revokeObjectURL(result);return}
   objectUrl=result;setCached(result);
  }).catch(()=>{});
  void cachePublicImage(src);
  return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[src]);
 return <img {...props} src={cached||src} onError={event=>{
  if(cached){setCached(null);return}
  onError?.(event);
 }}/>;
}
