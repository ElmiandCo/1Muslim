/** Lightweight, visually consistent outline icons for the profile action dock. */
export default function ProfileControlGlyph({kind}:{kind:"edit"|"message"|"share"|"insights"|"settings"|"posts"|"videos"}){
 const paths={
  edit:<><path d="M12 20h9"/><path d="M16.5 3.7a2.12 2.12 0 0 1 3 3L10 16l-4.2 1.2L7 13z"/></>,
  message:<><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-2 2v-8.5a8.5 8.5 0 0 1 8.5-8.5H13a8 8 0 0 1 8 6.5Z"/><path d="M8 12h8"/></>,
  share:<><path d="M7 17 18 6"/><path d="M9 6h9v9"/></>,
  insights:<><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M7 16v-4m5 4V8m5 8v-6"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .35 1.9l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.9-.35 1.7 1.7 0 0 0-1 1.6v.1h-3v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.35l-.06.06-2.1-2.1.06-.06a1.7 1.7 0 0 0 .35-1.9 1.7 1.7 0 0 0-1.6-1H5v-3h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.35-1.9L6.3 8l2.1-2.1.06.06a1.7 1.7 0 0 0 1.9.35 1.7 1.7 0 0 0 1-1.6v-.1h3v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.35l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.35 1.9 1.7 1.7 0 0 0 1.6 1h.1v3h-.1a1.7 1.7 0 0 0-1.6 1z" transform="translate(0 0) scale(.92) translate(1 1)"/></>,
  posts:<><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  videos:<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>
 };
 return <svg className="profileDockGlyph" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
