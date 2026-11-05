"use client";
import Recovery from "./RecoveryScreen";
export default function Error({error,reset}:{error:Error & {digest?:string};reset:()=>void}){return <Recovery error={error} reset={reset}/>;}
