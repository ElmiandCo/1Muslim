// WMM2025 JS model. magvar 2.2.0 ships CommonJS without TypeScript declarations.
declare module "magvar" {
 export function magvar(latitude:number,longitude:number,altitudeKm?:number,when?:Date|number):number;
 export function magneticField(latitude:number,longitude:number,altitudeKm?:number,when?:Date|number):{
  declination:number;inclination:number;x:number;y:number;z:number;h:number;f:number;decimalYear:number;
 };
}
