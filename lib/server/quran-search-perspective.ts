/**
 * First-party, reviewed Qur'an references for search topics with clear
 * scriptural relevance. These are short editorial summaries, NOT translations.
 * Only show them when the query identifies the topic; never let LLM guesses
 * create a ruling or invent a reference.
 */
export type QuranSearchCitation={ref:string;title:string;url:string};
export type QuranSearchPerspective={lead:string;citations:QuranSearchCitation[]};
const verse=(ref:string,slug:string):QuranSearchCitation=>({
 ref,title:"Qur'an "+ref,url:"https://quran.com/"+slug
});

export function getQuranSearchPerspective(input:string):QuranSearchPerspective|null{
 const q=input.normalize("NFKC").toLowerCase().trim();
 if(!q)return null;
 // Health emergencies and technical chemistry queries need their direct
 // factual response first; avoid inserting a generic moral ruling.
 if(/\b(poisoning|overdose|withdrawal|seizure|emergency|detox|chemical formula|chemical structure|solvent|sanitizer|disinfectant|isopropyl|rubbing alcohol|ethanol production|alcohol free|alcohol-free|alcohol ink|alcohol thermometer|cleaning|cosmetic|perfume|hand sanitizer|wine vinegar|vinegar|industrial alcohol|alcohol based|alcohol-based)\b/i.test(q))return null;
 if(/\b(alcohol|alcoholic|beer|wine|liquor|intoxicants?|khamr)\b/i.test(q)){
  // Only drinking/intoxicants are addressed by the Qur'anic prohibition.
  // Ethanol in hand sanitizer, perfumes and medicines is not automatically
  // equivalent to consuming alcoholic beverages.
  return {
   lead:"In Islam, consuming intoxicating drinks is haram (prohibited). Allah instructs believers to avoid intoxicants in Qur'an 5:90–91. Qur'an 2:219 also acknowledges some benefit while describing the harm and sin as greater.",
   citations:[verse("5:90–91","5/90-91"),verse("2:219","2/219")]
  };
 }
 if(/\b(gambling|betting|casino|lottery|wagering|maysir)\b/i.test(q)){
  return {
   lead:"In Islam, gambling is prohibited. Allah instructs believers to avoid gambling alongside intoxicants in Qur'an 5:90–91.",
   citations:[verse("5:90–91","5/90-91"),verse("2:219","2/219")]
  };
 }
 if(/\b(pork|pig meat|swine flesh)\b/i.test(q)){
  return {
   lead:"In Islam, eating pork is prohibited, while the Qur'an recognizes an exception for genuine necessity. See Qur'an 2:173.",
   citations:[verse("2:173","2/173")]
  };
 }
 if(/\b(riba|usury)\b/i.test(q)||/\binterest\b/i.test(q)&&/\b(islam|quran|qur'an|bank|loan|finance|halal|haram)\b/i.test(q)){
  return {
   lead:"The Qur'an prohibits riba, commonly translated as usury or interest (2:275). How particular modern financial products are classified requires careful analysis rather than a blanket ruling.",
   citations:[verse("2:275","2/275")]
  };
 }
 return null;
}
