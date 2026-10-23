import type {Metadata} from "next";
import SharedGameLobby from "../../components/SharedGameLobby";

export const metadata:Metadata={
 title:"Jurassic World · 1Muslim Games Preview",
 description:"Explore the prehistoric Jurassic reality in a standalone 1Muslim Games preview."
};

/** Isolated, direct-linkable Jurassic entry; production and other worlds are unchanged. */
export default function JurassicPreviewPage(){
 return <main aria-label="Jurassic World preview" style={{position:"relative",width:"100%",height:"100dvh",minHeight:480,overflow:"hidden",background:"#06241c"}}>
  <SharedGameLobby initialWorld="jurassic"/>
 </main>;
}
