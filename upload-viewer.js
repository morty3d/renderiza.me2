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

const modelName =
    document.getElementById("modelName");


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


const publishButton =
    document.getElementById("publishButton");


const axisButtons =
    document.querySelectorAll(".axis-button");

const viewButtons =
    document.querySelectorAll(".view-button");

const interactionHelp =
    document.getElementById(
        "interactionHelp"
    );


/* =====================================================
   INDEXED DB
===================================================== */

function openDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    "renderizaDB",
                    1
                );


            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;


                    if (
                        !db.objectStoreNames
                            .contains("models")
                    ) {

                        db.createObjectStore(
                            "models"
                        );

                    }

                };


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


async function getCurrentModel() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "models",
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    "models"
                );


            const request =
                store.get(
                    "currentModel"
                );


            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


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
   SCENE
===================================================== */

const scene =
    new BABYLON.Scene(
        engine
    );


scene.clearColor =
    BABYLON.Color4.FromHexString(
        "#E8E9E5FF"
    );


/* =====================================================
   CAMERA
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


camera.lowerBetaLimit = 0.02;

camera.upperBetaLimit =
    Math.PI - 0.02;


/* =====================================================
   LIGHT
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
   MODEL ROOT
===================================================== */

const modelRoot =
    new BABYLON.TransformNode(
        "modelRoot",
        scene
    );


/* =====================================================
   STATE
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
   LOADING UI
===================================================== */

function setLoadingFakeProgress(
    percent
) {

    const safePercent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    loadingProgress.style.width =
        safePercent + "%";


    loadingPercent.textContent =
        Math.round(
            safePercent
        ) + "%";

}


/* =====================================================
   LOAD USER MODEL
===================================================== */

async function loadUserModel() {

    try {

        const record =
            await getCurrentModel();


        if (
            !record ||
            !record.file
        ) {

            throw new Error(
                "No hay modelo seleccionado."
            );

        }


        const file =
            record.file;


        if (
            !file.name
                .toLowerCase()
                .endsWith(".glb")
        ) {

            throw new Error(
                "El archivo seleccionado no es GLB."
            );

        }


        modelName.textContent =
            file.name.replace(
                /\.glb$/i,
                ""
            );


        /* -----------------------------------------
           IMPORTANTE

           Pasamos el File directamente a Babylon.

           NO usamos:
           URL.createObjectURL()
           blob:
        ------------------------------------------ */


        setLoadingFakeProgress(10);


        BABYLON.SceneLoader.ImportMesh(

            "",

            "file:",

            file,

            scene,


            /* SUCCESS */

            function (
                meshes,
                particleSystems,
                skeletons,
                animationGroups
            ) {

                setLoadingFakeProgress(
                    90
                );


                prepareLoadedModel(
                    meshes,
                    animationGroups
                );

            },


            /* PROGRESS */

            function (
                event
            ) {

                /*
                Con archivos locales el navegador
                puede no informar event.total.

                Si existe, usamos el porcentaje real.
                */

                if (
                    event &&
                    event.lengthComputable &&
                    event.total > 0
                ) {

                    const percent =

                        (
                            event.loaded /
                            event.total
                        ) * 80 + 10;


                    setLoadingFakeProgress(
                        percent
                    );

                }

                else {

                    /*
                    Evitamos que la pantalla quede
                    visualmente clavada en 0%.
                    */

                    const current =
                        Number(
                            loadingPercent
                                .textContent
                                .replace(
                                    "%",
                                    ""
                                )
                        ) || 10;


                    if (
                        current < 80
                    ) {

                        setLoadingFakeProgress(
                            current + 3
                        );

                    }

                }

            },


            /* ERROR */

            function (
                scene,
                message,
                exception
            ) {

                console.error(
                    "Error cargando GLB:",
                    message,
                    exception
                );


                showLoadError(
                    message
                );

            },


            ".glb"

        );

    }

    catch (
        error
    ) {

        console.error(
            "Error:",
            error
        );


        showLoadError(
            error.message
        );

    }

}


/* =====================================================
   ERROR
===================================================== */

function showLoadError(
    message
) {

    console.error(
        message
    );


    loadingScreen
        .classList
        .add("hidden");


    errorMessage.textContent =
        "No pudimos cargar tu modelo 3D.";


    errorMessage
        .classList
        .add("visible");

}


/* =====================================================
   PREPARE MODEL
===================================================== */

