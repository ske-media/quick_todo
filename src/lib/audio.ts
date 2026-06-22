/**
 * Lightweight alarm helper using the Web Audio API.
 * No external assets needed — a beep sequence is synthesized via an oscillator.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Must be called from a user gesture to unlock audio on mobile browsers. */
export function unlockAudio(): void {
  const audioCtx = getContext();
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
}

function beepAt(
  audioCtx: AudioContext,
  startTime: number,
  frequency: number,
  duration: number
): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);

  // Smooth envelope to avoid clicks
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Plays a 3-beep "time's up" alarm. */
export function playAlarm(): void {
  const audioCtx = getContext();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();
  const now = audioCtx.currentTime;
  beepAt(audioCtx, now, 880, 0.18);
  beepAt(audioCtx, now + 0.25, 880, 0.18);
  beepAt(audioCtx, now + 0.5, 1175, 0.32);
}

/** A single subtle confirmation tick. */
export function playTick(): void {
  const audioCtx = getContext();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();
  beepAt(audioCtx, audioCtx.currentTime, 660, 0.12);
}
