var whiteNoise;
var fft;
var myFilter, filterFreq, filterWidth, crickets, vinyl, ambiance;
var myMouseX, myMouseY;
var noiseContainer, containerAction;
var canv;

function setup() {
  canv = createCanvas(710, 256);
  noStroke();

  myFilter = new p5.LowPass();

  whiteNoise = new p5.Noise();

  whiteNoise.disconnect(); // Disconnect soundfile from master output...
  myFilter.process(whiteNoise); // ...and connect to filter so we'll only hear BandPass.
  whiteNoise.start();

  fft = new p5.FFT();
  
  fill(50,50,50,25);
  noiseContainer = createDiv('');
  noiseContainer.size(width*.8,height);
  noiseContainer.position(width*.197,0);
  
  myMouseX = width*.5;
  myMouseY = height*.66;
  containerAction = false;  
  
  noiseContainer.touchStarted(function() {containerAction = true;});
  noiseContainer.touchEnded(function() {containerAction = false;});
}

function draw() {
  background(106, 143, 154);
  
  // Map mouseX to a bandpass freq from the FFT spectrum range: 10Hz - 22050Hz
  filterFreq = map(myMouseX, noiseContainer.x, noiseContainer.x+noiseContainer.width, 10, 22000);
  // Map mouseY to resonance/width
  filterRes = map(myMouseY, noiseContainer.y, noiseContainer.y+noiseContainer.height, 15, 5);
  // set filter parameters
  myFilter.set(filterFreq, filterWidth);
  // set noise volume based on mouseY position
  whiteNoise.amp(map(myMouseY, noiseContainer.y, noiseContainer.y+noiseContainer.height, 1, 0));
  
  fill(255,255,255,50);
  
  ellipse(myMouseX, myMouseY, width*.045, width*.045);
  ellipse(myMouseX, myMouseY, width*.0137, width*.0137);
  
  // Draw every value in the FFT spectrum analysis where
  // x = lowest (10Hz) to highest (22050Hz) frequencies,
  // h = energy / amplitude at that frequency
  var spectrum = fft.analyze();
  
  fill(161, 161, 161, 60);
  
  for (var i = 0; i< spectrum.length; i++){
    var x = map(i, 0, spectrum.length, noiseContainer.x, noiseContainer.x+noiseContainer.width);
    var h = -noiseContainer.height + map(spectrum[i], 0, 255, noiseContainer.height, noiseContainer.y);
    
    rect(x, noiseContainer.height, noiseContainer.width/spectrum.length, h) ;
  }
  
  handleAction();
}

function handleAction() {
  print(mouseX + " " + mouseY);
  
  if(containerAction){
    if(mouseX >= noiseContainer.x && mouseX <= noiseContainer.x+noiseContainer.width && mouseY >= noiseContainer.y && mouseY <= noiseContainer.y+noiseContainer.height) {
      myMouseX = mouseX;
      myMouseY = mouseY;
    }
  }
}
