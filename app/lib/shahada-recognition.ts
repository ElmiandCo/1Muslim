export type ShahadaLanguage="ar"|"en";
export const SHAHADA_ARABIC="أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله";
export const SHAHADA_ENGLISH="I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.";
const ar=(value:string)=>value.normalize("NFKD").replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/[ؤ]/g,"و").replace(/[ئ]/g,"ي").replace(/ـ/g,"").replace(/[^\u0621-\u063a\u0641-\u064a\s]/g," ").replace(/\s+/g," ").trim();
const en=(value:string)=>value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,"").replace(/[^a-z\s]/g," ").replace(/\s+/g," ").trim();
/** A conservative local transcript gate; this is not a religious ruling. */
export function hasShahada(transcript:string):boolean{
 const a=ar(transcript),e=en(transcript);
 if(a.includes("اشهد")&&a.includes("لا اله الا الله")&&a.includes("محمد")&&a.includes("رسول الله"))return true;
 const englishWitness=/(bear witness|testify|i witness)/.test(e);
 const englishTawhid=/(no (god|deity)|none worthy of worship|no one worthy of worship)/.test(e)&&/(except allah|but allah|other than allah)/.test(e);
 const englishProphet=/(muhammad|mohammed)/.test(e)&&/(messenger|prophet)/.test(e)&&/allah|god/.test(e);
 if(englishWitness&&englishTawhid&&englishProphet)return true;
 const latinTawhid=/(ashhadu|ash hadu|ashadu)/.test(e)&&/(la ilaha illa(llah| allah)|la ilaha illallah)/.test(e);
 const latinProphet=/(wa ashhadu|wa ash hadu|wa ashadu)/.test(e)&&/(muhammad|mohammed)/.test(e)&&/(rasul allah|rasulullah|rasool allah)/.test(e);
 return latinTawhid&&latinProphet;
}
