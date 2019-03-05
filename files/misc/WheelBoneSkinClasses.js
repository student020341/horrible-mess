class BoneUtils {
    // change origin for a given geometry
    static setOrigin (geom, vec3) {
        geom.applyMatrix( new THREE.Matrix4().makeTranslation(vec3.x, vec3.y, vec3.z) );
        geom.verticesNeedUpdate = true;
    }

    // pass origin to this and pass the result to setOrigin to re-origin a model that doesn't have its root at 0,0,0
    static invertVector (vec3) {
        return new THREE.Vector3(-vec3.x, -vec3.y, -vec3.z);
    }

    // get a normalized vector3 between 2 vector3s
    static getDirection (v1, v2) {
        let d = new THREE.Vector3();
        d.subVectors(v2, v1).normalize();
        return d;
    }

    // get the x and y coordinates for point position that has been rotated theta radians around the given origin
    static rotatedPoint (origin, position, theta) {
        let x = origin.x + (position.x - origin.x) * Math.cos(theta) + (position.y - origin.y) * Math.sin(theta);
        let y = origin.y - (position.x - origin.x) * Math.sin(theta) + (position.y - origin.y) * Math.cos(theta);
    
        return [x, y];
    }

    /**
     * get an x,y,z point on a sphere
     * rotate phi radians of the z axis and then theta radians around the y axis
     * 
     * 0, 0, 1 => phi = 0, theta = * (phi=0 will make theta not matter)
     * 1, 0, 0 => phi = pi/2, theta = 0
     * 0, 1, 0 => phi = pi/2, theta = pi/2
     */
    static pointOnSphere (radius, theta, phi) {
        let x = radius * Math.sin(phi) * Math.cos(theta);
        let y = radius * Math.sin(phi) * Math.sin(theta);
        let z = radius * Math.cos(phi);

        return [x, y, z].map(f => parseFloat(f.toFixed(8)));
    }

    // get a point that is radius units away from the origin at a rotation of theta
    static getCirclePoint (radius, theta) {
        // x = r cos(t)
        let x = radius * Math.cos(theta);
        // y = r sin(t)
        let y = radius * Math.sin(theta);
    
        return [x, y];
    }

    // degrees => radians
    static RadiansFrom (degrees) {
        return degrees * (Math.PI / 180);
    }
    
    // radians => degrees
    static DegreesFrom (radians) {
        return radians / (Math.PI / 180);
    }

    // get a THREEjs friendly mesh to render
    static BoilThePlates (vertices, triangles, uvs) {
        // create new simple geometry
        let simple = new THREE.Geometry();

        // load texture
        let texture = new THREE.TextureLoader().load("/misc/file/checker2.png");
        // set geometry stuff
        simple.vertices = vertices;
        simple.faces = triangles;
        simple.faceVertexUvs = uvs;

        // update normals & uvs
        simple.computeFaceNormals();
        simple.uvsNeedUpdate = true;

        // let mat = new THREE.MeshBasicMaterial( { color: 0x00FF00 } );
        let mat = new THREE.MeshBasicMaterial( { 
            map: texture,
            // wireframe: true 
        } );

        // get the geometry & material
        return new THREE.Mesh(simple, mat);
    }

    static SimpleLine (points, color = 0xffffff) {
        let material = new THREE.LineBasicMaterial({
            color: color
        });

        let geometry = new THREE.Geometry();
        geometry.vertices.push(...points);

        return new THREE.Line(geometry, material);
    }

    static textureVars () {
        // todo: parameterize, maybe automatically based on texture
        let size = 1024;
        let cell = size/8;
        let p = cell / size;
        return {
            size: size,
            cell: cell,
            p: p
        };
    }
};

/**
 * Manage various sub bones and final mesh state. For example,
 * regenerate mesh when a sub mesh changes. 
 * 
 * goals:
 *  merge and offset triangles
 *  make & manage connections between sub bones
 *  + manage order: offset and connect disc faces, then
 *  + connect the edges last
 */
