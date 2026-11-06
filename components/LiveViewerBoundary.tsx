"use client";
import {Component, type ErrorInfo, type ReactNode} from "react";

type Props={children:ReactNode;streamId:string;section:string};
type State={failed:boolean};
export default class LiveViewerBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError():State{return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){
  console.error("1Muslim Live viewer component failed",this.props.section,error,info.componentStack);
  // Report the exception from the guest's browser, where server logs cannot see it.
  try{void fetch("/api/live-viewer-error",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({streamId:this.props.streamId,section:this.props.section,message:String(error?.message||"Unknown error").slice(0,400),stack:String(error?.stack||"").slice(0,2000),componentStack:String(info.componentStack||"").slice(0,2000)})}).catch(()=>{});}catch{}
 }
 render(){
  if(!this.state.failed)return this.props.children;
  return <div role="alert" style={{position:"relative",zIndex:5,padding:16,color:"#fff",background:"#08130f",borderRadius:12}}>
   <strong>{this.props.section==="player"?"Live player temporarily unavailable":"Live comments temporarily unavailable"}</strong>
   <p style={{fontSize:12,opacity:.8}}>The broadcast has not been ended. You can retry this section.</p>
   <button type="button" onClick={()=>this.setState({failed:false})} style={{padding:"9px 16px",borderRadius:10,border:"1px solid #ffffff55",background:"#164532",color:"#fff"}}>Retry</button>
  </div>;
 }
}
