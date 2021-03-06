import * as SimplexNoise from "simplex-noise";

const simplex = new SimplexNoise();


interface Point {
    x: number,
    y: number,
    value: number
}

interface Position {
    x: number,
    y: number
}

class ColorUtils {
    static hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

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
    static hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = ColorUtils.hue2rgb(p, q, h + 1 / 3);
            g = ColorUtils.hue2rgb(p, q, h);
            b = ColorUtils.hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

class Display {
    public canvas;
    public ctx;
    public background;

    constructor() {
        const canvasElem = document.createElement('canvas');
        this.canvas = document.body.appendChild(canvasElem);
        this.canvas.style.border = '1px solid blue';
        this.canvas.height = 800;
        this.canvas.width = 800;
        this.ctx = this.canvas.getContext('2d');
    }

    setBackground(imgData: Array<number>) {
        this.background = new ImageData(Uint8ClampedArray.from(imgData), this.canvas.width, this.canvas.height);
    }

    clearWithBackground() {
        this.ctx.putImageData(this.background, 0, 0);
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getImageData(x0: number, y0: number, x1: number, y1: number) {
        return this.ctx.getImageData(x0, y0, x1, y1);
    }

    getDisplay() {
        return this.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

}

class HeatFieldGenerator {
    public heatData;

    constructor(public width: number, public height: number) {
        this.heatData = {};
    }

    generateRandomHeatmap() {
        let frequency = this.width / 8;
        let data = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let a = simplex.noise2D(x / frequency, y / frequency);
                let b = simplex.noise2D(x / frequency, y / frequency);

                // https://stackoverflow.com/a/27263918
                // var rgb = ColorUtils.hslToRgb(a, 1, 0.2);

                this.addHeatData({x, y, value: a});

                data[(x + y * this.width) * 4] = a * 255;
                data[(x + y * this.width) * 4 + 1] = 0;
                data[(x + y * this.width) * 4 + 2] = (1 - a) * 255;
                data[(x + y * this.width) * 4 + 3] = 255;
            }
        }
        return data;
    }

    addHeatData(point: Point) {
        this.heatData[point.x + ',' + point.y] = point.value;
    }

    // getHeatData(position: Position) {
    //     return this.heatData[position.x + ',' + position.y];
    // }
    getHeatData(x: number, y: number): number {
        return this.heatData[x + ',' + y];
    }
}

let display = new Display();

function randInt(max) {
    return Math.round(Math.random() * max);
}

class Sensor {
    getRepresentation() {
        let sensor = display.ctx.createImageData(1, 1);
        let data = sensor.data;
        data = [255, 255, 255, 255]; // only do this once per page load
        return data;
    }
}

class Vehicle {
    public theta0;
    public theta;
    public sl;
    public sr;
    public size;
    public wheelDistance;
    public x0;
    public y0;
    public x;
    public y;

    constructor() {
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

    getDistanceTravelled() {
        return (this.sl + this.sr) / 2;
    };

    getHeading() {
        return (this.sr - this.sl) / this.size + this.theta0;
    };

    activate(sensorValue1, sensorValue2) {
        // new speed
        const leftMove = Math.exp(sensorValue2 - 1);
        const rightMove = Math.exp(sensorValue1 - 1);

        this.sl += leftMove;
        this.sr += rightMove;

        this.theta = (this.sr - this.sl) / this.wheelDistance + this.theta0;

        const distance = this.getDistanceTravelled();
        this.x = distance * Math.cos(this.theta) + this.x0;

        this.y = distance * Math.sin(this.theta) + this.y0;

    };

    reset() {
        this.x0 = this.x;
        this.y0 = this.y;
        this.theta0 = this.theta;
        this.sr = 0;
        this.sl = 0;
    };

    getSensor1Position() {
        return {
            x: Math.round(this.x - Math.cos(this.theta - Math.PI / 3) * (this.size - 2)),
            y: Math.round(this.y - Math.sin(this.theta - Math.PI / 3) * (this.size - 2))
        };
    };

    getSensor2Position() {
        return {
            x: Math.round(this.x - Math.cos(this.theta + Math.PI / 3) * (this.size - 2)),
            y: Math.round(this.y - Math.sin(this.theta + Math.PI / 3) * (this.size - 2))
        };
    };
}


class World {
    public vehicles;
    public stopped;

    public heatMap;
    public sensor;
    public heatFieldGenerator;
    private intervalId;

    constructor(public numVehicles: number) {
        this.vehicles = [];
        this.stopped = true;

        for (let ii = 0; ii < numVehicles; ii++) {
            this.vehicles.push(new Vehicle());
        }

        this.sensor = new Sensor().getRepresentation();
        this.heatFieldGenerator = new HeatFieldGenerator(display.canvas.width, display.canvas.height);
        this.heatMap = this.heatFieldGenerator.generateRandomHeatmap();
    }

    start() {
        if (!this.intervalId) {
            display.setBackground(this.heatMap);
            this.intervalId = setInterval(
                () => {
                    window.requestAnimationFrame(this.step.bind(this));
                },
                1000 / 60
            );

        }
    }

    stop() {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    step() {
        display.clearWithBackground();

        for (let i = 0; i < this.vehicles.length; i++) {
            let vehicle = this.vehicles[i];
            display.ctx.beginPath();
            display.ctx.arc(vehicle.x, vehicle.y, vehicle.size, 0, 2 * Math.PI, false);
            display.ctx.fillStyle = 'rgba(0,0,0,1)';
            display.ctx.fill();
            display.ctx.beginPath();
            display.ctx.strokeStyle = 'white';
            display.ctx.moveTo(vehicle.x, vehicle.y);
            display.ctx.lineTo(
                vehicle.x + Math.cos(vehicle.theta) * vehicle.size,
                vehicle.y + Math.sin(vehicle.theta) * vehicle.size
            );
            display.ctx.stroke();

            let sensor1Pos = vehicle.getSensor1Position();
            let sensor2Pos = vehicle.getSensor2Position();
            try {
                display.ctx.putImageData(this.sensor, sensor1Pos.x, sensor1Pos.y);
                display.ctx.putImageData(this.sensor, sensor2Pos.x, sensor2Pos.y);
            } catch (e) {

            }
            // vehicle.theta = (vehicle.theta + 0.1) % (Math.PI * 2);
            vehicle.reset();
            vehicle.activate(
                this.heatFieldGenerator.getHeatData(sensor1Pos.x, sensor1Pos.y),
                this.heatFieldGenerator.getHeatData(sensor2Pos.x, sensor2Pos.y)
            );
        }
    }
}

let world = new World(10);
world.start();

// function getChannel(imageData, x, y, channel) {
//     return imageData[(x + y * canvas.width) * 4 + channel];
// }


