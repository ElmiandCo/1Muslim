"use client";
import {Component, type ErrorInfo, type ReactNode} from "react";
import {createErrorReference,friendlyErrorMessage} from "../lib/error-reference";

type Props={children:ReactNode;streamId:string;section:string};
type State={failed:boolean;reference:string};
export default class LiveViewerBoundary extends Component<Props,State>{
 state:State={failed:false,reference:""};
 static getDerivedStateFromError():Partial<State>{return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){
  const reference=createErrorReference(this.props.section);
  this.setState({reference});
  console.error("1Muslim Live viewer component failed",reference,this.props.section,error,info.componentStack);
  // Report the exception from the guest's browser, where server logs cannot see it.
  try{void fetch("/api/live-viewer-error",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,streamId:this.props.streamId,section:this.props.section,message:String(error?.message||"Unknown error").slice(0,400),stack:String(error?.stack||"").slice(0,2000),componentStack:String(info.componentStack||"").slice(0,2000)})}).catch(()=>{});}catch{}
 }
 render(){
  if(!this.state.failed)return this.props.children;
  return <div role="alert" style={{position:"relative",zIndex:5,padding:16,color:"#fff",background:"#08130f",borderRadius:12}}>
   <strong>1Muslim Live needs a moment</strong>
   <p style={{fontSize:12,opacity:.8}}>{friendlyErrorMessage(this.props.section)}</p>
   <button type="button" onClick={()=>this.setState({failed:false})} style={{padding:"9px 16px",borderRadius:10,border:"1px solid #ffffff55",background:"#164532",color:"#fff"}}>Retry</button>
   <p style={{fontSize:11,opacity:.65,marginTop:14}}>1Muslim Error Reference # {this.state.reference||"Generating…"}</p>
  </div>;
 }
}
