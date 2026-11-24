import {useEffect, useRef, useState, type TouchEvent} from "react";

const STORAGE_KEY = "1muslim:quran-text-zoom";
export const MIN_QURAN_ZOOM = 75;
export const MAX_QURAN_ZOOM = 175;

function clampZoom(value: number) {
 return Math.min(MAX_QURAN_ZOOM, Math.max(MIN_QURAN_ZOOM, Math.round(value)));
}

function touchDistance(touches: TouchEvent["touches"]) {
 return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

export function useQuranTextZoom() {
 const [zoom, setZoom] = useState(100);
 const gesture = useRef<{distance: number; initial: number; latest: number} | null>(null);
 const frame = useRef<number | null>(null);

 useEffect(() => {
  try {
   const saved = localStorage.getItem(STORAGE_KEY);
   if (saved !== null && /^\d+$/.test(saved)) setZoom(clampZoom(Number(saved)));
  } catch {}
  return () => {
   if (frame.current !== null) cancelAnimationFrame(frame.current);
  };
 }, []);

 function commitZoom(value: number) {
  setZoom(value);
  try { localStorage.setItem(STORAGE_KEY, String(value)); } catch {}
 }

 function finishPinch() {
  if (frame.current !== null) cancelAnimationFrame(frame.current);
  frame.current = null;
  const active = gesture.current;
  gesture.current = null;
  if (!active) return;
  if (active.latest === active.initial) setZoom(active.initial);
  else commitZoom(active.latest);
 }

 function startPinch(event: TouchEvent<HTMLDivElement>) {
  if (event.touches.length !== 2) {
   finishPinch();
   return;
  }
  const [first, second] = Array.from(event.touches);
  if (![first, second].every(touch =>
   touch.target instanceof Element && touch.target.closest(".qm-verse-arabic")
  )) return;
  const distance = touchDistance(event.touches);
  if (distance >= 8) gesture.current = {distance, initial: zoom, latest: zoom};
 }

 function movePinch(event: TouchEvent<HTMLDivElement>) {
  const active = gesture.current;
  if (!active || event.touches.length !== 2) return;
  active.latest = clampZoom(active.initial * touchDistance(event.touches) / active.distance);
  if (frame.current !== null) return;
  frame.current = requestAnimationFrame(() => {
   frame.current = null;
   setZoom(active.latest);
  });
 }

 return {zoom, commitZoom, startPinch, movePinch, finishPinch};
}
