/* Shared technical-view navigation for the demo and uploaded models. */
function createViewerNavigation(camera, scene, engine, canvas, help) {
    const defaults = {
        lowerAlphaLimit: camera.lowerAlphaLimit, upperAlphaLimit: camera.upperAlphaLimit,
        lowerBetaLimit: camera.lowerBetaLimit, upperBetaLimit: camera.upperBetaLimit
    };
    const pointers = new Map();
    const helpLabels = Array.from(help?.querySelectorAll?.('span') || []);
    const originalHelp = helpLabels.map(label => label.textContent);
    let orthographic = false;

    function updateHelp() {
        helpLabels.forEach((label, index) => {
            label.textContent = orthographic
                ? (index === 0 ? 'Arrastrá para desplazar · Scroll para acercar' : 'Deslizá para desplazar · Pellizcá para acercar')
                : originalHelp[index];
        });
        help?.classList.remove('hidden');
    }

    function clearMotion() {
        scene.stopAnimation(camera);
        camera.inertialAlphaOffset = camera.inertialBetaOffset = camera.inertialRadiusOffset = 0;
        camera.inertialPanningX = camera.inertialPanningY = 0;
        camera.movement?.resetRotationVelocity();
        camera.movement?.resetPanVelocity();
        camera.movement?.resetZoomVelocity();
        camera.stopInterpolation?.();
    }

    function updateProjection() {
        if (!orthographic) return;
        const halfHeight = camera.radius * Math.tan(camera.fov / 2);
        const halfWidth = halfHeight * engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
        camera.orthoLeft = -halfWidth;
        camera.orthoRight = halfWidth;
        camera.orthoTop = halfHeight;
        camera.orthoBottom = -halfHeight;
    }

    function zoom(factor) {
        camera.radius = Math.min(camera.upperRadiusLimit ?? Infinity,
            Math.max(camera.lowerRadiusLimit ?? 0.001, camera.radius * factor));
        updateProjection();
    }

    function pan(dx, dy) {
        updateProjection();
        const bounds = canvas.getBoundingClientRect();
        const delta = new BABYLON.Vector3(
            -dx * (camera.orthoRight - camera.orthoLeft) / Math.max(1, bounds.width),
            dy * (camera.orthoTop - camera.orthoBottom) / Math.max(1, bounds.height), 0
        );
        const inverseView = camera.getViewMatrix().clone().invert();
        camera.target.addInPlace(BABYLON.Vector3.TransformNormal(delta, inverseView));
    }

    function gesture() {
        const points = Array.from(pointers.values()).slice(0, 2);
        if (points.length === 1) return { ...points[0], distance: 0 };
        return {
            x: (points[0].x + points[1].x) / 2,
            y: (points[0].y + points[1].y) / 2,
            distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
        };
    }

    function consume(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    // Capture before Babylon's orbit input: touch and every mouse button pan.
    canvas.addEventListener('pointerdown', event => {
        if (!orthographic) return;
        consume(event);
        help?.classList.add('hidden');
        clearMotion();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        canvas.setPointerCapture(event.pointerId);
    }, true);
    canvas.addEventListener('pointermove', event => {
        if (!orthographic || !pointers.has(event.pointerId)) return;
        consume(event);
        const before = gesture();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const after = gesture();
        pan(after.x - before.x, after.y - before.y);
        if (before.distance > 0 && after.distance > 0) zoom(before.distance / after.distance);
    }, true);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        canvas.addEventListener(type, event => {
            if (!orthographic || !pointers.has(event.pointerId)) return;
            consume(event);
            pointers.delete(event.pointerId);
            if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        }, true);
    }
    canvas.addEventListener('wheel', event => {
        if (!orthographic) return;
        consume(event);
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
        zoom(Math.exp(Math.max(-1, Math.min(1, event.deltaY * unit * 0.001))));
    }, { capture: true, passive: false });
    canvas.addEventListener('contextmenu', event => {
        if (orthographic) consume(event);
    }, true);
    scene.onBeforeCameraRenderObservable.add(updateProjection);

    return {
        clearMotion,
        setOrthographic(viewName, alpha, beta) {
            clearMotion();
            pointers.clear();
            orthographic = true;
            camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
            // A different up vector makes the top view exact, avoiding the orbit pole epsilon.
            camera.upVector = viewName === 'top' ? new BABYLON.Vector3(0, 0, 1) : BABYLON.Vector3.Up();
            camera.alpha = alpha;
            camera.beta = viewName === 'top' ? Math.PI / 2 : beta;
            camera.lowerAlphaLimit = camera.upperAlphaLimit = camera.alpha;
            camera.lowerBetaLimit = camera.upperBetaLimit = camera.beta;
            updateProjection();
            updateHelp();
        },
        setPerspective() {
            clearMotion();
            pointers.clear();
            orthographic = false;
            camera.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;
            camera.upVector = BABYLON.Vector3.Up();
            Object.assign(camera, defaults);
            updateHelp();
        }
    };
}
