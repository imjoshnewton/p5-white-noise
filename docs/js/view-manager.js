const ViewManager = {
  currentView: '2d',
  views: ['2d', 'lake', 'garden'],
  renderer: null,
  activeScene: null,
  clock: null,
  toggleBtn: null,
  animFrameId: null,

  init() {
    this.toggleBtn = document.getElementById('view-toggle');
    this.toggleBtn.innerHTML = ICONS.viewLake;
    this.toggleBtn.addEventListener('click', () => this.next());
  },

  next() {
    const idx = this.views.indexOf(this.currentView);
    const nextView = this.views[(idx + 1) % this.views.length];
    this.switchTo(nextView);
  },

  switchTo(view) {
    if (this.activeScene) {
      this.activeScene.dispose();
      this.activeScene = null;
      cancelAnimationFrame(this.animFrameId);
    }

    const container2d = document.getElementById('container');
    const p5Canvas = document.querySelector('canvas.p5Canvas');

    if (view === '2d') {
      container2d.style.display = 'flex';
      if (p5Canvas) p5Canvas.style.display = 'block';
      if (this.renderer) {
        this.renderer.domElement.style.display = 'none';
      }
      GlassOverlay.hide();
      this.toggleBtn.innerHTML = ICONS.viewLake;
      this.toggleBtn.classList.remove('mode-3d');
      loop();
    } else {
      container2d.style.display = 'none';
      if (p5Canvas) p5Canvas.style.display = 'none';
      noLoop();

      this._ensure3DRenderer();
      this.renderer.domElement.style.display = 'block';

      GlassOverlay.show();
      GlassOverlay.syncState();
      this.toggleBtn.classList.add('mode-3d');

      if (view === 'lake') {
        this.activeScene = new LakeScene(this.renderer);
        this.toggleBtn.innerHTML = ICONS.viewGarden;
      } else {
        this.activeScene = new GardenScene(this.renderer);
        this.toggleBtn.innerHTML = ICONS.view2D;
      }

      this.clock = new THREE.Clock();
      this._animate();
    }

    this.currentView = view;
  },

  _ensure3DRenderer() {
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(innerWidth, innerHeight);
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.renderer.domElement.style.position = 'fixed';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.zIndex = '999';
      document.body.appendChild(this.renderer.domElement);
    }
  },

  _animate() {
    this.animFrameId = requestAnimationFrame(() => this._animate());
    const dt = this.clock.getDelta();

    if (this.activeScene) {
      this.activeScene.update(dt);
      this.activeScene.render(this.renderer);
    }
  },

  resize() {
    if (this.renderer) {
      this.renderer.setSize(innerWidth, innerHeight);
    }
    if (this.activeScene && this.activeScene.resize) {
      this.activeScene.resize();
    }
  }
};
