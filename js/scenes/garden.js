class GardenScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.fog.getHex(), 0.015);

    this.driftCam = new DriftCamera();
    this.driftCam.radius = 10;
    this.driftCam.height = 3;
    this.driftCam.target.set(0, 1.5, 0);

    this.scene.add(new THREE.AmbientLight(0x887766, 0.5));
    const sun = new THREE.DirectionalLight(0xFFCC88, 0.7);
    sun.position.set(5, 8, -5);
    this.scene.add(sun);

    createSkyDome(this.scene);

    this._createGround();
    this._createPlanters();
    this._createWire();

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

    this.auroraRibbons = [];
    this._createAurora();

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
      const planterGeo = new THREE.BoxGeometry(1.5, 0.6, 1.5);
      const planterMat = new THREE.MeshStandardMaterial({ color: '#B5651D', roughness: 0.8 });
      const planter = new THREE.Mesh(planterGeo, planterMat);
      planter.position.set(pos.x, 0.3, pos.z);
      this.scene.add(planter);

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
