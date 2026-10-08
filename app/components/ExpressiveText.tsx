"use client";
import type { ReactNode } from "react";
const emojiPattern = /(🔥|💚|❤️|😂|🤲|✨|🥹|🏆|🌙|🎉|👀|💯)/gu;
const animated: Record<string,string>={"🔥":"flame","💚":"heart","❤️":"heart","😂":"laugh","🤲":"dua","✨":"sparkle","🥹":"heart","🏆":"trophy","🌙":"moon","🎉":"trophy","👀":"eyes","💯":"trophy"};
export function AnimatedEmoji({emoji}:{emoji:string}){
 const effect=animated[emoji];
 return <span className={"oneMuslimEmoji "+(effect?"oneMuslimEmoji--"+effect:"")} role="img" aria-label={emoji} style={{display:"inline-block",transformOrigin:"center",cursor:"default"}}>{emoji}</span>;
}
export default function ExpressiveText({text}:{text:string}):ReactNode{
 return <>{text.split(emojiPattern).map((part,i)=>animated[part]?<AnimatedEmoji key={i} emoji={part}/>:part)}</>;
}
