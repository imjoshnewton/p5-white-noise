class Marker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.moveX = true;
    this.moveY = true;
    this.diameter = 0;
  }

  init(x, y, moveX, moveY, diameter) {
    this.update(x, y);
    this.moveX = moveX;
    this.moveY = moveY;
    this.diameter = diameter;
  }

  get radius() {
    return this.diameter / 2;
  }

  update(x, y) {
    if (this.moveX) this.x = x;
    if (this.moveY) this.y = y;
  }

  show(size) {
    fill(colors[0]);
    ellipse(this.x, this.y, size, size);
    fill(colors[1]);
    ellipse(this.x, this.y, size * 0.35, size * 0.35);
  }
}

class NoiseBox {
  constructor() {
    this.container = createDiv('');
    this.active = false;
    this.marker = new Marker(0, 0);
    this.hasMarker = true;
  }

  get bounds() {
    const rect = this.container.elt.getBoundingClientRect();
    return {
      x: Math.floor(rect.left),
      y: Math.floor(rect.top),
      width: this.container.width,
      height: this.container.height
    };
  }

  toggleActive() {
    this.active = !this.active;
  }

  inBounds(x, y) {
    const b = this.bounds;
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  handleAction() {
    if (!this.active || !this.hasMarker) return;

    let x = mouseX;
    let y = mouseY;

    if (this.inBounds(mouseX, mouseY)) {
      const b = this.bounds;
      const r = this.marker.radius;

      x = constrain(x, b.x + r, b.x + b.width - r);
      y = constrain(y, b.y + r, b.y + b.height - r);

      this.marker.update(x, y);
    }
  }

  show(size) {
    if (this.hasMarker) {
      this.marker.show(size);
    }
  }
}
