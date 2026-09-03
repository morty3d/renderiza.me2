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

const lightDirectionSlider =
    document.getElementById(
        "lightDirectionSlider"
    );

const lightDirectionValue =
    document.getElementById(
        "lightDirectionValue"
    );

const lightSlider =
    document.getElementById("lightSlider");

const lightValue =
    document.getElementById("lightValue");


const axisButtons =
    document.querySelectorAll(".axis-button");

const viewButtons =
    document.querySelectorAll(".view-button");


/* =====================================================
   CONFIGURACIÓN VISUAL
===================================================== */

const CUT_PLANE_COLOR_HEX =
    "#173B70";

const CUT_PLANE_OPACITY =
    0.35;

const CUT_PLANE_SIZE_FACTOR =
    1.15;

const CUT_MODEL_OPACITY =
    0.20;

const SECTION_BORDER_COLOR =
    BABYLON.Color3.FromHexString(
        "#2664EB"
    );

const SECTION_BORDER_ORTHO_COLOR =
    BABYLON.Color3.FromHexString(
        "#FFFFFF"
    );

const CUT_GUIDE_COLOR =
    BABYLON.Color3.FromHexString(
        "#100F0F"
    );


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
    true,
    true,
    2
);


/* =====================================================
   NAVEGACIÓN
===================================================== */

/*
DESKTOP

Izquierdo + arrastrar = rotar
Derecho + arrastrar = pan
Ctrl + izquierdo = pan
Rueda = zoom
*/

camera.panningSensibility =
    800;


/*
Zoom mouse
*/

camera.wheelDeltaPercentage =
    0.01;


/*
Zoom táctil
*/

camera.pinchDeltaPercentage =
    0.01;


/*
Evita zoom táctil brusco.
*/

camera.useNaturalPinchZoom =
    true;


/*
Dos dedos:

- mover juntos = PAN
- separar / juntar = ZOOM
*/

if (
    camera.inputs &&
    camera.inputs.attached &&
    camera.inputs.attached.pointers
) {

    camera.inputs.attached.pointers.multiTouchPanAndZoom =
        true;

    camera.inputs.attached.pointers.multiTouchPanning =
        true;

    camera.inputs.attached.pointers.pinchZoom =
        true;

}

camera.lowerBetaLimit =
    0.02;

camera.upperBetaLimit =
    Math.PI - 0.02;

camera.useInputToRestoreState =
    false;
/* =====================================================
   DOBLE TOQUE MOBILE = ZOOM
===================================================== */

scene.onPointerObservable.add(
    pointerInfo => {

        if (
            pointerInfo.type !==
            BABYLON.PointerEventTypes.POINTERDOUBLETAP
        ) {

            return;

        }


        const event =
            pointerInfo.event;


        /*
        Solo touch.
        No modificamos doble click de mouse.
        */

        if (
            !event ||
            event.pointerType !== "touch"
        ) {

            return;

        }


        /*
        Evitamos el comportamiento nativo de
        restaurar cámara con doble toque.
        */

        camera.useInputToRestoreState =
            false;


        const currentRadius =
            camera.radius;


        const minimumRadius =
            camera.lowerRadiusLimit ||
            0.01;


        /*
        Cada doble toque acerca aproximadamente 30%.
        */

        const targetRadius =
            Math.max(
                currentRadius * 0.70,
                minimumRadius
            );


        /* =================================================
           ANIMACIÓN SUAVE
        ================================================= */

        BABYLON.Animation.CreateAndStartAnimation(

            "doubleTapZoom",

            camera,

            "radius",

            60,

            12,

            currentRadius,

            targetRadius,

            BABYLON.Animation
                .ANIMATIONLOOPMODE_CONSTANT,

            new BABYLON.CubicEase()

        );

    }
);

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
        Math.round(
            percent
        ) + "%";

}


setLightIntensity(
    100
);


/* =====================================================
   GIRAR LUZ
===================================================== */

/*
0° conserva exactamente la posición
original de la iluminación.

360° completa una vuelta alrededor
del modelo.
*/

