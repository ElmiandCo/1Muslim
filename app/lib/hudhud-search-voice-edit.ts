/** Local, deterministic editing only. Spoken text never becomes a URL or account command. */
export type HudHudSearchVoiceEdit={
 action:"edit"|"search"|"ignore";
 next:string;
 message:string;
};
const LIMIT=90;
const tidy=(value:string)=>value.replace(/\s+/g," ").trim().slice(0,LIMIT);
const safeWord=(value:string)=>value.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&");
function removeWord(current:string,word:string):string|null{
 const sought=word.trim().replace(/^[“"'‘]+|[”"'’]+$/g,"");
 if(!sought||sought.length>40)return null;
 const re=new RegExp("(^|\\s)"+safeWord(sought)+"(?=\\s|$)","i");
 return re.test(current)?tidy(current.replace(re,(_match,prefix:string)=>prefix)):null;
}
function replaceWords(current:string,oldPhrase:string,newPhrase:string):string|null{
 const oldText=oldPhrase.trim().replace(/^["“‘]+|["”’]+$/g,"");
 const replacement=newPhrase.trim().replace(/^["“‘]+|["”’]+$/g,"");
 if(!oldText||!replacement||oldText.length>60)return null;
 const re=new RegExp("(^|\\s)"+safeWord(oldText)+"(?=\\s|$)","i");
 return re.test(current)?tidy(current.replace(re,(_match,prefix:string)=>prefix+replacement)):null;
}
export function editHudHudSearchQuery(spoken:string,current:string,previous:string|null):HudHudSearchVoiceEdit{
 const words=spoken.trim().replace(/[.!?]+$/g,"").replace(/\s+/g," ");
 const query=tidy(current);
 if(!words)return {action:"ignore",next:query,message:""};
 if(/^(?:search that|search this|run (?:the )?search|show (?:the )?results)(?: please)?$/i.test(words))
  return {action:query?"search":"ignore",next:query,message:query?"Search submitted":"The search field is empty"};
 if(/^(?:undo(?: that| the change)?|go back one edit)$/i.test(words))
  return previous===null?{action:"ignore",next:query,message:"Nothing to undo"}:{action:"edit",next:tidy(previous),message:"Last edit undone"};
 if(/^(?:clear|erase|delete|reset)(?: the| my)?(?: search(?: query)?| query| everything| all)(?: please)?$/i.test(words))
  return {action:"edit",next:"",message:"Search cleared"};
 if(/^(?:erase|delete|remove)(?: this| that| the last) word$/i.test(words))
  return {action:"edit",next:tidy(query.replace(/(?:^|\s)\S+$/,"")),message:"Last word removed"};
 const remove=/^(?:remove|delete|erase)(?: the)? word (.+)$/i.exec(words);
 if(remove){
  const next=removeWord(query,remove[1]);
  return next===null?{action:"ignore",next:query,message:"Word not found"}:{action:"edit",next,message:"Word removed"};
 }
 const replace=/^(?:replace|change)(?: the)?(?: word)? (.+?) (?:with|to) (.+)$/i.exec(words);
 if(replace){
  const next=replaceWords(query,replace[1],replace[2]);
  return next===null?{action:"ignore",next:query,message:"Phrase not found"}:{action:"edit",next,message:"Search updated"};
 }
 const explicit=/^(?:set (?:the )?search (?:to|as)|write|type|dictate) (.+)$/i.exec(words);
 if(explicit)return {action:"edit",next:tidy(explicit[1]),message:"Search updated"};
 // Ordinary speech extends the current idea. Editing alone never submits a search.
 return {action:"edit",next:tidy([query,words].filter(Boolean).join(" ")),message:"Search updated"};
}
