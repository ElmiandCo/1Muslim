"use client";
import { useEffect, useState } from "react";

type Ripple = { id: number; x: number; y: number; success: boolean };
const MAX = 7;
export default function TapShimmer() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  useEffect(() => {
    let seq = 0;
    const timers = new Set<number>();
    const onTap = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-no-tap-shimmer], [aria-disabled='true'], :disabled")) return;
      const actionable = target.closest("button,a,[role='button'],input,select,textarea,summary,[tabindex]");
      const success = !!actionable && !actionable.matches(":disabled,[aria-disabled='true']");
      const id = ++seq;
      setRipples(old => [...old.slice(-(MAX-1)), {id,x:event.clientX,y:event.clientY,success}]);
      const timer = window.setTimeout(() => {
        setRipples(old => old.filter(r => r.id !== id));
        timers.delete(timer);
      }, 780);
      timers.add(timer);
    };
    document.addEventListener("pointerdown", onTap, {passive:true});
    return () => { document.removeEventListener("pointerdown", onTap); timers.forEach(clearTimeout); };
  }, []);
  return <div className="tap-shimmer-layer" aria-hidden="true" data-no-tap-shimmer>
    {ripples.map(r => <span key={r.id} className={r.success?"tap-shimmer tap-success":"tap-shimmer"} style={{left:r.x,top:r.y}}>
      <i className="tap-shimmer-ring" /><i className="tap-shimmer-streak" /><i className="tap-shimmer-star" />
    </span>)}
    <style jsx>{`
      .tap-shimmer-layer{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}
      .tap-shimmer{position:absolute;width:0;height:0;pointer-events:none;--tap-color:#a7dfff}
      .tap-success{--tap-color:#79ffd7}
      .tap-shimmer-ring{position:absolute;left:-16px;top:-16px;width:32px;height:32px;border:1.5px solid var(--tap-color);border-radius:50%;box-shadow:0 0 12px var(--tap-color);animation:tapRing .65s ease-out both}
      .tap-shimmer-streak{position:absolute;left:-36px;top:-1px;width:72px;height:2px;background:linear-gradient(90deg,transparent,var(--tap-color),#fff,transparent);box-shadow:0 0 10px var(--tap-color);transform:rotate(-25deg);animation:tapStreak .6s ease-out both}
      .tap-shimmer-star{position:absolute;left:-3px;top:-3px;width:6px;height:6px;background:white;transform:rotate(45deg);box-shadow:0 0 10px var(--tap-color);animation:tapStar .7s ease-out both}
      @keyframes tapRing{from{opacity:1;transform:scale(.25)}to{opacity:0;transform:scale(2.2)}}
      @keyframes tapStreak{0%{opacity:0;transform:translateX(-20px) rotate(-25deg) scaleX(.2)}30%{opacity:1}100%{opacity:0;transform:translateX(30px) rotate(-25deg) scaleX(1.4)}}
      @keyframes tapStar{0%{opacity:1;transform:rotate(45deg) scale(1.4)}100%{opacity:0;transform:rotate(135deg) scale(.2)}}
      @media(prefers-reduced-motion:reduce){.tap-shimmer-layer{display:none}}
    `}</style>
  </div>;
}
