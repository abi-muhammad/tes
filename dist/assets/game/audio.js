// Modul Audio Prosedural menggunakan Web Audio API
// Tidak membutuhkan file MP3 eksternal sehingga 100% bebas 404 di GitHub Pages dan sangat ringan di Android.

const STORAGE_MUTE_KEY = 'kpw_audio_muted';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
    this.unlocked = false;
    this.stepTimer = 0;
    this.bgmInterval = null;
    this.bgmBeat = 0;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  setMuted(muteState) {
    this.muted = Boolean(muteState);
    try {
      localStorage.setItem(STORAGE_MUTE_KEY, String(this.muted));
    } catch {
      // Abaikan jika storage penuh
    }
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  canPlay() {
    if (this.muted) return false;
    if (!this.ctx) this.initContext();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  // Efek suara langkah kaki di keramik sekolah
  playStep(isLeft = true) {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = isLeft ? 135 : 155;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.055);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  // Efek suara melompat
  playJump(superJump = false) {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(superJump ? 760 : 540, now + 0.18);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  // Efek suara meluncur di lantai keramik
  playSlide() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;

    // White noise terfilter untuk efek gesekan sepatu/celana di keramik
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Efek pindah jalur kiri/kanan
  playLaneSwitch() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Efek mengambil koin uang jajan
  playCoin() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Efek mengambil power-up
  playPowerup() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.2, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.17);
    });
  }

  // Efek menabrak meja/rintangan
  playCrash() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  // Efek Bel Sekolah khas SMA Indonesia (Ding-Dong-Ding-Dong)
  playSchoolBell() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 659.25, t: 0.0, d: 0.28 }, // E5
      { f: 523.25, t: 0.28, d: 0.28 }, // C5
      { f: 587.33, t: 0.56, d: 0.28 }, // D5
      { f: 392.0, t: 0.84, d: 0.45 }   // G4
    ];

    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.22, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.02);
    });
  }

  // Efek Peluit Pak Wahid (PRIIIT!)
  playTeacherWhistle() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2650, now);

    // Efek bola peluit bergetar cepat
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, now);
    lfoGain.gain.setValueAtTime(180, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    mainGain.gain.setValueAtTime(0.01, now);
    mainGain.gain.linearRampToValueAtTime(0.24, now + 0.03);
    mainGain.gain.setValueAtTime(0.24, now + 0.32);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.43);
    lfo.stop(now + 0.43);
  }

  // Efek suara komedi ocehan Pak Wahid ("Heh! Berhenti kamu!")
  playTeacherBark() {
    if (!this.canPlay()) return;
    const now = this.ctx.currentTime;
    const syllables = [190, 240, 175, 260, 150];
    syllables.forEach((pitch, idx) => {
      const start = now + idx * 0.075;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, start);
      osc.frequency.linearRampToValueAtTime(pitch * 0.85, start + 0.06);

      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.065);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.07);
    });
  }

  startBGM() {
    this.stopBGM();
    if (this.muted) return;
    this.bgmBeat = 0;
    const bassLine = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    this.bgmInterval = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const freq = bassLine[this.bgmBeat % bassLine.length];
      this.bgmBeat++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    }, 210);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}
