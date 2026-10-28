// Respectful interpretive congregational prayer, no depiction of any prophet.
// Render-only NPCs: no collisions, network state, audio, or gameplay rewards.
export type PrayerDraw=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:[number,number,number],alpha?:number,angle?:number)=>void;
export type PrayerPose="standing"|"bowing"|"prostrating"|"sitting";
export function congregationPose(nowMs:number):PrayerPose{
  const t=((nowMs/1000)%72+72)%72;
  return t<22?"standing":t<32?"bowing":t<49?"prostrating":t<59?"sitting":"standing";
}
export function renderNabawiCongregation(draw:PrayerDraw,nowMs:number,px:number,pz:number){
  // Small gathering on an open courtyard, outside the existing mosque geometry.
  const centerX=0,centerZ=-430;
  if(Math.hypot(px-centerX,pz-centerZ)>145)return;
  const pose=congregationPose(nowMs);
  const cloth:[number,number,number]=[.92,.9,.83],shade:[number,number,number]=[.78,.76,.68];
  for(let row=0;row<3;row++)for(let col=0;col<7;col++){
    const x=centerX+(col-3)*3.1,z=centerZ+row*4.2;
    if(Math.hypot(px-x,pz-z)>100)continue;
    const head:[number,number,number]=col%3===0?[.55,.35,.24]:col%3===1?[.74,.53,.38]:[.39,.27,.2];
    const h=pose==="standing"?2.1:pose==="bowing"?1.25:pose==="sitting"?.95:.48;
    draw(x,.035,z,2.15,.06,1.65,[.27,.48,.36],.65);
    if(pose==="prostrating"){
      draw(x,.37,z-.33,.9,.45,1.2,cloth);
      draw(x,.27,z-1.05,.49,.43,.5,head);
    }else{
      draw(x,h*.5,z,.95,h,.65,cloth);
      draw(x,h+.28,pose==="bowing"?z-.37:z,.52,.56,.52,head);
      if(pose==="bowing")draw(x,1.02,z-.46,.85,.2,.85,shade);
    }
  }
}
