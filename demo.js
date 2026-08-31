/* =====================================================
   DOM
===================================================== */

const canvas =
    document.getElementById("renderCanvas");

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingProgress =
    document.getElementById("loadingProgress");

const loadingPercent =
    document.getElementById("loadingPercent");

const errorMessage =
    document.getElementById("errorMessage");

const interactionHelp =
    document.getElementById("interactionHelp");


const rotateButton =
    document.getElementById("rotateButton");

const resetButton =
    document.getElementById("resetButton");

const fullscreenButton =
    document.getElementById("fullscreenButton");


const frontButton =
    document.getElementById("frontButton");

const sideButton =
    document.getElementById("sideButton");

const topButton =
    document.getElementById("topButton");


const cutButton =
    document.getElementById("cutButton");

const cutPanel =
    document.getElementById("cutPanel");

const cutSlider =
    document.getElementById("cutSlider");

const cutValue =
    document.getElementById("cutValue");

const cutReset =
    document.getElementById("cutReset");


const lightButton =
    document.getElementById("lightButton");

const lightPanel =
    document.getElementById("lightPanel");

const lightSlider =
    document.getElementById("lightSlider");

const lightValue =
    document.getElementById("lightValue");


const axisButtons =
    document.querySelectorAll(".axis-button");

const viewButtons =
    document.querySelectorAll(".view-button");


/* =====================================================
   ENGINE
===================================================== */

const engine =
    new BABYLON.Engine(

        canvas,

        true,

        {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        }

    );


/* =====================================================
   ESCENA
===================================================== */

const scene =
    new BABYLON.Scene(engine);


scene.clearColor =
    BABYLON.Color4.FromHexString(
        "#E8E9E5FF"
    );


/* =====================================================
   CÁMARA
===================================================== */

const camera =
    new BABYLON.ArcRotateCamera(

        "camera",

        -Math.PI / 2,

        Math.PI / 2.35,

        5,

        BABYLON.Vector3.Zero(),

        scene

    );


camera.attachControl(
    canvas,
    true
);


camera.wheelPrecision = 45;

camera.pinchPrecision = 75;

camera.panningSensibility = 0;


camera.lowerBetaLimit =
    0.02;


camera.upperBetaLimit =
    Math.PI - 0.02;


/* =====================================================
   ILUMINACIÓN
===================================================== */

const hemiLight =
    new BABYLON.HemisphericLight(

        "hemiLight",

        new BABYLON.Vector3(
            0,
            1,
            0
        ),

        scene

    );


const keyLight =
    new BABYLON.DirectionalLight(

        "keyLight",

        new BABYLON.Vector3(
            -1,
            -2,
            -1
        ),

        scene

    );


keyLight.position =
    new BABYLON.Vector3(
        5,
        8,
        5
    );


const fillLight =
    new BABYLON.DirectionalLight(

        "fillLight",

        new BABYLON.Vector3(
            1,
            -1,
            1
        ),

        scene

    );


fillLight.position =
    new BABYLON.Vector3(
        -5,
        4,
        -5
    );


const LIGHT_BASE = {

    hemi: 1.25,

    key: 1.2,

    fill: 0.55

};


function setLightIntensity(
    percent
) {

    const factor =
        percent / 100;


    hemiLight.intensity =
        LIGHT_BASE.hemi *
        factor;


    keyLight.intensity =
        LIGHT_BASE.key *
        factor;


    fillLight.intensity =
        LIGHT_BASE.fill *
        factor;


    lightValue.textContent =
        Math.round(percent) +
        "%";

}


setLightIntensity(100);


/* =====================================================
   MODELO ROOT
===================================================== */

const modelRoot =
    new BABYLON.TransformNode(
        "modelRoot",
        scene
    );


/* =====================================================
   ESTADO
===================================================== */

let autoRotate =
    true;


let initialCamera = {

    alpha:
        camera.alpha,

    beta:
        camera.beta,

    radius:
        camera.radius,

    target:
        BABYLON.Vector3.Zero()

};


let modelDimensions = {

    x: 1,

    y: 1,

    z: 1

};


let cutAxis =
    "x";


let cutEnabled =
    false;


/* =====================================================
   CARGAR MODELO
===================================================== */

