import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS Home Screen icon: the 1M identity, without religious emblems. */
export default function AppleIcon() {
 return new ImageResponse(
  <div style={{display:"flex",position:"relative",width:"100%",height:"100%",background:"linear-gradient(145deg,#17553b,#071d15)",alignItems:"center",justifyContent:"center",borderRadius:38}}>
   <div style={{position:"absolute",inset:9,border:"2px solid #c6a969",borderRadius:31}}/>
   <div style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#e5c985",fontFamily:"sans-serif",fontWeight:900,fontSize:98,letterSpacing:-10,paddingRight:10}}>1M</div>
  </div>,size);
}
