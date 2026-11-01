const VIDEO_ID=/^[a-zA-Z0-9_-]{11}$/;
export function getYouTubeId(text:string):string|null {
 const links=text.match(/https?:\/\/[^\s<>"']+/g)||[];
 for(const raw of links){
  try{
   const url=new URL(raw.replace(/[),.!?]+$/,""));
   const host=url.hostname.toLowerCase();
   let id="";
   if(host==="youtu.be")id=url.pathname.split("/")[1]||"";
   else if(["youtube.com","www.youtube.com","m.youtube.com"].includes(host)){
    const path=url.pathname.split("/").filter(Boolean);
    id=path[0]==="watch"?url.searchParams.get("v")||"":(["shorts","live","embed"].includes(path[0])?path[1]||"":"");
   }
   if(VIDEO_ID.test(id))return id;
  }catch{}
 }
 return null;
}

export function extractVerse(body:string){
 const lines=body.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const index=lines.findIndex(x=>/^Qur[’']?an\s+\d{1,3}:\d{1,3}$/i.test(x));
 if(index<0)return null;
 const reference=lines[index];
 const following=lines.slice(index+1);
 const arabic=following.find(x=>/[\u0600-\u06ff]/.test(x))||"";
 const english=following.find(x=>!/[\u0600-\u06ff]/.test(x)&&!/^https?:\/\//.test(x))||"";
 if(!arabic&&!english)return null;
 const consumed=new Set([index]);
 if(arabic)consumed.add(lines.indexOf(arabic,index+1));
 if(english)consumed.add(lines.indexOf(english,index+1));
 return {reference,arabic,english,remaining:lines.filter((_,i)=>!consumed.has(i)).join("\n\n")};
}

