"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";

type Editable={profile_accent:string;profile_background:string;avatar_package:string;bio:string;username:string;email:string;password:string;selectedAvatarUrl:string;xp_total:number;avatar_gender:string;avatar_config:Record<string,unknown>};
const colors=[["emerald","Jannah Green","#22bd83"],["blue","Nur Blue","#398fff"],["gold","Najma Gold","#d9bd70"],["slate","Mulk Black","#202127"],["rose","Hoor Pink","#e89abb"],["ruby","Ruby Red","#ed3652"],["violet","Amethyst","#c85cf5"]];
const backgrounds=[
 ["emerald-mosaic","Jannah Green Mosaic","/assets/profile-backgrounds/emerald-mosaic.PNG",0],
 ["sapphire-mosaic","Nur Blue Mosaic","/assets/profile-backgrounds/sapphire-mosaic.PNG",0],
 ["golden-geometry","Najma Gold","/assets/profile-backgrounds/golden-geometry.PNG",0],
 ["ruby-red","Ruby Red","/assets/profile-backgrounds/ruby-red.PNG",0],
 ["amethyst-mirage","Hoor Pink","/assets/profile-backgrounds/amethyst-mirage.PNG",0],
 ["silver-eclipse","Silver Eclipse","/assets/profile-backgrounds/silver-eclipse.PNG",0],
 ["emerald","Emerald","/assets/profile-backgrounds/emerald.PNG",10000],
 ["sapphire","Sapphire","/assets/profile-backgrounds/sapphire.PNG",10000],
 ["rose-gold","Rose Gold","/assets/profile-backgrounds/rose-gold.PNG",10000],
 ["carbon-fiber","Carbon Fiber","/assets/profile-backgrounds/carbon-fiber.PNG",10000],
 ["amethyst","Amethyst","/assets/profile-backgrounds/amethyst.PNG",10000],
 ["obsidian","Obsidian","/assets/profile-backgrounds/obsidian.PNG",10000],
 ["ruby-gold","Ruby Gold","/assets/profile-backgrounds/ruby-gold.PNG",10000],
 ["silver-dust","Silver Dust","/assets/profile-backgrounds/silver-dust.PNG",10000],
 ["quran-sapphire-background","Qur’an Sapphire","/assets/profile-backgrounds/quran-sapphire-background.PNG",10000]
] as const;
const avatars=[
 ["/assets/avatars/default-male.jpg","Classic Male",0,"male"],
 ["/assets/avatars/Default-women.png","Classic Female",0,"female"],
 ["/assets/avatars/floral-avatar-female.PNG","Floral Female",0,"female"],
 ["/assets/avatars/silver-avatar-male.jpg","Silver Male",5000,"male"],
 ["/assets/avatars/silver-avatar-female.jpg","Silver Female",5000,"female"],
 ["/assets/avatars/gold-avatar-male.PNG","Gold Male",5000,"male"],
 ["/assets/avatars/gold-avatar-female.PNG","Gold Female",5000,"female"],
 ["/assets/avatars/water-avatar-male.PNG","Water Male",5000,"male"],
 ["/assets/avatars/water-avatar-female.PNG","Water Female",5000,"female"],
 ["/assets/avatars/diamond-avatar-female.PNG","Diamond Female · Elite",5000,"female"],
 ["/assets/avatars/cosmic-avatar-male.PNG","Cosmic Male · Elite",5000,"male"],
 ["/assets/avatars/cosmic-avatar-female.PNG","Cosmic Female · Elite",5000,"female"],
 ["/assets/avatars/emerald-royalty-female.PNG","Emerald Royalty · Elite",5000,"female"],
 ["/assets/avatars/violet-sentinel-female.PNG","Violet Sentinel · Elite",5000,"female"],
 ["/assets/avatars/tina-the-salafi-female.PNG","Tina the Salafi · Elite",5000,"female"]
] as const;

