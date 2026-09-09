const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Pass the Babylon.js UMD bundle used by upload.html as the first argument.
const BABYLON = require(path.resolve(process.argv[2]));
const source = fs.readFileSync(path.join(__dirname, '../upload-viewer.js'), 'utf8');
const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);
let imported;
let result;
const context = vm.createContext({
    BABYLON, scene, Uint8Array, console: { log() {}, error: console.error },
    createAutomaticCadMaterial: () => new BABYLON.StandardMaterial('cad', scene),
    getOcctModule: async () => ({ ReadStepFile: () => result }),
    setLoadingFakeProgress() {},
    prepareLoadedModel(meshes) { imported = meshes; },
    showLoadError(message) { throw new Error(message); }
});
for (const name of ['buildBabylonMeshesFromStep', 'loadStepModel']) {
    const start = source.indexOf(name === 'loadStepModel' ? 'async function ' + name : 'function ' + name);
    const next = source.indexOf('\nfunction ', start + 1);
    const nextAsync = source.indexOf('\nasync function ', start + 1);
    const end = Math.min(...[next, nextAsync, source.length].filter(i => i > start));
    vm.runInContext(source.slice(start, end), context);
}

(async () => {
    const occt = await require('occt-import-js')();
    const fixture = path.join(__dirname, '../node_modules/occt-import-js/test/testfiles/rounded-cube/rounded-cube.step');
    result = occt.ReadStepFile(fs.readFileSync(fixture), null);
    assert.equal(result.success, true);
    await context.loadStepModel({ arrayBuffer: async () => new ArrayBuffer(0) });
    assert.equal(scene.useRightHandedSystem, true);
    assert.equal(imported.length, result.meshes.length);
    imported.forEach((mesh, i) => {
        assert.deepEqual(Array.from(mesh.getVerticesData('position')), Array.from(new Float32Array(result.meshes[i].attributes.position.array)));
        assert.deepEqual(Array.from(mesh.getVerticesData('normal')), Array.from(new Float32Array(result.meshes[i].attributes.normal.array)));
        assert.deepEqual(Array.from(mesh.getIndices()), result.meshes[i].index.array);
        assert.equal(mesh.computeWorldMatrix(true).determinant(), 1);
        assert.equal(mesh.overrideMaterialSideOrientation, BABYLON.Material.ClockWiseSideOrientation);
    });
    // An asymmetric, offset triangle exposes axis swaps and incorrect fallback normals.
    const positions = [1, 2, 3, 5, 2, 3, 1, 8, 3];
    const [triangle] = context.buildBabylonMeshesFromStep({ meshes: [{
        attributes: { position: { array: positions } }, index: { array: [0, 1, 2] }
    }] });
    assert.deepEqual(Array.from(triangle.getVerticesData('position')), positions);
    const normals = triangle.getVerticesData('normal');
    for (let i = 0; i < normals.length; i += 3) {
        assert.ok(Math.abs(normals[i]) < 1e-8 && Math.abs(normals[i + 1]) < 1e-8);
        assert.ok(normals[i + 2] > 0.999);
    }
    engine.dispose();
    console.log('STEP: original axes, positions, winding and normals preserved; no reflection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
