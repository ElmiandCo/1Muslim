"use client";
import type {CSSProperties} from "react";

/** Reusable vector icons for the upcoming universal 1Muslim navigation.
 * Inherit page accent via --global-nav-accent / --page-accent / --theme-accent.
 * Each icon retains its own secondary color for recognition.
 */
export type GlobalNavDestination = "search"|"posts"|"settings"|"deepwatch"|"muslims"|"quran"|"messages"|"profile"|"unlocked"|"signout";
const secondary:Record<GlobalNavDestination,string>={
 posts:"#89aef5",search:"#53d6ef",settings:"#a78bfa",deepwatch:"#f8b85b",muslims:"#ef83bf",
 quran:"#e7c178",messages:"#67dcd2",profile:"#bd9cf6",unlocked:"#f6d26e",signout:"#fa8b91"
};
export default function GlobalNavIcon({name,size=28,className="",title}:{
 name:GlobalNavDestination;size?:number;className?:string;title?:string
}){
 const paths:Record<GlobalNavDestination,React.ReactNode>={
 posts:<><rect x="4" y="3" width="16" height="18" rx="3"/><path className="accent" d="M8 8h8M8 12h8M8 16h5"/></>,
 search:<><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/><path d="M8.2 10.8h5.2" className="accent"/></>,
 settings:<><path d="M10 2.5h4l.7 2.7 2 .8 2.4-1.4 2.8 2.8-1.4 2.4.8 2 2.7.7v4l-2.7.7-.8 2 1.4 2.4-2.8 2.8-2.4-1.4-2 .8-.7 2.7h-4l-.7-2.7-2-.8-2.4 1.4-2.8-2.8 1.4-2.4-.8-2-2.7-.7v-4l2.7-.7.8-2-1.4-2.4 2.8-2.8 2.4 1.4 2-.8z" transform="translate(0 -1) scale(.96)"/><circle className="accent" cx="12" cy="12" r="3.2"/></>,
 deepwatch:<><rect x="2.5" y="5" width="19" height="14" rx="4"/><path className="accent" d="m10 8 6 4-6 4z"/><path d="M6 3.5h12M6 20.5h12" opacity=".6"/></>,
 muslims:<><circle className="accent" cx="12" cy="7" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/><path d="M4.2 8.5a2.5 2.5 0 1 0-1 4.8M19.8 8.5a2.5 2.5 0 1 1 1 4.8M2 20v-2a4 4 0 0 1 2-3.5M22 20v-2a4 4 0 0 0-2-3.5"/></>,
 quran:<><path d="M12 6c-3-2.2-6-2.6-9-2v14c3-.6 6-.2 9 2 3-2.2 6-2.6 9-2V4c-3-.6-6-.2-9 2z"/><path d="M12 6v14"/><path className="accent" d="m17 7 .7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z"/></>,
 messages:<><path d="M4 4h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path className="accent" d="m5 8 7 5 7-5"/></>,
 profile:<><circle className="accent" cx="12" cy="7.5" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/><path d="M5.5 5.5 4 7M18.5 5.5 20 7" opacity=".6"/></>,
 unlocked:<><path d="M12 2 21 9l-9 13L3 9z"/><path className="accent" d="M3 9h18M8 3.5 9 9l3 13 3-13 1-5.5"/></>,
 signout:<><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path className="accent" d="M10 12h11m-4-4 4 4-4 4"/></>
 };
 return <svg className={className} width={size} height={size} viewBox="0 0 24 24"
 role={title?"img":undefined} aria-label={title} aria-hidden={title?undefined:true}
 fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
 style={{"--nav-icon-secondary":secondary[name]} as CSSProperties}>
 {paths[name]}
 <style jsx>{`svg{color:var(--global-nav-accent,var(--page-accent,var(--theme-accent,var(--nav-icon-secondary))));transition:color .3s ease,filter .3s ease,transform .2s ease}svg :global(.accent){stroke:var(--nav-icon-secondary);transition:stroke .3s ease}svg:hover{filter:drop-shadow(0 0 5px var(--nav-icon-secondary));transform:translateY(-1px)}@media(prefers-reduced-motion:reduce){svg{transition:none}}`}</style>
 </svg>;
}
