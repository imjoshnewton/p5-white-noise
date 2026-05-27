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
  ViewManager.init();
  GlassOverlay.init();
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
  ViewManager.resize();
}
