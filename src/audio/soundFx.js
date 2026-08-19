/**
 * Кибернетический звуковой синтезатор и генератор фоновой музыки в стиле Cyberpunk / Synthwave.
 * Полностью автономен на Web Audio API, не требует внешних MP3 файлов.
 */

class SoundFx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isMusicPlaying = false;
    this.musicGain = null;
    this.masterGain = null;
    this.musicTimer = null;
    this.currentStep = 0;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.enabled ? 0.35 : 0.0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    if (this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(this.enabled ? 0.35 : 0.0, now + 1.0);
    }

    // Запуск фонового киберпанк пэда / баса (Reese Bass + Pad)
    this.startAmbientDrones();

    // Запуск секвенсора арпеджио и ритма (115 BPM)
    this.startSequencer();
  }

  stopMusic() {
    if (!this.isMusicPlaying) return;
    this.isMusicPlaying = false;
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.init();

    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      if (this.enabled) {
        this.musicGain.gain.linearRampToValueAtTime(0.35, now + 0.5);
        if (!this.isMusicPlaying) {
          this.startMusic();
        }
      } else {
        this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      }
    }

    return this.enabled;
  }

  startAmbientDrones() {
    if (!this.ctx || !this.musicGain) return;

    try {
      // 1. Глубокий аналоговый саб-бас (Reese Bass)
      const bassOsc1 = this.ctx.createOscillator();
      const bassOsc2 = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bassOsc1.type = 'sawtooth';
      bassOsc2.type = 'sawtooth';
      bassOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
      bassOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime); // Слегка расстроенный унисон

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      bassFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      bassGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

      bassOsc1.connect(bassFilter);
      bassOsc2.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc1.start();
      bassOsc2.start();

      // 2. Кибернетический пэд (Blade Runner Style Pad)
      const padOsc1 = this.ctx.createOscillator();
      const padOsc2 = this.ctx.createOscillator();
      const padFilter = this.ctx.createBiquadFilter();
      const padGain = this.ctx.createGain();

      padOsc1.type = 'sawtooth';
      padOsc2.type = 'sine';
      padOsc1.frequency.setValueAtTime(220, this.ctx.currentTime); // A3
      padOsc2.frequency.setValueAtTime(330, this.ctx.currentTime); // E4

      padFilter.type = 'bandpass';
      padFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      padFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      padGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

      // Медленная LFO модуляция фильтра пэда
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
      lfo.connect(padFilter.frequency);
      lfo.start();

      padOsc1.connect(padFilter);
      padOsc2.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.musicGain);

      padOsc1.start();
      padOsc2.start();
    } catch (e) {
      console.warn("AudioContext error on ambient:", e);
    }
  }

  startSequencer() {
    if (!this.ctx) return;

    // 16-шаговая киберпанк мелодия (ноты в Гц: A3, C4, D4, E4, G4, A4, F4)
    const notes = [
      220.0, 261.63, 329.63, 392.00, // A3, C4, E4, G4
      293.66, 329.63, 440.00, 392.00, // D4, E4, A4, G4
      174.61, 220.00, 261.63, 329.63, // F3, A3, C4, E4
      293.66, 329.63, 392.00, 440.00  // D4, E4, G4, A4
    ];

    const stepInterval = 135; // ~111 BPM 16th notes
    this.currentStep = 0;

    this.musicTimer = setInterval(() => {
      if (!this.enabled || !this.isMusicPlaying || !this.ctx) return;

      const freq = notes[this.currentStep % notes.length];
      const isBeat = this.currentStep % 4 === 0;
      const isOffbeat = this.currentStep % 2 === 0;

      this.playSynthPluck(freq, this.currentStep % 2 === 0 ? 0.08 : 0.04);

      if (isBeat) {
        this.playCyberKick();
      } else if (isOffbeat) {
        this.playCyberHiHat();
      }

      this.currentStep++;
    }, stepInterval);
  }

  playSynthPluck(freq, volume = 0.06) {
    if (!this.ctx || !this.musicGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.18);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playCyberKick() {
    if (!this.ctx || !this.musicGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playCyberHiHat() {
    if (!this.ctx || !this.musicGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(6200, now);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5000, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // Звуковые эффекты интерфейса (UI Sound Effects)
  playHover() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playWarp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch (e) {}
  }

  playPulse() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }
  playFootstep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // =========================================================================
  // 🎧 ПРОСТРАНСТВЕННЫЙ 3D АУДИОДВИЖОК ДЛЯ ЗДАНИЙ И ПРОИЗВОДСТВА
  // =========================================================================
  initSpatialZones() {
    if (this.spatialInitialized || !this.ctx) return;
    this.spatialInitialized = true;

    this.spatialMasterGain = this.ctx.createGain();
    this.spatialMasterGain.gain.setValueAtTime(this.enabled ? 1.0 : 0.0, this.ctx.currentTime);
    this.spatialMasterGain.connect(this.masterGain);

    this.spatialZones = {
      factory: { pos: { x: 0, z: -115 }, maxDist: 95, gain: this.ctx.createGain(), baseVol: 0.38 },
      hub:     { pos: { x: 0, z: 0 },    maxDist: 85, gain: this.ctx.createGain(), baseVol: 0.32 },
      tpp:     { pos: { x: -185, z: 45 },maxDist: 95, gain: this.ctx.createGain(), baseVol: 0.40 },
      agro:    { pos: { x: -185, z: 75 },maxDist: 80, gain: this.ctx.createGain(), baseVol: 0.28 },
      tech:    { pos: { x: 115, z: 45 }, maxDist: 85, gain: this.ctx.createGain(), baseVol: 0.35 }
    };

    Object.values(this.spatialZones).forEach(z => {
      z.gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      z.gain.connect(this.spatialMasterGain);
    });

    this._startFactorySound();
    this._startHubSound();
    this._startTppSound();
    this._startAgroSound();
    this._startTechSound();
  }

  updateSpatialListener(listenerPos) {
    if (!this.enabled) return;
    this.init();
    if (!this.spatialInitialized) this.initSpatialZones();
    if (!this.ctx || !this.spatialZones) return;

    const now = this.ctx.currentTime;
    for (const key of Object.keys(this.spatialZones)) {
      const z = this.spatialZones[key];
      const dist = Math.hypot(listenerPos.x - z.pos.x, listenerPos.z - z.pos.z);
      let intensity = 0;
      if (dist < z.maxDist) {
        // Плавная кубическая кривая затухания звука при приближении
        const norm = 1 - (dist / z.maxDist);
        intensity = norm * norm * z.baseVol;
      }
      z.gain.gain.cancelScheduledValues(now);
      z.gain.gain.setValueAtTime(z.gain.gain.value, now);
      z.gain.gain.linearRampToValueAtTime(Math.max(0.0001, intensity), now + 0.12);
    }
  }

  // 1. Звуки завода SKD BYD (Гидравлика, ритм конвейера, гул станков)
  _startFactorySound() {
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(this.spatialZones.factory.gain);
      osc.start();

      // Ритмичные пневматические удары конвейера
      setInterval(() => {
        if (!this.enabled || !this.ctx || this.spatialZones.factory.gain.gain.value < 0.02) return;
        this.playWeldingSpark();
      }, 2200);
    } catch (e) {}
  }

  playWeldingSpark() {
    if (!this.enabled || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      whiteNoise.connect(filter);
      filter.connect(g);
      g.connect(this.spatialZones.factory.gain);
      whiteNoise.start();
    } catch (e) {}
  }

  // 2. Звуки Электрохаба «Витязь» (Высокочастотный инвертор 240 кВт, писк терминалов)
  _startHubSound() {
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(240, this.ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4800, this.ctx.currentTime); // Звон инвертора

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      osc2.connect(subGain);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      osc1.connect(filter);
      filter.connect(this.spatialZones.hub.gain);
      subGain.connect(this.spatialZones.hub.gain);

      osc1.start();
      osc2.start();
    } catch (e) {}
  }

  // 3. Звуки Угольной и Газовой ТЭЦ (Рев паровых турбин, 50 Гц трансформатор)
  _startTppSound() {
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(50, this.ctx.currentTime); // 50 Hz power hum

      // Рокот турбин
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(160, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.spatialZones.tpp.gain);
      osc.connect(this.spatialZones.tpp.gain);

      osc.start();
      noise.start();
    } catch (e) {}
  }

  // 4. Звуки Теплиц и Агрокомплекса (Автополив, шелест, легкий ветер)
  _startAgroSound() {
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const mistFilter = this.ctx.createBiquadFilter();
      mistFilter.type = 'highpass';
      mistFilter.frequency.setValueAtTime(4500, this.ctx.currentTime);

      const mistGain = this.ctx.createGain();
      mistGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

      noise.connect(mistFilter);
      mistFilter.connect(mistGain);
      mistGain.connect(this.spatialZones.agro.gain);

      noise.start();
    } catch (e) {}
  }

  // 5. Звуки Техноцентра (Квантовое ядро, сервеная стойка, гармонический резонанс)
  _startTechSound() {
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(330, this.ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(440, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.spatialZones.tech.gain);

      osc1.start();
      osc2.start();
    } catch (e) {}
  }
}

export const soundFx = new SoundFx();
