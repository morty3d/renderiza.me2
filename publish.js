document.addEventListener(
    "DOMContentLoaded",
    () => {


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


        let activePlan =
            null;



        /* =====================================================
           SELECCIONAR PLAN
        ====================================================== */

        planCards.forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {


                        planCards.forEach(
                            item => {

                                item
                                    .classList
                                    .remove(
                                        "selected"
                                    );

                            }
                        );


                        card
                            .classList
                            .add(
                                "selected"
                            );


                        const duration =
                            card.dataset.duration;


                        const price =
                            Number(
                                card.dataset.price
                            );


                        activePlan = {

                            id:
                                card.dataset.plan,

                            duration:
                                duration,

                            price:
                                price

                        };


                        selectedPlan.textContent =

                            `${duration} · $${price.toLocaleString("es-AR")}`;


                        payButton.disabled =
                            false;

                    }
                );

            }
        );



        /* =====================================================
           PAGAR

           Mercado Pago lo conectamos después.
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

                    "Plan seleccionado:",

                    activePlan

                );


                alert(

                    `Plan seleccionado:\n\n` +

                    `${activePlan.duration}\n` +

                    `$${activePlan.price.toLocaleString("es-AR")}\n\n` +

                    `Siguiente paso: Mercado Pago.`

                );

            }
        );


    }
);