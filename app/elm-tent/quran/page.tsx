import { redirect } from "next/navigation";

// The former full-screen cinematic Quran Studio is permanently retired.
// Keep old bookmarks and deep links functional, but never mount that UI again.
// Quran Library is the supported reading experience.
type Params = Record<string,string|string[]|undefined>;
const first = (value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export default async function RetiredQuranStudio({searchParams}:{searchParams:Promise<Params>}) {
 const params=await searchParams;
 const verse=first(params.verse);
 const surah=first(params.surah);
 const ayah=first(params.ayah);
 const candidate=verse||(surah&&ayah?surah+":"+ayah:"");
 const match=/^([1-9]|[1-9][0-9]|1(?:0[0-9]|1[0-4])):([1-9][0-9]{0,2})$/.exec(candidate);
 if(match)return redirect("/quran-library?verse="+encodeURIComponent(Number(match[1])+":"+Number(match[2])));
 const chapter=Number(first(params.chapter)||surah||"");
 if(Number.isInteger(chapter)&&chapter>=1&&chapter<=114)return redirect("/quran-library?chapter="+chapter);
 redirect("/quran-library");
}
