"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "../../utils/supabase/client";
import {useAutoCarousel} from "./useAutoCarousel";

type Editable={profile_accent:string;profile_background:string;avatar_package:string;bio:string;username:string;email:string;password:string;selectedAvatarUrl:string;xp_total:number;avatar_gender:string;avatar_config:Record<string,unknown>};
const colors=[["emerald","Jannah Green"],["blue","Nur Blue"],["gold","Najma Gold"],["slate","Mulk Black"],["rose","Hoor Pink"],["ruby","Ruby Red"],["violet","Amethyst"]];
const backgrounds=[["none","No Background · Skeleton",""],["emerald","Jannah Green","/assets/profile-backgrounds/emerald.PNG"],["sapphire","Nur Blue","/assets/profile-backgrounds/sapphire.PNG"],["rose-gold","Najma Gold","/assets/profile-backgrounds/rose-gold.PNG"],["carbon-fiber","Mulk Black","/assets/profile-backgrounds/carbon-fiber.PNG"],["amethyst","Amethyst","/assets/profile-backgrounds/amethyst.PNG"],["ruby","Ruby Red","/assets/profile-backgrounds/ruby.PNG"],["silver-dust","Titanium","/assets/profile-backgrounds/silver-dust.PNG"]];
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
 ["/assets/avatars/diamond-avatar-female.PNG","Diamond Female · Elite",10000,"female"],
 ["/assets/avatars/cosmic-avatar-male.PNG","Cosmic Male · Elite",10000,"male"],
 ["/assets/avatars/cosmic-avatar-female.PNG","Cosmic Female · Elite",10000,"female"],
 ["/assets/avatars/emerald-royalty-female.PNG","Emerald Royalty · Elite",10000,"female"],
 ["/assets/avatars/violet-sentinel-female.PNG","Violet Sentinel · Elite",10000,"female"],
 ["/assets/avatars/tina-the-salafi-female.PNG","Tina the Salafi · Elite",20000,"female"]
] as const;

