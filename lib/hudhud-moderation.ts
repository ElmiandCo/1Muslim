/** Conservative pre-publication screening; potential religious insults require human review. */
export type ModerationResult={restricted:boolean;reason:string|null;category:"profanity"|"religious_insult"|"none"};
const profanity=/\b(?:f[\W_]*u[\W_]*c[\W_]*k(?:ing|ed|er|s)?|sh[\W_]*i[\W_]*t(?:ty|s)?|b[\W_]*i[\W_]*t[\W_]*c[\W_]*h(?:es)?)\b/i;
const religiousInsult=/\b(?:allah|qur[’']?an|koran|prophet muhammad|muhammad)\b.{0,55}\b(?:stupid|worthless|fake|trash|idiot)\b|\b(?:stupid|worthless|fake|trash|idiot)\b.{0,55}\b(?:allah|qur[’']?an|koran|prophet muhammad)\b/i;
export function screenPost(text:string):ModerationResult {
 if(profanity.test(text))return {restricted:true,reason:"Possible profanity",category:"profanity"};
 if(religiousInsult.test(text))return {restricted:true,reason:"Possible religious insult — context review required",category:"religious_insult"};
 return {restricted:false,reason:null,category:"none"};
}