class Skeleton {
    constructor (bones) {
        this.bones = bones.filter(bones => typeof bones.generate == "function");

        // distance of bone skin from center point
        this.radius = 4; // todo: variable radii, maybe this is just default if bones don't supply one
        // points in disc
        this.resolution = 3;
        // useful for debugging, default to true
        this.connectEdges = false;
        // tilt bases and create extra discs to smooth turns / prevent flat angles
        this.autoModel = false;
        // threshold for rotation between 2 bones
        this.autoAngleLimit = BoneUtils.RadiansFrom(10);

        // combined verts and things from bones
        this.purge();
    }

    // empty all the datums!
    purge() {
        this.vertices = [];
        this.triangles = [];
        this.uvs = [];
    }

    // generate and connect all the sub bones
    createModel () {
        // stepo 1 - discard the old model
        this.purge();

        this.uvs[0] = [];

        // step 2 - build / generate the bone class
        this.bones.forEach(bone => bone.generate(this.radius, this.resolution));

        // step 2.5 - create additional bones to smooth turns
        if (this.autoModel) {
            let limit = this.autoAngleLimit;
            for (let i = 0;i < this.bones.length-1;) {
                const [b1, b2] = [i, i+1].map(index => this.bones[index]);
                let thetaDelta = b2.rotation[0] - b1.rotation[0];
                let phiDelta = b2.rotation[1] - b1.rotation[1];
                let dir = BoneUtils.getDirection(b1.origin, b2.origin);

                /**
                 check the rotations between this bone and the next bone
                 if the angle deltas are greater than 30 degrees, create a new intermediate bone
                 */
                if (Math.abs(thetaDelta) > limit || Math.abs(phiDelta) > limit) {
                    let halfDistVector = dir.clone().multiplyScalar( b1.origin.distanceTo(b2.origin) / 2 );
                    let position = b1.origin.clone().add(halfDistVector);
                    const newTheta = thetaDelta == 0 ? b1.rotation[0] : (thetaDelta / 2) + b1.rotation[0];
                    const newPhi = phiDelta == 0 ? b1.rotation[1] : (phiDelta / 2) + b1.rotation[1];

                    let newBone = new DiscBone(position, {segment: 4, rotation: [newTheta, newPhi]});
                    newBone.generate(this.radius, this.resolution);
                    this.bones.splice(i+1, 0, newBone);
                    // no change to i, compare previous and new bone
                } else {
                    i++;
                }
            }
        }

        // step 3 - offset the triangles, get other skeleton data
        for (let i = 0;i < this.bones.length;i++) {
            this.bones[i].vertexRange = [ this.vertices.length + (this.bones[i].segment == DiscBone.Segments()["Mid"] ? 0 : 1) ];
            // don't mutate the source!
            let tris = [].concat(this.bones[i].triangles)
                // offset tris by current vert count
                .map(tri => {
                    ["a", "b", "c"].forEach(prop => tri[prop] += this.vertices.length);
                    return tri;
                });
            this.triangles = this.triangles.concat(tris);
            // concat verts last so first pass is +0 for triangle offsets
            this.vertices = this.vertices.concat(this.bones[i].vertices);
            // maybe calculate uvs in generate? - done
            this.uvs[0] = this.uvs[0].concat(this.bones[i].uvs);
            // store vertex ranges for the bones
            this.bones[i].vertexRange[1] = this.vertices.length-1;
        }

        // step 4 - connections between bones
        if (this.connectEdges) {
            let size = 1024;
            let cell = size/8;
            let p = cell / size;
            for (let i = 0;i < this.bones.length-1;i++) {
                const b1 = this.bones[i];
                const b2 = this.bones[i+1];

                let [start1, end1] = b1.vertexRange;
                let [start2, end2] = b2.vertexRange;

                for (let i = 0;i < b1.vertices.length-2;i++) {
                    let tri1 = [ start1+i, start1+i+1, start2+i+1 ];
                    let tri2 = [ start1+i, start2+i+1, start2+i ];

                    this.triangles.push(
                        new THREE.Face3(...tri1),
                        new THREE.Face3(...tri2)
                    );

                    this.uvs[0].push(
                        [
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(p, 0),
                            new THREE.Vector2(p, p),
                        ],
                        [
                            new THREE.Vector2(0, 0),
                            new THREE.Vector2(p, p),
                            new THREE.Vector2(0, p),
                        ]
                    );
                }
                // last set of triangles connecting between end & start
                this.triangles.push(
                    new THREE.Face3(end1, start1, start2),
                    new THREE.Face3(end1, start2, end2)
                );

                this.uvs[0].push(
                    [
                        new THREE.Vector2(0, 0),
                        new THREE.Vector2(p, 0),
                        new THREE.Vector2(p, p),
                    ], 
                    [
                        new THREE.Vector2(0, 0),
                        new THREE.Vector2(p, p),
                        new THREE.Vector2(0, p),
                    ]
                );
            }
        }

        // throw some plates in the oven
        return BoneUtils.BoilThePlates(this.vertices, this.triangles, this.uvs);
    }
}

