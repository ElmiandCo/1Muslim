"use client";
import {useEffect,useState} from "react";
import "./animated-muslim-brand.css";

/**
 * One Muslim.Live holds for four seconds, then the words draw inward and
 * settle as the permanent 1Muslim.Live wordmark. Never repeats per mount.
 */
export default function AnimatedMuslimBrand(){
 const [condensed,setCondensed]=useState(false);
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){setCondensed(true);return}
  const timer=window.setTimeout(()=>setCondensed(true),4000);
  return()=>window.clearTimeout(timer);
 },[]);
 return <span className={"omAnimatedBrand"+(condensed?" omAnimatedBrandFinal":"")} aria-label={condensed?"1Muslim":"One Muslim"}>
  <span className="omBrandWordOne" aria-hidden="true">One{"\u00a0"}</span>
  <span className="omBrandDigit" aria-hidden="true">1</span>
  <span className="omBrandMuslim" aria-hidden="true">Muslim</span>
 </span>;
}
