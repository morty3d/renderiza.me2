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
   ABRIR EXPLORADOR
===================================================== */

uploadButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

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


        if (!file) {
            return;
        }


        /* SOLO GLB */

        if (
            !file.name
                .toLowerCase()
                .endsWith(".glb")
        ) {

            alert(
                "Por ahora renderiza.me acepta archivos GLB."
            );

            modelFileInput.value =
                "";

            return;

        }


        try {

            await saveModelFile(file);

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
                    file: file,
                    name: file.name,
                    size: file.size,
                    savedAt: Date.now()
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
