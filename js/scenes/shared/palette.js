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
