# 3D Noise Machine World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two immersive Firewatch-inspired 3D scenes (Lake, Garden) to the existing noise machine, toggled from the current 2D view, sharing a common audio engine.

**Architecture:** Extract audio logic into a standalone `AudioEngine` object. Add Three.js for 3D rendering. A `ViewManager` orchestrates switching between the 2D p5.js view and two Three.js scenes. Shared modules (sky shader, lantern, camera, controls) are consumed by both scenes. All files are vanilla JS loaded via `<script>` tags -- no bundler.

**Tech Stack:** p5.js 2.2.3 + p5.sound 0.3.0 (audio), Three.js r170+ (3D rendering), Sass (styles), vanilla JS (no framework)

---

## File Map

```
index.html                  -- add Three.js CDN, new script tags, 3D overlay HTML
styles/style.scss           -- add glass overlay, view toggle, 3D canvas styles
js/
  audio-engine.js           -- NEW: extracted audio API (Noise, LowPass, FFT, vinyl)
  view-manager.js           -- NEW: orchestrates 2D/Lake/Garden switching
  icons.js                  -- MODIFY: add view toggle icons (wave, leaf, grid)
  classes.js                -- unchanged
  sketch.js                 -- MODIFY: refactor to consume AudioEngine
  scenes/
    shared/
      palette.js            -- NEW: Firewatch color constants
      sky.js                -- NEW: gradient sky dome shader
      camera.js             -- NEW: ambient drift orbit controller
      lantern.js            -- NEW: draggable glowing orb with raycasting
      controls.js           -- NEW: totem base class + glass overlay sync
    lake.js                 -- NEW: Lake scene (water, columns, terrain, totems)
    garden.js               -- NEW: Garden scene (planters, wire, aurora, totems)
```

---

### Task 1: Extract AudioEngine

**Files:**
- Create: `js/audio-engine.js`
- Modify: `js/sketch.js`

The audio engine wraps all p5.sound objects behind a clean API so both 2D and 3D views can control sound without touching p5.sound directly.

- [ ] **Step 1: Create `js/audio-engine.js`**

```js
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
```

- [ ] **Step 2: Refactor `js/sketch.js` to use AudioEngine**

Remove all direct p5.sound usage. Replace with `AudioEngine` calls. The `setup()` function calls `AudioEngine.init()`. The `draw()` function calls `AudioEngine.getSpectrum()`, `AudioEngine.setFrequency()`, etc. Button handlers call `AudioEngine.toggle()`, `AudioEngine.switchNoise()`.

Full replacement for `sketch.js`:

```js
let noiseArea, playBtn, brownBtn, pinkBtn, whiteBtn, vinylBtn;

const colors = ['#30CCC1', '#709996', '#55FF94', '#FF95BB', '#CC30B5'];
const MARKER_SIZE = 35;

async function setup() {
  await AudioEngine.init();
  createCanvas(windowWidth, windowHeight);
  noStroke();

  const dims = calcDimensions();
  setupNoiseArea(dims);
  setupButtons();
}

function calcDimensions() {
  let h = windowHeight * 0.8;
  h = constrain(h, 345, 450);
  let w = windowWidth <= 980
    ? windowWidth * 0.85
    : Math.min(windowWidth * 0.55, 750);
  w = Math.max(w, 250);
  return { width: w, height: h };
}

function setupNoiseArea(dims) {
  noiseArea = new NoiseBox();
  noiseArea.container.size(dims.width, dims.height);
  noiseArea.container.id('noise-area').parent('area-container');

  const b = noiseArea.bounds;
  noiseArea.marker.init(b.x + b.width / 8, b.y + b.height / 2, true, true, 40);

  const el = noiseArea.container.elt;
  el.addEventListener('pointerdown', function () { noiseArea.active = true; });
  el.addEventListener('pointerup', function () { noiseArea.active = false; });
  el.addEventListener('pointerleave', function () { noiseArea.active = false; });
}

function setupButtons() {
  playBtn = createNoiseButton('all-stop', 'noise-button is-paused pulse', ICONS.play);
  if (windowWidth > 980) {
    playBtn.container.addClass('animated');
  }
  const playEl = playBtn.container.elt;
  playEl.addEventListener('click', function () {
    const isPlaying = AudioEngine.toggle();
    playEl.classList.remove('animated');
    if (isPlaying) {
      playEl.classList.remove('is-paused');
      playEl.classList.add('is-playing');
      playEl.innerHTML = ICONS.pause;
    } else {
      playEl.classList.remove('is-playing');
      playEl.classList.add('is-paused');
      playEl.innerHTML = ICONS.play;
    }
  });

  brownBtn = createNoiseButton('brown-noise', 'noise-button', ICONS.waveform('#709996'));
  brownBtn.container.elt.addEventListener('click', function () {
    AudioEngine.switchNoise('brown');
  });

  pinkBtn = createNoiseButton('pink-noise', 'noise-button', ICONS.waveform('#CC30B5'));
  pinkBtn.container.elt.addEventListener('click', function () {
    AudioEngine.switchNoise('pink');
  });

  whiteBtn = createNoiseButton('white-noise', 'noise-button', ICONS.waveform('#333'));
  whiteBtn.container.elt.addEventListener('click', function () {
    AudioEngine.switchNoise('white');
  });

  vinylBtn = createNoiseButton('vinyl-noise', 'noise-button', ICONS.vinyl);
  vinylBtn.container.elt.addEventListener('click', function () {
    AudioEngine.switchNoise('vinyl');
  });
}

function createNoiseButton(id, className, iconHtml) {
  const box = new NoiseBox();
  box.container.id(id).class(className).parent('button-container');
  box.container.elt.innerHTML = iconHtml;
  box.hasMarker = false;
  return box;
}

function draw() {
  background('#ddd');

  const b = noiseArea.bounds;
  const r = noiseArea.marker.radius;

  const filterFreq = map(noiseArea.marker.x, b.x + r, b.x + b.width - r, 10, 22000);
  const filterRes = map(noiseArea.marker.x, b.x + r, b.x + b.width - r, 0, 20);
  AudioEngine.setFrequency(filterFreq);
  AudioEngine.setResonance(filterRes);

  const vol = map(noiseArea.marker.y, b.y + r, b.y + b.height - r, 1, 0);
  AudioEngine.setVolume(vol);

  const spectrum = AudioEngine.getSpectrum();

  fill('rgba(106, 106, 106, 0.75)');
  rect(b.x, b.y, b.width, b.height);

  fill(colors[3]);
  for (let i = 0; i < spectrum.length; i++) {
    const x = map(i, 0, spectrum.length, b.x, b.x + b.width);
    const barH = spectrum[i] * b.height;
    rect(x, b.y + b.height, b.width / spectrum.length, -barH);
  }

  noiseArea.handleAction();
  noiseArea.show(MARKER_SIZE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background('#ddd');
  if (!noiseArea) return;
  const dims = calcDimensions();
  noiseArea.container.size(dims.width, dims.height);
  const b = noiseArea.bounds;
  noiseArea.marker.update(b.x + b.width / 8, b.y + b.height / 2);
}
```

