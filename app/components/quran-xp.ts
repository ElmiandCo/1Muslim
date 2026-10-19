"use client";
import {createClient} from "../../utils/supabase/client";
type Activity="read"|"listen";
const pending=new Set<string>();
export async function awardQuranVerse(chapter:number,verse:number,activity:Activity){
 const key=chapter+":"+verse+":"+activity;
 if(pending.has(key))return;
 pending.add(key);
 try{
  const {data,error}=await createClient().rpc("claim_quran_xp",{p_chapter:chapter,p_verse:verse,p_activity:activity});
  if(error)throw error;
  const awarded=Number(data?.awarded||0);
  if(awarded>0)window.dispatchEvent(new CustomEvent("1muslim:xp-awarded",{detail:{awarded,xp_total:Number(data.xp_total),source:"quran",activity}}));
 }catch(err){console.warn("Quran XP award failed",err)}finally{pending.delete(key)}
}
