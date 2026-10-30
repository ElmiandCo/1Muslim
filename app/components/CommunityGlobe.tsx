"use client";
import MapsPage from "../maps/page";
export default function CommunityGlobe({active}:{active:boolean}){
 return <div aria-hidden={!active} style={{width:"100%",height:"100%",position:"relative",overflow:"hidden"}}><MapsPage/></div>;
}
