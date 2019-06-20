var noiseFFT,
  whiteNoise,
  myFilter,
  filterFreq,
  filterWidth,
  currentNoise,
  vinyl,
  ambiance,
  noiseDivs = [],
  canv,
  colors = ["#30CCC1", "#709996", "#55FF94", "#FF95BB", "#CC30B5"],
  mDiam = 40,
  played = false;

function preload() {
    // For local testing
    vinyl = loadSound('../audio/Vinyl.mp3',
                      function(){
                        console.log("File loaded.");
                      },
                      function(){
                        console.log("File not loaded by reference, loading by path:" + getURL());
                        vinyl = loadSound(getURL() + "/audio/Vinyl.mp3");
                      });
}

function setup() {
  // Basic Canvas Setup.
  canv = createCanvas(windowWidth, windowHeight);
  noStroke();

  // Oscilator and Filter Setup and Init.
  myFilter = new p5.LowPass();
  whiteNoise = new p5.Noise();
  currentNoise = "white";

  whiteNoise.disconnect(); // Disconnect soundfile from master output...
  vinyl.disconnect();
  myFilter.process(whiteNoise); // ...and connect to filter so we'll only hear LowPass.
  myFilter.process(vinyl);

  noiseFFT = new p5.FFT();
  noiseFFT.setInput(myFilter);

  var minHeight = windowHeight * 0.8 > 450 ? 450 : windowHeight * 0.8 < 345 ? 345 : windowHeight * 0.8,
      minWidth = windowWidth <= 980 ? windowWidth * 0.85 : windowWidth * 0.55 > 750 ? 750 : windowWidth * 0.55;
  /*var minHeight = windowHeight * 0.8 > 450 ? 450 : windowHeight * 0.8 < 345 ? 345 : windowHeight * 0.8,
      minWidth = windowWidth * 0.45;*/

  minWidth = minWidth < 250 ? 250 : minWidth;

  // White Noise Setup.
  noiseDivs[0] = new NoiseBox();
  noiseDivs[0].container.size(minWidth, minHeight);
  noiseDivs[0].container.id("noise-area").parent("area-container");

  var na = noiseDivs[0];

  na.marker.init(
    na.getX() + na.container.width / 8,
    na.getY() + na.container.height / 2,
    true,
    true,
    mDiam
  );

  noiseDivs[0].container.touchStarted(function() {
    noiseDivs[0].hasAction = true;
  });
  noiseDivs[0].container.touchEnded(function() {
    noiseDivs[0].hasAction = false;
  });
  noiseDivs[0].container.mousePressed(function() {
    noiseDivs[0].hasAction = true;
  });
  noiseDivs[0].container.mouseReleased(function() {
    noiseDivs[0].hasAction = false;
  });

  // Start Stop
  noiseDivs[2] = new NoiseBox();
  noiseDivs[2].container
    .id("all-stop")
    .class("noise-button fa fa-play animated tada")
    .parent("button-container");

  if(windowWidth <= 980) {
    noiseDivs[2].container.elt.classList.remove('animated');
    noiseDivs[2].container.elt.classList.remove('tada');
  }

  noiseDivs[2].hasMarker = false;

  noiseDivs[2].container.mouseClicked(function() {
    if(!played) {
      played = true;
      this.elt.classList.remove('animated');
    }

    if (noiseDivs[2].hasAction) {
      this.elt.classList.remove("fa-pause");
      this.elt.classList.add("fa-play");

      if (currentNoise != "vinyl") {
        whiteNoise.stop();
      } else {
        vinyl.stop();
      }
    } else {
      this.elt.classList.remove("fa-play");
      this.elt.classList.add("fa-pause");

      if (currentNoise != "vinyl") {
        whiteNoise.start();
      } else {
        vinyl.play();
      }
    }

    noiseDivs[2].toggleAction();
  });

  // Brown Noise
  noiseDivs[4] = new NoiseBox();
  noiseDivs[4].container
    .id("brown-noise")
    .class("noise-button")
    .parent("button-container");

  noiseDivs[4].hasMarker = false;

  noiseDivs[4].container.mousePressed(function() {
    whiteNoise.setType("brown");

    if (noiseDivs[2].hasAction) {
      whiteNoise.start();

      if (currentNoise == "vinyl") {
        vinyl.stop();
      }
    }

    currentNoise = "brown";
  });

  // Pink Noise
  noiseDivs[3] = new NoiseBox();
  noiseDivs[3].container
    .id("pink-noise")
    .class("noise-button")
    .parent("button-container");

  noiseDivs[3].hasMarker = false;

  noiseDivs[3].container.mousePressed(function() {
    whiteNoise.setType("pink");

    if (noiseDivs[2].hasAction) {
      whiteNoise.start();

      if (currentNoise == "vinyl") {
        vinyl.stop();
      }
    }

    currentNoise = "pink";
  });

  // White Noise
  noiseDivs[5] = new NoiseBox();
  noiseDivs[5].container
    .id("white-noise")
    .class("noise-button")
    .parent("button-container");

  noiseDivs[5].hasMarker = false;

  noiseDivs[5].container.mousePressed(function() {
    whiteNoise.setType("white");

    if (noiseDivs[2].hasAction) {
      whiteNoise.start();

      if (currentNoise == "vinyl") {
        vinyl.stop();
      }
    }

    currentNoise = "white";
  });

  // Vinyl
  noiseDivs[6] = new NoiseBox();
  noiseDivs[6].container
    .id("vinyl-noise")
    .class("noise-button")
    .parent("button-container");

  noiseDivs[6].hasMarker = false;

  noiseDivs[6].container.mousePressed(function() {
    if (noiseDivs[2].hasAction) {
      whiteNoise.stop();
      vinyl.play();
      vinyl.loop(35);
    }

    currentNoise = "vinyl";
  });
}