BABYLON.SceneLoader.ImportMesh(

    "",

    "./assets/",

    "modelo.glb",

    scene,


    /* =============================================
       MODELO CARGADO
    ============================================= */

    function (
        meshes,
        particleSystems,
        skeletons,
        animationGroups
    ) {


        /* PARENT */

        meshes.forEach(

            mesh => {


                if (
                    !mesh.parent
                ) {

                    mesh.parent =
                        modelRoot;

                }

            }

        );


        /* ANIMACIONES */

        if (
            animationGroups &&
            animationGroups.length
        ) {


            animationGroups.forEach(

                animation => {


                    animation.start(
                        true
                    );

                }

            );

        }


        /* =========================================
           BOUNDING BOX
        ========================================= */

        let minimum =
            new BABYLON.Vector3(

                Number.POSITIVE_INFINITY,

                Number.POSITIVE_INFINITY,

                Number.POSITIVE_INFINITY

            );


        let maximum =
            new BABYLON.Vector3(

                Number.NEGATIVE_INFINITY,

                Number.NEGATIVE_INFINITY,

                Number.NEGATIVE_INFINITY

            );


        meshes.forEach(

            mesh => {


                if (
                    !mesh.getBoundingInfo
                ) {

                    return;

                }


                mesh.computeWorldMatrix(
                    true
                );


                const box =
                    mesh
                    .getBoundingInfo()
                    .boundingBox;


                minimum =
                    BABYLON.Vector3.Minimize(

                        minimum,

                        box.minimumWorld

                    );


                maximum =
                    BABYLON.Vector3.Maximize(

                        maximum,

                        box.maximumWorld

                    );

            }

        );


        /* =========================================
           CENTRO Y DIMENSIONES
        ========================================= */

        const center =

            minimum
            .add(maximum)
            .scale(.5);


        const dimensions =

            maximum
            .subtract(minimum);


        modelDimensions = {

            x:
                Math.max(
                    dimensions.x,
                    .001
                ),

            y:
                Math.max(
                    dimensions.y,
                    .001
                ),

            z:
                Math.max(
                    dimensions.z,
                    .001
                )

        };


        let size =
            Math.max(

                dimensions.x,

                dimensions.y,

                dimensions.z

            );


        if (
            !Number.isFinite(size) ||
            size <= 0
        ) {

            size = 1;

        }


        /* =========================================
           CENTRAR MODELO
        ========================================= */

        modelRoot.position =
            center.scale(-1);


        /* =========================================
           CÁMARA
        ========================================= */

        camera.target =
            BABYLON.Vector3.Zero();


        camera.radius =
            size * 2.1;


        camera.lowerRadiusLimit =
            size * .55;


        camera.upperRadiusLimit =
            size * 7;


        camera.minZ =
            Math.max(
                .001,
                size / 10000
            );


        camera.maxZ =
            size * 1000;


        initialCamera = {

            alpha:
                camera.alpha,

            beta:
                camera.beta,

            radius:
                camera.radius,

            target:
                camera.target.clone()

        };


        /* =========================================
           FIN CARGA
        ========================================= */

        loadingProgress.style.width =
            "100%";


        loadingPercent.textContent =
            "100%";


        setTimeout(

            () => {


                loadingScreen
                    .classList
                    .add("hidden");

            },

            250

        );

    },


    /* =============================================
       PROGRESO
    ============================================= */

    function (
        event
    ) {


        if (
            !event.lengthComputable
        ) {

            return;

        }


        const percent =

            Math.round(

                (
                    event.loaded /
                    event.total
                ) * 100

            );


        loadingProgress.style.width =
            percent + "%";


        loadingPercent.textContent =
            percent + "%";

    },


    /* =============================================
       ERROR
    ============================================= */

    function (
        scene,
        message,
        exception
    ) {


        console.error(

            "Error cargando modelo:",

            message,

            exception

        );


        loadingScreen
            .classList
            .add("hidden");


        errorMessage
            .classList
            .add("visible");

    }

);


/* =====================================================
   AUTOROTACIÓN
===================================================== */

scene.onBeforeRenderObservable.add(

    () => {


        if (
            autoRotate
        ) {


            modelRoot.rotation.y +=

                engine.getDeltaTime()
                * 0.00018;

        }

    }

);


/* =====================================================
   USUARIO TOCA EL MODELO
===================================================== */

canvas.addEventListener(

    "pointerdown",

    () => {


        autoRotate =
            false;


        rotateButton
            .classList
            .remove("active");


        clearViewButtons();


        interactionHelp
            .classList
            .add("hidden");

    }

);


/* =====================================================
   AUTOROTACIÓN
===================================================== */

rotateButton.addEventListener(

    "click",

    () => {


        autoRotate =
            !autoRotate;


        rotateButton
            .classList
            .toggle(

                "active",

                autoRotate

            );


        if (
            autoRotate
        ) {

            clearViewButtons();

        }

    }

);


/* =====================================================
   VISTAS
===================================================== */

function clearViewButtons() {

    viewButtons.forEach(

        button => {


            button
                .classList
                .remove("active");

        }

    );

}


function setView(
    alpha,
    beta,
    activeButton
) {


    autoRotate =
        false;


    rotateButton
        .classList
        .remove("active");


    modelRoot.rotation =
        BABYLON.Vector3.Zero();


    camera.alpha =
        alpha;


    camera.beta =
        beta;


    camera.setTarget(
        BABYLON.Vector3.Zero()
    );


    clearViewButtons();


    activeButton
        .classList
        .add("active");

}


/* FRONTAL */

