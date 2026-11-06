export type EditorialSegment={startSeconds:number;endSeconds:number|null;videoId:string};
export function shouldOfferContinue(video:EditorialSegment,seconds:number,continuedIds:ReadonlySet<string>):boolean{
  return video.endSeconds!==null&&Number.isFinite(video.endSeconds)&&video.endSeconds>video.startSeconds&&Number.isFinite(seconds)&&seconds>=video.endSeconds&&!continuedIds.has(video.videoId);
}
export function countdownRemaining(elapsedSeconds:number):number{
  return Math.max(1,3-Math.floor(Math.max(0,elapsedSeconds)));
}
