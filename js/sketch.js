/******************************************************************************/
/**   Name:       p5 White Noise App
/**   Version:    1.0
/**   Author:     Josh Newton
/**   Descript:   A graphical rewrite of my original White Noise App written
/**               on the P5.js framework.
/**   Notes:      Currently working on only updating certain axises based on
/**               new atributes of the Marker class.
/******************************************************************************/

var noiseFFT, whiteNoise, myFilter, filterFreq, filterWidth, currentNoise, vinyl, ambiance;
var noiseDivs = [];
var canv;

function preload() {
    ambiance = loadSound('audio/DPadBase.mp3');
    vinyl = loadSound('audio/Vinyl.mp3');
}

function setup() {
    // Basic Canbas Setup.
    canv = createCanvas(windowWidth, windowHeight);
    canv.style('max-height: 900px;');
    noStroke();

    // Oscilator and Filter Setup and Init.
    myFilter = new p5.LowPass();
    whiteNoise = new p5.Noise();
    currentNoise = 'white';

    whiteNoise.disconnect(); // Disconnect soundfile from master output...
    myFilter.process(whiteNoise); // ...and connect to filter so we'll only hear LowPass.
    myFilter.process(vinyl);
    whiteNoise.start();

    noiseFFT = new p5.FFT();
    noiseFFT.setInput(myFilter);

    // White Noise Setup.
    noiseDivs[0] = new NoiseBox();
    noiseDivs[0].container.size(width, height*.6);
    noiseDivs[0].container.position(0, 0);
    noiseDivs[0].container.id("noise-area");

    noiseDivs[0].marker.init(noiseDivs[0].container.width*.075, noiseDivs[0].container.height*.85, true, true, width*.045);

    noiseDivs[0].container.touchStarted(function() {noiseDivs[0].hasAction=true;});
    noiseDivs[0].container.touchEnded(function() {noiseDivs[0].hasAction=false;});

    // Ambiant Music Setup.
    noiseDivs[1] = new NoiseBox();
    noiseDivs[1].container.size(width, height*.1);
    noiseDivs[1].container.position(0, height*.9);
    noiseDivs[1].container.id("ambiance-volume");

    noiseDivs[1].marker.init(noiseDivs[1].container.width*.85, noiseDivs[1].container.position().y+noiseDivs[1].container.height*.5, true, false, width*.045);

    noiseDivs[1].container.touchStarted(function() {noiseDivs[1].hasAction=true;});
    noiseDivs[1].container.touchEnded(function() {noiseDivs[1].hasAction=false;});

    ambiance.setVolume(map(noiseDivs[1].marker.x, 0, noiseDivs[1].container.width, 0, 1));
    ambiance.play();

    // Start Stop
    noiseDivs[2] = new NoiseBox();
    noiseDivs[2].container.size(width/5, height*.3);
    noiseDivs[2].container.position(0, height*.6);
    noiseDivs[2].container.id("all-stop");

    noiseDivs[2].hasMarker = false;

    noiseDivs[2].container.mouseClicked(function() {
        if(!noiseDivs[2].hasAction) {
            ambiance.stop();
            if(currentNoise != 'vinyl') {
                whiteNoise.stop();
            }
            else {
                vinyl.stop();
            }
        }
        else {
            ambiance.play();

            if(currentNoise != 'vinyl') {
                whiteNoise.start();
            }
            else {
                vinyl.play();
            }
        }

        noiseDivs[2].toggleAction();
    });

    // Pink Noise
    noiseDivs[3] = new NoiseBox();
    noiseDivs[3].container.size(width/5, height*.3);
    noiseDivs[3].container.position(width/5*2, height*.6);
    noiseDivs[3].container.id("pink-noise");

    noiseDivs[3].hasMarker = false;

    noiseDivs[3].container.mousePressed(function() {
        whiteNoise.setType('pink');

        if(!noiseDivs[2].hasAction) {
            whiteNoise.start();

            if (currentNoise == 'vinyl') {
                vinyl.stop();
            }
        }

        currentNoise = 'pink';
    });

    // Brown Noise
    noiseDivs[4] = new NoiseBox();
    noiseDivs[4].container.size(width/5, height*.3);
    noiseDivs[4].container.position((width/5)*1, height*.6);
    noiseDivs[4].container.id("brown-noise");

    noiseDivs[4].hasMarker = false;

    noiseDivs[4].container.mousePressed(function() {
        whiteNoise.setType('brown');

        if(!noiseDivs[2].hasAction) {
            whiteNoise.start();

            if (currentNoise == 'vinyl') {
                vinyl.stop();
            }
        }

        currentNoise = 'brown';
    });

    // White Noise
    noiseDivs[5] = new NoiseBox();
    noiseDivs[5].container.size(width/5, height*.3);
    noiseDivs[5].container.position((width/5)*3, height*.6);
    noiseDivs[5].container.id("white-noise");

    noiseDivs[5].hasMarker = false;

    noiseDivs[5].container.mousePressed(function() {
        whiteNoise.setType('white');

        if(!noiseDivs[2].hasAction) {
            whiteNoise.start();

            if (currentNoise == 'vinyl') {
                vinyl.stop();
            }
        }

        currentNoise = 'white';
    });

    // Vinyl
    noiseDivs[6] = new NoiseBox();
    noiseDivs[6].container.size(width/5, height*.3);
    noiseDivs[6].container.position((width/5)*4, height*.6);
    noiseDivs[6].container.id("vinyl-noise");

    noiseDivs[6].hasMarker = false;

    noiseDivs[6].container.mousePressed(function() {
        if(!noiseDivs[2].hasAction) {
            whiteNoise.stop();
            vinyl.play();
            vinyl.loop(35);
        }

        currentNoise = 'vinyl';
    });
}

