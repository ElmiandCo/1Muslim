type PreviewEnvironment = {
  document: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  motion: Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;
  connection?: { saveData?: boolean; effectiveType?: string; addEventListener?: (type: string, listener: () => void) => void; removeEventListener?: (type: string, listener: () => void) => void };
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
};

/** Keep the decorative embed unloaded whenever it cannot be seen or should not autoplay. */
export function watchHeroPreview(env: PreviewEnvironment, enabled: boolean, setVisible: (visible: boolean) => void): () => void {
  let timer: number | undefined;
  let disposed = false;
  const refresh = () => {
    if (timer !== undefined) env.clearTimeout(timer);
    timer = undefined;
    setVisible(false);
    if (!enabled || env.document.visibilityState !== "visible" || env.motion.matches || env.connection?.saveData || /2g/.test(env.connection?.effectiveType || "")) return;
    timer = env.setTimeout(() => { timer = undefined; if (!disposed) setVisible(true); }, 4500);
  };
  env.document.addEventListener("visibilitychange", refresh);
  env.motion.addEventListener("change", refresh);
  env.connection?.addEventListener?.("change", refresh);
  refresh();
  return () => {
    disposed = true;
    if (timer !== undefined) env.clearTimeout(timer);
    env.document.removeEventListener("visibilitychange", refresh);
    env.motion.removeEventListener("change", refresh);
    env.connection?.removeEventListener?.("change", refresh);
  };
}
