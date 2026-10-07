"use client";

type AudioEffect = "studio" | "mosque";

type Processor = {
  name: string;
  processedTrack?: MediaStreamTrack;
  init: (opts: { audioContext: AudioContext; track: MediaStreamTrack }) => Promise<void>;
  restart: (opts: { audioContext: AudioContext; track: MediaStreamTrack }) => Promise<void>;
  destroy: () => Promise<void>;
  setVolume: (value: number) => void;
};

export function createLiveAudioProcessor(effect: AudioEffect, nasheedOn: boolean, soundVolume = 0.18): Processor {
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let destination: MediaStreamAudioDestinationNode | null = null;
  let nodes: AudioNode[] = [];
  let soundElement: HTMLAudioElement | null = null;
  let soundGain: GainNode | null = null;

  let processor: Processor;

  const connect = async (opts: { audioContext: AudioContext; track: MediaStreamTrack }) => {
    context = opts.audioContext;
    if (context.state === "suspended") await context.resume();

    source = context.createMediaStreamSource(new MediaStream([opts.track]));
    destination = context.createMediaStreamDestination();

    const dry = context.createGain();
    dry.gain.value = effect === "mosque" ? 0.78 : 1;
    source.connect(dry);
    dry.connect(destination);
    nodes = [source, dry];

    if (effect === "mosque") {
      const delay = context.createDelay(1);
      delay.delayTime.value = 0.16;
      const feedback = context.createGain();
      feedback.gain.value = 0.28;
      const wet = context.createGain();
      wet.gain.value = 0.42;
      source.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(destination);
      nodes.push(delay, feedback, wet);
    }

    if (nasheedOn) {
      soundElement = new Audio("/audio/NasheedLoop.mp3");
      soundElement.loop = true;
      soundElement.preload = "auto";
      soundElement.volume = 1;
      soundElement.crossOrigin = "anonymous";
      const soundSource = context.createMediaElementSource(soundElement);
      soundGain = context.createGain();
      soundGain.gain.value = Math.max(0, Math.min(1, soundVolume));
      soundSource.connect(soundGain);
      soundGain.connect(destination);
      nodes.push(soundSource, soundGain);
      try { await soundElement.play(); } catch {}
    }

    const output = destination.stream.getAudioTracks()[0];
    if (!output) throw new Error("Audio studio could not create an output track.");
    processor.processedTrack = output;
  };

  processor = {
    name: `1muslim-audio-${effect}-${nasheedOn ? "nasheed-on" : "nasheed-off"}-${Date.now()}`,
    init: connect,
    restart: async (opts) => {
      await processor.destroy();
      await connect(opts);
    },
    setVolume: (value) => {
      const next = Math.max(0, Math.min(1, value));
      if (soundGain && context) {
        const now = context.currentTime;
        soundGain.gain.cancelScheduledValues(now);
        soundGain.gain.setTargetAtTime(next, now, 0.015);
      }
    },
    destroy: async () => {
      soundElement?.pause();
      soundElement = null;
      soundGain = null;
      nodes.forEach((node) => { try { node.disconnect(); } catch {} });
      nodes = [];
      destination?.stream.getTracks().forEach((track) => track.stop());
      source = null;
      destination = null;
      context = null;
      processor.processedTrack = undefined;
    },
  };

  return processor;
}
