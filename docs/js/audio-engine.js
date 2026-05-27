const AudioEngine = {
  noise: null,
  filter: null,
  fft: null,
  vinyl: null,
  _playing: false,
  _currentNoise: 'white',

  async init() {
    this.vinyl = await loadSound('./audio/Vinyl.mp3');
    this.filter = new p5.LowPass();
    this.noise = new p5.Noise('white');

    this.noise.disconnect();
    this.vinyl.disconnect();
    this.noise.connect(this.filter);
    this.vinyl.connect(this.filter);

    this.fft = new p5.FFT();
    this.filter.connect(this.fft);
  },

  play() {
    if (this._playing) return;
    if (this._currentNoise !== 'vinyl') {
      this.noise.start();
    } else {
      this.vinyl.play();
      this.vinyl.loop(35);
    }
    this._playing = true;
  },

  stop() {
    if (!this._playing) return;
    if (this._currentNoise !== 'vinyl') {
      this.noise.stop();
    } else {
      this.vinyl.stop();
    }
    this._playing = false;
  },

  toggle() {
    if (this._playing) this.stop(); else this.play();
    return this._playing;
  },

  switchNoise(type) {
    if (type === 'vinyl') {
      if (this._playing) {
        this.noise.stop();
        this.vinyl.play();
        this.vinyl.loop(35);
      }
    } else {
      if (this._currentNoise === 'vinyl' && this._playing) {
        this.vinyl.stop();
      }
      this.noise.type(type);
      if (this._playing) {
        this.noise.start();
      }
    }
    this._currentNoise = type;
  },

  setFrequency(f) {
    this.filter.freq(f);
  },

  setResonance(r) {
    this.filter.res(r);
  },

  setVolume(v) {
    this.noise.amp(v);
    this.vinyl.amp(v);
  },

  getSpectrum() {
    const raw = this.fft.analyze();
    const out = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      let val;
      if (raw[i] < 0) {
        val = constrain(map(raw[i], -100, 0, 0, 1), 0, 1);
      } else if (raw[i] > 1) {
        val = raw[i] / 255;
      } else {
        val = raw[i];
      }
      out[i] = constrain(pow(val * 20, 0.4), 0, 1);
    }
    return out;
  },

  isPlaying() {
    return this._playing;
  },

  currentNoise() {
    return this._currentNoise;
  }
};
