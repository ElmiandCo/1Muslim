"use client";
import type { ReactNode } from "react";
import "./CinemaControls.css";
type Action = "previous"|"rewind"|"play"|"forward"|"next"|"fullscreen";
function Icon({name,playing,expanded}:{name:Action;playing:boolean;expanded:boolean}) {
 const paths:Record<Action,ReactNode>={
 previous:<><path d="M6 5v14M19 5l-10 7 10 7V5Z"/></>,
 rewind:<><path d="M5 9a8 8 0 1 1-.3 6M5 4v5h5"/><text x="12" y="15.7" textAnchor="middle" className="cinemaTen">10</text></>,
 play:playing?<><path d="M9 6v12M15 6v12" strokeWidth="3.4"/></>:<path d="m9 5 10 7-10 7Z" fill="currentColor" stroke="none"/>,
 forward:<><path d="M19 9a8 8 0 1 0 .3 6M19 4v5h-5"/><text x="12" y="15.7" textAnchor="middle" className="cinemaTen">10</text></>,
 next:<><path d="M18 5v14M5 5l10 7-10 7V5Z"/></>,
 fullscreen:expanded?<path d="M9 4v5H4m11-5v5h5M4 15h5v5m11-5h-5v5"/>:<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>
 };
 return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
export default function CinemaControls({playing,expanded,visible,onPrevious,onRewind,onTogglePlay,onForward,onNext,onFullscreen}:{playing:boolean;expanded:boolean;visible:boolean;onPrevious:()=>void;onRewind:()=>void;onTogglePlay:()=>void;onForward:()=>void;onNext:()=>void;onFullscreen:()=>void}) {
 const items:{name:Action;label:string;action:()=>void}[]=[
 {name:"previous",label:"Previous episode",action:onPrevious},{name:"rewind",label:"Rewind 10 seconds",action:onRewind},
 {name:"play",label:playing?"Pause":"Play",action:onTogglePlay},{name:"forward",label:"Forward 10 seconds",action:onForward},
 {name:"next",label:"Next episode",action:onNext},{name:"fullscreen",label:expanded?"Exit full view":"Full view",action:onFullscreen}];
 return <div className={"deepwatchControls dwCompactControls cinemaControls"+(visible?"":" dwIdle")} role="group" aria-label="Cinema playback controls">{items.map(({name,label,action})=><button key={name} type="button" className={"cinemaControl cinema-"+name+(name==="play"?" deepwatchPlay":"")+(name==="fullscreen"?" dwExpandButton":"")} onClick={action} aria-label={label} title={label} aria-pressed={name==="fullscreen"?expanded:undefined}><Icon name={name} playing={playing} expanded={expanded}/></button>)}</div>;
}
