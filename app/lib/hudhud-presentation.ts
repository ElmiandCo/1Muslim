// A request chooses ONE appropriate presentation, not six unrelated search cards.
// Keep this module independent from Next.js so it can be regression-tested.
export type HudHudPresentation =
 | {kind:"verse";verseKey:string}
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
export function selectHudHudPresentation(message:string):HudHudPresentation{
 const text=message.trim();
 const ref=verseReference(text);
 if(ref && (QURAN.test(text)||VERSE.test(text)||/^\d{1,3}:\d{1,3}$/.test(text)))return {kind:"verse",verseKey:ref};
 // Never replace an invalid explicitly requested reference with an unrelated ayah.
 if(!ref&&/\b(?:sura|surah|chapter)\s*\d+\s+(?:verse|ayah|ayat)\s*\d+\b/i.test(text))return {kind:"text"};
 const simpleVerse=(QURAN.test(text)&&VERSE.test(text)&&SHOW.test(text))
  || (/(?:show|give|share|read|quote)\s+(?:me\s+)?(?:a|one|any|random|first)\s+(?:verse|ayah)\b/i.test(text));
 // A theme-specific question needs a retrieved verse relevant to that theme;
 // don't quietly replace it with a hard-coded unrelated passage.
 const themed=/\b(about|regarding|on|concerning|related to|for|explaining)\b/i.test(text);
 if(simpleVerse&&!themed)return {kind:"verse",verseKey:"1:1"};
 // Qur'an questions are not marketplace searches. Suppress irrelevant cards.
 if(QURAN.test(text))return {kind:"text"};
 return SITE.test(text)?{kind:"results"}:{kind:"text"};
}
