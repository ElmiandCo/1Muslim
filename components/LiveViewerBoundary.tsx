"use client";
import {Component, type ErrorInfo, type ReactNode} from "react";
import {createErrorReference,friendlyErrorMessage} from "../lib/error-reference";
import {createClient} from "../utils/supabase/client";

type Props={children:ReactNode;streamId:string;section:string};
type State={failed:boolean;reference:string};
export default class LiveViewerBoundary extends Component<Props,State>{
 state:State={failed:false,reference:""};
 private fallbackTimer:ReturnType<typeof setTimeout>|null=null;
 componentWillUnmount(){if(this.fallbackTimer)clearTimeout(this.fallbackTimer);}
 private returnToVideos=()=>{try{sessionStorage.setItem("oneMuslimResumeAfterLiveError",String(Date.now()))}catch{}window.location.assign("/");};
 static getDerivedStateFromError():Partial<State>{return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){
  const reference=createErrorReference(this.props.section);
  this.setState({reference});
  console.error("1Muslim Live viewer component failed",reference,this.props.section,error,info.componentStack);
  if(this.props.section==="player"){
   if(this.fallbackTimer)clearTimeout(this.fallbackTimer);
   this.fallbackTimer=setTimeout(this.returnToVideos,2500);
   // Viewer failures are signals, not proof the host broadcast has failed.
   // Notify the host studio without ending or mutating the live session.
   try{const db=createClient();const channel=db.channel("live-health:"+this.props.streamId);void channel.subscribe(status=>{if(status==="SUBSCRIBED"){void channel.send({type:"broadcast",event:"viewer-error",payload:{reference,at:Date.now()}}).finally(()=>{void db.removeChannel(channel)});}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){void db.removeChannel(channel);}});}catch{}
  }
  // Report the exception from the guest's browser, where server logs cannot see it.
  try{void fetch("/api/live-viewer-error",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,streamId:this.props.streamId,section:this.props.section,message:String(error?.message||"Unknown error").slice(0,400),stack:String(error?.stack||"").slice(0,2000),componentStack:String(info.componentStack||"").slice(0,2000)})}).catch(()=>{});}catch{}
 }
 render(){
  if(!this.state.failed)return this.props.children;
  return <div role="alert" style={{position:"relative",zIndex:5,padding:16,color:"#fff",background:"#08130f",borderRadius:12}}>
   <strong>1Muslim Live needs a moment</strong>
   <p style={{fontSize:12,opacity:.8}}>{friendlyErrorMessage(this.props.section)}{this.props.section==="player"?" Returning to your videos automatically…":""}</p>
   {this.props.section==="player"&&<a onClick={event=>{event.preventDefault();this.returnToVideos()}} href="/" style={{display:"inline-block",padding:"9px 16px",marginRight:8,borderRadius:10,border:"1px solid #ffffff55",color:"#fff",textDecoration:"none"}}>Watch other videos →</a>}
   <button type="button" onClick={()=>{if(this.fallbackTimer)clearTimeout(this.fallbackTimer);this.fallbackTimer=null;this.setState({failed:false})}} style={{padding:"9px 16px",borderRadius:10,border:"1px solid #ffffff55",background:"#164532",color:"#fff"}}>Retry</button>
   <p style={{fontSize:11,opacity:.65,marginTop:14}}>1Muslim Error Reference # {this.state.reference||"Generating…"}</p>
  </div>;
 }
}
