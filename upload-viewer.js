/* =====================================================
   DOM
===================================================== */

const canvas = document.getElementById("renderCanvas");

const loadingScreen = document.getElementById("loadingScreen");
const loadingProgress = document.getElementById("loadingProgress");
const loadingPercent = document.getElementById("loadingPercent");
const errorMessage = document.getElementById("errorMessage");
const modelName = document.getElementById("modelName");

const rotateButton = document.getElementById("rotateButton");
const resetButton = document.getElementById("resetButton");
const fullscreenButton = document.getElementById("fullscreenButton");

const frontButton = document.getElementById("frontButton");
const sideButton = document.getElementById("sideButton");
const topButton = document.getElementById("topButton");

const cutButton = document.getElementById("cutButton");
const cutPanel = document.getElementById("cutPanel");
const cutSlider = document.getElementById("cutSlider");
const cutValue = document.getElementById("cutValue");
const cutReset = document.getElementById("cutReset");

const lightButton = document.getElementById("lightButton");
const lightPanel = document.getElementById("lightPanel");
const lightSlider = document.getElementById("lightSlider");
const lightValue = document.getElementById("lightValue");

const publishButton = document.getElementById("publishButton");

const axisButtons = document.querySelectorAll(".axis-button");
const viewButtons = document.querySelectorAll(".view-button");

const interactionHelp = document.getElementById("interactionHelp");

const replaceFileButton = document.getElementById("replaceFileButton");
const replaceFileInput = document.getElementById("replaceFileInput");


/* =====================================================
   CONFIGURACIÓN VISUAL
===================================================== */

/*
Plano Blueprint
*/

const CUT_PLANE_COLOR_HEX = "#1e78b3";

const CUT_PLANE_OPACITY = 1;


/*
El plano es SIEMPRE cuadrado.

Su lado se calcula tomando la dimensión
más grande del bounding box + 15%.
*/

const CUT_PLANE_SIZE_FACTOR = 1.15;


/*
Modelo durante el corte.
*/

const CUT_MODEL_OPACITY = 0.20;


/*
Contorno de intersección en perspectiva.
*/

const SECTION_BORDER_COLOR =
    BABYLON.Color3.FromHexString("#2664EB");


/*
Contorno de intersección cuando aparece
el plano Blueprint.
*/

const SECTION_BORDER_ORTHO_COLOR =
    BABYLON.Color3.FromHexString("#FFFFFF");


/*
Guía punteada en perspectiva.
*/

const CUT_GUIDE_COLOR =
    BABYLON.Color3.FromHexString("#100F0F");


/* =====================================================
   INDEXED DB
===================================================== */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                "renderizaDB",
                1
            );


        request.onupgradeneeded = event => {

            const db =
                event.target.result;


            if (
                !db.objectStoreNames.contains(
                    "models"
                )
            ) {

                db.createObjectStore(
                    "models"
                );

            }

        };


        request.onsuccess = () => {

            resolve(
                request.result
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


/* =====================================================
   GUARDAR NUEVO MODELO
===================================================== */

async function replaceStoredModel(file) {

    const db =
        await openDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                "models",
                "readwrite"
            );


        const store =
            transaction.objectStore(
                "models"
            );


        store.put(

            {
                file: file,
                name: file.name,
                size: file.size,
                savedAt: Date.now()
            },

            "currentModel"

        );


        transaction.oncomplete = () => {

            db.close();

            resolve();

        };


        transaction.onerror = () => {

            reject(
                transaction.error
            );

        };

    });

}


/* =====================================================
   OBTENER MODELO
===================================================== */

