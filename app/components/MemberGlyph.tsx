"use client";
/** Neutral, 1Muslim-original outline for members, groups and following.
 * Replaces the old playing-card club/clover symbol without changing navigation.
 */
export default function MemberGlyph({size=20}:{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{flexShrink:0,verticalAlign:"-.15em"}}>
  <circle cx="12" cy="7.1" r="3.1"/>
  <path d="M5.8 19v-1.4a6.2 6.2 0 0 1 12.4 0V19H5.8z"/>
  <path d="M19.1 8.4a2.5 2.5 0 0 1 0 4.8M18.7 15.4a4.5 4.5 0 0 1 3.1 4.3M4.9 8.4a2.5 2.5 0 0 0 0 4.8M5.3 15.4a4.5 4.5 0 0 0-3.1 4.3"/>
 </svg>;
}
