/** Remove legacy system-generated post labels and their literal or real newline separators. */
export function cleanPostBody(body: string): string {
 return body.replace(/^\s*(?:(?:[✦•]\s*)?DAILY\s+UMMAH\s*(?:[✦•])?\s*(?:(?:\\\\[nr])|[\\r\\n])*)+/i, "").replace(/^(?:(?:\\\\[nr])|[\\r\\n])+/g, "").trim();
}
