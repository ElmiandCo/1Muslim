"use client";
import { useEffect, useRef } from "react";

type Props = { active: boolean; stream: MediaStream | null; foreground?: boolean };
export default function GuardianParticles({ active, stream, foreground = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = canvas.parentElement;
    if (!host) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const count = reduced ? 14 : coarse ? 30 : 62;
    const dots = Array.from({ length: count }, (_, i) => ({
      angle: (i * 2.39996) % (Math.PI * 2),
      radius: .17 + ((i * 37) % 70) / 100,
      speed: (.00012 + (i % 7) * .000035) * (i % 2 ? 1 : -1),
      size: .6 + (i % 4) * .35,
      depth: (i % 3) / 3,
    }));
    let width = 1, height = 1, frame = 0, last = 0, visible = true;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px"; canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; });
    observer.observe(host);
    const ro = new ResizeObserver(resize); ro.observe(host); resize();
    let audioContext: AudioContext | null = null, source: MediaStreamAudioSourceNode | null = null, analyser: AnalyserNode | null = null;
    let buffer: Uint8Array<ArrayBuffer> | null = null;
    if (active && stream?.active) {
      try {
        audioContext = new AudioContext();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser); // no connection to speakers: no microphone feedback
        buffer = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      } catch { void audioContext?.close(); audioContext = null; }
    }
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || (!reduced && now - last < (coarse ? 33 : 20))) return;
      last = now;
      context.clearRect(0, 0, width, height);
      let energy = 0;
      if (analyser && buffer) {
        analyser.getByteFrequencyData(buffer);
        for (let i = 0; i < buffer.length; i++) energy += buffer[i];
        energy = Math.min(1, energy / buffer.length / 105);
      }
      const cx = width * .5, cy = height * .51;
      for (const d of dots) {
        const angle = d.angle + (reduced ? 0 : now * d.speed);
        const rx = width * (.16 + d.radius * .32), ry = height * (.10 + d.radius * .27);
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry + (reduced ? 0 : Math.sin(now * .00035 + d.angle) * 5);
        const pulse = active ? 1 + energy * 1.8 : 1;
        const alpha = (foreground ? .26 : .47) * (.55 + d.depth) * (active ? 1.4 : 1);
        context.beginPath();
        context.fillStyle = `rgba(${foreground ? "129,211,255" : "42,155,255"},${Math.min(.9, alpha)})`;
        context.shadowColor = "#1b94ff"; context.shadowBlur = (active ? 12 : 6) * pulse;
        context.arc(x, y, d.size * pulse, 0, Math.PI * 2); context.fill();
      }
      context.shadowBlur = 0;
      if (reduced) cancelAnimationFrame(frame);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); ro.disconnect(); observer.disconnect();
      try { source?.disconnect(); analyser?.disconnect(); } catch {}
      if (audioContext) void audioContext.close();
    };
  }, [active, stream, foreground]);
  return <canvas ref={canvasRef} aria-hidden="true" style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:foreground?3:0 }} />;
}
