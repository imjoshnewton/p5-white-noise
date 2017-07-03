// Marker Class
function Marker(initX, initY) {
    this.x = initX;
    this.y = initY;
    this.moveX = true;
    this.moveY = true;
    this.diameter;
}

Marker.prototype.init = function (newX, newY, moveX, moveY, diameter) {
    this.update(newX, newY);
    this.moveX = moveX;
    this.moveY = moveY;
    this.diameter = diameter;
};

Marker.prototype.getRadius = function () {
    return this.diameter/2;
};

Marker.prototype.update = function (newX, newY) {
    if(this.moveX) {
        this.setX(newX);
    }
    if(this.moveY) {
        this.setY(newY);
    }
};

Marker.prototype.setX = function (newX) {
    this.x = newX;
};

Marker.prototype.setY = function (newY) {
    this.y = newY;
};

Marker.prototype.show = function (width) {
    fill(colors[0]);
    ellipse(this.x, this.y, width, width);

    fill(colors[1]);
    ellipse(this.x, this.y, width*.35, width*.35);
};

// NoiseBox Class
function NoiseBox() {
    this.container = createDiv('');
    this.hasAction = false;
    this.marker = new Marker(0,0);
    this.hasMarker = true;
}

NoiseBox.prototype.startAction = function () {
    this.hasAction = true;
};

NoiseBox.prototype.endAction = function () {
    this.hasAction = false;
};

NoiseBox.prototype.toggleAction = function () {
    if(this.hasAction) {
        this.hasAction = false;
    }
    else {
        this.hasAction = true;
    }
};

NoiseBox.prototype.inBounds = function (x, y) {
    if(x >= this.getX() && x <= (this.getX()+this.container.width) && y >= this.getY() && y <= (this.getY()+this.container.height)) {
        return true;
    }
    else {
        return false;
    }
};

NoiseBox.prototype.handleAction = function () {
    var x = mouseX;
    var y = mouseY;

    if(this.hasAction && this.hasMarker){
        if(this.inBounds(mouseX, mouseY)) {
            if(x < this.getX()+this.marker.getRadius()) {
                x = this.getX()+this.marker.getRadius();
            }
            else if (x > (this.getX()+this.container.width)-this.marker.getRadius()) {
                x = (this.getX()+this.container.width)-this.marker.getRadius();
            }

            if (y < this.getY()+this.marker.getRadius()) {
                y = this.getY()+this.marker.getRadius();
            }
            else if (y > (this.getY()+this.container.height)-this.marker.getRadius()) {
                y = (this.getY()+this.container.height)-this.marker.getRadius();
            }

            this.marker.update(x, y);
        }
    }
};

NoiseBox.prototype.show = function (width) {
    if(this.hasMarker){
        this.marker.show(width);
    }
};

NoiseBox.prototype.getX = function () {
  var rect = this.container.elt.getBoundingClientRect();
  //console.log(rect.left);
  return Math.floor(rect.left);
};

NoiseBox.prototype.getY = function () {
  var rect = this.container.elt.getBoundingClientRect();
  //console.log(rect.top);
  return Math.floor(rect.top);
};
