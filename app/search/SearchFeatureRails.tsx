import Link from "next/link";

type Destination = {
  label: string;
  detail: string;
  href: string;
  icon: "posts" | "watch" | "live" | "book" | "prayer" | "compass";
};

// All destinations share a single horizontally scrollable rail, on every screen size.
const destinations:Destination[]=[
  {label:"Ummah Posts",detail:"What the Ummah is sharing",href:"/posts",icon:"posts"},
  {label:"DeepWatch",detail:"Films, shows and series",href:"/deepwatch",icon:"watch"},
  {label:"LIVE",detail:"Join live conversations",href:"/streaming",icon:"live"},
  {label:"Qur’an",detail:"Read and explore",href:"/quran-library",icon:"book"},
  {label:"Prayer Journey",detail:"Prayer times and learning",href:"/widget-tools/prayer",icon:"prayer"},
  {label:"Qibla",detail:"Open your profile compass",href:"/profile?compass=1",icon:"compass"}
];

function FeatureIcon({icon}:{icon:Destination["icon"]}) {
  const common={viewBox:"0 0 24 24",width:24,height:24,fill:"none",stroke:"currentColor",strokeWidth:1.6,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
  if(icon==="posts")return <svg {...common}><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if(icon==="watch")return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/></svg>;
  if(icon==="live")return <svg {...common}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6.6 6.6a7.6 7.6 0 0 0 0 10.8M17.4 6.6a7.6 7.6 0 0 1 0 10.8M3.7 3.7a11.6 11.6 0 0 0 0 16.6M20.3 3.7a11.6 11.6 0 0 1 0 16.6"/></svg>;
  if(icon==="book")return <svg {...common}><path d="M12 5c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v14"/></svg>;
  if(icon==="prayer")return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2M7 3.5 5 5M17 3.5 19 5"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="m10 10 6-3-3 7-6 3 3-7z" fill="currentColor" fillOpacity=".13"/><path d="m11 11 3-2-2 4-3 2z"/></svg>;
}

export default function SearchFeatureRails() {
  return <section className="dsExploreFeatureSection" aria-labelledby="dsExploreFeatureTitle">
    <div className="dsSectionHead"><h2 id="dsExploreFeatureTitle">Explore 1Muslim</h2></div>
    <div className="dsFeatureRails">
      <nav className="dsFeatureRail" aria-label="Explore all 1Muslim destinations. Swipe horizontally for more.">
        {destinations.map(item=><Link className="dsFeatureCard" href={item.href} key={item.href}
            aria-label={`${item.label}: ${item.detail}`}>
          <span className="dsFeatureIcon"><FeatureIcon icon={item.icon}/></span>
          <span className="dsFeatureCopy"><strong>{item.label}</strong><small>{item.detail}</small></span>
          {item.icon==="posts"&&<span className="dsFeaturePostPulse" aria-hidden="true"/>}
        </Link>)}
      </nav>
    </div>
  </section>;
}