- [ ] **Step 3: Add `audio-engine.js` script tag to `index.html`**

Add before `sketch.js`:

```html
<script src="js/audio-engine.js"></script>
```

- [ ] **Step 4: Verify 2D view still works**

Run: `bun run dev`
Open: `http://100.127.108.14:3000`
Verify: Play/pause, noise type switching, frequency/volume control, spectrum bars all work identically to before.

- [ ] **Step 5: Commit**

```bash
git add js/audio-engine.js js/sketch.js index.html
git commit -m "feat: extract AudioEngine from sketch.js"
```

---

### Task 2: Color Palette + Firewatch Sky Shader

**Files:**
- Create: `js/scenes/shared/palette.js`
- Create: `js/scenes/shared/sky.js`

- [ ] **Step 1: Create `js/scenes/shared/palette.js`**

```js
const PALETTE = {
  skyHorizon:  new THREE.Color('#FF6B35'),
  skyMid:      new THREE.Color('#F7931E'),
  skyUpper:    new THREE.Color('#C1456C'),
  skyZenith:   new THREE.Color('#4A2545'),
  water:       new THREE.Color('#1A3A4A'),
  lanternGlow: new THREE.Color('#FFD685'),
  fog:         new THREE.Color('#D4886B'),
  freqLow:     new THREE.Color('#E8632B'),
  freqMid:     new THREE.Color('#E84B8A'),
  freqHigh:    new THREE.Color('#7B4BB0'),
  totemActive:  new THREE.Color('#FFE0A0'),

  freqColor(t) {
    if (t < 0.5) {
      return this.freqLow.clone().lerp(this.freqMid, t * 2);
    }
    return this.freqMid.clone().lerp(this.freqHigh, (t - 0.5) * 2);
  }
};
```

- [ ] **Step 2: Create `js/scenes/shared/sky.js`**

A sky dome using a custom ShaderMaterial that renders the Firewatch banded gradient.

```js
function createSkyDome(scene) {
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uHorizon;
    uniform vec3 uMid;
    uniform vec3 uUpper;
    uniform vec3 uZenith;

    varying vec3 vWorldPosition;

    void main() {
      float h = normalize(vWorldPosition).y;
      h = clamp(h, 0.0, 1.0);

      vec3 color;
      if (h < 0.15) {
        color = mix(uHorizon, uMid, h / 0.15);
      } else if (h < 0.4) {
        color = mix(uMid, uUpper, (h - 0.15) / 0.25);
      } else {
        color = mix(uUpper, uZenith, (h - 0.4) / 0.6);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uHorizon: { value: PALETTE.skyHorizon },
      uMid:     { value: PALETTE.skyMid },
      uUpper:   { value: PALETTE.skyUpper },
      uZenith:  { value: PALETTE.skyZenith },
    },
    side: THREE.BackSide,
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);
  return skyMesh;
}
```

- [ ] **Step 3: Add script tags to `index.html`**