/**
 * Class for managing a group of vertices generated around a center point
 * and connecting other DiscBones to make cylindrical meshes.
 * 
 * goals
 *  connect edges between this and another disc
 *      should they be merge into a single skeleton at that point already? 
 *      + or should this data be part of the skeleton and be offset before rendering?
 *
 *  consider direction / tilt
 */
class DiscBone {
    constructor (origin, options) {
        // center point of disc
        this.origin = origin;
        // [theta, phi]
        this.rotation = options.rotation || [0, Math.PI/2];
        // start, mid, end - determines if a face should be created with the origin
        this.segment = options.segment || DiscBone.Segments()["Mid"]; // default to section with no face or need for a center point
        
        // mesh data exclusively for this disc. 
        // faces/verts/etc connecting it to another disc should be managed by the skeleton / some parent class
        this.vertices = [];
        this.triangles = [];
        this.uvs = [];
    }

    // attempt to convert the eular-ish solution to another
    generate (radius, resolution) {
        // vertices
        this.vertices = [this.origin]; // todo: conditional for this line
        let radiansPerIteration = BoneUtils.RadiansFrom( 360 / resolution );
        for (let i = 0;i < resolution;i++) {
            let theta = this.rotation[0];
            let phi = radiansPerIteration * i;

            // DEBUG
            theta = radiansPerIteration * i;
            phi = Math.PI / 2;

            let [x, y, z] = BoneUtils.pointOnSphere(radius, theta, phi);

            this.vertices.push(
                new THREE.Vector3(x + this.origin.x, y + this.origin.y, z + this.origin.z),
            );
        }

        const {p} = BoneUtils.textureVars();

        // triangles - note: a lone mid segment cannot exist because threejs will throw an error about faceless geometry
        // "top" face
        if (this.segment == DiscBone.Segments()["End"] || this.segment == DiscBone.Segments()["Debug"]) {
            for (let i = 1;i < this.vertices.length;i++) {
                let indices = [i, i+1, 0];
                // last face is conencted to the first one, which is index 1 because 0 is the center point
                if (i >= this.vertices.length-1) {
                    indices[1] = 1;
                }
                this.triangles.push(
                    new THREE.Face3(...indices),
                );
                // top UVs, A1
                this.uvs.push(
                    [
                        new THREE.Vector2(0, p*3),
                        new THREE.Vector2(p, p*3),
                        new THREE.Vector2(p, p*4),
                    ]
                );
            }
        }

        // "bottom" face
        if (this.segment == DiscBone.Segments()["Start"] || this.segment == DiscBone.Segments()["Debug"]) {
            for (let i = 1;i < this.vertices.length;i++) {
                let indices = [i+1, i, 0];
                if (i >= this.vertices.length-1) {
                    indices[0] = 1;
                }
                this.triangles.push(
                    new THREE.Face3(...indices),
                );
                // bottom UVs, H1
                this.uvs.push(
                    [
                        new THREE.Vector2(0, p*2),
                        new THREE.Vector2(p, p*2),
                        new THREE.Vector2(p, p*3),
                    ],
                );
            }
        }
    }