async function getCurrentModel() {

    const db =
        await openDatabase();


    return new Promise((resolve, reject) => {

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


        request.onsuccess = () => {

            db.close();

            resolve(
                request.result
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

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


camera.panningSensibility = 0;

camera.wheelDeltaPercentage = 0.01;

camera.pinchDeltaPercentage = 0.01;

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


function setLightIntensity(percent) {

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


/*
Vista actual:

null   = perspectiva
front  = frontal
side   = lateral
top    = superior
*/

let activePresetView =
    null;


/* =====================================================
   CUT STATE
===================================================== */

let cutAxis =
    "x";


let cutEnabled =
    false;


let currentCutPoint =
    BABYLON.Vector3.Zero();


/* =====================================================
   PLANO BLUEPRINT
===================================================== */

let cutVisualPlane =
    null;


let cutVisualMaterial =
    null;


/* =====================================================
   CONTORNO
===================================================== */

let sectionBorderMesh =
    null;


/* =====================================================
   GUÍA PUNTEADA
===================================================== */

let cutGuideMesh =
    null;


let cutGuideArrows =
    null;


/* =====================================================
   CACHE GEOMETRÍA
===================================================== */

let sectionGeometryCache =
    [];


/* =====================================================
   MATERIALES
===================================================== */

const originalMaterialStates =
    new Map();


/* =====================================================
   VISIBILIDAD
===================================================== */

let cutOpacityMeshes =
    [];


const originalMeshVisibility =
    new Map();


/* =====================================================
   FRAME UPDATE
===================================================== */

let sectionUpdateFrame =
    null;


/* =====================================================
   VIEW HELPERS
===================================================== */

function isPresetViewActive() {

    return (

        activePresetView === "front" ||

        activePresetView === "side" ||

        activePresetView === "top"

    );

}


/* =====================================================
   COLOR DEL CONTORNO
===================================================== */

function getCurrentSectionBorderColor() {

    if (
        isPresetViewActive()
    ) {

        return SECTION_BORDER_ORTHO_COLOR;

    }


    return SECTION_BORDER_COLOR;

}


/* =====================================================
   LOADING UI
===================================================== */

function setLoadingFakeProgress(percent) {

    const safePercent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    loadingProgress.style.width =
        safePercent +
        "%";


    loadingPercent.textContent =
        Math.round(
            safePercent
        ) +
        "%";

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


        setLoadingFakeProgress(
            10
        );


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

                animationGroups,

                transformNodes

            ) {

                setLoadingFakeProgress(
                    90
                );


                prepareLoadedModel(

                    meshes,

                    animationGroups,

                    transformNodes

                );

            },


            /* PROGRESS */

            function (event) {

                if (

                    event &&

                    event.lengthComputable &&

                    event.total > 0

                ) {

                    const percent =

                        (
                            event.loaded /
                            event.total
                        )

                        * 80 +

                        10;


                    setLoadingFakeProgress(
                        percent
                    );

                }

                else {

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

                            current +
                            3

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

    catch (error) {

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

function showLoadError(message) {

    console.error(
        message
    );


    loadingScreen
        .classList
        .add(
            "hidden"
        );


    errorMessage.textContent =
        "No pudimos cargar tu modelo 3D.";


    errorMessage
        .classList
        .add(
            "visible"
        );

}


/* =====================================================
   PREPARAR / AUTO-CENTRAR MODELO
===================================================== */

function prepareLoadedModel(

    meshes,

    animationGroups,

    transformNodes = []

) {

    /* =================================================
       VALIDAR
    ================================================= */

    if (
        !meshes ||
        meshes.length === 0
    ) {

        showLoadError(
            "El GLB no contiene geometría."
        );

        return;

    }


    /* =================================================
       ANIMACIONES
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
       JERARQUÍA
    ================================================= */

    const importedNodes = [

        ...meshes,

        ...(transformNodes || [])

    ];


    const importedNodeSet =
        new Set(
            importedNodes
        );


    const rootNodes =
        importedNodes.filter(
            node => {

                return (

                    !node.parent ||

                    !importedNodeSet.has(
                        node.parent
                    )

                );

            }
        );


    rootNodes.forEach(
        node => {

            node.parent =
                modelRoot;

        }
    );


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


    let validMeshCount =
        0;


    meshes.forEach(
        mesh => {

            if (
                !mesh.getBoundingInfo
            ) {

                return;

            }


            if (

                mesh.getTotalVertices &&

                mesh.getTotalVertices() === 0

            ) {

                return;

            }


            mesh.computeWorldMatrix(
                true
            );


            const boundingBox =
                mesh
                    .getBoundingInfo()
                    .boundingBox;


            minimum =
                BABYLON.Vector3.Minimize(

                    minimum,

                    boundingBox.minimumWorld

                );


            maximum =
                BABYLON.Vector3.Maximize(

                    maximum,

                    boundingBox.maximumWorld

                );


            validMeshCount++;

        }
    );


    /* =================================================
       VALIDAR BOUNDS
    ================================================= */

    if (

        validMeshCount === 0 ||

        !Number.isFinite(
            minimum.x
        ) ||

        !Number.isFinite(
            maximum.x
        )

    ) {

        showLoadError(
            "No pudimos calcular las dimensiones del modelo."
        );

        return;

    }


    /* =================================================
       CENTRO
    ================================================= */

    const center =
        minimum
            .add(maximum)
            .scale(0.5);


    /* =================================================
       DIMENSIONES
    ================================================= */

    const dimensions =
        maximum
            .subtract(
                minimum
            );


    modelDimensions = {

        x:
            Math.max(
                dimensions.x,
                0.000001
            ),

        y:
            Math.max(
                dimensions.y,
                0.000001
            ),

        z:
            Math.max(
                dimensions.z,
                0.000001
            )

    };


    /* =================================================
       AUTO-CENTRAR
    ================================================= */

    modelRoot.position.set(

        -center.x,

        -center.y,

        -center.z

    );


    modelRoot.computeWorldMatrix(
        true
    );


    meshes.forEach(
        mesh => {

            if (
                mesh.computeWorldMatrix
            ) {

                mesh.computeWorldMatrix(
                    true
                );

            }

        }
    );


    /* =================================================
       PREPARAR CUTTING
    ================================================= */

    prepareCutSystem(
        meshes
    );


    /* =================================================
       CÁMARA
    ================================================= */

    camera.setTarget(
        BABYLON.Vector3.Zero()
    );


    const boundingRadius =
        Math.max(

            dimensions.length() /
            2,

            0.000001

        );


    const renderWidth =
        Math.max(

            engine.getRenderWidth(),

            1

        );


    const renderHeight =
        Math.max(

            engine.getRenderHeight(),

            1

        );


    const aspect =
        renderWidth /
        renderHeight;


    const verticalFov =
        camera.fov;


    const horizontalFov =

        2 *

        Math.atan(

            Math.tan(
                verticalFov /
                2
            )

            *

            aspect

        );


    const limitingFov =
        Math.min(

            verticalFov,

            horizontalFov

        );


    let fittedRadius =

        boundingRadius /

        Math.sin(
            limitingFov /
            2
        );


    fittedRadius *=
        1.18;


    if (

        !Number.isFinite(
            fittedRadius
        ) ||

        fittedRadius <= 0

    ) {

        fittedRadius =
            5;

    }


    camera.radius =
        fittedRadius;


    camera.lowerRadiusLimit =
        Math.max(

            boundingRadius *
            0.20,

            0.000001

        );


    camera.upperRadiusLimit =
        fittedRadius *
        10;


    camera.minZ =
        Math.max(

            boundingRadius /
            10000,

            0.000001

        );


    camera.maxZ =
        Math.max(

            fittedRadius *
            1000,

            100

        );


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


    console.log(
        "renderiza.me — Modelo cargado"
    );


    console.log(
        "Dimensiones:",
        modelDimensions
    );


    console.log(
        "Centro original:",
        center
    );


    console.log(
        "Radio visual:",
        boundingRadius
    );


    console.log(
        "Distancia cámara:",
        fittedRadius
    );


    /* =================================================
       TERMINAR CARGA
    ================================================= */

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
   SALIR DE VISTA PREDEFINIDA
===================================================== */

function leavePresetView() {

    activePresetView =
        null;


    viewButtons.forEach(
        button => {

            button
                .classList
                .remove(
                    "active"
                );

        }
    );


    /*
    Al volver a perspectiva:

    - desaparece Blueprint
    - contorno vuelve a azul
    - reaparece guía punteada
    */

    if (
        cutEnabled
    ) {

        updateCutPlane();

    }

}


/* =====================================================
   INTERACCIÓN CON CANVAS
===================================================== */

canvas.addEventListener(
    "pointerdown",
    () => {

        autoRotate =
            false;


        rotateButton
            .classList
            .remove(
                "active"
            );


        leavePresetView();


        interactionHelp
            .classList
            .add(
                "hidden"
            );

    }
);


/* =====================================================
   AUTOROTATE BUTTON
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

            leavePresetView();

        }

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


    activePresetView =
        null;

}


/* =====================================================
   SINCRONIZAR EJE
===================================================== */

function setCutAxisState(axis) {

    cutAxis =
        axis;


    axisButtons.forEach(
        button => {

            button.classList.toggle(

                "active",

                button.dataset.axis ===
                    axis

            );

        }
    );

}


/* =====================================================
   CAMBIAR VISTA
===================================================== */

function setView(

    alpha,

    beta,

    button,

    viewName

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


    activePresetView =
        viewName;


    button
        .classList
        .add(
            "active"
        );


    /*
    IMPORTANTE:

    Frontal
        cámara mira eje Z
        corte Z
        plano XY

    Lateral
        cámara mira eje X
        corte X
        plano YZ

    Superior
        cámara mira eje Y
        corte Y
        plano XZ
    */

    if (
        viewName === "front"
    ) {

        setCutAxisState(
            "z"
        );

    }

    else if (
        viewName === "side"
    ) {

        setCutAxisState(
            "x"
        );

    }

    else if (
        viewName === "top"
    ) {

        setCutAxisState(
            "y"
        );

    }


    if (
        cutEnabled
    ) {

        updateCutPlane();

    }

}


/* =====================================================
   FRONTAL
===================================================== */

frontButton.addEventListener(
    "click",
    () => {

        setView(

            -Math.PI / 2,

            Math.PI / 2,

            frontButton,

            "front"

        );

    }
);


/* =====================================================
   LATERAL
===================================================== */

sideButton.addEventListener(
    "click",
    () => {

        setView(

            0,

            Math.PI / 2,

            sideButton,

            "side"

        );

    }
);


/* =====================================================
   SUPERIOR
===================================================== */

topButton.addEventListener(
    "click",
    () => {

        setView(

            -Math.PI / 2,

            0.02,

            topButton,

            "top"

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


    lightButton
        .classList
        .remove(
            "active"
        );


    /*
    El estado visual del botón Cortes
    depende del estado REAL del clipping.
    */

    cutButton.classList.toggle(

        "active",

        cutEnabled

    );

}


/* =====================================================
   BOTÓN CORTES

   Ahora sí activa/desactiva TODO.
===================================================== */

cutButton.addEventListener(
    "click",
    () => {

        /* =============================================
           SI ESTÁ ACTIVO -> DESACTIVAR
        ============================================= */

        if (
            cutEnabled
        ) {

            cutEnabled =
                false;


            cutPanel
                .classList
                .remove(
                    "visible"
                );


            cutButton
                .classList
                .remove(
                    "active"
                );


            /*
            Esto restaura:

            - clipping
            - opacidad
            - Double Side
            - borde
            - guía
            - plano Blueprint
            */

            updateCutPlane();


            return;

        }


        /* =============================================
           ACTIVAR
        ============================================= */

        cutEnabled =
            true;


        lightPanel
            .classList
            .remove(
                "visible"
            );


        lightButton
            .classList
            .remove(
                "active"
            );


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


        updateCutPlane();

    }
);


/* =====================================================
   LIGHT BUTTON
===================================================== */

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
   PREPARAR SISTEMA DE CORTE
===================================================== */

function prepareCutSystem(meshes) {

    sectionGeometryCache =
        [];


    originalMaterialStates.clear();


    cutOpacityMeshes =
        [];


    originalMeshVisibility.clear();


    meshes.forEach(
        mesh => {

            if (

                !mesh ||

                !mesh.getVerticesData ||

                !mesh.getTotalVertices

            ) {

                return;

            }


            if (
                mesh.getTotalVertices() === 0
            ) {

                return;

            }


            /* =========================================
               VISIBILIDAD
            ========================================= */

            cutOpacityMeshes.push(
                mesh
            );


            originalMeshVisibility.set(

                mesh,

                mesh.visibility

            );


            /* =========================================
               MATERIAL
            ========================================= */

            collectCutMaterials(
                mesh.material
            );


            /* =========================================
               POSICIONES
            ========================================= */

            const positions =
                mesh.getVerticesData(

                    BABYLON.VertexBuffer
                        .PositionKind

                );


            if (
                !positions ||
                positions.length === 0
            ) {

                return;

            }


            /* =========================================
               ÍNDICES
            ========================================= */

            let indices =
                mesh.getIndices();


            if (
                !indices ||
                indices.length === 0
            ) {

                indices =
                    [];


                const vertexCount =
                    positions.length /
                    3;


                for (
                    let i = 0;
                    i < vertexCount;
                    i++
                ) {

                    indices.push(
                        i
                    );

                }

            }


            /* =========================================
               MATRIZ WORLD
            ========================================= */

            mesh.computeWorldMatrix(
                true
            );


            const worldMatrix =
                mesh
                    .getWorldMatrix()
                    .clone();


            /* =========================================
               WORLD POSITIONS
            ========================================= */

            const worldPositions =
                new Float32Array(
                    positions.length
                );


            const source =
                BABYLON.Vector3.Zero();


            const transformed =
                BABYLON.Vector3.Zero();


            for (
                let i = 0;
                i < positions.length;
                i += 3
            ) {

                source.set(

                    positions[i],

                    positions[i + 1],

                    positions[i + 2]

                );


                BABYLON.Vector3
                    .TransformCoordinatesToRef(

                        source,

                        worldMatrix,

                        transformed

                    );


                worldPositions[i] =
                    transformed.x;


                worldPositions[i + 1] =
                    transformed.y;


                worldPositions[i + 2] =
                    transformed.z;

            }


            sectionGeometryCache.push({

                positions:
                    worldPositions,

                indices:
                    Array.from(
                        indices
                    )

            });

        }
    );


    /*
    Grupo 2 para contornos y guías.
    */

    scene.setRenderingAutoClearDepthStencil(

        2,

        true,

        true,

        false

    );

}


/* =====================================================
   RECOLECTAR MATERIALES
===================================================== */

function collectCutMaterials(material) {

    if (
        !material
    ) {

        return;

    }


    if (

        material.subMaterials &&

        material.subMaterials.length

    ) {

        material.subMaterials.forEach(
            subMaterial => {

                collectCutMaterials(
                    subMaterial
                );

            }
        );


        return;

    }


    if (
        originalMaterialStates.has(
            material
        )
    ) {

        return;

    }


    originalMaterialStates.set(

        material,

        {

            backFaceCulling:
                material.backFaceCulling,

            twoSidedLighting:
                material.twoSidedLighting

        }

    );

}


/* =====================================================
   DOUBLE SIDE
===================================================== */

function setCutDoubleSided(enabled) {

    originalMaterialStates.forEach(
        (
            originalState,
            material
        ) => {

            if (
                enabled
            ) {

                material.backFaceCulling =
                    false;


                if (
                    "twoSidedLighting"
                    in material
                ) {

                    material.twoSidedLighting =
                        true;

                }

            }

            else {

                material.backFaceCulling =
                    originalState
                        .backFaceCulling;


                if (
                    "twoSidedLighting"
                    in material
                ) {

                    material.twoSidedLighting =
                        originalState
                            .twoSidedLighting;

                }

            }

        }
    );

}


/* =====================================================
   OPACIDAD MODELO
===================================================== */

function setCutModelOpacity(enabled) {

    cutOpacityMeshes.forEach(
        mesh => {

            const originalVisibility =
                originalMeshVisibility.get(
                    mesh
                );


            if (
                originalVisibility ===
                undefined
            ) {

                return;

            }


            if (
                enabled
            ) {

                mesh.visibility =

                    originalVisibility *

                    CUT_MODEL_OPACITY;

            }

            else {

                mesh.visibility =
                    originalVisibility;

            }

        }
    );

}


/* =====================================================
   OVERLAY SIN CLIPPING
===================================================== */

function makeCutOverlay(

    mesh,

    renderingGroup = 2

) {

    if (
        !mesh
    ) {

        return;

    }


    mesh.isPickable =
        false;


    mesh.renderingGroupId =
        renderingGroup;


    let previousClipPlane =
        null;


    mesh
        .onBeforeRenderObservable
        .add(
            () => {

                previousClipPlane =
                    scene.clipPlane;


                scene.clipPlane =
                    null;

            }
        );


    mesh
        .onAfterRenderObservable
        .add(
            () => {

                scene.clipPlane =
                    previousClipPlane;

            }
        );

}


/* =====================================================
   DISTANCIA AL PLANO
===================================================== */

function planeDistanceXYZ(

    x,

    y,

    z,

    plane

) {

    return (

        plane.normal.x *
        x

        +

        plane.normal.y *
        y

        +

        plane.normal.z *
        z

        +

        plane.d

    );

}


/* =====================================================
   INTERSECCIÓN ARISTA / PLANO
===================================================== */

function intersectEdgeWithPlane(

    ax,
    ay,
    az,

    bx,
    by,
    bz,

    distanceA,
    distanceB,

    epsilon

) {

    /*
    Arista completamente sobre
    el plano.
    */

    if (

        Math.abs(distanceA) <=
        epsilon

        &&

        Math.abs(distanceB) <=
        epsilon

    ) {

        return null;

    }


    /*
    Ambos puntos del mismo lado.
    */

    if (

        (
            distanceA > epsilon &&
            distanceB > epsilon
        )

        ||

        (
            distanceA < -epsilon &&
            distanceB < -epsilon
        )

    ) {

        return null;

    }


    const denominator =
        distanceA -
        distanceB;


    if (
        Math.abs(denominator) <
        epsilon
    ) {

        return null;

    }


    const t =
        distanceA /
        denominator;


    if (
        t < 0 ||
        t > 1
    ) {

        return null;

    }


    return new BABYLON.Vector3(

        ax +
        (
            bx - ax
        ) * t,

        ay +
        (
            by - ay
        ) * t,

        az +
        (
            bz - az
        ) * t

    );

}


/* =====================================================
   PUNTO ÚNICO
===================================================== */

function addUniqueSectionPoint(

    points,

    point,

    epsilon

) {

    if (
        !point
    ) {

        return;

    }


    const epsilonSquared =
        epsilon *
        epsilon;


    for (
        const existing of points
    ) {

        if (

            BABYLON.Vector3
                .DistanceSquared(

                    existing,

                    point

                )

            <=

            epsilonSquared

        ) {

            return;

        }

    }


    points.push(
        point
    );

}


/* =====================================================
   CALCULAR CONTORNO REAL
===================================================== */

function buildSectionBorder() {

    if (
        sectionBorderMesh
    ) {

        sectionBorderMesh.dispose();


        sectionBorderMesh =
            null;

    }


    if (

        !cutEnabled ||

        !scene.clipPlane

    ) {

        return;

    }


    const plane =
        scene.clipPlane;


    const maxDimension =
        Math.max(

            modelDimensions.x,

            modelDimensions.y,

            modelDimensions.z

        );


    const epsilon =
        Math.max(

            maxDimension *
            0.000001,

            0.00000001

        );


    const lines =
        [];


    sectionGeometryCache.forEach(
        geometry => {

            const positions =
                geometry.positions;


            const indices =
                geometry.indices;


            for (

                let i = 0;

                i + 2 <
                indices.length;

                i += 3

            ) {

                const i0 =
                    indices[i] *
                    3;


                const i1 =
                    indices[i + 1] *
                    3;


                const i2 =
                    indices[i + 2] *
                    3;


                const ax =
                    positions[i0];

                const ay =
                    positions[i0 + 1];

                const az =
                    positions[i0 + 2];


                const bx =
                    positions[i1];

                const by =
                    positions[i1 + 1];

                const bz =
                    positions[i1 + 2];


                const cx =
                    positions[i2];

                const cy =
                    positions[i2 + 1];

                const cz =
                    positions[i2 + 2];


                const da =
                    planeDistanceXYZ(

                        ax,
                        ay,
                        az,
                        plane

                    );


                const db =
                    planeDistanceXYZ(

                        bx,
                        by,
                        bz,
                        plane

                    );


                const dc =
                    planeDistanceXYZ(

                        cx,
                        cy,
                        cz,
                        plane

                    );


                /*
                Triángulo completamente
                de un lado.
                */

                if (

                    (
                        da > epsilon &&
                        db > epsilon &&
                        dc > epsilon
                    )

                    ||

                    (
                        da < -epsilon &&
                        db < -epsilon &&
                        dc < -epsilon
                    )

                ) {

                    continue;

                }


                /*
                Triángulo coplanar.
                */

                if (

                    Math.abs(da) <= epsilon &&

                    Math.abs(db) <= epsilon &&

                    Math.abs(dc) <= epsilon

                ) {

                    continue;

                }


                const points =
                    [];


                addUniqueSectionPoint(

                    points,

                    intersectEdgeWithPlane(

                        ax,
                        ay,
                        az,

                        bx,
                        by,
                        bz,

                        da,
                        db,

                        epsilon

                    ),

                    epsilon

                );


                addUniqueSectionPoint(

                    points,

                    intersectEdgeWithPlane(

                        bx,
                        by,
                        bz,

                        cx,
                        cy,
                        cz,

                        db,
                        dc,

                        epsilon

                    ),

                    epsilon

                );


                addUniqueSectionPoint(

                    points,

                    intersectEdgeWithPlane(

                        cx,
                        cy,
                        cz,

                        ax,
                        ay,
                        az,

                        dc,
                        da,

                        epsilon

                    ),

                    epsilon

                );


                if (
                    points.length >= 2
                ) {

                    lines.push([

                        points[0],

                        points[1]

                    ]);

                }

            }

        }
    );


    if (
        lines.length === 0
    ) {

        return;

    }


    sectionBorderMesh =
        BABYLON.MeshBuilder
            .CreateLineSystem(

                "renderizaSectionBorder",

                {
                    lines:
                        lines
                },

                scene

            );


    /*
    Perspectiva -> azul
    Vistas -> blanco
    */

    sectionBorderMesh.color =
        getCurrentSectionBorderColor();


    sectionBorderMesh.alpha =
        1;


    makeCutOverlay(

        sectionBorderMesh,

        2

    );

}


/* =====================================================
   ELIMINAR GUÍA
===================================================== */

function disposeCutGuide() {

    if (
        cutGuideMesh
    ) {

        cutGuideMesh.dispose();


        cutGuideMesh =
            null;

    }


    if (
        cutGuideArrows
    ) {

        cutGuideArrows.dispose();


        cutGuideArrows =
            null;

    }

}


/* =====================================================
   LÍNEA PUNTEADA + FLECHAS

   SOLO PERSPECTIVA
===================================================== */

function buildCutGuide(point) {

    disposeCutGuide();


    if (

        !cutEnabled ||

        isPresetViewActive()

    ) {

        return;

    }


    const maxDimension =
        Math.max(

            modelDimensions.x,

            modelDimensions.y,

            modelDimensions.z

        );


    const halfLength =
        maxDimension *
        0.70;


    const offset =
        maxDimension *
        0.08;


    let start;

    let end;

    let normal;


    /* =================================================
       X
    ================================================= */

    if (
        cutAxis === "x"
    ) {

        start =
            new BABYLON.Vector3(

                point.x,

                modelDimensions.y /
                2 +
                offset,

                -halfLength

            );


        end =
            new BABYLON.Vector3(

                point.x,

                modelDimensions.y /
                2 +
                offset,

                halfLength

            );


        normal =
            new BABYLON.Vector3(
                1,
                0,
                0
            );

    }


    /* =================================================
       Y
    ================================================= */

    else if (
        cutAxis === "y"
    ) {

        start =
            new BABYLON.Vector3(

                -halfLength,

                point.y,

                modelDimensions.z /
                2 +
                offset

            );


        end =
            new BABYLON.Vector3(

                halfLength,

                point.y,

                modelDimensions.z /
                2 +
                offset

            );


        normal =
            new BABYLON.Vector3(
                0,
                1,
                0
            );

    }


    /* =================================================
       Z
    ================================================= */

    else {

        start =
            new BABYLON.Vector3(

                -halfLength,

                modelDimensions.y /
                2 +
                offset,

                point.z

            );


        end =
            new BABYLON.Vector3(

                halfLength,

                modelDimensions.y /
                2 +
                offset,

                point.z

            );


        normal =
            new BABYLON.Vector3(
                0,
                0,
                1
            );

    }


    /* =================================================
       DASHED LINE
    ================================================= */

    cutGuideMesh =
        BABYLON.MeshBuilder
            .CreateDashedLines(

                "renderizaCutGuide",

                {

                    points: [
                        start,
                        end
                    ],

                    dashNb:
                        24,

                    dashSize:
                        3,

                    gapSize:
                        2

                },

                scene

            );


    cutGuideMesh.color =
        CUT_GUIDE_COLOR;


    cutGuideMesh.alpha =
        0.72;


    makeCutOverlay(

        cutGuideMesh,

        2

    );


    /* =================================================
       FLECHAS
    ================================================= */

    const direction =
        end
            .subtract(
                start
            )
            .normalize();


    let side =
        BABYLON.Vector3.Cross(

            normal,

            direction

        );


    if (
        side.lengthSquared() <
        0.000001
    ) {

        side =
            BABYLON.Vector3.Up();

    }


    side.normalize();


    const arrowLength =
        maxDimension *
        0.055;


    const arrowWidth =
        arrowLength *
        0.45;


    const startOutDirection =
        direction.scale(
            -1
        );


    const startBase =
        start.subtract(

            startOutDirection
                .scale(
                    arrowLength
                )

        );


    const endOutDirection =
        direction;


    const endBase =
        end.subtract(

            endOutDirection
                .scale(
                    arrowLength
                )

        );


    const arrowLines = [

        [
            start,

            startBase.add(
                side.scale(
                    arrowWidth
                )
            )
        ],

        [
            start,

            startBase.subtract(
                side.scale(
                    arrowWidth
                )
            )
        ],

        [
            end,

            endBase.add(
                side.scale(
                    arrowWidth
                )
            )
        ],

        [
            end,

            endBase.subtract(
                side.scale(
                    arrowWidth
                )
            )
        ]

    ];


    cutGuideArrows =
        BABYLON.MeshBuilder
            .CreateLineSystem(

                "renderizaCutGuideArrows",

                {
                    lines:
                        arrowLines
                },

                scene

            );


    cutGuideArrows.color =
        CUT_GUIDE_COLOR;


    cutGuideArrows.alpha =
        0.85;


    makeCutOverlay(

        cutGuideArrows,

        2

    );

}


/* =====================================================
   GENERAR CUADRÍCULA BLUEPRINT

   NO USA:
   SVG
   PNG
   JPG
   ASSETS

   SE GENERA 100% POR CÓDIGO.
===================================================== */

function createBlueprintGridTexture() {

    const textureSize =
        1024;


    const texture =
        new BABYLON.DynamicTexture(

            "renderizaBlueprintGrid",

            {
                width:
                    textureSize,

                height:
                    textureSize
            },

            scene,

            false

        );


    const ctx =
        texture.getContext();


    /* =================================================
       FONDO
    ================================================= */

    ctx.clearRect(

        0,

        0,

        textureSize,

        textureSize

    );


    ctx.fillStyle =
        CUT_PLANE_COLOR_HEX;


    ctx.fillRect(

        0,

        0,

        textureSize,

        textureSize

    );


    /* =================================================
       GRID
    ================================================= */

    const divisions =
        24;


    const step =
        textureSize /
        divisions;


    for (
        let i = 0;
        i <= divisions;
        i++
    ) {

        const position =
            i *
            step;


        /*
        Cada sexta línea:
        línea principal.
        */

        const major =
            i % 6 === 0;


        ctx.beginPath();


        ctx.strokeStyle =
            major

                ? "rgba(255,255,255,0.55)"

                : "rgba(255,255,255,0.22)";


        ctx.lineWidth =
            major

                ? 2

                : 1;


        /* vertical */

        ctx.moveTo(

            position,

            0

        );


        ctx.lineTo(

            position,

            textureSize

        );


        /* horizontal */

        ctx.moveTo(

            0,

            position

        );


        ctx.lineTo(

            textureSize,

            position

        );


        ctx.stroke();

    }


    texture.update(
        false
    );


    return texture;

}


/* =====================================================
   CREAR PLANO BLUEPRINT
===================================================== */

function createCutVisualPlane() {

    if (
        cutVisualPlane
    ) {

        return;

    }


    /*
    Plano base 1 x 1.

    Después se escala uniformemente,
    por lo que SIEMPRE será cuadrado.
    */

    cutVisualPlane =
        BABYLON.MeshBuilder
            .CreatePlane(

                "renderizaCutVisualPlane",

                {

                    width:
                        1,

                    height:
                        1,

                    sideOrientation:
                        BABYLON.Mesh.DOUBLESIDE

                },

                scene

            );


    cutVisualPlane.isPickable =
        false;


    const blueprintTexture =
        createBlueprintGridTexture();


    blueprintTexture.wrapU =
        BABYLON.Texture.CLAMP_ADDRESSMODE;


    blueprintTexture.wrapV =
        BABYLON.Texture.CLAMP_ADDRESSMODE;


    /* =================================================
       MATERIAL
    ================================================= */

    cutVisualMaterial =
        new BABYLON.StandardMaterial(

            "renderizaCutVisualMaterial",

            scene

        );


    /*
    Textura creada por DynamicTexture.
    */

    cutVisualMaterial.diffuseTexture =
        blueprintTexture;


    cutVisualMaterial.emissiveTexture =
        blueprintTexture;


    cutVisualMaterial.diffuseColor =
        BABYLON.Color3.White();


    cutVisualMaterial.emissiveColor =
        BABYLON.Color3.White();


    cutVisualMaterial.specularColor =
        BABYLON.Color3.Black();


    cutVisualMaterial.disableLighting =
        true;


    cutVisualMaterial.alpha =
        CUT_PLANE_OPACITY;


    cutVisualMaterial.backFaceCulling =
        false;


    cutVisualMaterial.transparencyMode =
        BABYLON.Material
            .MATERIAL_ALPHABLEND;


    /*
    El plano no escribe profundidad.
    */

    cutVisualMaterial.disableDepthWrite =
        true;


    cutVisualPlane.material =
        cutVisualMaterial;


    cutVisualPlane.setEnabled(
        false
    );


    /*
    Plano = grupo 1
    Contornos = grupo 2
    */

    makeCutOverlay(

        cutVisualPlane,

        1

    );

}


/* =====================================================
   ACTUALIZAR PLANO BLUEPRINT
===================================================== */

function updateCutVisualPlane(point) {

    /*
    Solo aparece si:

    1. hay corte
    2. estamos en vista
       Frontal / Lateral / Superior
    */

    if (

        !cutEnabled ||

        !isPresetViewActive()

    ) {

        if (
            cutVisualPlane
        ) {

            cutVisualPlane
                .setEnabled(
                    false
                );

        }


        return;

    }


    if (
        !cutVisualPlane
    ) {

        createCutVisualPlane();

    }


    cutVisualPlane.setEnabled(
        true
    );


    /* =================================================
       POSICIÓN
    ================================================= */

    cutVisualPlane.position.copyFrom(
        point
    );


    /* =================================================
       RESET ROTACIÓN
    ================================================= */

    cutVisualPlane.rotation.set(

        0,

        0,

        0

    );


    /* =================================================
       TAMAÑO

       SIEMPRE CUADRADO.

       mayor dimensión del bounding box
       + 15%
    ================================================= */

    const largestBoundingEdge =
        Math.max(

            modelDimensions.x,

            modelDimensions.y,

            modelDimensions.z

        );


    const squareSize =
        largestBoundingEdge *
        CUT_PLANE_SIZE_FACTOR;


    cutVisualPlane.scaling.set(

        squareSize,

        squareSize,

        1

    );


    /* =================================================
       FRONTAL

       Cámara -> Z
       Plano -> XY

       CreatePlane ya nace en XY.
    ================================================= */

    if (
        activePresetView === "front"
    ) {

        cutVisualPlane.rotation.set(

            0,

            0,

            0

        );

    }


    /* =================================================
       LATERAL

       Cámara -> X
       Plano -> YZ
    ================================================= */

    else if (
        activePresetView === "side"
    ) {

        cutVisualPlane.rotation.set(

            0,

            Math.PI / 2,

            0

        );

    }


    /* =================================================
       SUPERIOR

       Cámara -> Y
       Plano -> XZ
    ================================================= */

    else if (
        activePresetView === "top"
    ) {

        cutVisualPlane.rotation.set(

            Math.PI / 2,

            0,

            0

        );

    }

}


/* =====================================================
   ACTUALIZAR VISUALES
===================================================== */

function scheduleSectionVisualUpdate(point) {

    if (
        sectionUpdateFrame
    ) {

        cancelAnimationFrame(
            sectionUpdateFrame
        );

    }


    const pointCopy =
        point.clone();


    sectionUpdateFrame =
        requestAnimationFrame(
            () => {

                sectionUpdateFrame =
                    null;


                /*
                Borde:
                siempre.
                */

                buildSectionBorder();


                /*
                Perspectiva:
                guía punteada.

                Vista:
                sin guía.
                */

                if (
                    isPresetViewActive()
                ) {

                    disposeCutGuide();

                }

                else {

                    buildCutGuide(
                        pointCopy
                    );

                }


                /*
                Blueprint:
                solo vistas.
                */

                updateCutVisualPlane(
                    pointCopy
                );

            }
        );

}


/* =====================================================
   LIMPIAR VISUALES DEL CORTE
===================================================== */

function clearSectionVisuals() {

    /*
    Cancelamos cualquier actualización
    pendiente para evitar que reaparezca
    un overlay después de apagar Cortes.
    */

    if (
        sectionUpdateFrame
    ) {

        cancelAnimationFrame(
            sectionUpdateFrame
        );


        sectionUpdateFrame =
            null;

    }


    if (
        sectionBorderMesh
    ) {

        sectionBorderMesh.dispose();


        sectionBorderMesh =
            null;

    }


    disposeCutGuide();


    if (
        cutVisualPlane
    ) {

        cutVisualPlane
            .setEnabled(
                false
            );

    }

}


/* =====================================================
   ACTUALIZAR CLIPPING PLANE
===================================================== */

function updateCutPlane() {

    /* =================================================
       CORTE APAGADO
    ================================================= */

    if (
        !cutEnabled
    ) {

        scene.clipPlane =
            null;


        /*
        Restaurar materiales.
        */

        setCutDoubleSided(
            false
        );


        /*
        Restaurar opacidad.
        */

        setCutModelOpacity(
            false
        );


        /*
        Eliminar:
        - borde
        - guía
        - blueprint
        */

        clearSectionVisuals();


        return;

    }


    /* =================================================
       SLIDER
    ================================================= */

    const percent =
        Number(
            cutSlider.value
        ) /
        100;


    let dimension;

    let normal;


    const point =
        BABYLON.Vector3.Zero();


    /* =================================================
       X
    ================================================= */

    if (
        cutAxis === "x"
    ) {

        dimension =
            modelDimensions.x;


        point.x =
            -dimension /
            2

            +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(

                1,

                0,

                0

            );

    }


    /* =================================================
       Y
    ================================================= */

    else if (
        cutAxis === "y"
    ) {

        dimension =
            modelDimensions.y;


        point.y =
            -dimension /
            2

            +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(

                0,

                1,

                0

            );

    }


    /* =================================================
       Z
    ================================================= */

    else {

        dimension =
            modelDimensions.z;


        point.z =
            -dimension /
            2

            +

            dimension *
            percent;


        normal =
            new BABYLON.Vector3(

                0,

                0,

                1

            );

    }


    currentCutPoint.copyFrom(
        point
    );


    /* =================================================
       PLANO REAL DE CLIPPING
    ================================================= */

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


    /* =================================================
       DOUBLE SIDE
    ================================================= */

    setCutDoubleSided(
        true
    );


    /* =================================================
       MODELO 20%
    ================================================= */

    setCutModelOpacity(
        true
    );


    /* =================================================
       ACTUALIZAR VISUALES
    ================================================= */

    scheduleSectionVisualUpdate(
        point
    );

}


/* =====================================================
   CUT SLIDER
===================================================== */

cutSlider.addEventListener(
    "input",
    () => {

        /*
        Si el usuario mueve el slider,
        el corte queda activo.
        */

        cutEnabled =
            true;


        cutButton
            .classList
            .add(
                "active"
            );


        cutValue.textContent =
            cutSlider.value +
            "%";


        updateCutPlane();

    }
);


/* =====================================================
   AXIS BUTTONS
===================================================== */

axisButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const selectedAxis =
                    button.dataset.axis;


                /*
                Si estamos en una vista ortogonal,
                mantenemos plano y cámara alineados.

                X -> Lateral
                Y -> Superior
                Z -> Frontal
                */

                if (
                    isPresetViewActive()
                ) {

                    if (
                        selectedAxis === "x"
                    ) {

                        setView(

                            0,

                            Math.PI / 2,

                            sideButton,

                            "side"

                        );

                    }


                    else if (
                        selectedAxis === "y"
                    ) {

                        setView(

                            -Math.PI / 2,

                            0.02,

                            topButton,

                            "top"

                        );

                    }


                    else {

                        setView(

                            -Math.PI / 2,

                            Math.PI / 2,

                            frontButton,

                            "front"

                        );

                    }


                    return;

                }


                /*
                Perspectiva:
                solo cambiamos eje.
                */

                setCutAxisState(
                    selectedAxis
                );


                cutEnabled =
                    true;


                cutButton
                    .classList
                    .add(
                        "active"
                    );


                updateCutPlane();

            }
        );

    }
);


/* =====================================================
   X DEL SLIDER / QUITAR CORTE
===================================================== */

cutReset.addEventListener(
    "click",
    () => {

        cutEnabled =
            false;


        cutSlider.value =
            50;


        cutValue.textContent =
            "50%";


        cutPanel
            .classList
            .remove(
                "visible"
            );


        cutButton
            .classList
            .remove(
                "active"
            );


        /*
        Misma restauración que apagar
        el botón Cortes.
        */

        updateCutPlane();

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
   RESET / CENTRAR
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


        /*
        Volvemos a perspectiva.
        */

        clearViewButtons();


        /*
        Si hay corte activo:

        desaparece Blueprint
        y vuelve el modo perspectiva.
        */

        if (
            cutEnabled
        ) {

            updateCutPlane();

        }


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

        catch (error) {

            console.error(
                error
            );

        }

    }
);


/* =====================================================
   PUBLICAR
===================================================== */

publishButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./publish.html";

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
   REEMPLAZAR ARCHIVO
===================================================== */

replaceFileButton.addEventListener(
    "click",
    () => {

        /*
        Permite seleccionar incluso
        nuevamente el mismo archivo.
        */

        replaceFileInput.value =
            "";


        replaceFileInput.click();

    }
);


replaceFileInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];


        if (
            !file
        ) {

            return;

        }


        /* =================================================
           VALIDAR GLB
        ================================================= */

        if (
            !file.name
                .toLowerCase()
                .endsWith(
                    ".glb"
                )
        ) {

            alert(
                "Seleccioná un archivo en formato GLB."
            );


            return;

        }


        try {

            loadingScreen
                .classList
                .remove(
                    "hidden"
                );


            setLoadingFakeProgress(
                10
            );


            await replaceStoredModel(
                file
            );


            /*
            Recargar visor completo.

            Limpia:
            - modelo anterior
            - clipping
            - overlays
            - materiales
            - cámara
            */

            window.location.reload();

        }

        catch (error) {

            console.error(

                "Error reemplazando GLB:",

                error

            );


            loadingScreen
                .classList
                .add(
                    "hidden"
                );


            alert(
                "No pudimos reemplazar el archivo."
            );

        }

    }
);


/* =====================================================
   START
===================================================== */

loadUserModel();