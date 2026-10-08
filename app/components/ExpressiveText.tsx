"use client";
import { useState, type ReactNode } from "react";
const pattern = /(🔥|💚|❤️|😂|🤲|✨|🥹|🏆|🌙|🎉|👀|💯|😍|👏|😮|😭|🕊️|⭐|💥|🎊|🤩|😎|😅|🤯|💫|🙌|💪|🌹|💖|💐|☪️)/gu;
const styles: Record<string,string> = {
"🔥":"flame","💚":"heart","❤️":"heart","💖":"heart","😍":"heart","😂":"laugh","😅":"laugh",
"🤲":"dua","🙌":"dua","✨":"sparkle","⭐":"sparkle","💫":"sparkle","🥹":"heart",
"🏆":"trophy","🎉":"trophy","🎊":"trophy","👏":"trophy","💯":"trophy","💪":"trophy",
"🌙":"moon","☪️":"moon","👀":"eyes","😮":"eyes","🤯":"eyes","🤩":"sparkle",
"😭":"laugh","🕊️":"dua","🌹":"heart","💐":"heart","💥":"flame","😎":"trophy"
};
export function AnimatedEmoji({emoji}:{emoji:string}){
 const [burst,setBurst]=useState(0);
 const effect=styles[emoji];
 return <span className={"oneMuslimEmojiWrap "+(burst?"oneMuslimEmojiWrap--burst":"")} key={burst} onClick={()=>setBurst(v=>v+1)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setBurst(v=>v+1)}}} aria-label={emoji+" — replay animation"} title="Tap to celebrate!" style={{display:"inline-block",position:"relative",cursor:"pointer",verticalAlign:"baseline"}}>
   <span className={"oneMuslimEmoji oneMuslimEmoji--"+(effect??"sparkle")}>{emoji}</span>
   {burst>0&&<span className="oneMuslimEmojiBurst" aria-hidden="true">✦ ✧ ✦</span>}
 </span>;
}
export default function ExpressiveText({text}:{text:string}):ReactNode{
 return <>{text.split(pattern).map((part,i)=>styles[part]?<AnimatedEmoji key={i} emoji={part}/>:part)}</>;
}
