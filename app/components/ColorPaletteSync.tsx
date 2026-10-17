"use client";
import {useEffect} from "react";

export const PALETTES = ["green","blue","gray-coral","yellow"] as const;
export type Palette = (typeof PALETTES)[number];
export const PALETTE_KEY = "1muslim-color-palette";

export function applyPalette(value:string|null){
 const palette=PALETTES.find(p=>p===value)??"green";
 document.documentElement.dataset.palette=palette;
 window.dispatchEvent(new CustomEvent("1muslim:palette-applied",{detail:{palette}}));
 return palette;
}

export default function ColorPaletteSync(){
 useEffect(()=>{
  const sync=()=>applyPalette(localStorage.getItem(PALETTE_KEY));
  sync();
  window.addEventListener("storage",sync);
  window.addEventListener("1muslim:palette-changed",sync);
  return()=>{window.removeEventListener("storage",sync);window.removeEventListener("1muslim:palette-changed",sync)};
 },[]);
 return null;
}