Add Three.js CDN and the new files (order matters -- palette before sky):

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js"></script>
<script src="js/scenes/shared/palette.js"></script>
<script src="js/scenes/shared/sky.js"></script>
```

- [ ] **Step 4: Quick visual test**

Temporarily add to bottom of `sketch.js` setup (or in browser console) to verify:

```js
const testScene = new THREE.Scene();
const testCam = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
testCam.position.set(0, 2, 5);
const testRenderer = new THREE.WebGLRenderer({ alpha: true });
testRenderer.setSize(innerWidth, innerHeight);
document.body.appendChild(testRenderer.domElement);
createSkyDome(testScene);
testRenderer.render(testScene, testCam);
```

Verify: A Firewatch gradient dome renders (orange at horizon fading to purple overhead). Remove test code after confirming.

- [ ] **Step 5: Commit**

```bash
git add js/scenes/shared/palette.js js/scenes/shared/sky.js index.html
git commit -m "feat: add Firewatch color palette and sky dome shader"
```

---

### Task 3: Ambient Drift Camera

**Files:**
- Create: `js/scenes/shared/camera.js`

- [ ] **Step 1: Create `js/scenes/shared/camera.js`**

```js
class DriftCamera {
  constructor(fov = 60, near = 0.1, far = 1000) {
    this.camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, near, far);
    this.target = new THREE.Vector3(0, 0, 0);
    this.radius = 12;
    this.height = 4;
    this.angle = 0;
    this.speed = (Math.PI * 2) / 60;  // full orbit in 60 seconds
    this.bobAmount = 0.3;
    this.bobSpeed = 0.5;
    this.paused = false;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    if (!this.paused) {
      this.angle += this.speed * dt;
    }

    const bob = Math.sin(this.angle * this.bobSpeed) * this.bobAmount;
    this.camera.position.set(
      Math.cos(this.angle) * this.radius,
      this.height + bob,
      Math.sin(this.angle) * this.radius
    );
    this.camera.lookAt(this.target);
  }
}
```

- [ ] **Step 2: Add script tag to `index.html`**

```html
<script src="js/scenes/shared/camera.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/scenes/shared/camera.js index.html
git commit -m "feat: add ambient drift camera controller"
```

---

### Task 4: Draggable Lantern

**Files:**
- Create: `js/scenes/shared/lantern.js`

- [ ] **Step 1: Create `js/scenes/shared/lantern.js`**

The lantern is a glowing emissive sphere with a point light. It supports pointer-based dragging via raycasting onto a constraint plane. Each scene provides its own constraint function.

```js
class Lantern {
  constructor(scene, renderer, camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.dragging = false;
    this.onDragStart = null;
    this.onDragEnd = null;
    this.constraintFn = null;  // scene sets this: (pos) => constrainedPos

    // Glowing sphere
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: PALETTE.lanternGlow,
        emissive: PALETTE.lanternGlow,
        emissiveIntensity: 2,
      })
    );
    this.mesh.position.set(0, 2, 0);
    scene.add(this.mesh);

    // Point light
    this.light = new THREE.PointLight(
      PALETTE.lanternGlow.getHex(), 3, 30
    );
    this.mesh.add(this.light);

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup', this._onPointerUp);
  }

  get position() { return this.mesh.position; }

  getNormalizedXY(bounds) {
    // bounds: { minX, maxX, minY, maxY } in world coords
    const nx = (this.mesh.position.x - bounds.minX) / (bounds.maxX - bounds.minX);
    const ny = (this.mesh.position.y - bounds.minY) / (bounds.maxY - bounds.minY);
    return {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
    };
  }

  _updatePointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _onPointerDown(event) {
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hits = this.raycaster.intersectObject(this.mesh);
    if (hits.length > 0) {
      this.dragging = true;
      this.dragPlane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()).negate(),
        this.mesh.position
      );
      if (this.onDragStart) this.onDragStart();
    }
  }

  _onPointerMove(event) {
    if (!this.dragging) return;
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

    if (this.constraintFn) {
      const constrained = this.constraintFn(intersection);
      this.mesh.position.copy(constrained);
    } else {
      this.mesh.position.copy(intersection);
    }
  }

  _onPointerUp() {
    if (this.dragging) {
      this.dragging = false;
      if (this.onDragEnd) this.onDragEnd();
    }
  }

  update(volume) {
    // Pulse light intensity with volume
    this.light.intensity = 1 + volume * 4;
    this.light.distance = 15 + volume * 20;
    this.mesh.material.emissiveIntensity = 1 + volume * 2;
  }

  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    canvas.removeEventListener('pointermove', this._onPointerMove);
    canvas.removeEventListener('pointerup', this._onPointerUp);
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.light.dispose();
  }
}
```

- [ ] **Step 2: Add script tag to `index.html`**

```html
<script src="js/scenes/shared/lantern.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/scenes/shared/lantern.js index.html
git commit -m "feat: add draggable lantern with glow and raycasting"
```

---

### Task 5: Glass Overlay UI + View Toggle

**Files:**
- Modify: `index.html` (add overlay HTML)
- Modify: `styles/style.scss` (add overlay + toggle styles)
- Modify: `js/icons.js` (add view toggle icons)
- Create: `js/scenes/shared/controls.js`

- [ ] **Step 1: Add overlay HTML to `index.html`**

Add after the existing `#container` div, before the closing `</body>`:

