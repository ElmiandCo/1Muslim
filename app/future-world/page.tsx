import type {Metadata} from "next";
import SharedGameLobby from "../components/SharedGameLobby";

export const metadata:Metadata={
 title:"Future City Preview | 1Muslim Games",
 description:"Playable preview of the 1Muslim futuristic world: hover traffic, skyways, flying, and multiplayer."
};

// Preview-only entrypoint. This route is intentionally independent from the
// homepage's game widget, and is committed only to the Future City branch.
export default function FutureWorldPreview(){
 return <main aria-label="1Muslim Future City playable preview" style={{
  position:"fixed",inset:0,width:"100vw",height:"100dvh",
  overflow:"hidden",background:"#030b22",zIndex:20
 }}>
  <SharedGameLobby initialWorld="Future"/>
 </main>;
}
