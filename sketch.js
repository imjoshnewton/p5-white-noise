function Marker(i,e){this.x=i,this.y=e}function NoiseBox(){this.container=createDiv(""),this.hasAction=!1,this.marker=new Marker(0,0)}function setup(){canv=createCanvas(windowWidth,windowHeight),canv.style("max-height: 900px;"),noStroke(),myFilter=new p5.LowPass,whiteNoise=new p5.Noise,whiteNoise.disconnect(),myFilter.process(whiteNoise),whiteNoise.start(),fft=new p5.FFT,fill(50,50,50,25),noiseDivs[0]=new NoiseBox,noiseDivs[0].container.size(width,.6*height),noiseDivs[0].container.position(0,0),noiseDivs[0].marker.update(.5*noiseDivs[0].container.width,.66*noiseDivs[0].container.height),noiseDivs[0].container.touchStarted(function(){noiseDivs[0].hasAction=!0}),noiseDivs[0].container.touchEnded(function(){noiseDivs[0].hasAction=!1}),fill(250,250,250,25),noiseDivs[1]=new NoiseBox,noiseDivs[1].container.size(width,.2*height),noiseDivs[1].container.position(0,.8*height),noiseDivs[1].marker.update(.5*noiseDivs[1].container.width,noiseDivs[1].container.position().y+.5*noiseDivs[1].container.height),noiseDivs[1].container.touchStarted(function(){noiseDivs[1].hasAction=!0}),noiseDivs[1].container.touchEnded(function(){noiseDivs[1].hasAction=!1})}function draw(){background(106),filterFreq=map(noiseDivs[0].marker.x,noiseDivs[0].container.x,noiseDivs[0].container.x+noiseDivs[0].container.width,10,22e3),myFilter.set(filterFreq,filterWidth),whiteNoise.amp(map(noiseDivs[0].marker.y,noiseDivs[0].container.y,noiseDivs[0].container.y+noiseDivs[0].container.height,1,0)),masterVolume(map(noiseDivs[1].marker.x,0,noiseDivs[1].container.width,0,1));var i=fft.analyze();fill(106,143,154,60);for(var e=0;e<i.length;e++){var n=map(e,0,i.length,noiseDivs[0].container.x,noiseDivs[0].container.x+noiseDivs[0].container.width),o=-noiseDivs[0].container.height+map(i[e],0,255,noiseDivs[0].container.height,noiseDivs[0].container.y);rect(n,noiseDivs[0].container.height,noiseDivs[0].container.width/i.length,o)}for(var e=0;e<noiseDivs.length;e++)noiseDivs[e].handleAction(),noiseDivs[e].marker.show(.045*width)}function windowResizeD(){resizeCanvas(windowWidth,windowWidth)}var whiteNoise,fft,myFilter,filterFreq,filterWidth,crickets,vinyl,ambiance,myMouseX,myMouseY,noiseDivs=[],canv;Marker.prototype.update=function(i,e){this.x=i,this.y=e},Marker.prototype.show=function(i){fill(255,255,255,50),ellipse(this.x,this.y,i,i),ellipse(this.x,this.y,.305*i,.305*i)},NoiseBox.prototype.startAction=function(){this.hasAction=!0},NoiseBox.prototype.endAction=function(){this.hasAction=!1},NoiseBox.prototype.handleAction=function(){window.console.log("Handling"),this.hasAction&&(window.console.log("Has Action!"),mouseX>=this.container.x&&mouseX<=this.container.x+this.container.width&&mouseY>=this.container.y&&mouseY<=this.container.y+this.container.height&&this.marker.update(mouseX,mouseY))};