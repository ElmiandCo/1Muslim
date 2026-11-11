import type {SVGProps} from "react";
type Kind="home"|"feed"|"profile"|"community"|"messages";
type Props=SVGProps<SVGSVGElement>&{kind:Kind};
/** Bespoke 1Muslim profile navigation glyphs, drawn on a shared 48px grid. */
export default function ProfileNavIcon({kind,...props}:Props){
 const common={stroke:"currentColor",strokeWidth:2.35,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
 {kind==="home"&&<g {...common}><path d="M7 23.2 24 9l17 14.2"/><path d="M11.5 20.5V38h25V20.5"/><path d="M20 38V27.5c0-2.2 1.8-4 4-4s4 1.8 4 4V38"/><path d="M18 15.3h12" opacity=".42"/></g>}
 {kind==="feed"&&<g {...common}><rect x="8" y="8" width="32" height="32" rx="8"/><path d="M15 18h18M15 25h18M15 32h10"/><circle cx="34" cy="32" r="2" fill="currentColor" stroke="none"/></g>}
 {kind==="profile"&&<g {...common}><circle cx="24" cy="17" r="8"/><path d="M9.5 39c0-8.2 5.6-13 14.5-13s14.5 4.8 14.5 13"/><path d="M16.5 37h15" opacity=".45"/></g>}
 {kind==="community"&&<g {...common}><circle cx="24" cy="14.5" r="6"/><path d="M12.5 35c0-6.3 4.4-10 11.5-10s11.5 3.7 11.5 10"/><path d="M11.5 15a5 5 0 0 0-1 9.7M36.5 15a5 5 0 0 1 1 9.7M7 34c0-3.8 2.1-6.1 5.8-7M41 34c0-3.8-2.1-6.1-5.8-7"/></g>}
 {kind==="messages"&&<g {...common}><path d="M9 12h30a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H20l-9 5v-5H9a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z"/><path d="m12 19 12 9 12-9"/></g>}
 </svg>;
}
