"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SimplexNoise = require("simplex-noise");
var simplex = new SimplexNoise();
var ColorUtils = (function () {
    function ColorUtils() {
    }
    ColorUtils.hue2rgb = function (p, q, t) {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6)
            return p + (q - p) * 6 * t;
        if (t < 1 / 2)
            return q;
        if (t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    ColorUtils.hslToRgb = function (h, s, l) {
        var r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = ColorUtils.hue2rgb(p, q, h + 1 / 3);
            g = ColorUtils.hue2rgb(p, q, h);
            b = ColorUtils.hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };
    return ColorUtils;
}());
var Display = (function () {
    function Display() {
        var canvasElem = document.createElement('canvas');
        this.canvas = document.body.appendChild(canvasElem);
        this.canvas.style.border = '1px solid blue';
        this.canvas.height = 800;
        this.canvas.width = 800;
        this.ctx = this.canvas.getContext('2d');
    }
    Display.prototype.setBackground = function (imgData) {
        this.background = new ImageData(Uint8ClampedArray.from(imgData), this.canvas.width, this.canvas.height);
    };
    Display.prototype.clearWithBackground = function () {
        this.ctx.putImageData(this.background, 0, 0);
    };
    Display.prototype.clear = function () {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Display.prototype.getImageData = function (x0, y0, x1, y1) {
        return this.ctx.getImageData(x0, y0, x1, y1);
    };
    Display.prototype.getDisplay = function () {
        return this.getImageData(0, 0, this.canvas.width, this.canvas.height);
    };
    return Display;
}());
var HeatFieldGenerator = (function () {
    function HeatFieldGenerator(width, height) {
        this.width = width;
        this.height = height;
        this.heatData = {};
    }
    HeatFieldGenerator.prototype.generateRandomHeatmap = function () {
        var frequency = this.width / 8;
        var data = [];
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var a = simplex.noise2D(x / frequency, y / frequency);
                var b = simplex.noise2D(x / frequency, y / frequency);
                // https://stackoverflow.com/a/27263918
                // var rgb = ColorUtils.hslToRgb(a, 1, 0.2);
                this.addHeatData({ x: x, y: y, value: a });
                data[(x + y * this.width) * 4] = a * 255;
                data[(x + y * this.width) * 4 + 1] = 0;
                data[(x + y * this.width) * 4 + 2] = (1 - a) * 255;
                data[(x + y * this.width) * 4 + 3] = 255;
            }
        }
        return data;
    };
    HeatFieldGenerator.prototype.addHeatData = function (point) {
        this.heatData[point.x + ',' + point.y] = point.value;
    };
    // getHeatData(position: Position) {
    //     return this.heatData[position.x + ',' + position.y];
    // }
    HeatFieldGenerator.prototype.getHeatData = function (x, y) {
        return this.heatData[x + ',' + y];
    };
    return HeatFieldGenerator;
}());
var display = new Display();
function randInt(max) {
    return Math.round(Math.random() * max);
}
var Sensor = (function () {
    function Sensor() {
    }
    Sensor.prototype.getRepresentation = function () {
        var sensor = display.ctx.createImageData(1, 1);
        var data = sensor.data;
        data = [255, 255, 255, 255]; // only do this once per page load
        return data;
    };
    return Sensor;
}());
var Vehicle = (function () {
    function Vehicle() {
        this.theta0 = Math.random() * 4 * Math.PI;
        this.theta = this.theta0;
        this.sl = 0;
        this.sr = 0;
        this.size = 10;
        this.wheelDistance = 7; // todo
        this.x0 = randInt(display.canvas.width) - this.size;
        this.y0 = randInt(display.canvas.height) - this.size;
        this.x = this.x0;
        this.y = this.y0;
    }
    Vehicle.prototype.getDistanceTravelled = function () {
        return (this.sl + this.sr) / 2;
    };
    ;
    Vehicle.prototype.getHeading = function () {
        return (this.sr - this.sl) / this.size + this.theta0;
    };
    ;
    Vehicle.prototype.activate = function (sensorValue1, sensorValue2) {
        // new speed
        var leftMove = Math.exp(sensorValue2 - 1);
        var rightMove = Math.exp(sensorValue1 - 1);
        this.sl += leftMove;
        this.sr += rightMove;
        this.theta = (this.sr - this.sl) / this.wheelDistance + this.theta0;
        var distance = this.getDistanceTravelled();
        this.x = distance * Math.cos(this.theta) + this.x0;
        this.y = distance * Math.sin(this.theta) + this.y0;
    };
    ;
    Vehicle.prototype.reset = function () {
        this.x0 = this.x;
        this.y0 = this.y;
        this.theta0 = this.theta;
        this.sr = 0;
        this.sl = 0;
    };
    ;
    Vehicle.prototype.getSensor1Position = function () {
        return {
            x: Math.round(this.x - Math.cos(this.theta - Math.PI / 3) * (this.size - 2)),
            y: Math.round(this.y - Math.sin(this.theta - Math.PI / 3) * (this.size - 2))
        };
    };
    ;
    Vehicle.prototype.getSensor2Position = function () {
        return {
            x: Math.round(this.x - Math.cos(this.theta + Math.PI / 3) * (this.size - 2)),
            y: Math.round(this.y - Math.sin(this.theta + Math.PI / 3) * (this.size - 2))
        };
    };
    ;
    return Vehicle;
}());
var World = (function () {
    function World(numVehicles) {
        this.numVehicles = numVehicles;
        this.vehicles = [];
        this.stopped = true;
        for (var ii = 0; ii < numVehicles; ii++) {
            this.vehicles.push(new Vehicle());
        }
        this.sensor = new Sensor().getRepresentation();
        this.heatFieldGenerator = new HeatFieldGenerator(display.canvas.width, display.canvas.height);
        this.heatMap = this.heatFieldGenerator.generateRandomHeatmap();
    }
    World.prototype.start = function () {
        var _this = this;
        if (!this.intervalId) {
            display.setBackground(this.heatMap);
            this.intervalId = setInterval(function () {
                window.requestAnimationFrame(_this.step.bind(_this));
            }, 1000 / 60);
        }
    };
    World.prototype.stop = function () {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    };
    World.prototype.step = function () {
        display.clearWithBackground();
        for (var i = 0; i < this.vehicles.length; i++) {
            var vehicle = this.vehicles[i];
            display.ctx.beginPath();
            display.ctx.arc(vehicle.x, vehicle.y, vehicle.size, 0, 2 * Math.PI, false);
            display.ctx.fillStyle = 'rgba(0,0,0,1)';
            display.ctx.fill();
            display.ctx.beginPath();
            display.ctx.strokeStyle = 'white';
            display.ctx.moveTo(vehicle.x, vehicle.y);
            display.ctx.lineTo(vehicle.x + Math.cos(vehicle.theta) * vehicle.size, vehicle.y + Math.sin(vehicle.theta) * vehicle.size);
            display.ctx.stroke();
            var sensor1Pos = vehicle.getSensor1Position();
            var sensor2Pos = vehicle.getSensor2Position();
            try {
                display.ctx.putImageData(this.sensor, sensor1Pos.x, sensor1Pos.y);
                display.ctx.putImageData(this.sensor, sensor2Pos.x, sensor2Pos.y);
            }
            catch (e) {
            }
            // vehicle.theta = (vehicle.theta + 0.1) % (Math.PI * 2);
            vehicle.reset();
            vehicle.activate(this.heatFieldGenerator.getHeatData(sensor1Pos.x, sensor1Pos.y), this.heatFieldGenerator.getHeatData(sensor2Pos.x, sensor2Pos.y));
        }
    };
    return World;
}());
var world = new World(10);
world.start();
// function getChannel(imageData, x, y, channel) {
//     return imageData[(x + y * canvas.width) * 4 + channel];
// }
