/**
 * 1Muslim Live media defaults.
 * Apply these when constructing LiveKit Room and publishing camera tracks.
 * Quality targets require real-device measurements; these options do not guarantee <1s latency.
 */
import type { RoomOptions, VideoCaptureOptions } from "livekit-client";

export const liveRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  stopLocalTrackOnUnpublish: true,
  reconnectPolicy: {
    nextRetryDelayInMs(context) {
      if (context.retryCount >= 10) return null;
      const cap = Math.min(30_000, 750 * 2 ** context.retryCount);
      return Math.round(cap * (0.75 + Math.random() * 0.5));
    },
  },
};

export const liveCameraCaptureOptions: VideoCaptureOptions = {
  resolution: { width: 1920, height: 1080, frameRate: 30 },
};

export const liveCameraPublishOptions = {
  simulcast: true,
  videoEncoding: { maxBitrate: 3_000_000, maxFramerate: 30 },
};

export const liveQualityTargets = Object.freeze({
  glassToGlassLatencyP95Ms: 1000,
  commentDisplayP95Ms: 500,
  preferredHeight: 1080,
  fallbackHeight: 720,
});
