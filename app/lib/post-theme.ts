/** Capture the signed-in creator's selected RealTheme 2.0 palette at publish time. */
export type PostTheme="emerald"|"sapphire"|"ruby"|"amethyst"|"titanium"|"obsidian";
const supported=new Set<PostTheme>(["emerald","sapphire","ruby","amethyst","titanium","obsidian"]);
const aliases:Record<string,PostTheme>={"rose-gold":"ruby","silver-dust":"titanium","carbon-fiber":"obsidian"};
export function currentPostTheme():PostTheme{
 if(typeof window==="undefined")return "emerald";
 let saved:string|null=null;
 try{saved=localStorage.getItem("1muslim:profile-background")}catch{}
 const raw=saved||document.documentElement.dataset.muslimTheme||"emerald";
 const normalized=aliases[raw]||raw;
 return supported.has(normalized as PostTheme)?normalized as PostTheme:"emerald";
}
