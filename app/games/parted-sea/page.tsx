import SharedGameLobby from "../../components/SharedGameLobby";

export const metadata = {
 title: "Parted Sea | 1Muslim Games Preview",
 description: "Explore a fictionalized dry seabed crossing with towering water walls, fleeing travelers and pursuing soldiers."
};

export default function PartedSeaPreviewPage(){
 return <main style={{position:"fixed",inset:0,width:"100vw",height:"100dvh",overflow:"hidden",background:"#052f42",zIndex:2147483600}}>
   <SharedGameLobby initialWorld="parted-sea"/>
 </main>;
}
