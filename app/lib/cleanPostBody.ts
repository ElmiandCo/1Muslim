/** Hide internal daily-post markers in all public-facing captions. Keep metadata in storage for eligibility checks. */
export function cleanPostBody(body: string): string {
 return body.replace(/^\s*✦\s*DAILY\s+UMMAH\s*✦\s*(?:(?:\\\\[nr])|\s)*/i, "").replace(/^(?:(?:\\\\[nr])|\s)+/g, "").trim();
}
