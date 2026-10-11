"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

type Template={id:string;title:string;message:string;destination:string};
const templates:Template[]=[
{id:"shahada-call",title:"🤲 Take Shahada & Join a Call",message:"You're invited to discover the Shahada and connect with our 1Muslim community on a private call. Start your journey here:",destination:"/shahada"},
{id:"shahada",title:"🌙 Shahada First",message:"Begin with the Shahada. Learn what it means and take your first step with 1Muslim:",destination:"/shahada"},
{id:"live",title:"🔴 Join Live",message:"Join us live on 1Muslim for conversation, learning and community:",destination:"/streaming"},
{id:"umma",title:"✨ Say Bismillah & Join the Umma",message:"Bismillah! Join the 1Muslim Umma. Learn, share, and connect with the community:",destination:"/community"}
];
export default function OneMuslimShare(){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(templates[0].id),[copied,setCopied]=useState(false);
 const pathname=usePathname();
 const [conversation,setConversation]=useState("");
 useEffect(()=>{setConversation(new URLSearchParams(window.location.search).get("conversation")||"")},[pathname,open]);
 const template=templates.find(t=>t.id===selected)||templates[0];
 const destination=selected==="shahada-call"&&conversation?"/messages?conversation="+encodeURIComponent(conversation)+"&call=1":template.destination;
 const [origin,setOrigin]=useState("https://1muslim.live");
 useEffect(()=>{setOrigin(window.location.origin)},[]);
 const url=origin+destination;
 const message=template.message+" "+url;
 const encoded=encodeURIComponent(message);
 const copy=async()=>{try{await navigator.clipboard.writeText(message);setCopied(true);setTimeout(()=>setCopied(false),2400)}catch{setCopied(false)}};
 const share=async()=>{if(navigator.share){try{await navigator.share({title:template.title,text:template.message,url})}catch(e){if((e as Error).name!=="AbortError")void copy()}}else void copy()};
 return <><style>{`
 .oms-share-trigger{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom) + 85px);z-index:1090;border:1px solid #9d80ff;background:linear-gradient(135deg,#6629d9,#1575c9);color:white;border-radius:99px;padding:11px 16px;box-shadow:0 0 18px #7842e977;font-weight:750;cursor:pointer}
 .oms-share-overlay{position:fixed;inset:0;z-index:16000;background:#020714bd;display:grid;place-items:center;padding:16px;box-sizing:border-box}
 .oms-share-dialog{background:#101626;color:#f4f5ff;border:1px solid #755bd4;border-radius:24px;padding:22px;width:min(100%,540px);max-height:90dvh;overflow:auto;box-shadow:0 18px 80px #000b}
 .oms-share-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:18px 0}
 .oms-share-options button,.oms-share-actions button,.oms-share-actions a{background:#202842;color:#f5f5ff;border:1px solid #465078;border-radius:12px;padding:12px;cursor:pointer;text-decoration:none;font:inherit;text-align:center}
 .oms-share-options button[aria-pressed=true]{border-color:#9b73ff;background:linear-gradient(120deg,#522c9c,#184e9c)}
 .oms-share-preview{padding:15px;border-radius:15px;background:#171f36;line-height:1.6;overflow-wrap:anywhere}
 .oms-share-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}
 .oms-share-actions button:first-child{background:linear-gradient(120deg,#6732db,#1966b7)}
 @media(max-width:390px){.oms-share-options{grid-template-columns:1fr}}
 `}</style>
 <button type="button" className="oms-share-trigger" onClick={()=>setOpen(true)} aria-label="Open 1Muslim sharing templates">↗ Share 1Muslim</button>
 {open&&<div className="oms-share-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
 <section className="oms-share-dialog" role="dialog" aria-modal="true" aria-labelledby="oms-share-title">
 <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div><h2 id="oms-share-title" style={{margin:0}}>🐦 Share 1Muslim</h2><p style={{opacity:.75,margin:"5px 0 0"}}>Choose an invitation. HudHud prepares your message.</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close sharing" style={{background:"transparent",border:0,color:"white",fontSize:24,cursor:"pointer"}}>✕</button></header>
 <div className="oms-share-options">{templates.map(t=><button type="button" key={t.id} aria-pressed={selected===t.id} onClick={()=>setSelected(t.id)}>{t.title}</button>)}</div>
 {selected==="shahada-call"&&!conversation&&<p style={{fontSize:13,color:"#c6c9e5"}}>To share a private call, open a conversation in Messages first. This invitation currently opens the Shahada page.</p>}
 <div className="oms-share-preview"><strong>Invitation preview</strong><p>{template.message}</p><small>{url}</small></div>
 <div className="oms-share-actions"><button type="button" onClick={()=>void share()}>📤 Share externally</button><button type="button" onClick={()=>void copy()}>{copied?"✓ Copied":"📋 Copy invitation"}</button><a href={"sms:?&body="+encoded}>💬 Text</a><a href={"https://www.instagram.com/"} target="_blank" rel="noopener noreferrer" title="Copy invitation then paste into Instagram">Instagram ↗</a><a href={"https://www.tiktok.com/"} target="_blank" rel="noopener noreferrer" title="Copy invitation then paste into TikTok">TikTok ↗</a></div>
 <p style={{fontSize:12,opacity:.7}}>Instagram and TikTok do not support a universal prefilled-message link. Copy the invitation and paste it there, or use your device's share sheet.</p>
 </section></div>}</>
}