// Synthesized sound effects (deferred polish pass; no asset files).
// Web Audio oscillators — no downloads, no audio assets.

let ctx: AudioContext | null = null
let master: GainNode | null = null
const MUTE_KEY = 'neon-data-heist:mute'

function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function toggleMute(): boolean {
  try {
    const muted = !isMuted()
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    if (master) master.gain.value = muted ? 0 : 0.22
    return muted
  } catch {
    return isMuted()
  }
}

export function getMuted(): boolean {
  const muted = isMuted()
  if (master) master.gain.value = muted ? 0 : 0.22
  return muted
}

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC: typeof AudioContext = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = isMuted() ? 0 : 0.22
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durSec: number, type: OscillatorType = 'square', vol = 0.18, delay = 0): void {
  const ac = ensureCtx()
  if (!ac || !master) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, ac.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + durSec)
  osc.connect(gain)
  gain.connect(master)
  osc.start(ac.currentTime + delay)
  osc.stop(ac.currentTime + delay + durSec + 0.02)
}

export function sfxPickup(): void {
  tone(660, 0.07, 'square', 0.14)
  tone(990, 0.09, 'square', 0.14, 0.06)
}

export function sfxWin(): void {
  tone(523, 0.12, 'sawtooth', 0.16)
  tone(659, 0.12, 'sawtooth', 0.16, 0.11)
  tone(784, 0.2, 'sawtooth', 0.16, 0.22)
  tone(1046, 0.34, 'sawtooth', 0.16, 0.33)
}

export function sfxLose(): void {
  tone(320, 0.25, 'sawtooth', 0.16)
  tone(200, 0.35, 'sawtooth', 0.14, 0.18)
  tone(120, 0.5, 'sawtooth', 0.14, 0.36)
}

export function sfxHeat(): void {
  tone(140, 0.12, 'sawtooth', 0.1)
}
