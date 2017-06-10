var simplex = new SimplexNoise();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var heatMapCheckBox = document.getElementById('showHeatmap');

canvas.width = 800;
canvas.height = 800;

canvas.style.border = '1px solid blue';

var heatMap = ctx.getImageData(0, 0, canvas.width, canvas.height);
var data = heatMap.data;

var frequency = canvas.width / 8;

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

function Vehicle() {
    var _this = this;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.size = 25;
    this.x = Math.round(Math.random() * canvas.width - this.size);
    this.y = Math.round(Math.random() * canvas.height - this.size);

    this.activate = function(sensorValue1, sensorValue2) {
        // new speed
        var newVx = Math.exp(sensorValue1 * 1.8) - 0.1;
        var newVy = Math.exp(sensorValue2 * 1.8) - 0.1;

        // keep current direction
        if (_this.vx < 0) {
            _this.vx = -newVx;
        } else {
            _this.vx = newVx;
        }
        if (_this.vy < 0) {
            _this.vy = -newVy;
        } else {
            _this.vy = newVy;
        }

        // turn back at walls
        if ((Math.round(_this.x + _this.vx) + _this.size >= canvas.width) ||
            (_this.x + _this.vx < 0)) {
            _this.vx = - _this.vx;
        } else {
            _this.x = Math.round(_this.x + _this.vx);
        }

        if ((Math.round(_this.y + _this.vy) + _this.size >= canvas.height) ||
            (_this.y + _this.vy < 0)) {
            _this.vy = - _this.vy;
        } else {
            _this.y = Math.round(_this.y + _this.vy);
        }
    }
}


var vehicles = [];
var numVehicles = 10;

for (var i = 0; i < numVehicles; i++) {
    vehicles.push(new Vehicle());
}

var stopped = false;

function getChannel(imageData, x, y, channel) {
    return imageData[(x + y * canvas.width) * 4 + channel];
}

function step(timestamp) {
    if (heatMapCheckBox.checked) {
        showHeatmap(heatMap);
    }

    for (var i = 0; i < numVehicles; i++) {
        var vehicle = vehicles[i];
        ctx.fillStyle = "black";
        ctx.fillRect(vehicle.x, vehicle.y, vehicle.size, vehicle.size);
        vehicle.activate(
            getChannel(heatMap.data, vehicle.x, vehicle.y, 3) / 255,
            getChannel(heatMap.data, vehicle.x, vehicle.y + vehicle.size, 3) / 255
        );
    }

    if (!stopped) {
        setTimeout(
            requestAnimationFrame.bind(this, step),
            1000/60
        );
    }
}

function stop() {
    stopped = true;
}
requestAnimationFrame(step);
