/* =====================================================
   FORMATOS SOPORTADOS
===================================================== */

const SUPPORTED_MODEL_EXTENSIONS = [
    "glb",
    "stl",
    "obj",
    "step",
    "stp"
];


/* =====================================================
   SUBIR MODELO DESDE HOME
===================================================== */

const uploadButtons =
    document.querySelectorAll(
        ".upload-trigger"
    );


const modelFileInput =
    document.getElementById(
        "modelFileInput"
    );


/* =====================================================
   EXTENSIÓN
===================================================== */

function getModelExtension(file) {

    if (
        !file ||
        !file.name
    ) {

        return "";

    }


    const parts =
        file.name
            .toLowerCase()
            .split(".");


    if (
        parts.length < 2
    ) {

        return "";

    }


    return parts.pop();

}

/* =====================================================
   LÍMITE DE PESO
===================================================== */

const MAX_MODEL_FILE_SIZE_MB =
    75;

const MAX_MODEL_FILE_SIZE_BYTES =
    MAX_MODEL_FILE_SIZE_MB *
    1024 *
    1024;


function isModelFileSizeValid(
    file
) {

    return (
        file &&
        file.size <=
        MAX_MODEL_FILE_SIZE_BYTES
    );

}


function getFileSizeMB(
    file
) {

    return (
        file.size /
        1024 /
        1024
    ).toFixed(1);

}
/* =====================================================
   VALIDAR FORMATO
===================================================== */

function isSupportedModelFile(file) {

    const extension =
        getModelExtension(file);


    return SUPPORTED_MODEL_EXTENSIONS
        .includes(
            extension
        );

}


/* =====================================================
   ABRIR EXPLORADOR
===================================================== */

uploadButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                /*
                Permite volver a elegir
                incluso el mismo archivo.
                */

                modelFileInput.value =
                    "";


                modelFileInput.click();

            }
        );

    }
);


/* =====================================================
   ARCHIVO SELECCIONADO
===================================================== */

modelFileInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];


        if (
            !file
        ) {

            return;

        }
/* =====================================================
   VALIDAR PESO MÁXIMO
===================================================== */

if (
    !isModelFileSizeValid(
        file
    )
) {

    alert(
        "El archivo pesa " +
        getFileSizeMB(file) +
        " MB.\n\n" +
        "El tamaño máximo permitido es de 75 MB."
    );


    modelFileInput.value =
        "";


    return;

}

        /* =================================================
           VALIDAR FORMATO
        ================================================= */

        if (
            !isSupportedModelFile(
                file
            )
        ) {

            alert(
                "renderiza.me acepta archivos GLB, STL, OBJ, STEP y STP."
            );


            modelFileInput.value =
                "";


            return;

        }


        try {

            await saveModelFile(
                file
            );


            window.location.href =
                "./upload.html";

        }


        catch (error) {

            console.error(

                "Error guardando modelo:",

                error

            );


            alert(
                "No pudimos preparar el modelo."
            );

        }

    }
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
                            .contains(
                                "models"
                            )
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


/* =====================================================
   GUARDAR ARCHIVO
===================================================== */

async function saveModelFile(
    file
) {

    const db =
        await openDatabase();


    const extension =
        getModelExtension(
            file
        );


    return new Promise(
        (resolve, reject) => {

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

                    file:
                        file,

                    name:
                        file.name,

                    size:
                        file.size,

                    format:
                        extension,

                    savedAt:
                        Date.now()

                },

                "currentModel"

            );


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}