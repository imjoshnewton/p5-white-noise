class LakeScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.fog.getHex(), 0.02);

    this.driftCam = new DriftCamera();
    this.driftCam.radius = 14;
    this.driftCam.height = 3.5;
    this.driftCam.target.set(0, 1, 0);

    this.scene.add(new THREE.AmbientLight(0x665544, 0.4));

    const sun = new THREE.DirectionalLight(0xFFAA55, 0.6);
    sun.position.set(-10, 5, -10);
    this.scene.add(sun);

    createSkyDome(this.scene);

    this._createWater();
    this._createTerrain();

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

    this.columns = [];
    this._createColumns();

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
    const layers = [
      { z: -40, height: 12, color: '#3A1F3A', y: 0 },
      { z: -30, height: 9,  color: '#5A2D4A', y: 0 },
      { z: -22, height: 6,  color: '#7A3D5A', y: 0 },
    ];

    layers.forEach(layer => {
      const shape = new THREE.Shape();
      shape.moveTo(-60, 0);
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

    const norm = this.lantern.getNormalizedXY(this.lanternBounds);
    AudioEngine.setFrequency(10 + norm.x * 21990);
    AudioEngine.setResonance(norm.x * 20);
    AudioEngine.setVolume(norm.y);

    this.lantern.update(norm.y);

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
