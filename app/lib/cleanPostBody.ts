/** Remove the legacy daily-post label and escaped or actual newlines from display text. */
export function cleanPostBody(body: string): string {
 return body.replace(/^\s*✦\s*DAILY UMMAH\s*✦(?:(?:\\[nr])|\s)*/i, "").replace(/^(?:(?:\\[nr])|\s)+/g, "").trim();
}
