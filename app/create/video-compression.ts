/** Browser-side real-time video compression. Requires captureStream and MediaRecorder support.
 * Keeps original on unsupported devices; never claims success without an encoded output.
 */
export async function compressVideo(source:File,onProgress?:(progress:number)=>void):Promise<File>{
 if(typeof document==="undefined"||typeof MediaRecorder==="undefined")throw Error("Video compression is unavailable in this browser.");
 const video=document.createElement("video");
 video.preload="auto";video.muted=true;video.playsInline=true;
 const url=URL.createObjectURL(source);video.src=url;
 let stream:MediaStream|null=null;let recorder:MediaRecorder|null=null;
 try{
  await new Promise<void>((resolve,reject)=>{video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(Error("Unable to decode this video."));});
  if(!Number.isFinite(video.duration)||video.duration<=0)throw Error("Video duration is unavailable.");
  const width=video.videoWidth,height=video.videoHeight;
  if(!width||!height)throw Error("Video dimensions are unavailable.");
  const scale=Math.min(1,1280/Math.max(width,height));
  const canvas=document.createElement("canvas");canvas.width=Math.max(2,Math.round(width*scale/2)*2);canvas.height=Math.max(2,Math.round(height*scale/2)*2);
  const ctx=canvas.getContext("2d");if(!ctx||!canvas.captureStream)throw Error("Canvas encoding is unavailable.");
  const mime=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw Error("No supported video encoder is available.");
  const canvasStream=canvas.captureStream(30);
  const audioContext=new AudioContext();const destination=audioContext.createMediaStreamDestination();
  const sourceNode=audioContext.createMediaElementSource(video);sourceNode.connect(destination);
  // Audio is recorded without routing to speakers.
  stream=new MediaStream([...canvasStream.getVideoTracks(),...destination.stream.getAudioTracks()]);
  const chunks:Blob[]=[];
  const encoded=new Promise<Blob>((resolve,reject)=>{
   recorder=new MediaRecorder(stream!,{mimeType:mime,videoBitsPerSecond:2_000_000,audioBitsPerSecond:128_000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onerror=()=>reject(Error("Video encoding failed."));
   recorder.onstop=()=>resolve(new Blob(chunks,{type:mime.split(";")[0]}));
  });
  const draw=()=>{if(video.paused||video.ended)return;ctx.drawImage(video,0,0,canvas.width,canvas.height);onProgress?.(Math.min(99,Math.round(video.currentTime/video.duration*100)));requestAnimationFrame(draw)};
  await audioContext.resume();await video.play();ctx.drawImage(video,0,0,canvas.width,canvas.height);
  if(!recorder)throw Error("Video encoder was not initialized.");
  (recorder as MediaRecorder).start(1000);requestAnimationFrame(draw);
  await new Promise<void>((resolve,reject)=>{video.onended=()=>resolve();video.onerror=()=>reject(Error("Video decoding failed during compression."));});
  if(!recorder)throw Error("Video encoder was not initialized.");
  (recorder as MediaRecorder).stop();const blob=await encoded;await audioContext.close();onProgress?.(100);
  if(!blob.size)throw Error("Compression produced an empty file.");
  const ext=mime.startsWith("video/mp4")?"mp4":"webm";
  return new File([blob],source.name.replace(/\.[^.]+$/,"")+"-compressed."+ext,{type:blob.type});
 }finally{video.pause();video.removeAttribute("src");video.load();URL.revokeObjectURL(url);stream?.getTracks().forEach(track=>track.stop());if(recorder?.state==="recording")recorder.stop();}
}
