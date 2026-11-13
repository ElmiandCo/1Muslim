export type QuranChapterVerse={verse_key:string;arabic:string;english?:string};
const API="https://api.quran.com/api/v4";
const BACKUP="https://api.alquran.cloud/v1";
function validate(rows:QuranChapterVerse[],chapter:number,count?:number){if(!Array.isArray(rows)||!rows.length)throw Error("Empty Qur'an chapter");if(count&&rows.length!==count)throw Error("Incomplete Qur'an chapter");rows.forEach((v,i)=>{if(v.verse_key!==chapter+":"+(i+1)||!v.arabic?.trim())throw Error("Invalid Qur'an verse sequence")});return rows}
export async function loadLocalQuranChapter(chapter:number,signal?:AbortSignal):Promise<QuranChapterVerse[]>{const r=await fetch("/quran-data/"+chapter+".json",{signal});if(!r.ok)throw Error("Local Qur'an chapter unavailable");return validate(await r.json(),chapter)}
export async function loadQuranChapter(chapter:number,signal?:AbortSignal,expectedCount?:number):Promise<QuranChapterVerse[]>{
 if(!Number.isInteger(chapter)||chapter<1||chapter>114)throw Error("Invalid surah");
 let localRows:QuranChapterVerse[]|null=null;
 try{localRows=validate(await loadLocalQuranChapter(chapter,signal),chapter,expectedCount);if(localRows.every(v=>v.english?.trim()))return localRows}catch(e){if(signal?.aborted)throw e}
 try{const result:QuranChapterVerse[]=[];let page=1,pages=1;do{
 const r=await fetch(API+"/verses/by_chapter/"+chapter+"?language=en&fields=text_uthmani&translations=131&per_page=50&page="+page,{signal});
 if(!r.ok)throw Error("Quran.com unavailable");const data=await r.json();if(!Array.isArray(data.verses)||!data.verses.length)throw Error("Empty Quran.com response");
 result.push(...data.verses.map((v:{verse_key:string;text_uthmani?:string;translations?:{text:string}[]})=>({verse_key:v.verse_key,arabic:v.text_uthmani||"",english:v.translations?.[0]?.text?.replace(/<[^>]*>/g,"")||""})));
 pages=Math.min(20,Number(data.pagination?.total_pages)||1);page++;
 }while(page<=pages);const complete=validate(result,chapter,expectedCount);if(complete.every(v=>v.english?.trim()))return complete;if(!localRows)localRows=complete}catch(e){if(signal?.aborted)throw e}
 const [ar,en]=await Promise.all([localRows?Promise.resolve(null):fetch(BACKUP+"/surah/"+chapter+"/quran-uthmani",{signal}),fetch(BACKUP+"/surah/"+chapter+"/en.sahih",{signal})]);
 if((ar&&!ar.ok)||!en.ok)throw Error("Qur'an sources unavailable");const [arabic,english]=await Promise.all([ar?ar.json():Promise.resolve(null),en.json()]);
 const translations=new Map<number,string>((english?.data?.ayahs||[]).map((v:{numberInSurah:number;text:string})=>[v.numberInSurah,v.text]));
 const rows=localRows?localRows.map((v,i)=>({...v,english:v.english?.trim()||translations.get(i+1)||""})):(arabic?.data?.ayahs||[]).map((v:{numberInSurah:number;text:string})=>({verse_key:chapter+":"+v.numberInSurah,arabic:v.text,english:translations.get(v.numberInSurah)||""}));
 return validate(rows,chapter,expectedCount);
}
