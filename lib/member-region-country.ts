const aliases:Record<string,string>={
 "usa":"United States","us":"United States","u s":"United States","united states":"United States","u s a":"United States","united states of america":"United States","america":"United States",
 "uk":"United Kingdom","u k":"United Kingdom","united kingdom":"United Kingdom","great britain":"United Kingdom","britain":"United Kingdom",
 "uae":"United Arab Emirates","u a e":"United Arab Emirates","emirates":"United Arab Emirates",
 "ksa":"Saudi Arabia","kingdom of saudi arabia":"Saudi Arabia",
 "republic of somalia":"Somalia","turkiye":"Türkiye","turkey":"Türkiye",
 "ivory coast":"Côte d’Ivoire","cote d ivoire":"Côte d’Ivoire","drc":"Democratic Republic of the Congo",
 "the netherlands":"Netherlands","holland":"Netherlands","palestinian territories":"Palestine","state of palestine":"Palestine"
};
const codes:Record<string,string>={"US":"United States","GB":"United Kingdom","AE":"United Arab Emirates","SA":"Saudi Arabia","SO":"Somalia","TR":"Türkiye","PS":"Palestine","KR":"South Korea","KP":"North Korea","RU":"Russia","CI":"Côte d’Ivoire","CD":"Democratic Republic of the Congo"};
const clean=(v:string)=>v.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function canonicalCountry(value:string|null|undefined):string{
 const raw=(value||"").trim();if(!raw)return "";
 const key=clean(raw);if(aliases[key])return aliases[key];
 if(raw.length===2&&/^[a-z]{2}$/i.test(raw)){const code=raw.toUpperCase();if(codes[code])return codes[code];try{const label=new Intl.DisplayNames(["en"],{type:"region"}).of(code);if(label&&label!==code)return label}catch{}}
 return raw;
}
