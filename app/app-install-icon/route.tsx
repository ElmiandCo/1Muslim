import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET() {
 return new ImageResponse(
  <div style={{display:"flex",position:"relative",width:512,height:512,background:"linear-gradient(145deg,#17553b,#071d15)",alignItems:"center",justifyContent:"center",borderRadius:105}}>
   <div style={{position:"absolute",inset:25,border:"5px solid #c6a969",borderRadius:88}}/>
   <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:245,fontWeight:900,color:"#e5c985",fontFamily:"sans-serif",letterSpacing:-28,paddingRight:28}}>1M</div>
  </div>,{width:512,height:512});
}