function draw() {
  background("#ddd");
  var na = noiseDivs[0];

  // Map mouseX to a lowpass freq from the FFT spectrum range: 10Hz - 22050Hz
  filterFreq = map(
    noiseDivs[0].marker.x,
    Math.floor(noiseDivs[0].getX() + noiseDivs[0].marker.diameter / 2),
    noiseDivs[0].getX() +
      noiseDivs[0].container.width -
      noiseDivs[0].marker.diameter / 2,
    10,
    22000
  );
  // set filter parameters
  myFilter.set(filterFreq, filterWidth);
  // set noise volume based on mouseY position
  whiteNoise.amp(
    map(
      noiseDivs[0].marker.y,
      Math.floor(noiseDivs[0].getY() + noiseDivs[0].marker.diameter / 2),
      noiseDivs[0].getY() +
        noiseDivs[0].container.height -
        noiseDivs[0].marker.diameter / 2,
      1,
      0
    )
  );
  vinyl.amp(
    map(
      noiseDivs[0].marker.y,
      Math.floor(noiseDivs[0].getY() + noiseDivs[0].marker.diameter / 2),
      noiseDivs[0].getY() +
        noiseDivs[0].container.height -
        noiseDivs[0].marker.diameter / 2,
      1,
      0
    )
  );

  // Draw every value in the FFT spectrum analysis where
  // x = lowest (10Hz) to highest (22050Hz) frequencies,
  // h = energy / amplitude at that frequency
  var spectrum = noiseFFT.analyze();

  fill("rgba(106, 106, 106, 0.75)");
  rect(na.getX(), na.getY(), na.container.width, na.container.height);

  fill(colors[3]);
  for (var i = 0; i < spectrum.length; i++) {
    var x = map(
      i,
      0,
      spectrum.length,
      noiseDivs[0].getX(),
      noiseDivs[0].getX() + noiseDivs[0].container.width
    );
    var h =
      -noiseDivs[0].container.height +
      map(
        spectrum[i],
        0,
        255,
        noiseDivs[0].container.height,
        noiseDivs[0].getY() - na.container.height * .062
      );

    rect(
      x,
      noiseDivs[0].container.height + noiseDivs[0].getY(),
      noiseDivs[0].container.width / spectrum.length,
      h
    );
  }

  for (var i = 0; i < noiseDivs.length; i++) {
    if (i !== 1) {
      noiseDivs[i].handleAction();
      noiseDivs[i].show(35);
    }
  }
}

function windowResized() {
  var na = noiseDivs[0];

  resizeCanvas(windowWidth, windowHeight);

  background("#ddd");

  minHeight = windowHeight * 0.8 > 450 ? 450 : windowHeight * 0.8 < 345 ? 345 : windowHeight * 0.8;
  minWidth = windowWidth <= 980 ? windowWidth * 0.85 : windowWidth * 0.55 > 750 ? 750 : windowWidth * 0.55;

  minWidth = minWidth < 250 ? 250 : minWidth;

  noiseDivs[0].container.size(minWidth, minHeight);

  na.marker.update(
    na.getX() + na.container.width / 8,
    na.getY() + na.container.height / 2
  );
}
