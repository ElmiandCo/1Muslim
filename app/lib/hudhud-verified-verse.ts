// Never generate Arabic scripture with an AI model. Fetch an exact canonical
// ayah from the same verified edition source used by the existing HudHud verse route.
export type VerifiedHudHudVerse={key:string;arabic:string;english:string;translation:string;source:string};
export async function loadVerifiedHudHudVerse(key:string):Promise<VerifiedHudHudVerse>{
 if(!/^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):[1-9]\d{0,2}$/.test(key))throw Error("Invalid Qur'an verse reference");
 const [chapter,verse]=key.split(":").map(Number);
 if(chapter<1||chapter>114||verse<1||verse>286)throw Error("Invalid Qur'an verse reference");
 try{
  const [arabic,english]=await Promise.all((["ar.alafasy","en.asad"] as const).map(async edition=>{
   const response=await fetch("https://api.alquran.cloud/v1/ayah/"+encodeURIComponent(key)+"/"+edition,{
    signal:AbortSignal.timeout(6500),next:{revalidate:86400}
   });
   if(!response.ok)throw Error("Verified Qur'an text is temporarily unavailable");
   const data=await response.json();
   if(data?.data?.surah?.number!==chapter||data?.data?.numberInSurah!==verse)throw Error("Qur'an reference did not match the source");
   const text=String(data?.data?.text||"").trim();
   if(!text)throw Error("Missing verified Qur'an text");
   return text;
  }));
  return {key,arabic,english,translation:"Muhammad Asad",source:"AlQuran Cloud"};
 }catch{
  // Independent verified backup, not model-generated scripture.
  const response=await fetch("https://api.quran.com/api/v4/verses/by_key/"+encodeURIComponent(key)+"?fields=text_uthmani&translations=131&language=en",{
   signal:AbortSignal.timeout(6500),next:{revalidate:86400}
  });
  if(!response.ok)throw Error("Verified Qur'an sources temporarily unavailable");
  const data=await response.json();
  const row=data?.verse;
  const arabic=String(row?.text_uthmani||"").trim();
  const english=String(row?.translations?.[0]?.text||"").replace(/<[^>]*>/g,"").trim();
  if(row?.verse_key!==key||!arabic||!english)throw Error("Backup Qur'an verse did not match the requested reference");
  return {key,arabic,english,translation:"Quran.com (translation 131)",source:"Quran.com"};
 }
}
