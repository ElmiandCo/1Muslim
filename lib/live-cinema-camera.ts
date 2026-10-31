/**
 * Camera-only flip for an established LiveKit publication. Never disconnect the
 * room, unpublish the camera or touch the microphone. LiveKit's restartTrack
 * replaces the sender's capture track within the existing publication.
 */
export type CameraFacing = "user" | "environment";
export type CameraSize = { width: number; height: number };
export type PublishedCamera = {
  mediaStreamTrack: MediaStreamTrack;
  restartTrack(options: { facingMode: CameraFacing; resolution: CameraSize }): Promise<unknown>;
};
type Capture = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

export async function flipLiveCamera(
  stream: MediaStream,
  published: PublishedCamera | undefined,
  previous: CameraFacing,
  next: CameraFacing,
  size: CameraSize,
  getUserMedia: Capture,
): Promise<MediaStreamTrack> {
  const oldTracks = stream.getVideoTracks();
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: { facingMode: { ideal: next }, width: { ideal: size.width }, height: { ideal: size.height } },
  };
  let replacement: MediaStreamTrack;
  if (published) {
    // SDK handles Safari's single-camera limitation and keeps the RTCRtpSender
    // and LiveKit publication alive. On failure try restoring the old camera.
    try {
      await published.restartTrack({ facingMode: next, resolution: size });
    } catch (error) {
      try {
        await published.restartTrack({ facingMode: previous, resolution: size });
        syncVideoTrack(stream, published.mediaStreamTrack);
      } catch { /* Surface original failure; never tear down the room/microphone. */ }
      throw error;
    }
    replacement = published.mediaStreamTrack;
  } else {
    // Pre-live preview: acquire before releasing where supported. iOS Safari
    // can require releasing the old camera first; retry with that fallback.
    try {
      const media = await getUserMedia(constraints);
      replacement = requireVideoTrack(media);
    } catch {
      oldTracks.forEach(track => track.stop());
      try {
        replacement = requireVideoTrack(await getUserMedia(constraints));
      } catch (error) {
        // Best-effort restore preview after Safari's release-first fallback.
        try {
          const restored = await getUserMedia({ audio: false, video: { facingMode: { ideal: previous } } });
          syncVideoTrack(stream, requireVideoTrack(restored));
        } catch { /* Preserve microphone regardless. */ }
        throw error;
      }
    }
  }
  syncVideoTrack(stream, replacement);
  return replacement;
}

function requireVideoTrack(stream: MediaStream): MediaStreamTrack {
  const track = stream.getVideoTracks()[0];
  if (!track) throw new Error("The camera did not return a video track.");
  return track;
}

function syncVideoTrack(stream: MediaStream, replacement: MediaStreamTrack) {
  for (const track of stream.getVideoTracks()) {
    if (track !== replacement) {
      stream.removeTrack(track);
      track.stop();
    }
  }
  if (!stream.getVideoTracks().includes(replacement)) stream.addTrack(replacement);
}
