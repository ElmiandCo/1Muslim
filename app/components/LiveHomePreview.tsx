"use client";
import HudHudLiveMiniPlayer from "./HudHudLiveMiniPlayer";

/** The actual global HudHud mini-player, mounted into the homepage canvas. */
export default function LiveHomePreview({roomName,streamId}:{roomName:string;streamId:string}){
 void roomName;void streamId;
 return <span className="live-home-embedded-player" style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:170,overflow:"hidden",borderRadius:0,pointerEvents:"none",animation:"omHomeLiveFloat 8s ease-in-out infinite"}}>
   <HudHudLiveMiniPlayer canvas />
   <style jsx>{`@keyframes omHomeLiveFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@media(prefers-reduced-motion:reduce){.live-home-embedded-player{animation:none!important}}`}</style>
 </span>;
}
