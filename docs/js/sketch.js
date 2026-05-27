let noiseFFT, whiteNoise, myFilter, vinyl;
let noiseArea, playBtn, brownBtn, pinkBtn, whiteBtn, vinylBtn;
let currentNoise = 'white';
let playing = false;
let hasPlayed = false;

const colors = ['#30CCC1', '#709996', '#55FF94', '#FF95BB', '#CC30B5'];
const MARKER_SIZE = 35;

async function setup() {
  vinyl = await loadSound('./audio/Vinyl.mp3');
  createCanvas(windowWidth, windowHeight);
  noStroke();

  myFilter = new p5.LowPass();
  whiteNoise = new p5.Noise('white');

  whiteNoise.disconnect();
  vinyl.disconnect();
  whiteNoise.connect(myFilter);
  vinyl.connect(myFilter);

  noiseFFT = new p5.FFT();
  myFilter.connect(noiseFFT);

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
  noiseArea.marker.init(
    b.x + b.width / 8,
    b.y + b.height / 2,
    true, true, 40
  );

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
    if (!hasPlayed) {
      hasPlayed = true;
      playEl.classList.remove('animated');
    }

    if (playing) {
      playEl.classList.remove('is-playing');
      playEl.classList.add('is-paused');
      playEl.innerHTML = ICONS.play;
      if (currentNoise !== 'vinyl') {
        whiteNoise.stop();
      } else {
        vinyl.stop();
      }
    } else {
      playEl.classList.remove('is-paused');
      playEl.classList.add('is-playing');
      playEl.innerHTML = ICONS.pause;
      if (currentNoise !== 'vinyl') {
        whiteNoise.start();
      } else {
        vinyl.play();
      }
    }

    playing = !playing;
  });

  brownBtn = createNoiseButton('brown-noise', 'noise-button', ICONS.waveform('#709996'));
  brownBtn.container.elt.addEventListener('click', function () {
    switchNoise('brown');
  });

  pinkBtn = createNoiseButton('pink-noise', 'noise-button', ICONS.waveform('#CC30B5'));
  pinkBtn.container.elt.addEventListener('click', function () {
    switchNoise('pink');
  });

  whiteBtn = createNoiseButton('white-noise', 'noise-button', ICONS.waveform('#333'));
  whiteBtn.container.elt.addEventListener('click', function () {
    switchNoise('white');
  });

  vinylBtn = createNoiseButton('vinyl-noise', 'noise-button', ICONS.vinyl);
  vinylBtn.container.elt.addEventListener('click', function () {
    if (playing) {
      whiteNoise.stop();
      vinyl.play();
      vinyl.loop(35);
    }
    currentNoise = 'vinyl';
  });
}

function createNoiseButton(id, className, iconHtml) {
  const box = new NoiseBox();
  box.container
    .id(id)
    .class(className)
    .parent('button-container');
  box.container.elt.innerHTML = iconHtml;
  box.hasMarker = false;
  return box;
}

function switchNoise(type) {
  whiteNoise.type(type);
  if (playing) {
    whiteNoise.start();
    if (currentNoise === 'vinyl') {
      vinyl.stop();
    }
  }
  currentNoise = type;
}

function draw() {
  background('#ddd');

  const b = noiseArea.bounds;
  const r = noiseArea.marker.radius;

  const filterFreq = map(noiseArea.marker.x, b.x + r, b.x + b.width - r, 10, 22000);
  const filterRes = map(noiseArea.marker.x, b.x + r, b.x + b.width - r, 0, 20);
  myFilter.freq(filterFreq);
  myFilter.res(filterRes);

  const vol = map(noiseArea.marker.y, b.y + r, b.y + b.height - r, 1, 0);
  whiteNoise.amp(vol);
  vinyl.amp(vol);

  const spectrum = noiseFFT.analyze();

  fill('rgba(106, 106, 106, 0.75)');
  rect(b.x, b.y, b.width, b.height);

  fill(colors[3]);
  for (let i = 0; i < spectrum.length; i++) {
    const x = map(i, 0, spectrum.length, b.x, b.x + b.width);
    let val;
    if (spectrum[i] < 0) {
      val = constrain(map(spectrum[i], -100, 0, 0, 1), 0, 1);
    } else if (spectrum[i] > 1) {
      val = spectrum[i] / 255;
    } else {
      val = spectrum[i];
    }
    val = constrain(pow(val * 20, 0.4), 0, 1);
    const barH = val * b.height;
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
