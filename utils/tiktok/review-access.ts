/**
 * TikTok is available for 1Muslim's internal app-review recording only.
 * Never trust a client flag, URL param, or a profile field for access.
 * Keep the working OAuth integration intact for the actual administrator.
 */
export function canUseTikTokReview(user: {email?:string|null}|null|undefined):boolean{
 return (user?.email||"").trim().toLowerCase()==="hudhudbyelmi@gmail.com";
}
