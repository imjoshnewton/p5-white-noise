class Lantern {
  constructor(scene, renderer, camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.dragging = false;
    this.onDragStart = null;
    this.onDragEnd = null;
    this.constraintFn = null;

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: PALETTE.lanternGlow,
        emissive: PALETTE.lanternGlow,
        emissiveIntensity: 2,
      })
    );
    this.mesh.position.set(0, 2, 0);
    scene.add(this.mesh);

    this.light = new THREE.PointLight(
      PALETTE.lanternGlow.getHex(), 3, 30
    );
    this.mesh.add(this.light);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup', this._onPointerUp);
  }

  get position() { return this.mesh.position; }

  getNormalizedXY(bounds) {
    const nx = (this.mesh.position.x - bounds.minX) / (bounds.maxX - bounds.minX);
    const ny = (this.mesh.position.y - bounds.minY) / (bounds.maxY - bounds.minY);
    return {
      x: Math.max(0, Math.min(1, nx)),
      y: Math.max(0, Math.min(1, ny)),
    };
  }

  _updatePointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _onPointerDown(event) {
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hits = this.raycaster.intersectObject(this.mesh);
    if (hits.length > 0) {
      this.dragging = true;
      this.dragPlane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()).negate(),
        this.mesh.position
      );
      if (this.onDragStart) this.onDragStart();
    }
  }

  _onPointerMove(event) {
    if (!this.dragging) return;
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

    if (this.constraintFn) {
      const constrained = this.constraintFn(intersection);
      this.mesh.position.copy(constrained);
    } else {
      this.mesh.position.copy(intersection);
    }
  }

  _onPointerUp() {
    if (this.dragging) {
      this.dragging = false;
      if (this.onDragEnd) this.onDragEnd();
    }
  }

  update(volume) {
    this.light.intensity = 1 + volume * 4;
    this.light.distance = 15 + volume * 20;
    this.mesh.material.emissiveIntensity = 1 + volume * 2;
  }

  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    canvas.removeEventListener('pointermove', this._onPointerMove);
    canvas.removeEventListener('pointerup', this._onPointerUp);
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.light.dispose();
  }
}
