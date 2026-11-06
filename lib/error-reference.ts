export function createErrorReference(scope:string):string {
 const stamp=Date.now().toString(36).toUpperCase();
 const random=typeof crypto!=="undefined"&&"randomUUID" in crypto?crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase():Math.random().toString(36).slice(2,10).toUpperCase();
 return "1M-"+scope.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8)+"-"+stamp+"-"+random;
}
export function friendlyErrorMessage(scope:string):string {
 switch(scope){
  case "player":return "We couldn't display this Live right now. Please retry. The host may still be broadcasting.";
  case "comments":return "Live comments couldn't load. You can retry the conversation without leaving the broadcast.";
  case "guests":return "Guest controls are temporarily unavailable. Please retry to rejoin the conversation.";
  default:return "This part of 1Muslim encountered an unexpected problem. Please try again or return Home.";
 }
}
