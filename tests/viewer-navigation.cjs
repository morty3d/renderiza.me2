const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const BABYLON = require(path.resolve(process.argv[2]));
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function element() {
    const listeners = new Map(), classes = new Set(), captures = new Set();
    return {
        disabled: false, clientHeight: 600,
        classList: { add: x => classes.add(x), remove: x => classes.delete(x),
            contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
        addEventListener(type, callback, options) {
            const list = listeners.get(type) || [];
            list.push({ callback, capture: options === true || options?.capture });
            listeners.set(type, list);
        },
        fire(type, values = {}) {
            const event = { pointerId: 1, clientX: 200, clientY: 200, deltaMode: 0,
                preventDefault() {}, stopImmediatePropagation() { this.stopped = true; }, ...values };
            for (const { callback } of [...(listeners.get(type) || [])].sort((a,b) => !!b.capture - !!a.capture)) {
                callback(event);
                if (event.stopped) break;
            }
            return event;
        },
        getBoundingClientRect: () => ({ width: 800, height: 600 }),
        setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id),
        releasePointerCapture: id => captures.delete(id)
    };
}
for (const file of ['demo.js', 'upload-viewer.js']) {
    for (const rightHanded of [false, true]) {
        const engine = new BABYLON.NullEngine({ renderWidth: 800, renderHeight: 600 });
        const scene = new BABYLON.Scene(engine);
        scene.useRightHandedSystem = rightHanded;
        const camera = new BABYLON.ArcRotateCamera('test', -Math.PI / 2, 1.2, 10, BABYLON.Vector3.Zero(), scene);
        camera.lowerBetaLimit = 0.02;
        camera.upperBetaLimit = Math.PI - 0.02;
        camera.lowerRadiusLimit = 1;
        camera.upperRadiusLimit = 100;
        const buttons = Object.fromEntries(['frontButton','sideButton','topButton','perspectiveButton','rotateButton','resetButton'].map(id => [id, element()]));
        const context = vm.createContext({ BABYLON, scene, engine, camera, ...buttons,
            canvas: element(), document: { getElementById: id => buttons[id] },
            viewButtons: ['frontButton','sideButton','topButton','perspectiveButton'].map(id => buttons[id]),
            axisButtons: [], cutEnabled: false, activePresetView: null, autoRotate: true,
            interactionHelp: element(), closePanels() {}, updateCutPlane() {},
            initialCamera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.clone() }
        });
        const source = read(file);
        const presetStart = source.indexOf('function isPresetViewActive()');
        vm.runInContext(source.slice(presetStart, source.indexOf('\n}', presetStart) + 2), context);
        vm.runInContext(read('viewer-navigation.js'), context);
        vm.runInContext(source.slice(source.indexOf('function leavePresetView()'), source.indexOf('function closePanels()')), context);
        const resetStart = source.indexOf('resetButton.addEventListener(');
        vm.runInContext(source.slice(resetStart, source.indexOf('/* =====================================================', resetStart)), context);
        for (const view of ['front', 'side', 'top']) {
            buttons[view + 'Button'].fire('click');
            camera.getViewMatrix(true);
            const direction = camera.position.subtract(camera.target).normalize();
            const expected = view === 'front' ? new BABYLON.Vector3(0,0,-1) : view === 'side' ? new BABYLON.Vector3(1,0,0) : new BABYLON.Vector3(0,1,0);
            assert.ok(direction.equalsWithEpsilon(expected, 1e-10), `${file}: exact ${view} direction`);
            assert.equal(camera.mode, BABYLON.Camera.ORTHOGRAPHIC_CAMERA);
            assert.equal(camera.getProjectionMatrix(true).m[15], 1);
            const alpha = camera.alpha, beta = camera.beta;
            const oldTarget = camera.target.clone();
            const projectOrigin = () => BABYLON.Vector3.Project(BABYLON.Vector3.Zero(), BABYLON.Matrix.Identity(),
                camera.getViewMatrix(true).multiply(camera.getProjectionMatrix(true)), new BABYLON.Viewport(0,0,800,600));
            const beforePan = projectOrigin();
            context.canvas.fire('pointerdown');
            context.canvas.fire('pointermove', { clientX: 250, clientY: 220 });
            context.canvas.fire('pointerup');
            assert.ok(!oldTarget.equals(camera.target), 'drag must pan');
            const afterPan = projectOrigin();
            assert.ok(Math.abs(afterPan.x - beforePan.x - 50) < 0.001, 'pan follows horizontal drag');
            assert.ok(Math.abs(afterPan.y - beforePan.y - 20) < 0.001, 'pan follows vertical drag');
            assert.equal(context.activePresetView, view);
            assert.ok(buttons[view + 'Button'].classList.contains('active'));
            const oldWidth = camera.orthoRight - camera.orthoLeft;
            context.canvas.fire('wheel', { deltaY: -150 });
            assert.ok(camera.orthoRight - camera.orthoLeft < oldWidth, 'wheel must zoom orthographic bounds');
            const oldRadius = camera.radius;
            context.canvas.fire('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100 });
            context.canvas.fire('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 300 });
            context.canvas.fire('pointermove', { pointerId: 2, pointerType: 'touch', clientX: 350 });
            assert.ok(camera.radius < oldRadius, 'pinch must zoom');
            context.canvas.fire('pointercancel', { pointerId: 2 });
            context.canvas.fire('pointerup', { pointerId: 1 });
            camera.inertialAlphaOffset = 0.5;
            camera.inertialBetaOffset = 0.5;
            camera._checkInputs();
            assert.equal(camera.alpha, alpha);
            assert.equal(camera.beta, beta);
            buttons.rotateButton.fire('click');
            assert.equal(context.autoRotate, false);
            buttons.resetButton.fire('click');
            camera._checkInputs();
            assert.equal(context.activePresetView, view, 'center must retain preset');
            assert.equal(camera.mode, BABYLON.Camera.ORTHOGRAPHIC_CAMERA);
            assert.ok(camera.target.equalsWithEpsilon(BABYLON.Vector3.Zero()));
            assert.equal(camera.radius, context.initialCamera.radius, 'center restores the original zoom');
            camera.getViewMatrix(true);
            assert.ok(camera.position.subtract(camera.target).normalize().equalsWithEpsilon(expected, 1e-10));
            const getWidth = engine.getRenderWidth.bind(engine);
            engine.getRenderWidth = () => 400;
            scene.onBeforeCameraRenderObservable.notifyObservers(camera);
            assert.ok(Math.abs(camera.orthoRight / camera.orthoTop - 400 / 600) < 1e-10, 'resize preserves proportions');
            engine.getRenderWidth = getWidth;
        }
        buttons.perspectiveButton.fire('click');
        assert.equal(camera.mode, BABYLON.Camera.PERSPECTIVE_CAMERA);
        assert.equal(context.activePresetView, null);
        assert.equal(camera.lowerBetaLimit, 0.02);
        assert.equal(buttons.rotateButton.disabled, false);
        assert.equal(context.canvas.fire('pointerdown').stopped, undefined, 'perspective keeps native orbit input');
        camera.inertialAlphaOffset = 0.1;
        const oldAlpha = camera.alpha;
        camera._checkInputs();
        assert.notEqual(camera.alpha, oldAlpha, 'perspective can rotate again');
        engine.dispose();
    }
}
console.log('Both viewers: exact orthographic axes, mouse/touch pan, wheel/pinch zoom, preset lock, center and perspective passed (LH and RH).');
