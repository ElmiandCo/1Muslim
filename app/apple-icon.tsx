import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS Home Screen icon: matches the approved crescent + 1 favicon. */
export default function AppleIcon() {
 return new ImageResponse(
  <div style={{display:"flex",position:"relative",width:"100%",height:"100%",background:"linear-gradient(145deg,#17553b,#071d15)",alignItems:"center",justifyContent:"center",borderRadius:38}}>
   <div style={{position:"absolute",inset:9,border:"2px solid #c6a969",borderRadius:31}}/>
   <div style={{display:"flex",position:"absolute",left:39,top:29,fontSize:119,fontWeight:900,color:"#e5c985",fontFamily:"serif"}}>1</div>
   <div style={{position:"absolute",left:106,top:37,width:47,height:47,borderRadius:99,background:"#e5c985"}}/>
   <div style={{position:"absolute",left:119,top:29,width:45,height:45,borderRadius:99,background:"#0b281d"}}/>
   <div style={{position:"absolute",left:142,top:29,width:7,height:7,borderRadius:99,background:"#f5e6b9"}}/>
  </div>,size);
}
