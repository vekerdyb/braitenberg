var simplex = new SimplexNoise();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var heatMapCheckBox = document.getElementById('showHeatmap');

canvas.width = 800;
canvas.height = 800;

canvas.style.border = '1px solid blue';

var heatMap = ctx.getImageData(0, 0, canvas.width, canvas.height);
var data = heatMap.data;

var frequency = canvas.width / 5;

for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
        var a = simplex.noise2D(x / frequency, y / frequency) * 0.6 + 0.8;
        var b = simplex.noise2D(x / frequency, y / frequency) * 0.2 + 0.6;
        data[(x + y * canvas.width) * 4] = 255;
        data[(x + y * canvas.width) * 4 + 1] = 0;
        data[(x + y * canvas.width) * 4 + 2] = 0;
        data[(x + y * canvas.width) * 4 + 3] = 255 - a * 255 + b * 70;
    }
}


function showHeatmap(imgData) {
    ctx.putImageData(imgData, 0, 0);
}

function hideHeatmap() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function toggleHeatmap() {
    if (heatMapCheckBox.checked) {
        showHeatmap(heatMap);
    } else {
        hideHeatmap();
    }
}

heatMapCheckBox.addEventListener('change', toggleHeatmap);
showHeatmap(heatMap);

function randInt(max) {
    return Math.round(Math.random() * max);
}

function Vehicle() {
    var _this = this;
    this.theta0 = Math.random() * 4 * Math.PI;
    this.theta = this.theta0;
    this.sl = 0;
    this.sr = 0;
    this.size = 10;
    this.wheelDistance = 2; // todo
    this.x0 = randInt(canvas.width) - this.size;
    this.y0 = randInt(canvas.height) - this.size;
    this.x = this.x0;
    this.y = this.y0;

    this.getDistanceTravelled = function () {
        return (_this.sl + _this.sr) / 2;
    };

    this.getHeading = function () {
        return (_this.sr - _this.sl) / _this.size + _this.theta0;
    };

    this.activate = function (sensorValue1, sensorValue2) {
        // new speed
        var leftMove = Math.exp(sensorValue1) * 2;
        var rightMove = Math.exp(sensorValue2) * 2;

        _this.sl += leftMove;
        _this.sr += rightMove;

        _this.x = Math.round((_this.getDistanceTravelled() + leftMove) * Math.cos(_this.theta) + _this.x0);

        _this.y = Math.round((_this.getDistanceTravelled() + rightMove) * Math.sin(_this.theta) + _this.y0);

        _this.theta = (_this.sr - _this.sl) / _this.wheelDistance + _this.theta0;
    };

    this.reset = function () {
        _this.x0 = _this.x;
        _this.y0 = _this.y;
        _this.theta0 = _this.theta;
        _this.sr = 0;
        _this.sl = 0;
    };

    this.getSensor1Position = function () {
        return {
            x: Math.round(_this.x - Math.cos(_this.theta - Math.PI / 3) * (_this.size - 2)),
            y: Math.round(_this.y - Math.sin(_this.theta - Math.PI / 3) * (_this.size - 2))
        };
    };

    this.getSensor2Position = function () {
        return {
            x: Math.round(_this.x - Math.cos(_this.theta + Math.PI / 3) * (_this.size - 2)),
            y: Math.round(_this.y - Math.sin(_this.theta + Math.PI / 3) * (_this.size - 2))
        };
    };
}


var vehicles = [];
var numVehicles = 100;

for (var i = 0; i < numVehicles; i++) {
    vehicles.push(new Vehicle());
}

var stopped = false;

function getChannel(imageData, x, y, channel) {
    return imageData[(x + y * canvas.width) * 4 + channel];
}

var sensor = ctx.createImageData(1, 1);
var d = sensor.data;                        // only do this once per page
d[0] = 255;
d[1] = 255;
d[2] = 255;
d[3] = 255;

function step(timestamp) {
    if (heatMapCheckBox.checked) {
        showHeatmap(heatMap);
    }

    for (var i = 0; i < numVehicles; i++) {
        var vehicle = vehicles[i];
        ctx.beginPath();
        ctx.arc(vehicle.x, vehicle.y, vehicle.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(vehicle.x, vehicle.y);
        ctx.lineTo(
            vehicle.x + Math.cos(vehicle.theta) * vehicle.size,
            vehicle.y + Math.sin(vehicle.theta) * vehicle.size
        );
        ctx.stroke();

        var sensor1Pos = vehicle.getSensor1Position();
        var sensor2Pos = vehicle.getSensor2Position();
        try {
            ctx.putImageData(sensor, sensor1Pos.x, sensor1Pos.y);
            ctx.putImageData(sensor, sensor2Pos.x, sensor2Pos.y);
        } catch (e) {

        }
        // vehicle.theta = (vehicle.theta + 0.1) % (Math.PI * 2);
        vehicle.reset();
        vehicle.activate(
            getChannel(heatMap.data, sensor1Pos.x, sensor1Pos.y, 3) / 255,
            getChannel(heatMap.data, sensor2Pos.x, sensor2Pos.y, 3) / 255
        );
    }
    // stopped = true;
    if (!stopped) {
        setTimeout(
            requestAnimationFrame.bind(this, step),
            1000 / 60
        );
    }
}

function stop() {
    stopped = true;
}
requestAnimationFrame(step);
