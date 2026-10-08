"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRecordingButton({recordingId,title}:{recordingId:string;title:string}){
 const [deleting,setDeleting]=useState(false);
 const [error,setError]=useState("");
 const router=useRouter();
 const remove=async()=>{
  if(!window.confirm(`Permanently delete "${title}" and its saved video? This cannot be undone.`))return;
  setDeleting(true);setError("");
  try{
   const res=await fetch(`/api/recordings/${recordingId}`,{method:"DELETE"});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"Could not delete recording");
   router.push("/streaming/recordings");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Deletion failed");setDeleting(false)}
 };
 return <span style={{display:"inline-flex",flexDirection:"column",gap:5}}>
  <button type="button" disabled={deleting} onClick={()=>void remove()} style={{padding:"9px 13px",borderRadius:999,border:"1px solid #8e4545",background:"#2a1115",color:"#ffbdbd",fontSize:11,fontWeight:800,cursor:"pointer"}}>{deleting?"Deleting…":"🗑 Delete recording"}</button>
  {error&&<small role="alert" style={{color:"#ffbdbd"}}>{error}</small>}
 </span>;
}
