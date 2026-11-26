// Pure, allowlisted HudHud navigation grammar. Spoken words never become arbitrary selectors or URLs.
export type HudHudAction =
 | {kind:"navigate";path:string;label:string}
 | {kind:"back"}
 | {kind:"scroll";direction:"up"|"down"}
 | {kind:"find";label:string}
 | {kind:"tab";label:string}
 | {kind:"fill";field:string;value:string}
 | {kind:"refresh"}
 | {kind:"describe"}
 | {kind:"usual"}
 | {kind:"delete"}
 | {kind:"pause"}
 | {kind:"disable"}
 | {kind:"question";text:string}
 | {kind:"unknown"};

const destinations: Array<{label:string;path:string;terms:RegExp}> = [
 {label:"Home",path:"/search",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:home|search(?: page)?|discover)$/},
 {label:"Profile",path:"/profile",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:my )?profile$/},
 {label:"Ummah Posts",path:"/posts",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:ummah(?: posts)?|posts|feed|community)$/},
 {label:"Messages",path:"/messages",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:my )?(?:messages|inbox|messenger)$/},
 {label:"Qur’an",path:"/quran-library",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:the )?(?:quran|qur.an|quran library|qur.an library)$/},
 {label:"Prayer",path:"/widget-tools/prayer",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:the )?(?:prayer|salah|prayer times|prayer page)$/},
 {label:"DeepWatch",path:"/deepwatch",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:deep ?watch|movies|series)$/},
 {label:"Live",path:"/streaming",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:live|live streams|streaming)$/},
 {label:"Qibla",path:"/qibla",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:qibla|direction of prayer)$/},
 {label:"Notifications",path:"/notifications",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?(?:my )?notifications$/},
 {label:"Settings",path:"/settings",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?settings$/},
 {label:"HudHud",path:"/hudhud",terms:/^(?:(?:go|navigate|take me|switch) to |open |show )?hudhud(?: chat)?$/}
];
export function parseHudHudCommand(raw:string): HudHudAction {
 let words=raw.trim().toLowerCase().replace(/[.?!]+$/,"").replace(/^\s*(?:(?:hey|okay|ok)\s+)?hud\s?hud[,\s:]+/,"").trim();
 if(!words)return {kind:"unknown"};
 if(/^(?:turn off|disable|switch off|exit) (?:full access|hudhud full access|voice control)$/.test(words))return {kind:"disable"};
 if(/^(?:stop listening|pause listening|pause hudhud|be quiet|mute microphone)$/.test(words))return {kind:"pause"};
 if(/^(?:where am i|what page am i on|describe (?:this|the) (?:page|screen)|what is on (?:this|the) (?:page|screen))$/.test(words))return {kind:"describe"};
 if(/^(?:go to|open|show|take me to) (?:my )?(?:usual|favorite|favourite|most visited) (?:page|place)$/.test(words))return {kind:"usual"};
 if(/^(?:go back|previous page|back one page)$/.test(words))return {kind:"back"};
 if(/^(?:scroll|move|page) (up|down)(?: a little| slowly| now| please)?$/.test(words))return {kind:"scroll",direction:words.includes("up")?"up":"down"};
 if(/^(?:refresh|reload|update) (?:this |the |current )?(?:page|section|results)$/.test(words))return {kind:"refresh"};
 if(/^(?:delete|remove|erase) (?:this |the |current )?(?:post)(?: permanently)?$/.test(words))return {kind:"delete"};
 const tab=words.match(/^(?:(?:open|select|switch to|tap|click|show) (?:the )?)(.{2,46}?)(?: tab| category)$/);
 if(tab)return {kind:"tab",label:tab[1].trim()};
 const find=words.match(/^(?:scroll to|find|go to|focus on|highlight|show me) (?:the )?(.{2,60}?)(?: section| heading| area)?$/);
 // Navigation is resolved first, so 'go to profile' cannot select arbitrary DOM.
 for(const route of destinations)if(route.terms.test(words))return {kind:"navigate",path:route.path,label:route.label};
 if(find)return {kind:"find",label:find[1].trim()};
 const fill=words.match(/^(?:fill|type|enter|write) (?:in |into )?(?:the )?(.{2,35}?)(?: field| box| input)? (?:with|as|to|:?) (.{1,180})$/);
 if(fill && !/(password|card|payment|token|secret|security|otp|one time code|verification)/.test(fill[1]))
  return {kind:"fill",field:fill[1].trim(),value:fill[2].trim()};
 if(/^(?:ask|explain|tell me|what|why|how|who|when|can you|could you|help me|is |are )/.test(words))
  return {kind:"question",text:words.slice(0,900)};
 return {kind:"unknown"};
}
export function hudhudSafePath(path:string):boolean {
 return destinations.some(item=>item.path===path);
}
export function hudhudScreenLabel(path:string):string {
 return destinations.find(item=>path===item.path)?.label ||
  (path.startsWith("/posts/story/")?"Post Story":path.startsWith("/posts/")?"Post":path.startsWith("/profile")?"Profile":path.startsWith("/quran")?"Qur’an":"This page");
}
export function hudhudDeleteTarget(path:string):{kind:"legacy"|"ummah";id:string}|null {
 const exact=path.match(/^\/posts\/([0-9a-f-]{36})$/i);
 if(exact)return {kind:"legacy",id:exact[1]};
 const story=path.match(/^\/posts\/story\/([0-9a-f-]{36})$/i);
 if(story)return {kind:"ummah",id:story[1]};
 return null;
}
