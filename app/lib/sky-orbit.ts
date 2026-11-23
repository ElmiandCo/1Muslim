/**
 * City-level sun/moon ephemerides for the compact next-prayer widget.
 * Meeus low-order solar/lunar formulae (also used by SunCalc).
 * Approximate apparent altitude/illumination, not a crescent-sighting,
 * astronomical navigation, or a source of religious prayer times.
 * Prayer times continue to come exclusively from the 1Muslim Prayer app.
 */
const RAD=Math.PI/180;
const OBLIQUITY=23.4397*RAD;
const SYNODIC_AU_KM=149_598_000;

type Equatorial={ra:number;dec:number};
export type SkyBody={aboveHorizon:boolean;progress:number;altitudeDegrees:number};
export type LocalSky={
 sun:SkyBody;moon:SkyBody;illumination:number;waxing:boolean;
 sunAndMoonAboveHorizon:boolean;
};

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function daysSinceJ2000(at:Date){return at.getTime()/86_400_000+2440587.5-2451545}
function rightAscension(longitude:number,latitude:number){
 return Math.atan2(Math.sin(longitude)*Math.cos(OBLIQUITY)-Math.tan(latitude)*Math.sin(OBLIQUITY),Math.cos(longitude));
}
function declination(longitude:number,latitude:number){
 return Math.asin(Math.sin(latitude)*Math.cos(OBLIQUITY)+Math.cos(latitude)*Math.sin(OBLIQUITY)*Math.sin(longitude));
}
function sunCoordinates(days:number){
 const anomaly=(357.5291+0.98560028*days)*RAD;
 const center=(1.9148*Math.sin(anomaly)+.02*Math.sin(2*anomaly)+.0003*Math.sin(3*anomaly))*RAD;
 const longitude=anomaly+center+102.9372*RAD+Math.PI;
 return {ra:rightAscension(longitude,0),dec:declination(longitude,0),longitude};
}
function moonCoordinates(days:number){
 const meanLongitude=(218.316+13.176396*days)*RAD;
 const anomaly=(134.963+13.064993*days)*RAD;
 const argument=(93.272+13.229350*days)*RAD;
 const longitude=meanLongitude+6.289*RAD*Math.sin(anomaly);
 const latitude=5.128*RAD*Math.sin(argument);
 const distance=385001-20905*Math.cos(anomaly);
 return {ra:rightAscension(longitude,latitude),dec:declination(longitude,latitude),distance};
}
function position(at:Date,latitude:number,longitude:number,body:Equatorial,threshold:number,moon=false):SkyBody {
 const days=daysSinceJ2000(at),lat=latitude*RAD,lw=-longitude*RAD;
 // Local sidereal time, east-positive geodetic longitude.
 const sidereal=(280.16+360.9856235*days)*RAD-lw;
 const hourAngle=Math.atan2(Math.sin(sidereal-body.ra),Math.cos(sidereal-body.ra));
 const altitude=Math.asin(clamp(Math.sin(lat)*Math.sin(body.dec)+Math.cos(lat)*Math.cos(body.dec)*Math.cos(hourAngle),-1,1));
 // Moon: approximately 0.6° atmospheric refraction at horizon; distinguish
 // the rising upper limb from the body's geometric center.
 const refractedMoon=altitude+(.0002967/Math.tan(Math.max(0,altitude)+.00312536/(Math.max(0,altitude)+.08901179)));
 const apparent=moon?refractedMoon:altitude;
 const cosHour=(Math.sin(threshold*RAD)-Math.sin(lat)*Math.sin(body.dec))/(Math.cos(lat)*Math.cos(body.dec));
 const crossingAngle=Number.isFinite(cosHour)?Math.acos(clamp(cosHour,-1,1)):Math.PI/2;
 const progress=crossingAngle>0.001?
  clamp((hourAngle+crossingAngle)/(2*crossingAngle),0,1):
  clamp((hourAngle+Math.PI)/(2*Math.PI),0,1);
 return {aboveHorizon:apparent>(moon ? .133 : threshold)*RAD,progress,altitudeDegrees:apparent/RAD};
}

/** Derives both bodies from the SAME current instant and SAME saved prayer city. */
export function localSky(at:Date,latitude:number,longitude:number):LocalSky|null {
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
 const d=daysSinceJ2000(at),sun=sunCoordinates(d),moon=moonCoordinates(d);
 const angularSeparation=Math.acos(clamp(Math.sin(sun.dec)*Math.sin(moon.dec)+Math.cos(sun.dec)*Math.cos(moon.dec)*Math.cos(sun.ra-moon.ra),-1,1));
 const incidence=Math.atan2(SYNODIC_AU_KM*Math.sin(angularSeparation),moon.distance-SYNODIC_AU_KM*Math.cos(angularSeparation));
 const illumination=clamp((1+Math.cos(incidence))/2,0,1);
 // Negative moon-to-sun position angle corresponds to waxing lunar phase.
 const angle=Math.atan2(Math.cos(sun.dec)*Math.sin(sun.ra-moon.ra),
  Math.sin(sun.dec)*Math.cos(moon.dec)-Math.cos(sun.dec)*Math.sin(moon.dec)*Math.cos(sun.ra-moon.ra));
 const sunPosition=position(at,latitude,longitude,sun,-.833);
 const moonPosition=position(at,latitude,longitude,moon,.133,true);
 return {sun:sunPosition,moon:moonPosition,illumination,waxing:angle<0,
  sunAndMoonAboveHorizon:sunPosition.aboveHorizon&&moonPosition.aboveHorizon};
}
