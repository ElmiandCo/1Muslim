// Futuristic World rendering helpers
export const FUTURE_BOUNDS={minX:-560,maxX:560,minZ:-560,maxZ:560} as const;
export const FUTURE_TOWERS=Array.from({length:64},(_,i)=>({x:(i%8-3.5)*84,z:(Math.floor(i/8)-3.5)*88,height:50+i%8*9}));
export const FUTURE_WALKWAYS=[-176,176].map(z=>({x:0,z,y:34,width:84,depth:8}));
