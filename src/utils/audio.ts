// Procedural Web Audio API synthesizer for Deep Space radio transmissions & documentary cues.
// Zero external audio asset dependencies (never 404s).

class SpaceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private isMuted = true;
  private isAmbientRunning = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.28, now + 0.25);
    if (!muted && !this.isAmbientRunning) {
      this.startRadioAmbient();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startRadioAmbient(): void {
    if (this.isAmbientRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.isAmbientRunning = true;

    // Faint deep-space carrier drone (110 Hz + 164.81 Hz harmonic)
    const carrierGain = ctx.createGain();
    carrierGain.gain.value = 0.14;
    carrierGain.connect(this.masterGain);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 110;
    osc1.connect(carrierGain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 164.81;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.06;
    osc2.connect(subGain);
    subGain.connect(this.masterGain);
    osc2.start();

    // Filtered cosmic static hiss
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 2.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.045;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    this.carrierOsc = osc1;
    this.subOsc = osc2;
    this.noiseSource = noise;
  }

  public stopRadioAmbient(): void {
    if (!this.isAmbientRunning) return;
    try {
      this.carrierOsc?.stop();
      this.subOsc?.stop();
      this.noiseSource?.stop();
    } catch {
      // Ignore already-stopped nodes
    }
    this.carrierOsc = null;
    this.subOsc = null;
    this.noiseSource = null;
    this.isAmbientRunning = false;
  }

  public playTelemetryPing(freq = 660): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playImpactCue(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.55);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }
}

export const spaceAudio = new SpaceAudioEngine();
