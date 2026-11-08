/** Strip the legacy Daily Ummah marker and either literal \\n or actual line breaks from displayed post text. */
export function cleanPostBody(body:string):string {
 return body.replace(/^\\s*✦\\s*DAILY UMMAH\\s*✦(?:\\s|\\\\[nr])*/i,"").replace(/^(?:\\\\[nr]|\\s)+/g,"").trim();
}
