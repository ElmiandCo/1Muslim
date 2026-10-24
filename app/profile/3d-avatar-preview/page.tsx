"use client";

import { useEffect, useRef, useState } from "react";

const MODEL = "/assets/avatars/3d/1muslim-emerald-guardian-3d.glb";

export default function SpecialAvatarPreview() {
  const viewer = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [theme, setTheme] = useState<"night" | "day">("night");

  useEffect(() => {
    if (customElements.get("model-viewer")) { setReady(true); return; }
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.1.0/dist/model-viewer.min.js";
    script.onload = () => setReady(true);
    script.onerror = () => setError("3D viewer could not load. Check your connection.");
    document.head.appendChild(script);
    return () => { script.onload = null; script.onerror = null; };
  }, []);

  const modelProps: Record<string, unknown> = {
    src: MODEL,
    alt: "Faceless emerald-and-gold 3D guardian avatar",
    "camera-controls": true,
    "auto-rotate": autoRotate,
    "rotation-per-second": "25deg",
    "shadow-intensity": "1",
    "environment-image": "neutral",
    "camera-orbit": "0deg 75deg auto",
    "field-of-view": "30deg",
    "interaction-prompt": "auto",
    style: { width: "100%", height: "100%", background: "transparent", display: "block" },
    onError: () => setError("The GLB model could not be loaded."),
  };

  return (
    <main style={{minHeight:"100dvh",color:"#f5e9c8",background:theme==="night"?"radial-gradient(circle at 50% 34%,#13533e 0%,#071c1b 54%,#050d12 100%)":"radial-gradient(circle at 50% 34%,#e8d9a4 0%,#6eaa91 65%,#1a5449 100%)",fontFamily:"system-ui,sans-serif",padding:"20px 16px 56px"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <a href="/profile" style={{color:"#f5d78a",textDecoration:"none",fontSize:14}}>← Back to Profile</a>
          <span style={{letterSpacing:3,fontSize:12,fontWeight:800}}>1MUSLIM ✦ SPECIAL AVATARS</span>
          <button onClick={()=>setTheme(theme==="night"?"day":"night")} style={buttonStyle}>{theme==="night"?"☀ Day":"☾ Night"}</button>
        </header>
        <section style={{textAlign:"center",paddingTop:30}}>
          <div style={{fontSize:11,letterSpacing:4,color:"#f4d98b"}}>PROFILE • 3D AVATAR STUDIO</div>
          <h1 style={{fontSize:"clamp(28px,6vw,48px)",margin:"12px 0 4px",fontWeight:750}}>Emerald Guardian</h1>
          <p style={{opacity:.8,fontSize:14}}>Your first faceless 3D avatar · Rotate, zoom and explore</p>
        </section>
        <div style={{margin:"24px auto 0",maxWidth:650,height:"min(65vh,540px)",minHeight:340,border:"1px solid #e5c87855",borderRadius:30,overflow:"hidden",position:"relative",background:"radial-gradient(ellipse at 50% 65%,#b79a5633,transparent 60%)",boxShadow:"inset 0 0 70px #0b171d88"}}>
          <div style={{position:"absolute",top:18,left:18,fontSize:11,letterSpacing:2,zIndex:2,color:"#e9d79b"}}>✦ 3D PREVIEW</div>
          {ready && !error ? <div ref={viewer as any} style={{height:"100%"}}>{ReactModel(modelProps)}</div> : <div style={{height:"100%",display:"grid",placeItems:"center",textAlign:"center",padding:20}}>{error || "Loading interactive 3D viewer…"}</div>}
          <div style={{position:"absolute",bottom:16,left:0,right:0,textAlign:"center",fontSize:12,pointerEvents:"none",opacity:.8}}>Drag to rotate 360° · Pinch to zoom</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",gap:10,marginTop:18}}>
          <button style={buttonStyle} onClick={()=>setAutoRotate(!autoRotate)}>{autoRotate?"⏸ Stop rotation":"↻ Auto rotate"}</button>
          <button style={buttonStyle} onClick={()=>{const el=document.querySelector("model-viewer") as any;if(el){el.cameraOrbit="0deg 75deg auto";el.fieldOfView="30deg";el.jumpCameraToGoal?.();}}}>◎ Reset view</button>
          <button style={{...buttonStyle,background:selected?"#156d53":"linear-gradient(120deg,#d8b765,#f2db96)",color:selected?"white":"#16352d",fontWeight:750}} onClick={()=>setSelected(!selected)}>{selected?"✓ Selected for preview":"Select avatar"}</button>
        </div>
        <p style={{textAlign:"center",fontSize:12,opacity:.7,marginTop:16}}>{selected?"Preview selection only — your saved profile avatar has not changed.":"Demonstration only. No profile settings are changed."}</p>
      </div>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {minHeight:44,padding:"10px 17px",borderRadius:999,border:"1px solid #e7c67b77",background:"#0d352d",color:"#f6e8b7",cursor:"pointer",fontSize:13};

function ReactModel(props: Record<string,unknown>) {
  return require("react").createElement("model-viewer", props);
}
