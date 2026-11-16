/** Strip legacy auto-generated labels, including literal \\n and actual line breaks. */
export function cleanPostBody(body: string): string {
 return body.replace(/^(?:(?:\\s|\\\\[nr])*[✦•·]?\\s*DAILY\\s+UMMAH\\s*[✦•·]?(?:\\s|\\\\[nr])*)+/gi, "").replace(/^(?:(?:\\r|\\n)|\\\\[nr])+/g, "").trim();
}
