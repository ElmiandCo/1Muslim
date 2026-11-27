/** Narrow ASR cleanup for explicitly spoken Qur'an chapter/verse references.
 * Ordinary questions and words are left unchanged. The server verifies the ayah.
 */
const small:Record<string,number>={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
const tens:Record<string,number>={twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function asNumber(input:string):number|null{
 const clean=input.trim().toLowerCase().replace(/-/g," ");
 if(/^\d{1,3}$/.test(clean))return Number(clean);
 const parts=clean.split(/\s+/);
 if(parts.some(word=>!(word in small)&&!(word in tens)&&word!=="hundred"&&word!=="and"))return null;
 let value=0;
 for(const word of parts){
  if(word in small)value+=small[word];
  else if(word in tens)value+=tens[word];
  else if(word==="hundred")value*=100;
 }
 return Number.isInteger(value)?value:null;
}
const terms="(?:\\d{1,3}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|and)\\b";
const sequence=terms+"(?:[\\s-]+"+terms+"){0,4}";
const surahVerse=new RegExp("\\b(?:surah|sura|chapter)\\s+("+sequence+")\\s+(?:verse|ayah|ayat)\\s+("+sequence+")","i");
const quranVerse=new RegExp("\\b(?:quran|qur['’]?an|koran)\\s+(?:verse|ayah|ayat)\\s+("+sequence+")","i");
function valid(chapter:number|null,verse:number|null):boolean{return chapter!==null&&verse!==null&&chapter>=1&&chapter<=114&&verse>=1&&verse<=286}
export function normalizeSpokenHudHudQuestion(text:string):string{
 const explicit=surahVerse.exec(text);
 if(explicit){
  const chapter=asNumber(explicit[1]),verse=asNumber(explicit[2]);
  if(valid(chapter,verse))return text.replace(explicit[0],"Surah "+chapter+" verse "+verse);
 }
 const quran=quranVerse.exec(text);
 if(quran){
  const parts=quran[1].trim().replace(/-/g," ").split(/\s+/);
  // "verse ninety nine" is one number (99), not chapter 90 verse 9.
  // Don't fabricate a chapter from ambiguous unmarked spoken numerals.
  if(parts.length===2&&parts[0] in tens&&parts[1] in small&&small[parts[1]]<10)return text;
  if(parts.length===3&&!/^\d+$/.test(parts[0]))return text;
  const candidates:Array<{chapter:number;verse:number;score:number}>=[];
  for(let split=1;split<parts.length;split++){
   const chapter=asNumber(parts.slice(0,split).join(" ")),verse=asNumber(parts.slice(split).join(" "));
   if(valid(chapter,verse))candidates.push({chapter:chapter!,verse:verse!,score:(split===2?1:0)+(parts.length===2?3:0)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  if(candidates.length)return text.replace(quran[0],"Qur'an "+candidates[0].chapter+":"+candidates[0].verse);
 }
 return text;
}
