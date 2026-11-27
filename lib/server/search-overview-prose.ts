/** Keep AI search overviews focused on the answer, not on the fact that a search ran.
 * These narrow repairs catch occasional stock introductions without changing
 * source citations, factual claims, or subsequent sentences.
 */
export function startSearchOverviewWithAnswer(query:string,raw:string):string{
 const text=raw.trim();
 if(!text)return text;
 const topic=query.trim().replace(/^[\s"'“”]+|[\s"'“”?!\.]+$/g,"").slice(0,110);
 if(!topic)return text;
 const capitalized=topic.charAt(0).toUpperCase()+topic.slice(1);
 // Example: "The search query about 'praying' yields ... . It is described ..."
 const meta=/^The (?:search )?query (?:about|for|on|regarding)\s+(?:(?:["'“])[^"'”]+(?:["'”])|[^.?!]{2,90}?)\s+(?:yields|returns|provides|shows|produces|brings up)\b[^.?!]*[.!?]\s*(?=It is\b)/i;
 if(meta.test(text))return text.replace(meta,capitalized+" ").replace(new RegExp("^"+escapeRegex(capitalized)+" It is\\b"),capitalized+" is");
 // Example: "The query pertains to the practice of praying in Islam, known
 // as Salah or Salat. It is one of the five pillars ..."
 const pertains=/^The (?:search )?query pertains to (?:the (?:practice|topic|subject|concept) of\s+)?([^.?!]+)[.!?]\s*It is\b/i;
 const match=pertains.exec(text);
 if(match){
  const subject=match[1].trim();
  // The appositive ("..., known as Salah") needs a closing comma before "is".
  const direct=subject.charAt(0).toUpperCase()+subject.slice(1);
  const prefix=direct.includes(",")?direct+", is":direct+" is";
  return prefix+text.slice(match[0].length);
 }
 return text;
}
function escapeRegex(value:string):string{
 return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}