```html
<!-- 3D Glass Overlay (hidden in 2D mode) -->
<div id="glass-overlay" class="glass-overlay hidden">
  <button class="glass-btn" data-noise="play" aria-label="Play/Pause"></button>
  <button class="glass-btn" data-noise="white" aria-label="White Noise"></button>
  <button class="glass-btn" data-noise="pink" aria-label="Pink Noise"></button>
  <button class="glass-btn" data-noise="brown" aria-label="Brown Noise"></button>
  <button class="glass-btn" data-noise="vinyl" aria-label="Vinyl Pop"></button>
</div>

<!-- View Toggle (always visible) -->
<button id="view-toggle" class="view-toggle" aria-label="Switch view"></button>
```

- [ ] **Step 2: Add icons to `js/icons.js`**

Add to the ICONS object:

```js
  viewLake: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 18c2-1 4 1 6 0s4-1 6 0 4 1 6 0v4H2z"/><circle cx="17" cy="6" r="3"/></svg>',
  viewGarden: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C9 2 6 5 6 8c0 2 1 4 3 5v9h6v-9c2-1 3-3 3-5 0-3-3-6-6-6z"/></svg>',
  view2D: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
```

- [ ] **Step 3: Add styles to `styles/style.scss`**

Add at the end of the file (before the media query):

```scss
// Glass overlay for 3D mode
.glass-overlay {
  align-items: center;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  bottom: 0;
  display: flex;
  gap: 12px;
  justify-content: center;
  left: 0;
  padding: 12px 20px;
  position: fixed;
  right: 0;
  transition: opacity 0.5s, transform 0.5s;
  z-index: 2000;

  &.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(100%);
  }

  &.auto-hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.glass-btn {
  align-items: center;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  height: 44px;
  justify-content: center;
  transition: all 200ms;
  width: 44px;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  &.active {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 12px rgba(255, 224, 160, 0.4);
  }
}

.view-toggle {
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  bottom: 80px;
  color: $grey-2;
  cursor: pointer;
  display: flex;
  height: 44px;
  justify-content: center;
  position: fixed;
  right: 20px;
  transition: all 200ms;
  width: 44px;
  z-index: 2001;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  // In 3D mode, make it white text
  &.mode-3d {
    color: rgba(255, 255, 255, 0.8);
  }
}
```

- [ ] **Step 4: Create `js/scenes/shared/controls.js`**

Manages glass overlay button state and auto-hide behavior. Syncs with AudioEngine.

```js
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
```

- [ ] **Step 5: Add script tags to `index.html`**

```html
<script src="js/scenes/shared/controls.js"></script>
```

- [ ] **Step 6: Compile SCSS and verify overlay renders**

Run: `bunx sass styles/style.scss styles/style.css --style compressed --no-source-map`

Temporarily remove the `hidden` class from `#glass-overlay` in HTML, open the page, verify the frosted glass bar renders at the bottom with 5 buttons. Then restore the `hidden` class.

- [ ] **Step 7: Commit**

```bash
git add index.html js/icons.js js/scenes/shared/controls.js styles/style.scss
git commit -m "feat: add glass overlay UI, view toggle button, and controls module"
```

---

### Task 6: View Manager

**Files:**
- Create: `js/view-manager.js`
- Modify: `js/sketch.js` (integrate view manager)
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Create `js/view-manager.js`**

Orchestrates switching between 2D, Lake, and Garden views. Manages the Three.js renderer lifecycle.

```js
const ViewManager = {
  currentView: '2d',  // '2d' | 'lake' | 'garden'
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
    // Tear down current 3D scene
    if (this.activeScene) {
      this.activeScene.dispose();
      this.activeScene = null;
      cancelAnimationFrame(this.animFrameId);
    }

    // Hide/show appropriate elements
    const container2d = document.getElementById('container');
    const p5Canvas = document.querySelector('canvas.p5Canvas');

    if (view === '2d') {
      // Show 2D elements
      container2d.style.display = 'flex';
      if (p5Canvas) p5Canvas.style.display = 'block';
      if (this.renderer) {
        this.renderer.domElement.style.display = 'none';
      }
      GlassOverlay.hide();
      this.toggleBtn.innerHTML = ICONS.viewLake;
      this.toggleBtn.classList.remove('mode-3d');
      loop(); // resume p5 draw loop
    } else {
      // Hide 2D elements
      container2d.style.display = 'none';
      if (p5Canvas) p5Canvas.style.display = 'none';
      noLoop(); // pause p5 draw loop

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
```

- [ ] **Step 2: Integrate into `sketch.js`**

Add to the end of `setup()`:

```js
  ViewManager.init();
  GlassOverlay.init();
```