function draw() {
    background(106);

    // Map mouseX to a lowpass freq from the FFT spectrum range: 10Hz - 22050Hz
    filterFreq = map(noiseDivs[0].marker.x, noiseDivs[0].container.x+(noiseDivs[0].marker.diameter/2), (noiseDivs[0].container.x+noiseDivs[0].container.width)-(noiseDivs[0].marker.diameter/2), 10, 22000);
    // Map mouseY to resonance/width
    //filterRes = map(noiseDivs[0].marker.y, noiseDivs[0].container.y, noiseDivs[0].container.y+noiseDivs[0].container.height, 15, 5);
    // set filter parameters
    myFilter.set(filterFreq, filterWidth);
    // set noise volume based on mouseY position
    whiteNoise.amp(map(noiseDivs[0].marker.y, noiseDivs[0].container.y+(noiseDivs[0].marker.diameter/2), (noiseDivs[0].container.y+noiseDivs[0].container.height)-(noiseDivs[0].marker.diameter/2), 1, 0));
    vinyl.amp(map(noiseDivs[0].marker.y, noiseDivs[0].container.y+(noiseDivs[0].marker.diameter/2), (noiseDivs[0].container.y+noiseDivs[0].container.height)-(noiseDivs[0].marker.diameter/2), 1, 0));

    //masterVolume(map(noiseDivs[1].marker.x, 0, noiseDivs[1].container.width, 0, 1));
    ambiance.setVolume(map(noiseDivs[1].marker.x, 0, noiseDivs[1].container.width, 0, 1));
    // Draw every value in the FFT spectrum analysis where
    // x = lowest (10Hz) to highest (22050Hz) frequencies,
    // h = energy / amplitude at that frequency
    var spectrum = noiseFFT.analyze();

    fill(106, 156, 154, 70);
    for (var i = 0; i< spectrum.length; i++){
        var x = map(i, 0, spectrum.length, noiseDivs[0].container.x, noiseDivs[0].container.x+noiseDivs[0].container.width);
        var h = -noiseDivs[0].container.height + map(spectrum[i], 0, 255, noiseDivs[0].container.height, noiseDivs[0].container.y);

        rect(x, noiseDivs[0].container.height, noiseDivs[0].container.width/spectrum.length, h) ;
    }

    for (var i = 0; i< noiseDivs.length; i++) {
        //print(noiseDivs[i].hasAction);
        noiseDivs[i].handleAction();
        noiseDivs[i].show(width*.045);
    }
}

function windowResizeD() {
    resizeCanvas(windowWidth, windowWidth);
}