const LIGHT_ORBIT_RADIUS =
    Math.sqrt(
        5 * 5 +
        5 * 5
    );


const LIGHT_BASE_ANGLE =
    Math.PI / 4;


const LIGHT_HORIZONTAL_COMPONENT =
    Math.SQRT2;


function setLightDirection(
    degrees
) {

    const safeDegrees =
        Math.max(
            0,
            Math.min(
                360,
                Number(degrees) || 0
            )
        );


    const radians =

        LIGHT_BASE_ANGLE +

        (
            safeDegrees *
            Math.PI /
            180
        );


    const cos =
        Math.cos(
            radians
        );


    const sin =
        Math.sin(
            radians
        );


    /* =================================================
       LUZ PRINCIPAL
    ================================================= */

    keyLight.position.set(
        cos *
        LIGHT_ORBIT_RADIUS,

        8,

        sin *
        LIGHT_ORBIT_RADIUS
    );


    const keyHorizontalX =
        cos *
        LIGHT_HORIZONTAL_COMPONENT;


    const keyHorizontalZ =
        sin *
        LIGHT_HORIZONTAL_COMPONENT;


    keyLight.direction.set(
        -keyHorizontalX,
        -2,
        -keyHorizontalZ
    );


    /* =================================================
       LUZ DE RELLENO
       SIEMPRE EN EL LADO CONTRARIO
    ================================================= */

    fillLight.position.set(
        -cos *
        LIGHT_ORBIT_RADIUS,

        4,

        -sin *
        LIGHT_ORBIT_RADIUS
    );


    fillLight.direction.set(
        keyHorizontalX,
        -1,
        keyHorizontalZ
    );


    /* =================================================
       UI
    ================================================= */

    lightDirectionValue.textContent =
        Math.round(
            safeDegrees
        ) + "°";

}


setLightDirection(
    0
);


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
null  = perspectiva
front = frontal
side  = lateral
top   = superior
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
   MATERIALES ORIGINALES
===================================================== */

const originalMaterialStates =
    new Map();


/* =====================================================
   VISIBILIDAD ORIGINAL
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
   LOADING
===================================================== */

function setLoadingProgress(
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
        safePercent +
        "%";


    loadingPercent.textContent =
        Math.round(
            safePercent
        ) +
        "%";

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
        .add(
            "hidden"
        );


    errorMessage
        .classList
        .add(
            "visible"
        );

}


/* =====================================================
   LOAD DEMO MODEL
===================================================== */

