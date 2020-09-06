class Disc {
    constructor(radius, position, direction, resolution) {
        this.radius = radius;
        this.position = position;
        this.direction = direction;
        this.resolution = resolution;

        this.generate();
    }

    generate () {
        this.vertices = [];
        this.uvs = [];

        const {radius, position, direction, resolution} = this;

        let iter = (2 * Math.PI) / resolution;
        let max = 0;
        let min = 0;
        
        /**
         * calculate min and max
         * calculate counter clockwise points facing z positive
         */
        let points = [];
        for (let i = 0;i < resolution;i++) {
            let [x, y] = getCirclePoint(radius, iter * i);
            if (x < min) {
                min = x;
            } 
            if (x > max) {
                max = x;
            }

            if (y < min) {
                min = y;
            } 
            if (y > max) {
                max = y;
            }
            
            points.push([x, y]);
        }

        /**
         * expand 2d collection of points into single array of triangles
         * calculate uvs based on points
         */
        let test = [];
        let uvs = [];
        for (let i = 0;i < points.length;i++) {
            const next = i == points.length - 1 ? 0 : i+1;
            // vertices
            test = test.concat(
                // vertex 1
                points[i],
                0,
                // vertex 2
                points[next],
                0,
                // vertex 3
                [0, 0, 0]
            );
            // uv coordinates
            uvs = uvs.concat(
                points[i].map(v => (v-min) / (max-min)),
                points[ i == points.length - 1 ? 0 : i+1 ].map(v => (v-min) / (max-min)),
                [0, 0].map(v => (v-min) / (max-min))
            );
        }

        /**
         * rotate points
         */
        let floats = qRotatePoints( test, direction);
        for (let i = 0;i < floats.length;i+=3) {
            floats[i] += position.x;
            floats[i+1] += position.y;
            floats[i+2] += position.z;
        }

        this.uvs = uvs;
        this.vertices = floats;
    }
}

// utility and things
function qRotatePoints (points, direction) {
	let buffer = new THREE.BufferGeometry();
	buffer.addAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3))
	buffer.lookAt(direction);
	return buffer.attributes.position.array;
}

function getCirclePoint (radius, theta) {
	// x = r cos(t)
	let x = radius * Math.cos(theta);
	// y = r sin(t)
	let y = radius * Math.sin(theta);

	return [x, y];
}
