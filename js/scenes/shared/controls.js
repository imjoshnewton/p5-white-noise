const GlassOverlay = {
  overlay: null,
  buttons: {},
  hideTimeout: null,
  isMobile: false,

  init() {
    this.overlay = document.getElementById('glass-overlay');
    this.isMobile = 'ontouchstart' in window;

    this.overlay.querySelectorAll('.glass-btn').forEach(btn => {
      const noise = btn.dataset.noise;
      this.buttons[noise] = btn;

      if (noise === 'play') {
        btn.innerHTML = ICONS.play;
        btn.addEventListener('click', () => {
          const isPlaying = AudioEngine.toggle();
          btn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
          btn.classList.toggle('active', isPlaying);
        });
      } else {
        const colorMap = { white: '#ddd', pink: '#E84B8A', brown: '#E8632B', vinyl: '#888' };
        btn.innerHTML = noise === 'vinyl' ? ICONS.vinyl : ICONS.waveform(colorMap[noise]);
        btn.addEventListener('click', () => {
          AudioEngine.switchNoise(noise);
          this._updateActiveNoise(noise);
        });
      }
    });

    this._updateActiveNoise(AudioEngine.currentNoise());

    if (!this.isMobile) {
      document.addEventListener('mousemove', () => this._showTemporarily());
    }
  },

  show() {
    this.overlay.classList.remove('hidden');
    if (!this.isMobile) this._showTemporarily();
  },

  hide() {
    this.overlay.classList.add('hidden');
    clearTimeout(this.hideTimeout);
  },

  _showTemporarily() {
    this.overlay.classList.remove('auto-hidden');
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.overlay.classList.add('auto-hidden');
    }, 3000);
  },

  _updateActiveNoise(type) {
    ['white', 'pink', 'brown', 'vinyl'].forEach(n => {
      this.buttons[n].classList.toggle('active', n === type);
    });
  },

  syncState() {
    const isPlaying = AudioEngine.isPlaying();
    this.buttons.play.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    this.buttons.play.classList.toggle('active', isPlaying);
    this._updateActiveNoise(AudioEngine.currentNoise());
  }
};
