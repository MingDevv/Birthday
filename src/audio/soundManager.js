/**
 * Sound Manager:
 * - Plays the supplied local MP3 (/audio/velika-official-audio.mp3) as looping background music
 * - Synthesizes whoosh, chime, countdown, and cosmic star-burst effects via Web Audio API
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.mediaSource = null;
    this.analyser = null;
    this.frequencyData = null;
    this.smoothedBass = 0;
    this.recordDestination = null;
    this.isPlayingBGM = false;
    this.isMuted = false;
    this.bgmAudio = new Audio(`${import.meta.env.BASE_URL}audio/velika-official-audio.mp3`);
    this.bgmAudio.loop = true;
    this.bgmAudio.preload = 'none';
    this.bgmAudio.volume = 0.35;

    this.initAudioContext = this.initAudioContext.bind(this);
  }

  initAudioContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.82;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        try {
          this.mediaSource = this.ctx.createMediaElementSource(this.bgmAudio);
          this.mediaSource.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
          if (this.recordDestination) this.analyser.connect(this.recordDestination);
        } catch (error) {
          console.warn('Music analyser unavailable; continuing without beat response.', error);
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startRecordingAudio() {
    this.initAudioContext();
    if (!this.ctx || !this.analyser) return null;
    this.recordDestination = this.ctx.createMediaStreamDestination();
    this.analyser.connect(this.recordDestination);
    return this.recordDestination.stream;
  }

  stopRecordingAudio() {
    if (!this.recordDestination) return;
    try { this.analyser?.disconnect(this.recordDestination); } catch {}
    this.recordDestination = null;
  }

  connectOutput(node) {
    node.connect(this.ctx.destination);
    if (this.recordDestination) node.connect(this.recordDestination);
  }

  // Plays a pure music box chime tone
  playMusicBoxTone(freq, duration = 1.6, gainLevel = 0.15) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Camera Whoosh sound for approach journey
  playWhooshSound() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 1.4), this.ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.65);
    filter.frequency.exponentialRampToValueAtTime(180, now + 1.4);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.025, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    noise.connect(filter);
    filter.connect(noiseGain);
    this.connectOutput(noiseGain);
    noise.start(now);
    noise.stop(now + 1.4);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(70, now + 1.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + 1.4);
  }

  // Checkpoint Hover Sound
  playHoverSound() {
    if (this.isMuted) return;
    this.playMusicBoxTone(880, 0.45, 0.06);
  }

  playLetterTick() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1480, now);
    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    oscillator.connect(gain);
    this.connectOutput(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.04);
  }

  // Checkpoint Click / Fly-to Sound
  playClickSound() {
    if (this.isMuted) return;
    this.initAudioContext();
    this.playMusicBoxTone(523.25, 0.9, 0.18);
    setTimeout(() => {
      this.playMusicBoxTone(783.99, 1.2, 0.15);
    }, 120);
  }

  playPlanetNote(planetId) {
    if (this.isMuted) return;
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880];
    this.playMusicBoxTone(pentatonic[(Math.max(1, Number(planetId)) - 1) % pentatonic.length], 0.72, 0.12);
  }

  playCandleBell() {
    if (this.isMuted) return;
    this.playMusicBoxTone(1046.5, 0.45, 0.035);
  }

  // Rocket Launch Sound
  playLaunchSound() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Cosmic Star Burst ("ดาวแตก") Sound: Deep resonant rumble + sparkling harmonics
  playStarBurstSound() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Resonant shockwave rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.9);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    osc.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + 0.95);

    // Multi-tier sparkling harmonics
    [659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      setTimeout(() => {
        this.playMusicBoxTone(freq, 1.4, 0.1);
      }, idx * 110);
    });
  }

  // Firework Soft Pop Sound
  playPopSound() {
    this.playStarBurstSound();
  }

  // Sparkle Burst sound for celebratory bursts
  playSparkleBurstSound() {
    if (this.isMuted) return;
    this.playStarBurstSound();
  }

  // Hyperspace Riser: builds ascending pitch & filtered tension before breakthrough
  playWarpRiser(duration = 2.4) {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Gate Breakthrough Boom: deep resonant sub-bass drop when crossing portal
  playGateBoom() {
    if (this.isMuted) return;
    this.initAudioContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 1.2);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

    osc.connect(gain);
    this.connectOutput(gain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  // Grand Celebration Chime
  playChimeSound() {
    if (this.isMuted) return;
    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        this.playMusicBoxTone(freq, 2.5, 0.14);
      }, idx * 140);
    });
  }

  // Start the supplied MP3 after a user gesture (browser autoplay policy)
  startBGM() {
    if (this.isPlayingBGM || this.isMuted) return;
    this.isPlayingBGM = true;
    this.bgmAudio.preload = 'auto';
    this.bgmAudio.load();
    this.bgmAudio.play().catch((error) => {
      this.isPlayingBGM = false;
      console.warn('Background music could not start:', error);
    });
  }

  stopBGM() {
    this.isPlayingBGM = false;
    this.bgmAudio.pause();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return !this.isMuted;
  }

  isPlaying() {
    return this.isPlayingBGM && !this.bgmAudio.paused;
  }

  getMusicBassEnergy() {
    if (!this.isPlaying() || !this.analyser || !this.frequencyData) {
      this.smoothedBass *= 0.82;
      return this.smoothedBass;
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    const count = Math.min(8, this.frequencyData.length);
    let sum = 0;
    for (let index = 0; index < count; index += 1) sum += this.frequencyData[index] / 255;
    const bass = count ? sum / count : 0;
    this.smoothedBass += (bass - this.smoothedBass) * 0.18;
    return this.smoothedBass;
  }
}
