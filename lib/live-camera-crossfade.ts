/**
 * Host-only camera transition. A still canvas sits above the SAME local
 * preview video while LiveKit restarts its published camera track. No extra
 * player, camera capture, room or audio publication is created here.
 */
export function cameraCrossfadeDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 400;
}

export function captureCameraFreezeFrame(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null,
): boolean {
  if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return false;
  const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  try {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return false;
    context.drawImage(video, 0, 0, width, height);
    // The caller applies the outgoing camera's mirror class to the canvas.
    // No screenshot data leaves the device or is stored as a Blob/data URL.
    canvas.style.transition = "none";
    canvas.style.opacity = "1";
    return true;
  } catch {
    canvas.width = 0;
    canvas.height = 0;
    canvas.style.opacity = "0";
    return false;
  }
}

export function waitForIncomingCameraFrame(
  video: HTMLVideoElement | null,
  timeoutMs = 2000,
): Promise<boolean> {
  if (!video) return Promise.resolve(false);
  return new Promise(resolve => {
    let settled = false;
    let frameId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const withFrames = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const cleanup = () => {
      clearTimeout(timeout);
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
      video.removeEventListener("loadeddata", onLoaded);
      if (frameId !== undefined) withFrames.cancelVideoFrameCallback?.(frameId);
    };
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };
    const onLoaded = () => finish(video.readyState >= 2 && video.videoWidth > 0);
    const timeout = setTimeout(() => finish(false), timeoutMs);
    if (typeof withFrames.requestVideoFrameCallback === "function") {
      try {
        frameId = withFrames.requestVideoFrameCallback(() => finish(video.readyState >= 2 && video.videoWidth > 0));
      } catch {
        video.addEventListener("loadeddata", onLoaded, { once: true });
        fallbackTimer = setTimeout(onLoaded, 160);
      }
    } else {
      // Older iOS Safari: loadeddata or a short frame-settle window.
      video.addEventListener("loadeddata", onLoaded, { once: true });
      fallbackTimer = setTimeout(onLoaded, 160);
    }
  });
}

export function dissolveCameraFreezeFrame(
  canvas: HTMLCanvasElement | null,
  durationMs: number,
): Promise<void> {
  if (!canvas || !canvas.width) return Promise.resolve();
  if (durationMs <= 0) {
    canvas.style.opacity = "0";
    canvas.width = 0;
    canvas.height = 0;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    // Force a layout flush so the opaque still is painted before fading.
    void canvas.offsetWidth;
    canvas.style.transition = `opacity ${durationMs}ms ease-in-out`;
    canvas.style.opacity = "0";
    setTimeout(() => {
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.transition = "none";
      resolve();
    }, durationMs + 40);
  });
}