const fields=[["Theme Color","profile_accent"],["Background Image","profile_background"],["Avatar","avatar_package"],["Bio","bio"],["Username","username"],["Email","email"],["Password","password"]] as const;
const initial:Editable={profile_accent:"emerald",profile_background:"carbon-fiber",avatar_package:"default",bio:"",username:"",email:"",password:"",selectedAvatarUrl:"",xp_total:0,avatar_gender:"",avatar_config:{}};
export default function Profile2AppearanceEditor({onSaved}:{onSaved?:()=>void}){

 const [values,setValues]=useState<Editable>(initial),[original,setOriginal]=useState<Editable>(initial),[open,setOpen]=useState<string|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState("");const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{let alive=true;(async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){if(alive){setMessage("Sign in to edit your profile.");setLoading(false)}return}const {data,error}=await db.from("profiles").select("profile_accent,profile_background,avatar_package,bio,username,avatar_config,xp_total,avatar_gender,gender").eq("id",user.id).single();if(!alive)return;if(error){setMessage(error.message);setLoading(false);return}const next:Editable={profile_accent:data.profile_accent||"emerald",profile_background:data.profile_background||"carbon-fiber",avatar_package:data.avatar_package||"default",bio:data.bio||"",username:data.username||"",email:user.email||"",password:"",selectedAvatarUrl:String(data.avatar_config?.selectedAvatarUrl||""),xp_total:data.xp_total||0,avatar_gender:String(data.avatar_gender||data.gender||"").toLowerCase(),avatar_config:data.avatar_config||{}};setValues(next);setOriginal(next);setLoading(false)})();return()=>{alive=false}},[]);
 const pendingTheme=useRef<Promise<void>>(Promise.resolve());
 const commitTheme=(accent:string)=>{pendingTheme.current=pendingTheme.current.then(async()=>{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Please sign in again.");const {error}=await db.from("profiles").update({profile_accent:accent}).eq("id",user.id);if(error)throw Error(error.message);setOriginal(prev=>({...prev,profile_accent:accent}));window.dispatchEvent(new Event("1muslim:theme-changed"));}).catch(error=>{setMessage(error instanceof Error?error.message:"Theme could not be saved.");});return pendingTheme.current;};
 const set=(key:keyof Editable,value:string)=>{setValues(old=>({...old,[key]:value}));setMessage("")};
 const save=async()=>{if(busy)return;setBusy(true);setMessage("");const db=createClient();try{
 await pendingTheme.current;
 const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error("Please sign in again.");
 const username=values.username.trim().replace(/^@/,"").toLowerCase();if(username&&!/^[a-z0-9_.]{3,30}$/.test(username))throw Error("Username must be 3–30 letters, numbers, dots or underscores.");
 if(values.selectedAvatarUrl!==original.selectedAvatarUrl){const choice=avatars.find(a=>a[0]===values.selectedAvatarUrl);if(choice&&values.xp_total<Number(choice[2]))throw Error("Avatar is locked until "+choice[2]+" XP.");if(choice&&["male","female"].includes(values.avatar_gender)&&choice[3]!==values.avatar_gender)throw Error("Choose an avatar from your profile gender gallery.");}
 if(values.password&&values.password.length<8)throw Error("Password must be at least 8 characters.");
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
 window.dispatchEvent(new CustomEvent("1muslim:profile-background-changed",{detail:values.profile_background}));window.dispatchEvent(new Event("1muslim:appearance-updated"));window.dispatchEvent(new Event("1muslim:theme-changed"));window.dispatchEvent(new Event("1muslim-settings-updated"));
 }catch(e){setMessage(e instanceof Error?e.message:"Unable to save changes.")}finally{setBusy(false)}};
 const backgroundsRail=useAutoCarousel<HTMLDivElement>(backgrounds.length);
 const colorsRail=useAutoCarousel<HTMLDivElement>(colors.length);
 const avatarsRail=useAutoCarousel<HTMLDivElement>(avatars.length);
 const options=(items:string[][],key:keyof Editable)=><div ref={key==="profile_background"?backgroundsRail:colorsRail} className="p2EditOptions p2AutoRail">{items.map(([id,label,image])=><button type="button" key={id} className="p2EditChoice" aria-pressed={values[key]===id} onClick={()=>{set(key,id);if(key==="profile_accent")void commitTheme(id)}}>{image&&<img src={image} alt="" loading="lazy" style={{width:"100%",height:110,objectFit:"cover",borderRadius:10,display:"block",marginBottom:8}}/>}{label}{values[key]===id?" ✓":""}</button>)}</div>;
 return <div ref={root} className="p2Appearance">
 <style>{`.p2Appearance{display:grid;gap:10px}.p2EditRow{border:1px solid var(--p2-line);background:var(--p2-glass);border-radius:16px;overflow:hidden}.p2EditHead{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;background:transparent;border:0;color:inherit;text-align:left;font:inherit;cursor:pointer}.p2EditHead small{display:block;opacity:.65;margin-top:4px;font-size:12px}.p2EditBody{padding:0 16px 18px}.p2EditOptions{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:9px}.p2AutoRail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:thin;padding:4px 2px 12px}.p2AutoRail .p2EditChoice{flex:0 0 clamp(148px,46%,210px);scroll-snap-align:start}.p2EditChoice{padding:12px;border:1px solid var(--p2-line);border-radius:12px;background:var(--p2-glass);color:inherit;cursor:pointer}.p2EditChoice[aria-pressed=true]{border-color:var(--p2-accent);box-shadow:inset 0 0 16px var(--p2-line)}.p2EditInput{width:100%;box-sizing:border-box;border-radius:12px;padding:13px;background:var(--p2-glass);border:1px solid var(--p2-line);color:inherit;font:inherit}.p2EditSave{position:sticky;bottom:8px;z-index:3;width:100%;padding:15px;border:1px solid var(--p2-accent);border-radius:16px;background:color-mix(in srgb,var(--p2-accent) 26%,#17232b);color:inherit;font:inherit;font-weight:750;cursor:pointer;backdrop-filter:blur(16px)}`}</style>
 <p style={{opacity:.8,margin:"4px 0 10px"}}>Customize your profile. Open any setting, choose your option, then save your changes together.</p>
 {loading?<p>Loading your settings…</p>:fields.map(([label,key])=><section className="p2EditRow" key={key}><button type="button" className="p2EditHead" aria-expanded={open===key} onClick={()=>setOpen(open===key?null:key)}><span><strong>{label}</strong><small>{key==="password"?"Secure account credential":key==="email"?values.email:key==="bio"?(values.bio||"Add your introduction"):key==="username"?"@"+(values.username||"member"):key==="profile_accent"?colors.find(c=>c[0]===values[key])?.[1]||values[key]:key==="profile_background"?backgrounds.find(c=>c[0]===values[key])?.[1]||values[key]:values[key]}</small></span><span aria-hidden="true">{open===key?"−":"+"}</span></button>{open===key&&<div className="p2EditBody">{key==="profile_accent"?options(colors,key):key==="profile_background"?options(backgrounds,key):key==="avatar_package"?<div ref={avatarsRail} className="p2EditOptions p2AutoRail">{avatars.filter(a=>!["male","female"].includes(values.avatar_gender)||a[3]===values.avatar_gender).map(([url,label,xp])=><button type="button" key={url} className="p2EditChoice" disabled={values.xp_total<Number(xp)} aria-pressed={values.selectedAvatarUrl===url} onClick={()=>set("selectedAvatarUrl",String(url))}><img src={String(url)} alt="" style={{width:"100%",maxHeight:100,objectFit:"contain"}}/><span style={{display:"block"}}>{label}{values.selectedAvatarUrl===url?" ✓":""}{values.xp_total<Number(xp)?" · "+xp+" XP":""}</span></button>)}</div>:key==="bio"?<textarea className="p2EditInput" rows={4} maxLength={500} value={values.bio} onChange={e=>set(key,e.target.value)}/>:<input className="p2EditInput" type={key==="password"?"password":key==="email"?"email":"text"} autoComplete={key==="password"?"new-password":key==="email"?"email":"username"} placeholder={key==="password"?"New password (8+ characters)":label} value={values[key]} onChange={e=>set(key,e.target.value)}/>}</div>}</section>)}
 {message&&<p role="status" style={{margin:0,opacity:.9}}>{message}</p>}
 <button className="p2EditSave" type="button" onClick={()=>void save()} disabled={busy||loading}>{busy?"Saving…":"Save Changes ✓"}</button>
 </div>;
}
