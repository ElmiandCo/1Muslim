/** Lightweight, visually consistent outline icons for the profile action dock. */
export default function ProfileControlGlyph({kind}:{kind:"edit"|"message"|"share"|"insights"|"settings"|"posts"|"videos"}){
 const paths={
  edit:<><path d="M12 20h9"/><path d="M16.5 3.7a2.12 2.12 0 0 1 3 3L10 16l-4.2 1.2L7 13z"/></>,
  message:<><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-2 2v-8.5a8.5 8.5 0 0 1 8.5-8.5H13a8 8 0 0 1 8 6.5Z"/><path d="M8 12h8"/></>,
  share:<><path d="M7 17 18 6"/><path d="M9 6h9v9"/></>,
  insights:<><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 16v-4m5 4V8m5 8v-6"/></>,
  settings:<><path d="M4 7h8m4 0h4M4 17h3m4 0h9"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
  posts:<><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  videos:<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>
 };
 return <svg className="profileDockGlyph" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