Add to `windowResized()`:

```js
  ViewManager.resize();
```

- [ ] **Step 3: Add script tag to `index.html`**

Add after `controls.js`, before scene files:

```html
<script src="js/view-manager.js"></script>
```

- [ ] **Step 4: Verify toggle button appears and clicking it doesn't crash**

At this point clicking toggle will try to instantiate `LakeScene` which doesn't exist yet. Verify the button renders and the 2D view works. The console will error on click -- that's expected.

- [ ] **Step 5: Commit**

```bash
git add js/view-manager.js js/sketch.js index.html
git commit -m "feat: add ViewManager for 2D/3D scene switching"
```

---

### Task 7: The Lake Scene

**Files:**
- Create: `js/scenes/lake.js`
- Modify: `index.html` (add script tag)

This is the biggest task. The Lake scene creates the full environment: sky dome, water plane, terrain silhouettes, lantern, frequency columns, and totems.

- [ ] **Step 1: Create `js/scenes/lake.js`**

```js
class LakeScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.fog.getHex(), 0.02);

    this.driftCam = new DriftCamera();
    this.driftCam.radius = 14;
    this.driftCam.height = 3.5;
    this.driftCam.target.set(0, 1, 0);

    // Ambient light
    this.scene.add(new THREE.AmbientLight(0x665544, 0.4));

    // Directional (sun-like)
    const sun = new THREE.DirectionalLight(0xFFAA55, 0.6);
    sun.position.set(-10, 5, -10);
    this.scene.add(sun);

    // Sky
    createSkyDome(this.scene);

    // Water plane
    this._createWater();

    // Terrain silhouettes
    this._createTerrain();

    // Lantern
    this.lantern = new Lantern(this.scene, renderer, this.driftCam.camera);
    this.lantern.mesh.position.set(-3, 1.5, 0);
    this.lantern.constraintFn = (pos) => {
      return new THREE.Vector3(
        THREE.MathUtils.clamp(pos.x, -6, 6),
        THREE.MathUtils.clamp(pos.y, 0.5, 5),
        THREE.MathUtils.clamp(pos.z, -3, 3)
      );
    };
    this.lanternBounds = { minX: -6, maxX: 6, minY: 0.5, maxY: 5 };

    this.lantern.onDragStart = () => this.driftCam.pause();
    this.lantern.onDragEnd = () => this.driftCam.resume();

    // Frequency columns
    this.columns = [];
    this._createColumns();

    // Totems
    this.totems = [];
    this._createTotems();
  }

  _createWater() {
    const waterGeo = new THREE.PlaneGeometry(200, 200);
    const waterMat = new THREE.MeshStandardMaterial({
      color: PALETTE.water,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0;
    this.scene.add(this.water);
  }

  _createTerrain() {
    // Layered mountain silhouettes at different distances
    const layers = [
      { z: -40, height: 12, color: '#3A1F3A', y: 0 },
      { z: -30, height: 9,  color: '#5A2D4A', y: 0 },
      { z: -22, height: 6,  color: '#7A3D5A', y: 0 },
    ];

    layers.forEach(layer => {
      const shape = new THREE.Shape();
      shape.moveTo(-60, 0);
      // Generate jagged mountain profile
      for (let x = -60; x <= 60; x += 4) {
        const h = layer.height * (0.5 + 0.5 * Math.sin(x * 0.15) * Math.cos(x * 0.08 + 1));
        shape.lineTo(x, h);
      }
      shape.lineTo(60, 0);
      shape.lineTo(-60, 0);

      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color: layer.color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, layer.y, layer.z);
      this.scene.add(mesh);
    });
  }

  _createColumns() {
    const count = 32;
    const arcRadius = 5;
    const arcSpan = Math.PI * 0.8;
    const startAngle = Math.PI * 0.6;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = startAngle + t * arcSpan;
      const x = Math.cos(angle) * arcRadius;
      const z = Math.sin(angle) * arcRadius;
      const color = PALETTE.freqColor(t);

      const geo = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.7,
      });
      const col = new THREE.Mesh(geo, mat);
      col.position.set(x, 0, z);
      col.scale.y = 0.01;
      this.scene.add(col);
      this.columns.push(col);
    }
  }

  _createTotems() {
    const totemDefs = [
      { type: 'white',  color: '#DDDDDD', geo: new THREE.SphereGeometry(0.25, 12, 12) },
      { type: 'pink',   color: '#E84B8A', geo: new THREE.OctahedronGeometry(0.25) },
      { type: 'brown',  color: '#E8632B', geo: new THREE.DodecahedronGeometry(0.25) },
      { type: 'vinyl',  color: '#333333', geo: new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16) },
    ];

    const baseX = 7;
    const baseZ = 2;
    const spacing = 1.2;

    totemDefs.forEach((def, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(def.geo, mat);
      mesh.position.set(baseX, 1.2 + Math.sin(i) * 0.1, baseZ - i * spacing);
      mesh.userData = { type: def.type, baseY: mesh.position.y };
      this.scene.add(mesh);
      this.totems.push(mesh);
    });

    // Totem click detection
    this._totemRaycaster = new THREE.Raycaster();
    this._totemPointer = new THREE.Vector2();
    this._onTotemClick = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this._totemPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this._totemPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this._totemRaycaster.setFromCamera(this._totemPointer, this.driftCam.camera);

      const hits = this._totemRaycaster.intersectObjects(this.totems);
      if (hits.length > 0) {
        const type = hits[0].object.userData.type;
        AudioEngine.switchNoise(type);
        GlassOverlay.syncState();
        this._updateActiveTotems();
      }
    };
    this.renderer.domElement.addEventListener('click', this._onTotemClick);
  }

  _updateActiveTotems() {
    const current = AudioEngine.currentNoise();
    this.totems.forEach(t => {
      const isActive = t.userData.type === current;
      t.material.emissiveIntensity = isActive ? 1.2 : 0.3;
    });
  }

  update(dt) {
    this.driftCam.update(dt);

    // Map lantern position to audio
    const norm = this.lantern.getNormalizedXY(this.lanternBounds);
    AudioEngine.setFrequency(10 + norm.x * 21990);
    AudioEngine.setResonance(norm.x * 20);
    AudioEngine.setVolume(norm.y);

    this.lantern.update(norm.y);

    // Update frequency columns
    const spectrum = AudioEngine.getSpectrum();
    const step = Math.floor(spectrum.length / this.columns.length);
    for (let i = 0; i < this.columns.length; i++) {
      const val = spectrum[i * step] || 0;
      const targetH = 0.1 + val * 6;
      const col = this.columns[i];
      col.scale.y += (targetH - col.scale.y) * 0.15;
      col.position.y = col.scale.y * 0.5;
      col.material.emissiveIntensity = 0.3 + val * 1.5;
    }

    // Animate totems (gentle bob)
    const current = AudioEngine.currentNoise();
    this.totems.forEach(t => {
      const isActive = t.userData.type === current;
      const targetY = t.userData.baseY + (isActive ? 0.3 : 0);
      t.position.y += (targetY - t.position.y) * 0.05;
      t.rotation.y += dt * (isActive ? 0.5 : 0.1);
    });
  }

  render(renderer) {
    renderer.render(this.scene, this.driftCam.camera);
  }

  resize() {
    this.driftCam.resize();
  }

  dispose() {
    this.lantern.dispose();
    this.renderer.domElement.removeEventListener('click', this._onTotemClick);
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
```

