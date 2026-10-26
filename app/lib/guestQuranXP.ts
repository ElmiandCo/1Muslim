"use client";
import {createClient} from "../../utils/supabase/client";
const KEY="1muslim-guest-quran-claims-v1";
type Claim={verse:string;activity:"view"|"listen"};
export const guestClaims=():Claim[]=>{try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter((c:Claim)=>/^([1-9]|[1-9][0-9]|1[01][0-4]):[1-9][0-9]{0,2}$/.test(c.verse)&&["view","listen"].includes(c.activity)):[]}catch{return []}};
export const guestXP=()=>guestClaims().reduce((sum,c)=>sum+(c.activity==="view"?100:250),0);
export const awardGuestVerse=(verse:string,activity:"view"|"listen")=>{const claims=guestClaims();if(claims.some(c=>c.verse===verse&&c.activity===activity))return 0;claims.push({verse,activity});localStorage.setItem(KEY,JSON.stringify(claims));const awarded=activity==="view"?100:250;window.dispatchEvent(new CustomEvent("1muslim:quran-xp",{detail:{awarded,xp_total:guestXP(),guest:true}}));return awarded};
let syncing:Promise<void>|null=null;
export const syncGuestQuranXP=()=>{if(syncing)return syncing;syncing=(async()=>{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;for(const claim of guestClaims()){const {error}=await supabase.rpc("claim_quran_verse_xp",{p_verse_key:claim.verse,p_activity:claim.activity});if(error)break;const remaining=guestClaims().filter(c=>!(c.verse===claim.verse&&c.activity===claim.activity));localStorage.setItem(KEY,JSON.stringify(remaining))}const {data}=await supabase.from("profiles").select("xp_total").eq("id",user.id).maybeSingle();window.dispatchEvent(new CustomEvent("1muslim:quran-xp-sync",{detail:{xp_total:Number(data?.xp_total||0)}}))})().finally(()=>{syncing=null});return syncing};
