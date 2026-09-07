/* Studio rendering uses the viewer's original two lighting controls. */
(() => {
    const processing = scene.imageProcessingConfiguration;
    processing.toneMappingEnabled = true;
    processing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    processing.exposure = 1;
    processing.contrast = 1;

    function syncEnvironmentRotation() {
        if (scene.environmentTexture) {
            scene.environmentTexture.rotationY = Number(lightDirectionSlider.value) * Math.PI / 180;
        }
    }

    function syncEnvironmentIntensity() {
        scene.environmentIntensity = 0.8 * Number(lightSlider.value) / 100;
    }

    // The existing handlers adjust the direct lights; these also adjust the HDRI.
    lightDirectionSlider.addEventListener('input', syncEnvironmentRotation);
    lightSlider.addEventListener('input', syncEnvironmentIntensity);
    syncEnvironmentIntensity();

    // Always load the shared environment, without adding controls to the panel.
    // The original lights remain available if the asset fails to load.
    const environment = new BABYLON.CubeTexture(
        './assets/studio.env', scene, null, false, null,
        () => {
            scene.environmentTexture = environment;
            syncEnvironmentRotation();
            syncEnvironmentIntensity();
            Object.assign(LIGHT_BASE, {hemi: 0.3, key: 1.1, fill: 0.3});
            setLightIntensity(Number(lightSlider.value));
        },
        () => environment.dispose(),
        undefined, true
    );
})();
