
let canvas = document.getElementById("canvas");
let engine = new BABYLON.Engine(canvas, true);

const vec3 = BABYLON.Vector3;

let scene = (() => {

    let bscene = new BABYLON.Scene(engine);
    let cam = new BABYLON.ArcRotateCamera("cam", Math.PI / 2, Math.PI / 2, 2, new vec3(0, 0, 5), bscene);

    let hLight = new BABYLON.HemisphericLight("hemisphereLight", new vec3(1, 1, 0), bscene);
    let plight = new BABYLON.PointLight("pointLight", new vec3(0, 1, -1), bscene);

    let sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, bscene);

    return bscene;
})();

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