- [ ] **Step 2: Add script tag to `index.html`**

Add after all shared scripts, before `sketch.js`:

```html
<script src="js/scenes/lake.js"></script>
```

- [ ] **Step 3: Verify Lake scene**

Run: `bun run dev`
Open: `http://100.127.108.14:3000`
Click the view toggle button. Verify:
- Firewatch sunset sky renders
- Dark water plane visible
- Mountain silhouettes in background
- Glowing lantern orb visible and draggable
- Frequency columns pulse with audio when playing
- Totems visible and clickable
- Glass overlay appears at bottom
- Camera drifts slowly

- [ ] **Step 4: Commit**

```bash
git add js/scenes/lake.js index.html
git commit -m "feat: add Lake scene with water, terrain, columns, and totems"
```

---

### Task 8: The Garden Scene

**Files:**
- Create: `js/scenes/garden.js`
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Create `js/scenes/garden.js`**

```js
class GardenScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.fog.getHex(), 0.015);

    this.driftCam = new DriftCamera();
    this.driftCam.radius = 10;
    this.driftCam.height = 3;
    this.driftCam.target.set(0, 1.5, 0);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0x887766, 0.5));
    const sun = new THREE.DirectionalLight(0xFFCC88, 0.7);
    sun.position.set(5, 8, -5);
    this.scene.add(sun);

    // Sky
    createSkyDome(this.scene);

    // Ground
    this._createGround();

    // Planters and vegetation
    this._createPlanters();

    // Wire posts and wire
    this._createWire();

    // Lantern on wire
    this.lantern = new Lantern(this.scene, renderer, this.driftCam.camera);
    this.lantern.mesh.position.set(0, 3, 0);
    const wireMinX = -4;
    const wireMaxX = 4;
    this.lantern.constraintFn = (pos) => {
      const x = THREE.MathUtils.clamp(pos.x, wireMinX, wireMaxX);
      const y = THREE.MathUtils.clamp(pos.y, 1.5, 4.5);
      return new THREE.Vector3(x, y, 0);
    };
    this.lanternBounds = { minX: wireMinX, maxX: wireMaxX, minY: 1.5, maxY: 4.5 };

    this.lantern.onDragStart = () => this.driftCam.pause();
    this.lantern.onDragEnd = () => this.driftCam.resume();

    // Aurora ribbons
    this.auroraRibbons = [];
    this._createAurora();

    // Totems
    this.totems = [];
    this._createTotems();
  }

  _createGround() {
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#8B7355',
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);

    // Stone path
    const pathGeo = new THREE.PlaneGeometry(1.5, 12);
    const pathMat = new THREE.MeshStandardMaterial({ color: '#A09080', roughness: 1.0 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.01, 0);
    this.scene.add(path);
  }

  _createPlanters() {
    const planterPositions = [
      { x: -3, z: -2 }, { x: 3, z: -2 },
      { x: -3, z: 2 },  { x: 3, z: 2 },
    ];

    planterPositions.forEach(pos => {
      // Box planter
      const planterGeo = new THREE.BoxGeometry(1.5, 0.6, 1.5);
      const planterMat = new THREE.MeshStandardMaterial({ color: '#B5651D', roughness: 0.8 });
      const planter = new THREE.Mesh(planterGeo, planterMat);
      planter.position.set(pos.x, 0.3, pos.z);
      this.scene.add(planter);

      // Simple tree/bush as cone
      const treeGeo = new THREE.ConeGeometry(0.6, 1.5, 6);
      const treeMat = new THREE.MeshStandardMaterial({
        color: '#5A7247',
        flatShading: true,
      });
      const tree = new THREE.Mesh(treeGeo, treeMat);
      tree.position.set(pos.x, 1.35, pos.z);
      this.scene.add(tree);
    });
  }

  _createWire() {
    const postGeo = new THREE.CylinderGeometry(0.05, 0.07, 4, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: '#6B4226' });

    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-4.5, 2, 0);
    this.scene.add(postL);

    const postR = new THREE.Mesh(postGeo, postMat);
    postR.position.set(4.5, 2, 0);
    this.scene.add(postR);

    // Catenary wire curve
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 3.8, 0),
      new THREE.Vector3(-2, 3.2, 0),
      new THREE.Vector3(0, 3.0, 0),
      new THREE.Vector3(2, 3.2, 0),
      new THREE.Vector3(4.5, 3.8, 0),
    ]);
    const wireGeo = new THREE.TubeGeometry(curve, 32, 0.015, 8, false);
    const wireMat = new THREE.MeshStandardMaterial({ color: '#444' });
    this.wire = new THREE.Mesh(wireGeo, wireMat);
    this.scene.add(this.wire);
  }

  _createAurora() {
    const bandCount = 8;
    const bandWidth = 40;

    for (let i = 0; i < bandCount; i++) {
      const t = i / (bandCount - 1);
      const color = PALETTE.freqColor(t);
      const y = 15 + t * 20;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-bandWidth / 2, y, -20),
        new THREE.Vector3(-bandWidth / 4, y + 1, -22),
        new THREE.Vector3(0, y - 0.5, -21),
        new THREE.Vector3(bandWidth / 4, y + 0.8, -20),
        new THREE.Vector3(bandWidth / 2, y, -22),
      ]);

      const geo = new THREE.TubeGeometry(curve, 32, 0.5, 4, false);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
      });
      const ribbon = new THREE.Mesh(geo, mat);
      ribbon.userData = { baseY: y, index: i, baseCurve: curve.points.map(p => p.clone()) };
      this.scene.add(ribbon);
      this.auroraRibbons.push(ribbon);
    }
  }

  _createTotems() {
    const totemDefs = [
      { type: 'white',  color: '#DDDDDD', geo: new THREE.SphereGeometry(0.2, 8, 8) },
      { type: 'pink',   color: '#E84B8A', geo: new THREE.ConeGeometry(0.2, 0.3, 6) },
      { type: 'brown',  color: '#E8632B', geo: new THREE.BoxGeometry(0.3, 0.3, 0.3) },
      { type: 'vinyl',  color: '#333333', geo: new THREE.CylinderGeometry(0.25, 0.25, 0.04, 16) },
    ];

    const baseX = -5;
    const baseZ = 0;
    const spacing = 0.8;

    totemDefs.forEach((def, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(def.geo, mat);
      mesh.position.set(baseX, 0.8, baseZ + i * spacing);
      mesh.userData = { type: def.type, baseY: 0.8 };
      this.scene.add(mesh);
      this.totems.push(mesh);
    });

    this._totemRaycaster = new THREE.Raycaster();
    this._totemPointer = new THREE.Vector2();
    this._onTotemClick = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this._totemPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this._totemPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this._totemRaycaster.setFromCamera(this._totemPointer, this.driftCam.camera);

      const hits = this._totemRaycaster.intersectObjects(this.totems);
      if (hits.length > 0) {
        const type = hits[0].object.userData.type;
        AudioEngine.switchNoise(type);
        GlassOverlay.syncState();
        this._updateActiveTotems();
      }
    };
    this.renderer.domElement.addEventListener('click', this._onTotemClick);
  }

  _updateActiveTotems() {
    const current = AudioEngine.currentNoise();
    this.totems.forEach(t => {
      t.material.emissiveIntensity = t.userData.type === current ? 1.2 : 0.3;
    });
  }

  update(dt) {
    this.driftCam.update(dt);

    const norm = this.lantern.getNormalizedXY(this.lanternBounds);
    AudioEngine.setFrequency(10 + norm.x * 21990);
    AudioEngine.setResonance(norm.x * 20);
    AudioEngine.setVolume(norm.y);

    this.lantern.update(norm.y);

    // Animate aurora ribbons
    const spectrum = AudioEngine.getSpectrum();
    const time = performance.now() * 0.001;
    const step = Math.floor(spectrum.length / this.auroraRibbons.length);

    this.auroraRibbons.forEach((ribbon, i) => {
      const val = spectrum[i * step] || 0;
      ribbon.material.opacity = 0.08 + val * 0.6;
      ribbon.position.y = Math.sin(time * 0.3 + i) * 0.5;
      const scale = 1 + val * 0.5;
      ribbon.scale.set(1, scale, 1);
    });

    // Animate totems
    const current = AudioEngine.currentNoise();
    this.totems.forEach(t => {
      const isActive = t.userData.type === current;
      const targetY = t.userData.baseY + (isActive ? 0.25 : 0);
      t.position.y += (targetY - t.position.y) * 0.05;
      t.rotation.y += dt * (isActive ? 0.5 : 0.1);
    });
  }

  render(renderer) {
    renderer.render(this.scene, this.driftCam.camera);
  }

  resize() {
    this.driftCam.resize();
  }

  dispose() {
    this.lantern.dispose();
    this.renderer.domElement.removeEventListener('click', this._onTotemClick);
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
```