function loadDemoModel() {

    setLoadingProgress(
        10
    );


    BABYLON.SceneLoader.ImportMesh(

        "",

        "./assets/",

        "modelo.glb",

        scene,


        function (
            meshes,
            particleSystems,
            skeletons,
            animationGroups,
            transformNodes
        ) {

            setLoadingProgress(
                90
            );


            prepareLoadedModel(
                meshes,
                animationGroups,
                transformNodes
            );

        },


        function (
            event
        ) {

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


                setLoadingProgress(
                    percent
                );

            }

        },


        function (
            scene,
            message,
            exception
        ) {

            console.error(
                "Error cargando modelo demo:",
                message,
                exception
            );


            showLoadError(
                message
            );

        }

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
            .add(
                maximum
            )
            .scale(
                0.5
            );


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
        "renderiza.me demo — Modelo cargado"
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


    setLoadingProgress(
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


    if (
        cutEnabled
    ) {

        updateCutPlane();

    }

}


/* =====================================================
   USER INTERACTION
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


        if (
            interactionHelp
        ) {

            interactionHelp
                .classList
                .add(
                    "hidden"
                );

        }

    }
);


/* =====================================================
   ROTATE BUTTON
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

function setCutAxisState(
    axis
) {

    cutAxis =
        axis;


    axisButtons.forEach(
        button => {

            button
                .classList
                .toggle(
                    "active",
                    button.dataset.axis ===
                        axis
                );

        }
    );

}


/* =====================================================
   SET VIEW
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


    cutButton
        .classList
        .toggle(
            "active",
            cutEnabled
        );

}


/* =====================================================
   CUT BUTTON
===================================================== */

cutButton.addEventListener(
    "click",
    () => {

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


            updateCutPlane();

            return;

        }


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
   PREPARAR CUT SYSTEM
===================================================== */

function prepareCutSystem(
    meshes
) {

    sectionGeometryCache =
        [];


    originalMaterialStates
        .clear();


    cutOpacityMeshes =
        [];


    originalMeshVisibility
        .clear();


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


            cutOpacityMeshes.push(
                mesh
            );


            originalMeshVisibility.set(
                mesh,
                mesh.visibility
            );


            collectCutMaterials(
                mesh.material
            );


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


            mesh.computeWorldMatrix(
                true
            );


            const worldMatrix =
                mesh
                    .getWorldMatrix()
                    .clone();


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

function collectCutMaterials(
    material
) {

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

function setCutDoubleSided(
    enabled
) {

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

function setCutModelOpacity(
    enabled
) {

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
   DISTANCIA PUNTO / PLANO
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

    if (
        Math.abs(
            distanceA
        ) <= epsilon
        &&
        Math.abs(
            distanceB
        ) <= epsilon
    ) {

        return null;

    }


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
        Math.abs(
            denominator
        ) < epsilon
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
   AGREGAR PUNTO SIN DUPLICADOS
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
   BORDE REAL DE INTERSECCIÓN
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
                i + 2 < indices.length;
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
   BORRAR GUÍA
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
   GUÍA PUNTEADA + FLECHAS
===================================================== */

function buildCutGuide(
    point
) {

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


    const endBase =
        end.subtract(
            direction
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
   TEXTURA BLUEPRINT
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


        ctx.moveTo(
            position,
            0
        );


        ctx.lineTo(
            position,
            textureSize
        );


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


    cutVisualMaterial =
        new BABYLON.StandardMaterial(
            "renderizaCutVisualMaterial",
            scene
        );


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


    cutVisualMaterial.disableDepthWrite =
        true;


    cutVisualPlane.material =
        cutVisualMaterial;


    cutVisualPlane.setEnabled(
        false
    );


    makeCutOverlay(
        cutVisualPlane,
        1
    );

}


/* =====================================================
   ACTUALIZAR PLANO BLUEPRINT
===================================================== */

function updateCutVisualPlane(
    point
) {

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


    cutVisualPlane.position.copyFrom(
        point
    );


    cutVisualPlane.rotation.set(
        0,
        0,
        0
    );


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


    if (
        activePresetView === "front"
    ) {

        cutVisualPlane.rotation.set(
            0,
            0,
            0
        );

    }

    else if (
        activePresetView === "side"
    ) {

        cutVisualPlane.rotation.set(
            0,
            Math.PI / 2,
            0
        );

    }

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

function scheduleSectionVisualUpdate(
    point
) {

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


                buildSectionBorder();


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


                updateCutVisualPlane(
                    pointCopy
                );

            }
        );

}


/* =====================================================
   LIMPIAR VISUALES
===================================================== */

function clearSectionVisuals() {

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
   UPDATE CUT PLANE
===================================================== */

function updateCutPlane() {

    if (
        !cutEnabled
    ) {

        scene.clipPlane =
            null;


        setCutDoubleSided(
            false
        );


        setCutModelOpacity(
            false
        );


        clearSectionVisuals();


        return;

    }


    const percent =
        Number(
            cutSlider.value
        )
        /
        100;


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


    setCutDoubleSided(
        true
    );


    setCutModelOpacity(
        true
    );


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
   QUITAR CORTE
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


        updateCutPlane();

    }
);


/* =====================================================
   LUZ — GIRO
===================================================== */

lightDirectionSlider.addEventListener(
    "input",
    () => {

        setLightDirection(
            Number(
                lightDirectionSlider.value
            )
        );

    }
);


/* =====================================================
   LUZ — INTENSIDAD
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


        clearViewButtons();


        if (
            cutEnabled
        ) {

            updateCutPlane();

        }


        closePanels();


        if (
            interactionHelp
        ) {

            interactionHelp
                .classList
                .remove(
                    "hidden"
                );

        }

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

loadDemoModel();