frontButton.addEventListener(

    "click",

    () => {


        setView(

            -Math.PI / 2,

            Math.PI / 2,

            frontButton

        );

    }

);


/* LATERAL */

sideButton.addEventListener(

    "click",

    () => {


        setView(

            0,

            Math.PI / 2,

            sideButton

        );

    }

);


/* SUPERIOR */

topButton.addEventListener(

    "click",

    () => {


        setView(

            -Math.PI / 2,

            .02,

            topButton

        );

    }

);


/* =====================================================
   PANELES
===================================================== */

function closePanels() {


    cutPanel
        .classList
        .remove("visible");


    lightPanel
        .classList
        .remove("visible");


    cutButton
        .classList
        .remove("active");


    lightButton
        .classList
        .remove("active");

}


/* =====================================================
   ABRIR CORTES
===================================================== */

cutButton.addEventListener(

    "click",

    () => {


        const isOpen =

            cutPanel
            .classList
            .contains("visible");


        closePanels();


        if (
            !isOpen
        ) {


            cutPanel
                .classList
                .add("visible");


            cutButton
                .classList
                .add("active");

        }

    }

);


/* =====================================================
   ABRIR LUZ
===================================================== */

lightButton.addEventListener(

    "click",

    () => {


        const isOpen =

            lightPanel
            .classList
            .contains("visible");


        closePanels();


        if (
            !isOpen
        ) {


            lightPanel
                .classList
                .add("visible");


            lightButton
                .classList
                .add("active");

        }

    }

);


/* =====================================================
   CORTE
===================================================== */

function updateCutPlane() {


    if (
        !cutEnabled
    ) {


        scene.clipPlane =
            null;


        return;

    }


    const percent =

        Number(
            cutSlider.value
        ) / 100;


    let dimension;

    let normal;

    const point =
        BABYLON.Vector3.Zero();


    /* X */

    if (
        cutAxis === "x"
    ) {


        dimension =
            modelDimensions.x;


        point.x =

            -dimension / 2 +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(
                1,
                0,
                0
            );

    }


    /* Y */

    else if (
        cutAxis === "y"
    ) {


        dimension =
            modelDimensions.y;


        point.y =

            -dimension / 2 +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(
                0,
                1,
                0
            );

    }


    /* Z */

    else {


        dimension =
            modelDimensions.z;


        point.z =

            -dimension / 2 +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(
                0,
                0,
                1
            );

    }


    const d =

        -BABYLON.Vector3.Dot(

            normal,

            point

        );


    scene.clipPlane =

        new BABYLON.Plane(

            normal.x,

            normal.y,

            normal.z,

            d

        );

}


/* =====================================================
   SLIDER CORTE
===================================================== */

cutSlider.addEventListener(

    "input",

    () => {


        cutEnabled =
            true;


        cutValue.textContent =

            cutSlider.value +
            "%";


        updateCutPlane();

    }

);


/* =====================================================
   EJES
===================================================== */

axisButtons.forEach(

    button => {


        button.addEventListener(

            "click",

            () => {


                axisButtons.forEach(

                    item => {


                        item
                            .classList
                            .remove(
                                "active"
                            );

                    }

                );


                button
                    .classList
                    .add("active");


                cutAxis =
                    button.dataset.axis;


                cutEnabled =
                    true;


                updateCutPlane();

            }

        );

    }

);


/* =====================================================
   QUITAR CORTE
===================================================== */

cutReset.addEventListener(

    "click",

    () => {


        cutEnabled =
            false;


        scene.clipPlane =
            null;


        cutSlider.value =
            50;


        cutValue.textContent =
            "50%";

    }

);


/* =====================================================
   LUZ
===================================================== */

lightSlider.addEventListener(

    "input",

    () => {


        const value =

            Number(
                lightSlider.value
            );


        setLightIntensity(
            value
        );

    }

);


/* =====================================================
   CENTRAR
===================================================== */

resetButton.addEventListener(

    "click",

    () => {


        camera.alpha =
            initialCamera.alpha;


        camera.beta =
            initialCamera.beta;


        camera.radius =
            initialCamera.radius;


        camera.setTarget(
            initialCamera.target
        );


        modelRoot.rotation =
            BABYLON.Vector3.Zero();


        autoRotate =
            true;


        rotateButton
            .classList
            .add("active");


        clearViewButtons();


        closePanels();

    }

);


/* =====================================================
   FULLSCREEN
===================================================== */

fullscreenButton.addEventListener(

    "click",

    async () => {


        try {


            if (
                !document.fullscreenElement
            ) {


                await document
                    .documentElement
                    .requestFullscreen();

            }

            else {


                await document
                    .exitFullscreen();

            }


        }

        catch (
            error
        ) {


            console.error(
                error
            );

        }

    }

);


/* =====================================================
   RENDER
===================================================== */

engine.runRenderLoop(

    () => {


        scene.render();

    }

);


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(

    "resize",

    () => {


        engine.resize();

    }

);