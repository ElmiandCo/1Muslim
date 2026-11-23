"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  size?: number;
};

/** Host-only Live Captions control. Mount beside the host's mic/camera buttons.
 * Parent owns state and must start/stop the transcription pipeline before
 * confirming enabled. Do not render this control in viewer UI.
 */
export default function LiveCaptionsControl({
  enabled, onToggle, disabled = false, busy = false, size = 48,
}: Props) {
  const [pending, setPending] = useState(false);
  const locked = disabled || busy || pending;
  const style: CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    display: "inline-grid", placeItems: "center",
    border: enabled ? "1px solid rgba(255,255,255,.75)" : "1px solid rgba(255,255,255,.28)",
    background: enabled ? "rgba(245,245,245,.94)" : "rgba(90,90,90,.62)",
    color: enabled ? "#111" : "#eee",
    boxShadow: enabled ? "0 0 0 3px rgba(255,255,255,.13), 0 0 18px rgba(255,255,255,.22)" : "none",
    fontWeight: 750, fontSize: Math.max(12, size * .28),
    letterSpacing: "-.03em", cursor: locked ? "wait" : "pointer",
    opacity: locked ? .6 : 1,
    transition: "background 240ms ease, color 240ms ease, box-shadow 240ms ease, transform 240ms ease",
    transform: pending ? "scale(.94)" : "scale(1)",
  };
  return (
    <button
      type="button"
      aria-label={enabled ? "Turn live captions off" : "Turn live captions on"}
      aria-pressed={enabled}
      title={enabled ? "Live captions on" : "Live captions off"}
      disabled={locked}
      style={style}
      onClick={async () => {
        setPending(true);
        try { await onToggle(!enabled); }
        finally { setPending(false); }
      }}
    >
      <span aria-hidden="true">LC</span>
    </button>
  );
}
