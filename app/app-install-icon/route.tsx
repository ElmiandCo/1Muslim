import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET() {
 return new ImageResponse(
  <div style={{display:"flex",position:"relative",width:512,height:512,background:"linear-gradient(145deg,#17553b,#071d15)",alignItems:"center",justifyContent:"center",borderRadius:105}}>
   <div style={{position:"absolute",inset:25,border:"5px solid #c6a969",borderRadius:88}}/>
   <div style={{display:"flex",position:"absolute",left:112,top:82,fontSize:345,fontWeight:900,color:"#e5c985",fontFamily:"serif"}}>1</div>
   <div style={{position:"absolute",left:305,top:105,width:135,height:135,borderRadius:999,background:"#e5c985"}}/>
   <div style={{position:"absolute",left:343,top:82,width:130,height:130,borderRadius:999,background:"#0b281d"}}/>
   <div style={{position:"absolute",left:409,top:83,width:18,height:18,borderRadius:999,background:"#f5e6b9"}}/>
  </div>,{width:512,height:512});
}
