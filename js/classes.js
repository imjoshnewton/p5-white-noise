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
}

Marker.prototype.getRadius = function () {
    return this.diameter/2;
}

Marker.prototype.update = function (newX, newY) {
    if(this.moveX) {
        this.setX(newX);
    }
    if(this.moveY) {
        this.setY(newY);
    }
}

Marker.prototype.setX = function (newX) {
    this.x = newX;
}

Marker.prototype.setY = function (newY) {
    this.y = newY;
}

Marker.prototype.show = function (width) {
    fill(255,255,255,50);

    ellipse(this.x, this.y, width, width);
    ellipse(this.x, this.y, width*.305, width*.305);
}

// NoiseBox Class
function NoiseBox() {
    this.container = createDiv('');
    this.hasAction = false;
    this.marker = new Marker(0,0);
    this.hasMarker = true;
}

NoiseBox.prototype.startAction = function () {
    this.hasAction = true;
}

NoiseBox.prototype.endAction = function () {
    this.hasAction = false;
}

NoiseBox.prototype.toggleAction = function () {
    if(this.hasAction) {
        this.hasAction = false;
    }
    else {
        this.hasAction = true;
    }
}

NoiseBox.prototype.inBounds = function (x, y) {
    if(x >= this.container.x && x <= (this.container.x+this.container.width) && y >= this.container.y && y <= (this.container.y+this.container.height)) {
        return true;
    }
    else {
        return false;
    }
}

NoiseBox.prototype.handleAction = function () {
    var x = mouseX;
    var y = mouseY;

    if(this.hasAction && this.hasMarker){
        if(this.inBounds(mouseX, mouseY)) {
            if(x < this.container.x+this.marker.getRadius()) {
                x = this.container.x+this.marker.getRadius();
            }
            else if (x > (this.container.x+this.container.width)-this.marker.getRadius()) {
                x = (this.container.x+this.container.width)-this.marker.getRadius();
            }

            if (y < this.container.y+this.marker.getRadius()) {
                y = this.container.y+this.marker.getRadius();
            }
            else if (y > (this.container.y+this.container.height)-this.marker.getRadius()) {
                y = (this.container.y+this.container.height)-this.marker.getRadius();
            }

            this.marker.update(x, y);
        }
    }
}

NoiseBox.prototype.show = function (width) {
    if(this.hasMarker){
        this.marker.show(width);
    }
}
