import type {SVGProps} from "react";
export type UnlockedFeature = "deepwatch"|"quran"|"messages"|"live"|"personalization"|"qibla";
/** Consistent platinum line iconography for the Unlocked membership and product surfaces. */
export default function UnlockedFeatureIcon({name,...props}:{name:UnlockedFeature}&SVGProps<SVGSVGElement>){
 const base={width:48,height:48,viewBox:"0 0 48 48",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
 const paths={
 deepwatch:<><rect x="5" y="13" width="38" height="27" rx="5"/><path d="M5 20h38M10 7l30-3 2 9-34 4zM14 7l7 8M27 5l7 8"/><path d="m20 25 11 6-11 6z" fill="currentColor" fillOpacity=".18"/></>,
 quran:<><path d="M24 38c-6-4-11-5-18-4V10c7-1 13 0 18 4 5-4 11-5 18-4v24c-7-1-12 0-18 4Z"/><path d="M24 14v24M10 16c4-.4 7 .2 10 2M10 22c4-.4 7 .2 10 2M28 18c3-2 6-2.4 10-2M28 24c3-2 6-2.4 10-2M8 38c6-1 11 0 16 4 5-4 10-5 16-4" strokeOpacity=".6"/></>,
 messages:<><path d="M7 10h24a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H18l-9 7v-7a5 5 0 0 1-5-5V15a5 5 0 0 1 3-5Z"/><path d="M37 15h3a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4v6l-6-5M12 21h16M12 27h10" strokeOpacity=".75"/></>,
 live:<><rect x="18" y="5" width="12" height="25" rx="6"/><path d="M12 22a12 12 0 0 0 24 0M24 34v8M16 42h16M7 12a23 23 0 0 0-3 12M41 12a23 23 0 0 1 3 12M12 9l-3 5M36 9l3 5" strokeOpacity=".9"/></>,
 personalization:<><circle cx="24" cy="17" r="8"/><path d="M9 39c1-9 7-13 15-13s14 4 15 13M6 13l2-4 4-2-4-2-2-4-2 4-4 2 4 2 2 4M40 28l2-4 2 4 4 2-4 2-2 4-2-4-4-2 4-2" transform="translate(1 0) scale(.95)"/><path d="M14 42h20" strokeOpacity=".6"/></>,
 qibla:<><path d="M8 8h24a5 5 0 0 1 5 5v28H13a5 5 0 0 1-5-5V8Z"/><path d="M13 13h19M13 19h19M13 25h8M13 30h8M25 25h7v8h-7zM13 36h19M37 13h4v27h-4" strokeOpacity=".8"/><path d="M8 35a5 5 0 0 0 5 6"/></>
 };
 return <svg {...base} {...props}>{paths[name]}</svg>;
}