const fields=[["Theme Color","profile_accent"],["Background Image","profile_background"],["Avatar","avatar_package"],["Bio","bio"],["Username","username"],["Email","email"],["Password","password"]] as const;
const initial:Editable={profile_accent:"emerald",profile_background:"emerald-mosaic",avatar_package:"default",bio:"",username:"",email:"",password:"",selectedAvatarUrl:"",xp_total:0,avatar_gender:"",avatar_config:{}};
export default function Profile2AppearanceEditor({onSaved}:{onSaved?:()=>void}){

 const [values,setValues]=useState<Editable>(initial),[original,setOriginal]=useState<Editable>(initial),[open,setOpen]=useState<string|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState("");const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{let alive=true;(async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){if(alive){setMessage("Sign in to edit your profile.");setLoading(false)}return}const {data,error}=await db.from("profiles").select("profile_accent,profile_background,avatar_package,bio,username,avatar_config,xp_total,avatar_gender,gender").eq("id",user.id).single();if(!alive)return;if(error){setMessage(error.message);setLoading(false);return}const next:Editable={profile_accent:data.profile_accent||"emerald",profile_background:data.profile_background||data.avatar_config?.profileBackgroundTheme||"emerald-mosaic",avatar_package:data.avatar_package||"default",bio:data.bio||"",username:data.username||"",email:user.email||"",password:"",selectedAvatarUrl:String(data.avatar_config?.selectedAvatarUrl||""),xp_total:data.xp_total||0,avatar_gender:String(data.avatar_gender||data.gender||"").toLowerCase(),avatar_config:data.avatar_config||{}};setValues(next);setOriginal(next);setLoading(false)})();return()=>{alive=false}},[]);
 const pendingTheme=useRef<Promise<void>>(Promise.resolve());
 const commitTheme=(accent:string)=>{pendingTheme.current=pendingTheme.current.then(async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Please sign in again.");const {error}=await db.from("profiles").update({profile_accent:accent}).eq("id",user.id);if(error)throw Error(error.message);setOriginal(prev=>({...prev,profile_accent:accent}));window.dispatchEvent(new CustomEvent("1muslim:theme-changed",{detail:accent}));}).catch(error=>{setMessage(error instanceof Error?error.message:"Theme could not be saved.");});return pendingTheme.current;};
 const set=(key:keyof Editable,value:string)=>{setValues(old=>({...old,[key]:value}));setMessage("")};
 const save=async()=>{if(busy)return;setBusy(true);setMessage("");const db=createClient();try{
 await pendingTheme.current;
 const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error("Please sign in again.");
 const username=values.username.trim().replace(/^@/,"").toLowerCase();if(username&&!/^[a-z0-9_.]{3,30}$/.test(username))throw Error("Username must be 3–30 letters, numbers, dots or underscores.");
 if(values.selectedAvatarUrl!==original.selectedAvatarUrl){const choice=avatars.find(a=>a[0]===values.selectedAvatarUrl);if(choice&&values.xp_total<Number(choice[2]))throw Error("Avatar is locked until "+choice[2]+" XP.");if(choice&&["male","female"].includes(values.avatar_gender)&&choice[3]!==values.avatar_gender)throw Error("Choose an avatar from your profile gender gallery.");}
 if(values.password&&values.password.length<8)throw Error("Password must be at least 8 characters.");
 const backgroundChoice=backgrounds.find(b=>b[0]===values.profile_background);if(backgroundChoice&&values.xp_total<backgroundChoice[3])throw Error("Background requires "+backgroundChoice[3].toLocaleString()+" XP.");
 const patch:Record<string,unknown>={};for(const key of ["profile_accent","profile_background","avatar_package","bio"] as const)if(values[key]!==original[key])patch[key]=values[key];
 if(username!==original.username)patch.username=username||null;
 if(values.selectedAvatarUrl!==original.selectedAvatarUrl||values.profile_background!==original.profile_background)patch.avatar_config={...values.avatar_config,selectedAvatarUrl:values.selectedAvatarUrl,profileBackgroundTheme:values.profile_background};
 if(Object.keys(patch).length){const {error}=await db.from("profiles").update(patch).eq("id",user.id);if(error)throw Error(error.message)}
 if(values.email.trim()!==original.email){const {error}=await db.auth.updateUser({email:values.email.trim()});if(error)throw Error(error.message)}
 if(values.password){const {error}=await db.auth.updateUser({password:values.password});if(error)throw Error(error.message)}
 const next={...values,username,password:"",avatar_config:{...values.avatar_config,selectedAvatarUrl:values.selectedAvatarUrl,profileBackgroundTheme:values.profile_background}};
 const {data:refreshed,error:refreshError}=await db.from("profiles").select("avatar_package,avatar_config,profile_accent").eq("id",user.id).single();
 if(refreshError)throw Error("Changes saved, but the avatar refresh failed: "+refreshError.message);
 window.dispatchEvent(new CustomEvent("1muslim:avatar-changed",{detail:{userId:user.id,avatarPackage:refreshed.avatar_package,avatarConfig:refreshed.avatar_config}}));setOriginal(next);setValues(next);setOpen(null);setMessage("Saved successfully. Email changes may require confirmation. Appearance XP is credited when the database reward is enabled.");onSaved?.();
 const scroll=root.current?.closest('[style*="overflow"]') as HTMLElement|null;scroll?.scrollTo({top:0,behavior:"smooth"});root.current?.scrollIntoView({behavior:"smooth",block:"nearest"});
 window.dispatchEvent(new CustomEvent("1muslim:profile-background-changed",{detail:values.profile_background}));window.dispatchEvent(new Event("1muslim:appearance-updated"));window.dispatchEvent(new CustomEvent("1muslim:theme-changed",{detail:values.profile_accent}));window.dispatchEvent(new Event("1muslim-settings-updated"));
 }catch(e){setMessage(e instanceof Error?e.message:"Unable to save changes.")}finally{setBusy(false)}};
 const carousel=(items:readonly (readonly [string,string,string,number])[],title:string)=><div className="p2CarouselSection"><div className="p2CarouselTitle">{title}</div><div className="p2Carousel" role="group" aria-label={title}>{items.map(([id,label,image,xp])=><button type="button" key={id} className="p2EditChoice p2CarouselCard" disabled={values.xp_total<xp} aria-pressed={values.profile_background===id} onClick={()=>set("profile_background",id)}><img src={image} alt="" loading="lazy"/><span>{label}{values.profile_background===id?" ✓":""}</span>{values.xp_total<xp&&<small>🔒 {xp.toLocaleString()} XP</small>}</button>)}</div></div>;
 const avatarCarousel=(group:typeof avatars[number][],title:string)=><div className="p2CarouselSection"><div className="p2CarouselTitle">{title}</div><div className="p2Carousel" role="group" aria-label={title}>{group.map(([url,label,xp])=><button type="button" key={url} className="p2EditChoice p2CarouselCard" disabled={values.xp_total<xp} aria-pressed={values.selectedAvatarUrl===url} onClick={()=>set("selectedAvatarUrl",url)}><img src={url} alt="" loading="lazy"/><span>{label}{values.selectedAvatarUrl===url?" ✓":""}</span>{values.xp_total<xp&&<small>🔒 {xp.toLocaleString()} XP</small>}</button>)}</div></div>;
 const availableAvatars=avatars.filter(a=>!["male","female"].includes(values.avatar_gender)||a[3]===values.avatar_gender);
 return <div ref={root} className="p2Appearance">
 <style>{`.p2Appearance{display:grid;gap:10px}.p2EditRow{border:1px solid var(--p2-line);background:var(--p2-glass);border-radius:16px;overflow:hidden}.p2EditHead{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;background:transparent;border:0;color:inherit;text-align:left;font:inherit;cursor:pointer}.p2EditHead small{display:block;opacity:.65;margin-top:4px;font-size:12px}.p2EditBody{padding:0 16px 18px}.p2EditOptions{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:9px}.p2EditChoice{padding:12px;border:1px solid var(--p2-line);border-radius:12px;background:var(--p2-glass);color:inherit;cursor:pointer}.p2EditChoice[aria-pressed=true]{border-color:var(--p2-accent);box-shadow:inset 0 0 16px var(--p2-line)}.p2ThemeOptions{display:flex;flex-wrap:wrap;gap:8px}.p2ThemeChip{display:flex;align-items:center;gap:9px;border:1px solid var(--p2-line);border-radius:999px;background:var(--p2-glass);color:inherit;padding:7px 11px;cursor:pointer;font-size:12px}.p2ThemeChip[aria-pressed=true]{border-color:var(--p2-accent);box-shadow:0 0 0 1px var(--p2-accent)}.p2ThemeSwatch{display:block;width:24px;height:24px;border-radius:50%;border:1px solid #ffffff65;box-shadow:inset 0 0 8px #0004}.p2CarouselSection{margin-bottom:17px}.p2CarouselTitle{font-size:13px;font-weight:700;margin:5px 0 10px}.p2Carousel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding:3px 3px 12px;scrollbar-width:thin}.p2CarouselCard{flex:0 0 clamp(125px,35%,165px);scroll-snap-align:start;display:grid;gap:7px;align-content:start;min-width:0}.p2CarouselCard img{width:100%;height:130px;object-fit:cover;border-radius:10px}.p2CarouselCard span{font-size:12px}.p2CarouselCard small{font-size:11px;color:#e9ca8d}.p2CarouselCard:disabled{opacity:.65;cursor:not-allowed}.p2EditInput{width:100%;box-sizing:border-box;border-radius:12px;padding:13px;background:var(--p2-glass);border:1px solid var(--p2-line);color:inherit;font:inherit}.p2EditSave{position:sticky;bottom:8px;z-index:3;width:100%;padding:15px;border:1px solid var(--p2-accent);border-radius:16px;background:color-mix(in srgb,var(--p2-accent) 26%,#17232b);color:inherit;font:inherit;font-weight:750;cursor:pointer;backdrop-filter:blur(16px)}`}</style>
 <p style={{opacity:.8,margin:"4px 0 10px"}}>Customize your profile. Open any setting, choose your option, then save your changes together.</p>
 {loading?<p>Loading your settings…</p>:fields.map(([label,key])=><section className="p2EditRow" key={key}><button type="button" className="p2EditHead" aria-expanded={open===key} onClick={()=>setOpen(open===key?null:key)}><span><strong>{label}</strong><small>{key==="password"?"Secure account credential":key==="email"?values.email:key==="bio"?(values.bio||"Add your introduction"):key==="username"?"@"+(values.username||"member"):key==="profile_accent"?colors.find(c=>c[0]===values[key])?.[1]||values[key]:key==="profile_background"?backgrounds.find(c=>c[0]===values[key])?.[1]||values[key]:values[key]}</small></span><span aria-hidden="true">{open===key?"−":"+"}</span></button>{open===key&&<div className="p2EditBody">{key==="profile_accent"?<div className="p2ThemeOptions">{colors.map(([id,label,color])=><button type="button" key={id} className="p2ThemeChip" aria-pressed={values.profile_accent===id} onClick={()=>{set("profile_accent",id);void commitTheme(id)}}><i className="p2ThemeSwatch" style={{background:color}}/>{label}{values.profile_accent===id?" ✓":""}</button>)}</div>:key==="profile_background"?<>{carousel(backgrounds.filter(b=>b[3]===0),"Default · Available to everyone")}{carousel(backgrounds.filter(b=>b[3]>0),"Premium scenes · Unlock at 10,000 XP")}</>:key==="avatar_package"?<>{avatarCarousel(availableAvatars.filter(a=>a[2]===0),"Classic · Available")}{avatarCarousel(availableAvatars.filter(a=>a[2]===5000&&/Silver|Gold|Water/.test(a[1])),"Mu’mins · 5,000 XP")}{avatarCarousel(availableAvatars.filter(a=>a[2]===5000&&!/Silver|Gold|Water/.test(a[1])),"Elites · 5,000 XP")}</>:key==="bio"?<textarea className="p2EditInput" rows={4} maxLength={500} value={values.bio} onChange={e=>set(key,e.target.value)}/>:<input className="p2EditInput" type={key==="password"?"password":key==="email"?"email":"text"} autoComplete={key==="password"?"new-password":key==="email"?"email":"username"} placeholder={key==="password"?"New password (8+ characters)":label} value={values[key]} onChange={e=>set(key,e.target.value)}/>}</div>}</section>)}
 {message&&<p role="status" style={{margin:0,opacity:.9}}>{message}</p>}
 <button className="p2EditSave" type="button" onClick={()=>void save()} disabled={busy||loading}>{busy?"Saving…":"Save Changes ✓"}</button>
 </div>;
}
