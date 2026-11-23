"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "../utils/supabase/client";
import GuestWelcomeHome from "./components/GuestWelcomeHome";

/** Root now contains only the guest landing or a white auth handoff.
 * The retired Live workspace cannot render behind profile/navigation.
 */
export default function HomePage(){
 const router=useRouter();
 const [status,setStatus]=useState<"checking"|"guest"|"member">("checking");
 useEffect(()=>{
  let active=true;
  const db=createClient();
  const open=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(user){setStatus("member");router.replace("/profile");}
   else setStatus("guest");
  };
  void open();
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
   if(!active)return;
   if(session?.user){setStatus("member");router.replace("/profile");}
   else setStatus("guest");
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[router]);
 if(status!=="guest")return <main className="oneWhiteWelcomeLoading" aria-label="Opening 1Muslim"><span className="oneWhiteWelcomeMark">1M</span></main>;
 return <GuestWelcomeHome/>;
}
