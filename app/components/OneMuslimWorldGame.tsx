"use client";
import {useRef} from "react";
export default function OneMuslimWorldGame(){const canvas=useRef<HTMLCanvasElement>(null);return <section style={{width:"100%",height:"100%",background:"#f5ffff",position:"relative"}}><canvas ref={canvas} style={{width:"100%",height:"100%"}}/><strong style={{position:"absolute",top:10,left:10,color:"#234"}}>1Muslim Game</strong></section>}
