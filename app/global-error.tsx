"use client";
import Recovery from "./RecoveryScreen";
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){return <Recovery error={error} reset={reset} global/>;}
