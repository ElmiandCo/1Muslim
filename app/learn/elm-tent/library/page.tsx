"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Book={title:string;author:string;category:string;description:string;url:string;rights:string;download?:string};
const books:Book[]=[
 {title:"The Sealed Nectar (Ar-Raheeq Al-Makhtum)",author:"Safiur Rahman al-Mubarakpuri",category:"Seerah",description:"An acclaimed biography of Prophet Muhammad ﷺ. Publisher-authorized editions may require purchase; check the source's permissions before downloading or re-uploading.",url:"https://www.darussalam.com/search.php?search_query=the+sealed+nectar",rights:"Publisher / licensed edition"},
 {title:"Seerah resources and public collections",author:"Internet Archive collections",category:"Seerah",description:"Search historical editions and borrowing copies. Availability and reuse rights vary by item.",url:"https://archive.org/search?query=seerah+prophet+muhammad",rights:"Check item license"},
 {title:"The Qur’an — translations and study",author:"Quran.com",category:"Qur’an",description:"Read the Qur’an with translations and verse navigation. Use source links rather than redistributing copyrighted translations.",url:"https://quran.com/",rights:"External reading"},
 {title:"Sahih al-Bukhari",author:"Imam al-Bukhari",category:"Hadith",description:"Browse narrations and book chapters with references and translations.",url:"https://sunnah.com/bukhari",rights:"External reading"},
 {title:"Sahih Muslim",author:"Imam Muslim",category:"Hadith",description:"Browse narrations and chapters with citations.",url:"https://sunnah.com/muslim",rights:"External reading"},
 {title:"Riyad as-Salihin",author:"Imam an-Nawawi",category:"Hadith",description:"A collection organized around ethics, worship and daily practice.",url:"https://sunnah.com/riyadussalihin",rights:"External reading"},
 {title:"Islamic manuscript collections",author:"Internet Archive",category:"Classical texts",description:"Find scanned public-domain and licensed historical materials. Verify each item before downloading.",url:"https://archive.org/search?query=islamic+manuscripts",rights:"Check item license"}
];
export default function ElmTentLibrary(){
 const [query,setQuery]=useState("");const [category,setCategory]=useState("All");const [file,setFile]=useState<File|null>(null);const [status,setStatus]=useState("");
 const filtered=useMemo(()=>books.filter(b=>(category==="All"||b.category===category)&&[b.title,b.author,b.description].join(" ").toLowerCase().includes(query.toLowerCase())),[query,category]);
 const upload=async()=>{if(!file)return;setStatus("Preparing your document…");
 // Phase one: local, private browser-only reading. No file is transmitted or stored server-side.
 if(file.type!=="application/pdf"&& !file.name.toLowerCase().endsWith(".pdf")){setStatus("Please select a PDF.");return;}
 if(file.size>15*1024*1024){setStatus("PDF must be 15 MB or smaller.");return;}
 const url=URL.createObjectURL(file);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000);
 setStatus("Opened locally. Cloud upload and HudHud analysis require the secure document pipeline, which is not enabled yet.");
 };
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#1c3a30,#08120f 65%)",color:"#f0f7ef",padding:"32px clamp(16px,5vw,70px)"}}>
 <style>{`@keyframes bookRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}.bookTile{animation:bookRise .35s ease both;transition:transform .2s,border-color .2s}.bookTile:hover{transform:translateY(-3px);border-color:#a9d7b2!important}@media(prefers-reduced-motion:reduce){.bookTile{animation:none;transition:none}}`}</style>
 <Link href="/learn/elm-tent" style={{color:"#c5e9ce"}}>← Elm Tent</Link>
 <header style={{padding:"34px 0 20px"}}><span style={{color:"#c7dca5",fontSize:12,letterSpacing:3}}>1MUSLIM · ELM TENT</span><h1 style={{fontSize:"clamp(34px,6vw,62px)",margin:"12px 0"}}>📚 The Library</h1><p style={{maxWidth:680,lineHeight:1.7,color:"#c3d2c7"}}>A quiet home for books, Seerah, source documents, and serious study. Search curated references, visit trusted sources, and bring your own PDF to the learning workspace.</p></header>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}><input aria-label="Search books" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles, authors, topics…" style={{flex:"1 1 250px",padding:14,borderRadius:14,background:"#162b21",border:"1px solid #5b7962",color:"white"}}/><select aria-label="Category" value={category} onChange={e=>setCategory(e.target.value)} style={{padding:14,borderRadius:14,background:"#162b21",color:"white",border:"1px solid #5b7962"}}>{["All","Seerah","Qur’an","Hadith","Classical texts"].map(c=><option key={c}>{c}</option>)}</select></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,290px),1fr))",gap:16}}>{filtered.map((b,i)=><article className="bookTile" key={b.title} style={{animationDelay:i*40+"ms",background:"linear-gradient(155deg,#1a3026,#102018)",border:"1px solid #395848",borderRadius:20,padding:22,display:"flex",flexDirection:"column",gap:12}}>
 <span style={{fontSize:30}}>📖</span><small style={{color:"#c7dca5",letterSpacing:1}}>{b.category.toUpperCase()}</small><h2 style={{fontSize:20,margin:0}}>{b.title}</h2><span style={{fontSize:12,color:"#b6c7b9"}}>{b.author}</span><p style={{fontSize:13,lineHeight:1.65,flex:1}}>{b.description}</p><small style={{color:"#a8bdad"}}>📜 {b.rights}</small>
 <a href={b.url} target="_blank" rel="noopener noreferrer" style={{background:"#d7ebbb",color:"#102117",borderRadius:12,padding:12,textAlign:"center",fontWeight:800,textDecoration:"none"}}>↗ Open source / download options</a>
 </article>)}</div>
 {!filtered.length&&<p>No matching books yet. Try another search.</p>}
 <section style={{marginTop:36,padding:24,border:"1px solid #567a60",borderRadius:22,background:"#173125"}}>
 <h2>🧠 Bring a PDF to your Learning Studio</h2><p style={{lineHeight:1.7}}>Download a document you are permitted to use, then open it here. For now, files open privately in your browser. Secure cloud storage and HudHud document analysis are planned integrations—not yet active.</p>
 <label style={{display:"block",marginBottom:12}}>Choose a PDF (max 15 MB)<br/><input type="file" accept=".pdf,application/pdf" onChange={e=>{setFile(e.target.files?.[0]??null);setStatus("")}} style={{marginTop:10}}/></label>
 <button disabled={!file} onClick={()=>void upload()} style={{border:0,borderRadius:12,padding:"12px 18px",background:"#d7ebbb",color:"#112319",fontWeight:800,cursor:"pointer"}}>📄 Open my PDF</button>
 {status&&<p role="status">{status}</p>}
 </section>
 <p style={{fontSize:12,opacity:.7,marginTop:22}}>Library links point to external providers. A book being listed here does not mean it is public domain or licensed for redistribution.</p>
 </main>;
}
