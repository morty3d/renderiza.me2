document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =====================================================
           DOM
        ====================================================== */

        const planCards =
            document.querySelectorAll(
                ".plan-card"
            );


        const selectedPlan =
            document.getElementById(
                "selectedPlan"
            );


        const payButton =
            document.getElementById(
                "payButton"
            );


        /* =====================================================
           ESTADO
        ====================================================== */

        let activePlan =
            null;



        /* =====================================================
           FORMATEAR PRECIO
        ====================================================== */

        function formatPrice(
            price
        ) {

            return (
                "$" +
                Number(
                    price
                ).toLocaleString(
                    "es-AR"
                )
            );

        }



        /* =====================================================
           SELECCIONAR PLAN
        ====================================================== */

        planCards.forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {


                        /* =====================================
                           QUITAR SELECCIÓN ANTERIOR
                        ====================================== */

                        planCards.forEach(
                            item => {

                                item
                                    .classList
                                    .remove(
                                        "selected"
                                    );

                            }
                        );


                        /* =====================================
                           MARCAR NUEVO PLAN
                        ====================================== */

                        card
                            .classList
                            .add(
                                "selected"
                            );


                        /* =====================================
                           LEER DATOS DEL HTML
                        ====================================== */

                        const planId =
                            card.dataset.plan;


                        const duration =
                            card.dataset.duration;


                        const price =
                            Number(
                                card.dataset.price
                            );


                        /* =====================================
                           GUARDAR PLAN ACTIVO
                        ====================================== */

                        activePlan = {

                            id:
                                planId,

                            duration:
                                duration,

                            price:
                                price

                        };


                        /* =====================================
                           MOSTRAR RESUMEN
                        ====================================== */

                        selectedPlan.textContent =

                            `${duration} · ${formatPrice(price)}`;


                        /* =====================================
                           ACTIVAR BOTÓN DE PAGO
                        ====================================== */

                        payButton.disabled =
                            false;

                    }
                );

            }
        );



        /* =====================================================
           PAGAR

           Mercado Pago se conecta después.
        ====================================================== */

        payButton.addEventListener(
            "click",
            () => {


                if (
                    !activePlan
                ) {

                    return;

                }


                console.log(

                    "renderiza.me — Plan seleccionado:",

                    activePlan

                );


                /* =============================================
                   TEMPORAL

                   Después este bloque se reemplaza
                   por la creación del pago en Mercado Pago.
                ============================================= */

                alert(

                    `Publicación seleccionada\n\n` +

                    `${activePlan.duration}\n` +

                    `${formatPrice(activePlan.price)}\n\n` +

                    `Pago único · Sin suscripción\n\n` +

                    `Siguiente paso: Mercado Pago.`

                );

            }
        );


    }
);