function prepareLoadedModel(
    meshes,
    animationGroups
) {


    if (
        !meshes ||
        meshes.length === 0
    ) {

        showLoadError(
            "El GLB no contiene meshes."
        );

        return;

    }


    /* =================================================
       ANIMATIONS
    ================================================= */

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


    /* =================================================
       BOUNDING BOX
    ================================================= */

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


    /* =================================================
       VALIDATE BOUNDS
    ================================================= */

    if (
        !Number.isFinite(
            minimum.x
        ) ||
        !Number.isFinite(
            maximum.x
        )
    ) {

        showLoadError(
            "No fue posible calcular las dimensiones."
        );

        return;

    }


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


    /* =================================================
       CENTER

       En lugar de reparentar todos los meshes,
       movemos únicamente los meshes raíz.
    ================================================= */

    meshes.forEach(
        mesh => {

            if (
                !mesh.parent
            ) {

                mesh.position.subtractInPlace(
                    center
                );

            }

        }
    );


    /* =================================================
       CAMERA
    ================================================= */

    camera.setTarget(
        BABYLON.Vector3.Zero()
    );


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
            BABYLON.Vector3.Zero()

    };


    setLoadingFakeProgress(
        100
    );


    setTimeout(
        () => {

            loadingScreen
                .classList
                .add(
                    "hidden"
                );

        },
        250
    );

}




/* =====================================================
   AUTOROTACIÓN
===================================================== */

scene.onBeforeRenderObservable.add(
    () => {

        if (
            autoRotate
        ) {

            camera.alpha +=

                engine.getDeltaTime()
                * 0.00012;

        }

    }
);


/* =====================================================
   USER INTERACTION
===================================================== */

canvas.addEventListener(
    "pointerdown",
    () => {

        /* detener autorrotación */

        autoRotate =
            false;


        rotateButton
            .classList
            .remove(
                "active"
            );


        clearViewButtons();


        /* esconder cartel de ayuda */

        interactionHelp
            .classList
            .add(
                "hidden"
            );

    }
);


/* =====================================================
   ROTATION BUTTON
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

    }
);


/* =====================================================
   VIEWS
===================================================== */

function clearViewButtons() {

    viewButtons.forEach(
        button => {

            button
                .classList
                .remove(
                    "active"
                );

        }
    );

}


function setView(
    alpha,
    beta,
    button
) {

    autoRotate =
        false;


    rotateButton
        .classList
        .remove(
            "active"
        );


    camera.alpha =
        alpha;


    camera.beta =
        beta;


    camera.setTarget(
        BABYLON.Vector3.Zero()
    );


    clearViewButtons();


    button
        .classList
        .add(
            "active"
        );

}


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
   PANELS
===================================================== */

function closePanels() {

    cutPanel
        .classList
        .remove(
            "visible"
        );


    lightPanel
        .classList
        .remove(
            "visible"
        );


    cutButton
        .classList
        .remove(
            "active"
        );


    lightButton
        .classList
        .remove(
            "active"
        );

}


cutButton.addEventListener(
    "click",
    () => {

        const open =
            cutPanel
                .classList
                .contains(
                    "visible"
                );


        closePanels();


        if (
            !open
        ) {

            cutPanel
                .classList
                .add(
                    "visible"
                );


            cutButton
                .classList
                .add(
                    "active"
                );

        }

    }
);


lightButton.addEventListener(
    "click",
    () => {

        const open =
            lightPanel
                .classList
                .contains(
                    "visible"
                );


        closePanels();


        if (
            !open
        ) {

            lightPanel
                .classList
                .add(
                    "visible"
                );


            lightButton
                .classList
                .add(
                    "active"
                );

        }

    }
);


/* =====================================================
   CUT
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
   CUT SLIDER
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
   AXES
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
                    .add(
                        "active"
                    );


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
   REMOVE CUT
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
   LIGHT
===================================================== */

lightSlider.addEventListener(
    "input",
    () => {

        setLightIntensity(

            Number(
                lightSlider.value
            )

        );

    }
);


/* =====================================================
   RESET
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


        autoRotate =
            true;


        rotateButton
            .classList
            .add(
                "active"
            );


        clearViewButtons();

        closePanels();

        interactionHelp
    .classList
    .remove(
        "hidden"
    );

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
   PUBLISH
===================================================== */

publishButton.addEventListener(
    "click",
    () => {

        alert(
            "Siguiente paso: elegir vigencia y generar link / QR."
        );

    }
);


/* =====================================================
   RENDER LOOP
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


/* =====================================================
   START
===================================================== */

loadUserModel();
