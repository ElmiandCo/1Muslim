/** Client-side photo-to-video export. Never claims to burn in licensed audio. */
export async function animatePhoto(file:File,filterCss:string):Promise<File>{
 if(typeof MediaRecorder==="undefined")throw Error("Video export is not supported in this browser.");
 const image=await createImageBitmap(file);
 const canvas=document.createElement("canvas");
 const width=720,height=1280;canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d");if(!ctx){image.close();throw Error("Canvas unavailable.");}
 if(typeof canvas.captureStream!=="function"){image.close();throw Error("Video export is unavailable on this device.");}
 const stream=canvas.captureStream(24);
 const mime=["video/mp4;codecs=avc1","video/webm;codecs=vp9","video/webm"].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime){image.close();stream.getTracks().forEach(t=>t.stop());throw Error("No supported video encoder.");}
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});
 const chunks:Blob[]=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const result=new Promise<Blob>((resolve,reject)=>{recorder.onerror=()=>reject(Error("Video export failed."));recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}))});
 const duration=6000;let frame=0;let timer:number|undefined;
 try{
  recorder.start(250);
  await new Promise<void>(resolve=>{
   const started=performance.now();
   const draw=(now:number)=>{
    const progress=Math.min(1,(now-started)/duration);
    ctx.fillStyle="#080b13";ctx.fillRect(0,0,width,height);
    ctx.save();ctx.filter=filterCss;
    const scale=Math.max(width/image.width,height/image.height)*(1+.12*progress);
    const w=image.width*scale,h=image.height*scale;
    const x=(width-w)/2+(width-w)*.035*Math.sin(progress*Math.PI);
    const y=(height-h)/2+(height-h)*.04*progress;
    ctx.drawImage(image,x,y,w,h);ctx.restore();
    frame++;
    if(progress<1)timer=requestAnimationFrame(draw);else resolve();
   };timer=requestAnimationFrame(draw);
  });
  recorder.stop();
  const blob=await result;
  if(!blob.size)throw Error("Video export produced an empty file.");
  return new File([blob],"1muslim-animated-photo."+(mime.includes("mp4")?"mp4":"webm"),{type:mime.split(";")[0]});
 }finally{
  if(timer!==undefined)cancelAnimationFrame(timer);
  if(recorder.state!=="inactive")recorder.stop();
  stream.getTracks().forEach(t=>t.stop());image.close();
 }
}
