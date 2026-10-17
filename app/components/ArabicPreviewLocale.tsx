"use client";
import {useEffect} from "react";
const dictionary:Record<string,string>={
"Go Live":"ابدأ بثًا مباشرًا","LIVE":"مباشر","Live":"مباشر","QUR’AN":"القرآن","POST":"منشور","MESSAGES":"الرسائل","ELM TENT":"خيمة العلم","PROFILE":"الملف الشخصي","RECORD STUDIO":"استوديو التسجيل","UMMAH":"الأمة","MESSENGER":"المحادثات",
"Be the first to go live":"كن أول من يبدأ البث المباشر","Sign In":"تسجيل الدخول","Sign in":"تسجيل الدخول","Sign Up":"إنشاء حساب","Sign up":"إنشاء حساب","Not a Member":"لست عضوًا بعد","Return home":"العودة للرئيسية","Welcome":"مرحبًا بك","Explore freely. Join when ready.":"تصفّح بحرية وانضم عندما تكون مستعدًا.","Your place to connect, learn, and reflect.":"مساحتك للتواصل والتعلّم والتدبّر.","Email":"البريد الإلكتروني","Password":"كلمة المرور","Continue":"متابعة","Create account":"إنشاء حساب","Confirm your email":"أكّد بريدك الإلكتروني","Choose how to continue":"اختر طريقة المتابعة","Forgot password?":"هل نسيت كلمة المرور؟","Back":"رجوع","Next":"التالي","Done":"تم","Settings":"الإعدادات","Notifications":"الإشعارات","Messages":"الرسائل","Profile":"الملف الشخصي","Home":"الرئيسية","Daily Post":"المنشور اليومي","Add Widgets":"إضافة أدوات","Watch videos":"شاهد الفيديوهات","Read & listen":"اقرأ واستمع","See live streams":"شاهد البث المباشر","Your conversations":"محادثاتك","Guest":"زائر","Continue as guest":"المتابعة كزائر","Log in":"تسجيل الدخول","Create an account":"إنشاء حساب","Get started":"ابدأ الآن","Submit":"إرسال","Cancel":"إلغاء","Close":"إغلاق","Log out":"تسجيل الخروج","Welcome to 1Muslim":"مرحبًا بك في 1Muslim","As-salāmu ʿalaykum":"السلام عليكم","As-salāmu ‘alaykum":"السلام عليكم"
};
export default function ArabicPreviewLocale(){
useEffect(()=>{
const enabled=new URLSearchParams(location.search).get("lang")==="ar"||sessionStorage.getItem("1muslim:preview-language")==="ar";
if(!enabled)return;
sessionStorage.setItem("1muslim:preview-language","ar");document.documentElement.lang="ar";
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
if(!url.searchParams.has("lang")){url.searchParams.set("lang","ar");a.href=url.pathname+url.search;}
});
};
const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(translate)}});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});translate();
return()=>observer.disconnect();
},[]);return null;
}
