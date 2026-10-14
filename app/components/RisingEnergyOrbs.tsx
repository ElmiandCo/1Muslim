"use client";
import { useEffect, useRef, useState } from "react";

type Props = { tone?: "blue" | "green"; density?: "ambient" | "focused" };
export default function RisingEnergyOrbs({ tone = "blue", density = "focused" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [bursts, setBursts] = useState<{ x: number; y: number; id: number }[]>([]);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: coarse)");
    const sync = () => { setReduced(motion.matches); setCoarse(pointer.matches); };
    sync();
    motion.addEventListener("change", sync); pointer.addEventListener("change", sync);
    return () => { motion.removeEventListener("change", sync); pointer.removeEventListener("change", sync); };
  }, []);
  useEffect(() => {
    if (reduced) return;
    const node = host.current;
    const parent = node?.parentElement;
    if (!parent) return;
    let nextId = 0;
    const onTap = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest("button, a, [data-widget], .voiceCard, .authHudHudFirst, .authPanel")) return;
      const bounds = parent.getBoundingClientRect();
      const id = ++nextId;
      setBursts(prev => [...prev.slice(-3), { x: e.clientX - bounds.left, y: e.clientY - bounds.top, id }]);
      window.setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 780);
    };
    parent.addEventListener("pointerdown", onTap, { passive: true });
    return () => parent.removeEventListener("pointerdown", onTap);
  }, [reduced]);
  const count = reduced ? 4 : coarse ? (density === "ambient" ? 9 : 13) : (density === "ambient" ? 16 : 24);
  const rgb = tone === "green" ? "72,230,152" : "48,162,255";
  return <div ref={host} className="risingEnergyField" aria-hidden="true" data-tone={tone}>
    <div className="atmosphere" />
    {Array.from({ length: count }, (_, i) => {
      const foreground = i % 7 === 0;
      const far = i % 3 === 0 && !foreground;
      const size = foreground ? 3 + i % 4 : far ? 26 + i % 4 * 13 : 8 + i % 5 * 4;
      return <i key={i} className={`energyOrb ${foreground ? "near" : far ? "far" : "mid"}`} style={{
        left: `${(i * 37 + 11) % 96}%`,
        width: size, height: size,
        animationDuration: `${foreground ? 9 + i % 7 : far ? 23 + i % 13 : 15 + i % 10}s`,
        animationDelay: `${-((i * 13) % 29)}s`,
        ["--drift" as string]: `${(i % 2 ? 1 : -1) * (20 + i % 6 * 13)}px`,
        ["--rgb" as string]: rgb
      }} />;
    })}
    {bursts.map(b => <span key={b.id} className="orbTouchRipple" style={{ left: b.x, top: b.y }} />)}
    <style jsx>{`
      .risingEnergyField{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;isolation:isolate}
      .atmosphere{position:absolute;inset:-20%;background:radial-gradient(ellipse 34% 24% at 32% 82%,rgba(${rgb},.075),transparent 80%),radial-gradient(ellipse 30% 30% at 76% 38%,rgba(${rgb},.045),transparent 85%);animation:atmosphericDrift 27s ease-in-out infinite alternate}
      .energyOrb{position:absolute;bottom:-15%;border-radius:50%;will-change:transform;animation:energyRise linear infinite;transform:translate3d(0,0,0)}
      .energyOrb.far{background:radial-gradient(circle,rgba(${rgb},.38),rgba(${rgb},0) 75%);filter:blur(12px);opacity:.3}
      .energyOrb.mid{background:radial-gradient(circle at 35% 30%,rgba(235,255,255,.75),rgba(${rgb},.7) 33%,transparent 80%);filter:blur(3px);box-shadow:0 0 15px rgba(${rgb},.2);opacity:.3}
      .energyOrb.near{background:rgba(${rgb},.8);box-shadow:0 0 8px rgba(${rgb},.6);opacity:.3;filter:blur(.4px)}
      .orbTouchRipple{position:absolute;width:10px;height:10px;border:1px solid rgba(${rgb},.4);box-shadow:0 0 12px rgba(${rgb},.18);border-radius:50%;animation:touchGlow .75s ease-out forwards}
      @keyframes energyRise{0%{transform:translate3d(0,15vh,0) scale(.7)}25%{transform:translate3d(calc(var(--drift)*.7),-15vh,0) scale(1)}50%{transform:translate3d(calc(var(--drift)*-.35),-42vh,0) scale(1.1)}75%{transform:translate3d(var(--drift),-75vh,0) scale(.85)}100%{transform:translate3d(calc(var(--drift)*-.5),-120vh,0) scale(.5)}}
      @keyframes atmosphericDrift{from{transform:translate3d(-2%,2%,0)}to{transform:translate3d(3%,-3%,0)}}
      @keyframes touchGlow{from{transform:translate(-50%,-50%) scale(.3);opacity:.8}to{transform:translate(-50%,-50%) scale(9);opacity:0}}
      @media(prefers-reduced-motion:reduce){.energyOrb,.atmosphere{animation:none!important}.energyOrb{bottom:15%;opacity:.08!important}}
    `}</style>
  </div>;
}
