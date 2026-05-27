class DriftCamera {
  constructor(fov = 60, near = 0.1, far = 1000) {
    this.camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, near, far);
    this.target = new THREE.Vector3(0, 0, 0);
    this.radius = 12;
    this.height = 4;
    this.angle = 0;
    this.speed = (Math.PI * 2) / 60;
    this.bobAmount = 0.3;
    this.bobSpeed = 0.5;
    this.paused = false;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    if (!this.paused) {
      this.angle += this.speed * dt;
    }

    const bob = Math.sin(this.angle * this.bobSpeed) * this.bobAmount;
    this.camera.position.set(
      Math.cos(this.angle) * this.radius,
      this.height + bob,
      Math.sin(this.angle) * this.radius
    );
    this.camera.lookAt(this.target);
  }
}
