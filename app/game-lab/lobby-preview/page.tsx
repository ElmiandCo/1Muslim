"use client";
import LobbyLiveScreen from "../../components/LobbyLiveScreen";
export default function LobbyPreview(){
 return <main style={{minHeight:"100dvh",background:"linear-gradient(#effffa,#c5e2df)",display:"grid",placeItems:"center",padding:24}}>
  <section style={{width:"min(100%,720px)",textAlign:"center",color:"#153b36"}}>
   <h1>1Muslim Shared Lobby · Live Screen Test</h1>
   <p>Live data comes from the existing public broadcasts. No simulated stream.</p>
   <LobbyLiveScreen/>
   <p>Spatial placement and multiplayer integration are still in development.</p>
  </section>
 </main>;
}