- [ ] **Step 2: Add script tag to `index.html`**

```html
<script src="js/scenes/garden.js"></script>
```

- [ ] **Step 3: Verify Garden scene**

Click view toggle twice (2D -> Lake -> Garden). Verify:
- Firewatch sunset sky
- Brown ground with stone path
- Planters with cone trees
- Wire strung between two posts
- Lantern on wire, draggable left/right
- Aurora ribbons in the sky pulsing with audio
- Totems on left side, clickable
- Glass overlay functional

- [ ] **Step 4: Commit**

```bash
git add js/scenes/garden.js index.html
git commit -m "feat: add Garden scene with planters, wire, aurora, and totems"
```

---

### Task 9: Final Script Order + Build + Polish

**Files:**
- Modify: `index.html` (finalize script order)
- Modify: `js/sketch.js` (minor tweaks)
- Modify: `package.json` (update build to copy scenes)

- [ ] **Step 1: Finalize `index.html` script order**

The full script section should be:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.sound@0.3.0/dist/p5.sound.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js"></script>
<script src="js/icons.js"></script>
<script src="js/classes.js"></script>
<script src="js/audio-engine.js"></script>
<script src="js/scenes/shared/palette.js"></script>
<script src="js/scenes/shared/sky.js"></script>
<script src="js/scenes/shared/camera.js"></script>
<script src="js/scenes/shared/lantern.js"></script>
<script src="js/scenes/shared/controls.js"></script>
<script src="js/scenes/lake.js"></script>
<script src="js/scenes/garden.js"></script>
<script src="js/view-manager.js"></script>
<script src="js/sketch.js"></script>
```

- [ ] **Step 2: Update build script in `package.json`**

Change the `build:js` script to recursively copy the scenes directory:

```json
"build:js": "cp -r js docs/",
```

- [ ] **Step 3: Full build and verify**

```bash
bun run build
```

Open: `http://100.127.108.14:3000`
Test the full flow:
- 2D view loads and works (play, noise types, drag marker)
- Click toggle -> Lake scene renders and is interactive
- Click toggle -> Garden scene renders and is interactive
- Click toggle -> Back to 2D, everything still works
- Glass overlay buttons work in 3D modes
- Totems in both scenes switch noise types
- Camera drifts in both scenes, pauses during lantern drag
- Window resize works in all views
- Test on mobile viewport (responsive)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: finalize 3D noise world - script order, build, polish"
```

- [ ] **Step 5: Push**

```bash
git push origin master
```

---

## Deferred to v2

- **Cinematic transitions** (`transition.js`): The spec describes a zoom-through-portal effect when switching views. For v1, ViewManager does instant show/hide. The cinematic transition is a polish item.
- **Dynamic wire sag**: The Garden wire is a static catenary. Making it respond to lantern position is a v2 enhancement.
- **Light trail particles**: The lantern spec mentions a fading trail. Deferred to v2 particle system pass.

---

## Task Summary

| # | Task | Key Deliverable |
|---|------|----------------|
| 1 | Extract AudioEngine | Shared audio API, refactored sketch.js |
| 2 | Palette + Sky Shader | Firewatch colors, gradient sky dome |
| 3 | Ambient Drift Camera | Orbiting camera controller |
| 4 | Draggable Lantern | Glowing orb with raycasting drag |
| 5 | Glass Overlay + Toggle | HTML/CSS overlay, view cycling button |
| 6 | View Manager | Scene switching orchestrator |
| 7 | Lake Scene | Water, terrain, columns, totems |
| 8 | Garden Scene | Planters, wire, aurora ribbons, totems |
| 9 | Final Integration | Script order, build, full verification |