    // get direction between 2 bones or vector3
    static getDirection (arg0, arg1) {
        const _type = arg => {
            switch(arg) {
                case arg instanceof THREE.Vector3: return 1;
                case arg instanceof DiscBone: return 2;
                default: return 0;
            };
        };
        
        let type0 = _type(arg0);
        let type1 = _type(arg1);

        if (type0 == 0 || type1 == 0) {
            throw new Error("Invalid argument");
        }

        let vec0 = type0 == 1 ? arg0 : arg0.origin;
        let vec1 = type1 == 1 ? arg1 : arg1.origin;

        return BoneUtils.getDirection(vec0, vec1);
    }

    // enums
    static Segments () {
        return {
            Start: 1, // bottom face
            Mid: 2, // no face
            End: 3, // top face
            Debug: 4 // double sided face
        };
    }
}

/**
 * observations
 *  - phi can exceed pi
 *  - for phi = radiansPerIteration * iteration, increasing theta gives a counter clockwise tilt on the z axis
 *  - for phi = half pi, increasing theta revolves around z axis
 *  - for theta = half pi, increasing phi revolves around x axis
 *  - for theta = 0, increasing phi revolves around the y axis
 * 
 * conversion, observation phase, "axis to counter clockwise rotate points on" (eular direction) => "theta and phi values"
 *  - iter = (2pi / total_iterations * current_iteration)
 *  - (0, 1, 0) => [theta = 0, phi = iter] - verified
 *  - (0, -1, 0) => [theta = pi, phi = iter] - verified
 *  - (1, 0, 0) => [theta = -pi/2, phi = iter] - verified
 *  - (-1, 0, 0) => [theta = pi/2, phi = iter] - verified
 *  - (0, 0, 1) => [theta = iter, phi = -pi/2 or pi/2] - verified
 *  - (0, 0, -1) => [theta = iter * -1, phi = -pi/2 or pi/2] - verified
 *  + to check conversion, red=bottom and green=top
 *  + camera.position.z=10 also makes it a little easier to see
 * 
 * conversion, second observation phase, "find the variable operations to yield tilted faces that are not axis aligned"
 *  - iter variable probably does not need to be modified during iteration, as it will always need to complete a full revolution
 *  - from (0, 1, 0) where theta=0 and phi=iter, increasing theta causes the object to rotate counter clockwise on the +z axis
 *  + the object disappears at theta=Math.pi/2 but is still visible at 1.57
 *  - short cut: trying to convert between eulars is stupid, I can do everything I need by interpolating between the theta-phi rotations between 2 discs!
 * 
 * angles between previous observations (like (0, 1, 0) to (1, 0, 0), or points (0, 0, 0) to (1, 1, 0), tilting 45 degrees on z axis)
 *  - [(0, 0, 0) to (1, 1, 0)] (~45 degrees) => [theta = 0.7853981633974483 (45 degrees), phi=iter] - verified
 *  - [(0, 0, 0) to (1, -1, 0)] => [theta = -0.7853981633974483, phi = iter]
 *  
 * sample angle I can't make...
 * circle facing z+, tilt clockwise on x+ (tilted back from forward perspective)
 *  - p1 = [theta = 0, phi = pi/2]
 *  - p2 = [theta = pi/2, phi = pi * (3/4) ]
 *  - p3 = [theta = pi * (3/4), phi = pi * (3/4)]
 *  - p4 = [theta = pi, phi = pi/2]
 *  - p5 = [theta = pi * 5/4, phi = pi * 1/4]
 *  - p6 = [theta = pi * 6/4, phi = pi * 1/4]
 *  - generally, increase theta by pi/4 from 0, increase theta by pi/4 from pi/2?
 */
