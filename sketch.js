function preload(){ambiance=loadSound("audio/DPadBase.mp3")}function setup(){canv=createCanvas(windowWidth,windowHeight),canv.style("max-height: 900px;"),noStroke(),myFilter=new p5.LowPass,whiteNoise=new p5.Noise,whiteNoise.disconnect(),myFilter.process(whiteNoise),whiteNoise.start(),noiseFFT=new p5.FFT,noiseFFT.setInput(myFilter),noiseDivs[0]=new NoiseBox,noiseDivs[0].container.size(width,.6*height),noiseDivs[0].container.position(0,0),noiseDivs[0].marker.init(.075*noiseDivs[0].container.width,.85*noiseDivs[0].container.height,!0,!0),noiseDivs[0].container.touchStarted(function(){noiseDivs[0].hasAction=!0}),noiseDivs[0].container.touchEnded(function(){noiseDivs[0].hasAction=!1}),noiseDivs[1]=new NoiseBox,noiseDivs[1].container.size(width,.1*height),noiseDivs[1].container.position(0,.9*height),noiseDivs[1].marker.init(.85*noiseDivs[1].container.width,noiseDivs[1].container.position().y+.5*noiseDivs[1].container.height,!0,!1),noiseDivs[1].container.touchStarted(function(){noiseDivs[1].hasAction=!0}),noiseDivs[1].container.touchEnded(function(){noiseDivs[1].hasAction=!1}),ambiance.setVolume(map(noiseDivs[1].marker.x,0,noiseDivs[1].container.width,0,1)),ambiance.play()}function draw(){background(106),filterFreq=map(noiseDivs[0].marker.x,noiseDivs[0].container.x,noiseDivs[0].container.x+noiseDivs[0].container.width,10,22e3),myFilter.set(filterFreq,filterWidth),whiteNoise.amp(map(noiseDivs[0].marker.y,noiseDivs[0].container.y,noiseDivs[0].container.y+noiseDivs[0].container.height,1,0)),ambiance.setVolume(map(noiseDivs[1].marker.x,0,noiseDivs[1].container.width,0,1));var i=noiseFFT.analyze();fill(106,156,154,60);for(var e=0;e<i.length;e++){var n=map(e,0,i.length,noiseDivs[0].container.x,noiseDivs[0].container.x+noiseDivs[0].container.width),o=-noiseDivs[0].container.height+map(i[e],0,255,noiseDivs[0].container.height,noiseDivs[0].container.y);rect(n,noiseDivs[0].container.height,noiseDivs[0].container.width/i.length,o)}for(var e=0;e<noiseDivs.length;e++)noiseDivs[e].handleAction(),noiseDivs[e].marker.show(.045*width)}function windowResizeD(){resizeCanvas(windowWidth,windowWidth)}var noiseFFT,whiteNoise,myFilter,filterFreq,filterWidth,crickets,vinyl,ambiance,myMouseX,myMouseY,noiseDivs=[],canv;