/** Official 1Muslim XP level ranges (inclusive). */
export const XP_LEVEL_MAX=[1500,5000,10000,20000,50000,100000,200000,500000,750000,1000000] as const;
export const levelForXp=(xp:number):number=>{
 const safe=Math.max(0,Number.isFinite(xp)?Math.floor(xp):0);
 const index=XP_LEVEL_MAX.findIndex(max=>safe<=max);
 return index<0?10:index+1;
};
export const levelStartXp=(level:number):number=>level<=1?0:(XP_LEVEL_MAX[Math.min(9,Math.max(1,level)-2)]+1);
export const levelEndXp=(level:number):number=>XP_LEVEL_MAX[Math.min(9,Math.max(1,level)-1)];
