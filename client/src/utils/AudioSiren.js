// Web Audio API Synthesizer for Security & Proctoring Warning Siren
class SirenSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSiren(durationMs = 2800) {
    if (this.isMuted) return;

    try {
      this.init();
      if (!this.audioCtx) return;

      // Stop any existing sound
      this.stop();

      const now = this.audioCtx.currentTime;
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      // Configure siren tone
      this.oscillator.type = 'sawtooth';

      // Sweep frequency between 700Hz and 1050Hz for warning siren effect
      const durationSec = durationMs / 1000;
      const cycles = 4;
      const cycleDuration = durationSec / cycles;

      for (let i = 0; i < cycles; i++) {
        const cycleStart = now + i * cycleDuration;
        const cycleMid = cycleStart + cycleDuration / 2;
        const cycleEnd = cycleStart + cycleDuration;

        this.oscillator.frequency.setValueAtTime(650, cycleStart);
        this.oscillator.frequency.exponentialRampToValueAtTime(1100, cycleMid);
        this.oscillator.frequency.exponentialRampToValueAtTime(650, cycleEnd);
      }

      // Smooth gain envelope
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.linearRampToValueAtTime(0.18, now + 0.1);
      this.gainNode.gain.setValueAtTime(0.18, now + durationSec - 0.2);
      this.gainNode.gain.linearRampToValueAtTime(0.001, now + durationSec);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start(now);
      this.oscillator.stop(now + durationSec);
      this.isPlaying = true;

      this.oscillator.onended = () => {
        this.isPlaying = false;
      };
    } catch (err) {
      console.warn('Audio siren play suppressed or unavailable:', err);
    }
  }

  stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {}
      this.oscillator = null;
    }
    this.isPlaying = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stop();
    return this.isMuted;
  }
}

export const siren = new SirenSynthesizer();
