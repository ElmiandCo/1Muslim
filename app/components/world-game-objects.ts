import {Era,Object3D,eras,landmarks} from "./world-game-data";
export function makeObjects(era:Era):Object3D[] {
 if(era==="hub") return [];
 const out:Object3D[]=[];
 let seed=(eras.indexOf(era)+1)*27183;
 function random():number {seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 for(let i=0;i<100;i++){
  const x=(random()-.5)*94,z=7+random()*110,r=random();
  if(Math.abs(x)<3&&z<16)continue;
  let kind:Object3D["kind"]="rock";
  if(era==="dinosaurs")kind=r<.6?"tree":r<.8?"rock":"animal";
  else if(era==="future")kind=r<.7?"building":r<.9?"rock":"tree";
  else kind=r<.4?"tree":r<.7?"building":r<.87?"rock":"animal";
  out.push({x,z,kind,size:.7+random()*1.1});
 }
 for(const landmark of landmarks[era])out.push({...landmark,kind:"landmark",size:1.5});
 return out;
}
