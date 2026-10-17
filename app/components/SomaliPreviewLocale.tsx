"use client";
import {useEffect} from "react";
const dictionary:Record<string,string>={
"1MUSLIM JUST GOT AN UPGRADE":"1MUSLIM WAA LA CUSBOONAYSIIYEY","Not just a facelift. We’re connecting the Ummah.":"Ma aha muuqaal cusub oo keliya. Waxaan isku xiraynaa Ummadda.","Voice and video calling are here in 1Muslim Messenger.":"Wicitaannada codka iyo muuqaalka ayaa hadda laga heli karaa Farriimaha 1Muslim.","Try Now":"Hadda tijaabi","Try Now ↗":"Hadda tijaabi ↗","The 1Muslim App":"Barnaamijka 1Muslim","1MUSLIM · WELCOME":"1MUSLIM · SOO DHAWOW",
"Go Live":"Bilow toos","LIVE":"TOOS","Live":"Toos","QUR’AN":"QUR'AAN","Qur’an":"Qur'aanka","POST":"QORAAL","MESSAGES":"FARRIIMO","ELM TENT":"TEENDHADA CILMIGA","PROFILE":"ASTAANTA","RECORD STUDIO":"ISTUUDIYAHA DUUBISTA","UMMAH":"UMMADDA","MESSENGER":"FARRIIMAHA",
"Be the first to go live":"Noqo qofka ugu horreeya ee toos u baxa","My Profile":"Astaantayda","Your journey starts here":"Safarkaagu halkan ayuu ka bilaabmaa","Sign In":"Soo gal","Sign in":"Soo gal","Sign in ↗":"Soo gal ↗","Sign in →":"Soo gal →","Sign Up":"Isdiiwaangeli","Sign up":"Isdiiwaangeli","Not a Member":"Weli xubin ma tihid","Not a Member ✦":"Weli xubin ma tihid ✦","Return home":"Ku noqo bogga hore","Welcome":"Soo dhawoow","Explore freely. Join when ready.":"Si xor ah u daawo. Ku soo biir markaad diyaar tahay.","Your place to connect, learn, and reflect.":"Goobtaada xiriirka, barashada iyo xusuusta Alle.","Email":"Iimayl","Password":"Furaha sirta ah","Continue":"Sii wad","Create account":"Samee akoon","Confirm your email":"Xaqiiji iimaylkaaga","Choose how to continue":"Dooro sidaad u sii wadi lahayd","Forgot password?":"Ma illowday furaha sirta ah?","Back":"Dib u noqo","Next":"Xiga","Done":"Dhammaystir","Settings":"Dejinta","Notifications":"Ogeysiisyo","Messages":"Farriimaha","Profile":"Astaanta","Home":"Bogga hore","Daily Post":"Qoraalka maalinlaha ah","Add Widgets":"Ku dar qaybo","Watch videos":"Daawo muuqaallo","Read & listen":"Akhri oo dhegayso","See live streams":"Daawo baahinta tooska ah","Your conversations":"Wada sheekaysigaaga","Guest":"Marti","Continue as guest":"Sii wad adigoo marti ah","Log in":"Soo gal","Create an account":"Samee akoon","Get started":"Bilow","Submit":"Gudbi","Cancel":"Jooji","Close":"Xir","Log out":"Ka bax","Welcome to 1Muslim":"Ku soo dhawoow 1Muslim","As-salāmu ʿalaykum":"Asalaamu calaykum","As-salāmu ‘alaykum":"Asalaamu calaykum",
"Sign in to see your avatar, achievements, and posts inside the Canvas.":"Soo gal si aad u aragto sawirkaaga, guulahaaga iyo qoraalladaada gudaha Canvas-ka.","Open full experience ↗":"Fur waayo-aragnimada oo dhan ↗","♪ Hear HudHud":"♪ Dhegayso HudHud",
};
export default function SomaliPreviewLocale(){
useEffect(()=>{
const enabled=new URLSearchParams(location.search).get("lang")==="so"||sessionStorage.getItem("1muslim:preview-language")==="so";
if(!enabled)return;
sessionStorage.setItem("1muslim:preview-language","so");document.documentElement.lang="so";
let pending=false;
const translate=()=>{
pending=false;
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
while(walker.nextNode()){
const node=walker.currentNode as Text;const parent=node.parentElement;
if(!parent||parent.closest("script,style,textarea,code"))continue;
const raw=node.nodeValue||"";const trimmed=raw.trim();const value=dictionary[trimmed];
if(value&&value!==trimmed)node.nodeValue=raw.replace(trimmed,value);
}
document.querySelectorAll('a[href^="/auth"]').forEach(link=>{
const a=link as HTMLAnchorElement;const url=new URL(a.href,location.origin);
if(!url.searchParams.has("lang")){url.searchParams.set("lang","so");a.href=url.pathname+url.search;}
});
};
const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(translate)}});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});translate();
return()=>observer.disconnect();
},[]);return null;
}
