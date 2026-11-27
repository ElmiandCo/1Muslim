import type {AdhanPrayer,PrayerSchedule} from "./adhan";

/** Pure, timezone-aware prayer interval calculation. Five obligatory prayers,
 * including Isha → next-day Fajr. Never invent a progress value without both
 * the previous and next verified prayer boundaries. */
const ORDER:AdhanPrayer[]=["Fajr","Dhuhr","Asr","Maghrib","Isha"];
const numericMinute=(time:string)=>{
 const match=/^(\\d{1,2}):(\\d{2})/.exec(time);
 if(!match)return null;
 const h=Number(match[1]),m=Number(match[2]);
 return h<24&&m<60?h*60+m:null;
};
export function shiftPrayerDate(day:string,offset:number):string{
 const [year,month,date]=day.split("-").map(Number);
 if(!year||!month||!date)return "";
 const next=new Date(Date.UTC(year,month-1,date+offset,12,0,0));
 return next.toISOString().slice(0,10);
}
function localWallEpoch(instant:number,timeZone:string):number{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone,year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 }).formatToParts(new Date(instant));
 const fields=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 return Date.UTC(Number(fields.year),Number(fields.month)-1,Number(fields.day),
  Number(fields.hour),Number(fields.minute));
}
function zonedPrayerEpoch(day:string,time:string,timeZone:string):number|null{
 const minute=numericMinute(time);
 if(minute===null)return null;
 const [year,month,date]=day.split("-").map(Number);
 const wall=Date.UTC(year,month-1,date,Math.floor(minute/60),minute%60);
 if(!Number.isFinite(wall))return null;
 let epoch=wall;
 // Resolve local wall-clock prayer time to an actual UTC instant, respecting
 // the chosen city's IANA timezone and seasonal DST offset.
 for(let i=0;i<4;i++){
  const correction=wall-localWallEpoch(epoch,timeZone);
  epoch+=correction;
  if(!correction)break;
 }
 return epoch;
}
function localPrayerDay(timeZone:string,instant:Date):string{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone,year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(instant);
 const fields=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 return [fields.year,fields.month,fields.day].join("-");
}
export type PrayerBrandProgress={
 from:AdhanPrayer;to:AdhanPrayer;ratio:number;remainingMinutes:number;
};
export function prayerBrandProgress(
 today:PrayerSchedule|null,
 yesterday:PrayerSchedule|null,
 tomorrow:PrayerSchedule|null,
 instant:Date
):PrayerBrandProgress|null{
 if(!today||localPrayerDay(today.timezone,instant)!==today.date)return null;
 const previousDate=shiftPrayerDate(today.date,-1);
 const nextDate=shiftPrayerDate(today.date,1);
 const entries:Array<{name:AdhanPrayer;time:number}>=[];
 const push=(day:string,name:AdhanPrayer,schedule:PrayerSchedule)=>{
  const epoch=zonedPrayerEpoch(day,schedule.times[name],today.timezone);
  if(epoch!==null)entries.push({name,time:epoch});
 };
 if(yesterday?.date===previousDate)push(previousDate,"Isha",yesterday);
 for(const name of ORDER)push(today.date,name,today);
 if(tomorrow?.date===nextDate)push(nextDate,"Fajr",tomorrow);
 entries.sort((a,b)=>a.time-b.time);
 const nextIndex=entries.findIndex(item=>item.time>instant.getTime());
 if(nextIndex<1)return null;
 const from=entries[nextIndex-1],to=entries[nextIndex];
 const duration=to.time-from.time;
 if(duration<=0)return null;
 const ratio=Math.max(0,Math.min(1,(instant.getTime()-from.time)/duration));
 return {from:from.name,to:to.name,ratio,remainingMinutes:Math.max(0,(to.time-instant.getTime())/60_000)};
}
