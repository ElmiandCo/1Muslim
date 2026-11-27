// A request chooses ONE appropriate presentation, not six unrelated search cards.
// Keep this module independent from Next.js so it can be regression-tested.
export type HudHudPresentation =
 | {kind:"verse";verseKey:string}
 | {kind:"image";query:string}
 | {kind:"results"}
 | {kind:"text"};

const QURAN=/\b(qur['’]?(?:an|ān)|koran|surah|sura|ayah|ayat)\b/i;
const VERSE=/\b(verse|ayah|ayat)\b/i;
const SHOW=/\b(show|give|quote|cite|read|display|find|tell|share|what|which|one|random|first)\b/i;
const SITE=/\b(1muslim|one muslim|deepwatch|on (?:this|our) (?:site|app)|in the app|people|members|creators|profiles|posts|videos|movies|series|search results|links to)\b/i;

function verseReference(text:string):string|null{
 const compact=/(?:^|\D)(\d{1,3})\s*:\s*(\d{1,3})(?!\d)/.exec(text);
 const words=/\b(?:surah|sura|chapter)\s*(\d{1,3})\s*(?:[,;:\-]|\b(?:verse|ayah|ayat)\b)\s*(?:verse|ayah|ayat)?\s*(\d{1,3})\b/i.exec(text);
 const chapter=Number((compact||words)?.[1]),verse=Number((compact||words)?.[2]);
 return chapter>=1&&chapter<=114&&verse>=1&&verse<=286?chapter+":"+verse:null;
}
/** Return only explicit image requests; don't treat any mention of a photo as a search. */
export function imageQueryFromHudHud(text:string):string|null{
 const request=/(?:can (?:i|we) (?:see|view)|show (?:me|us)|find|display|pull up|look up|search for|i (?:want|would like) to see)\s+(?:an?\s+|some\s+)?(?:images?|pictures?|photos?|photographs?)\s+(?:of|showing|for|about)\s+(.+?)(?:[?.!]+)?$/i.exec(text.trim());
 const subject=request?.[1]?.replace(/[?.!]+$/,"").trim().replace(/^(?:an?|the)\s+/i,"").slice(0,110);
 return subject&&subject.length>=2?subject:null;
}

export function selectHudHudPresentation(message:string):HudHudPresentation{
 const text=message.trim();
 const imageQuery=imageQueryFromHudHud(text);
 if(imageQuery)return {kind:"image",query:imageQuery};
 // A natural-language request for divine guidance should cite an exact,
 // independently verified ayah (2:272) rather than an invented quotation.
 const asksForVerse=/(?:where|which|what|show|give|find|read|verse|ayah|qur['’]?an|koran)/i.test(text);
 if(asksForVerse&&/\b(?:allah|god|he)\b/i.test(text)
   &&/\bguid(?:e|es|ance|ing)\b/i.test(text)
   &&/\b(?:whom|who|whoever|whomever)\b[^.!?]{0,35}\bwills?\b/i.test(text))
  return {kind:"verse",verseKey:"2:272"};
 const ref=verseReference(text);
 const detailedQuestion=/\b(explain|why|meaning|how|context|tafsir|interpret|commentary|lessons?|support|hadith|about)\b/i.test(text);
 if(ref&&!detailedQuestion&&(QURAN.test(text)||VERSE.test(text)||/^\d{1,3}:\d{1,3}$/.test(text)))return {kind:"verse",verseKey:ref};
 // Never replace an invalid explicitly requested reference with an unrelated ayah.
 if(!ref&&/\b(?:sura|surah|chapter)\s*\d+\s+(?:verse|ayah|ayat)\s*\d+\b/i.test(text))return {kind:"text"};
 const simpleVerse=(QURAN.test(text)&&VERSE.test(text)&&SHOW.test(text))
  || (/(?:show|give|share|read|quote)\s+(?:me\s+)?(?:a|one|any|random|first)\s+(?:verse|ayah)\b/i.test(text));
 // A theme-specific question needs a retrieved verse relevant to that theme;
 // don't quietly replace it with a hard-coded unrelated passage.
 const themed=/\b(about|regarding|on|concerning|related to|for|explaining)\b/i.test(text);
 if(simpleVerse&&!themed&&!detailedQuestion)return {kind:"verse",verseKey:"1:1"};
 // Qur'an questions are not marketplace searches. Suppress irrelevant cards.
 if(QURAN.test(text))return {kind:"text"};
 return SITE.test(text)?{kind:"results"}:{kind:"text"};
}
