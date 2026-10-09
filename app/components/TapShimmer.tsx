"use client";
import { useEffect, useState } from "react";

type Ripple = { id: number; x: number; y: number; success: boolean; confirmed?: boolean; width: number; height: number };
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
      const rect = (actionable ?? target).getBoundingClientRect();
      const width = Math.min(360, Math.max(64, rect.width || 110));
      const height = Math.min(120, Math.max(30, rect.height || 44));
      const x = actionable ? rect.left + rect.width / 2 : event.clientX;
      const y = actionable ? rect.top + rect.height / 2 : event.clientY;
      setRipples(old => [...old.slice(-(MAX-1)), {id,x,y,success,width,height}]);
      const timer = window.setTimeout(() => {
        setRipples(old => old.filter(r => r.id !== id));
        timers.delete(timer);
      }, 850);
      timers.add(timer);
    };
    const onConfirmed = (event: Event) => {\n      const e = event as CustomEvent<{ x?:number; y?:number }>;\n      const x = e.detail?.x ?? window.innerWidth/2;\n      const y = e.detail?.y ?? window.innerHeight/2;\n      const id = ++seq;\n      setRipples(old => [...old.slice(-(MAX-1)), {id,x,y,success:true,confirmed:true,width:130,height:56}]);\n      const timer = window.setTimeout(() => {setRipples(old=>old.filter(r=>r.id!==id));timers.delete(timer)},1100);\n      timers.add(timer);\n    };\n    window.addEventListener("1muslim:action-success",onConfirmed);\n    document.addEventListener("pointerdown", onTap, {passive:true});
    return () => { document.removeEventListener("pointerdown", onTap); window.removeEventListener("1muslim:action-success",onConfirmed); timers.forEach(clearTimeout); };
  }, []);
  return <div className="tap-shimmer-layer" aria-hidden="true" data-no-tap-shimmer>
    {ripples.map(r => <span key={r.id} className={r.confirmed?"tap-shimmer tap-confirmed":r.success?"tap-shimmer tap-success":"tap-shimmer"} style={{left:r.x,top:r.y,width:r.width,height:r.height}}>
      <i className="tap-shimmer-ring" /><i className="tap-shimmer-streak" /><i className="tap-shimmer-star" />
    </span>)}
    <style jsx>{`
      .tap-shimmer-layer{position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden}
      .tap-shimmer{position:absolute;pointer-events:none;--tap-color:#a7dfff;transform:translate(-50%,-50%);overflow:hidden;border-radius:12px}
      .tap-success{--tap-color:#79ffd7}\n      .tap-confirmed{--tap-color:#f6dd7b}\n      .tap-confirmed .tap-shimmer-ring{animation:tapRing .9s ease-out both;border-width:3px}\n      .tap-confirmed .tap-shimmer-star{width:12px;height:12px;left:-6px;top:-6px;animation:tapStar 1s ease-out both}
      .tap-shimmer-ring{position:absolute;left:50%;top:50%;margin-left:-16px;margin-top:-16px;width:32px;height:32px;border:1.5px solid var(--tap-color);border-radius:50%;box-shadow:0 0 12px var(--tap-color);animation:tapRing .65s ease-out both}
      .tap-shimmer-streak{position:absolute;inset:0;width:38%;height:100%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--tap-color) 22%,transparent),#ffffffdd,color-mix(in srgb,var(--tap-color) 30%,transparent),transparent);filter:blur(2px);box-shadow:0 0 16px var(--tap-color);transform:skewX(-22deg);animation:tapStreak .72s ease-in-out both}
      .tap-shimmer-star{position:absolute;left:50%;top:50%;margin-left:-3px;margin-top:-3px;width:6px;height:6px;background:white;transform:rotate(45deg);box-shadow:0 0 10px var(--tap-color);animation:tapStar .7s ease-out both}
      @keyframes tapRing{from{opacity:1;transform:scale(.25)}to{opacity:0;transform:scale(2.2)}}
      @keyframes tapStreak{0%{opacity:0;left:-40%}12%{opacity:1}75%{opacity:1}100%{opacity:0;left:110%}}
      @keyframes tapStar{0%{opacity:1;transform:rotate(45deg) scale(1.4)}100%{opacity:0;transform:rotate(135deg) scale(.2)}}
      @media(prefers-reduced-motion:reduce){.tap-shimmer-layer{display:none}}
    `}</style>
  </div>;
}
