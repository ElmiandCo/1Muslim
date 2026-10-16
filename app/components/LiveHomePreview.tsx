"use client";
import LiveKitViewer from "../../components/LiveKitViewer";

/**
 * Home canvas uses the same proven LiveKitViewer as the HudHud mini player.
 * The homepage card owns navigation, so embedded controls are noninteractive here.
 * Public viewers receive scoped viewing tokens, signed in or not.
 */
export default function LiveHomePreview({roomName,streamId}:{roomName:string;streamId:string}){
 return <span className="live-home-embedded-player" style={{display:"block",position:"relative",width:"100%",height:"100%",minHeight:170,overflow:"hidden",borderRadius:18,pointerEvents:"none",animation:"omHomeLiveFloat 8s ease-in-out infinite",willChange:"transform"}}>
   <LiveKitViewer key={streamId} roomName={roomName} streamId={streamId} embedded canvas forceMuted />
   <style jsx>{`@keyframes omHomeLiveFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@media(prefers-reduced-motion:reduce){.live-home-embedded-player{animation:none!important}}`}</style>
 </span>;
}
