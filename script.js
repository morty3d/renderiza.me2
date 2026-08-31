document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =====================================================
           NAVBAR
        ====================================================== */

        const navbar =
            document.querySelector(
                ".navbar"
            );


        const updateNavbar = () => {

            if (
                !navbar
            ) {

                return;

            }


            const scrollY =
                window.scrollY;


            /* =================================================
               BORDE / ESTADO SCROLL
            ================================================= */

            navbar.classList.toggle(

                "is-scrolled",

                scrollY > 8

            );


            /* =================================================
               CTA SUBIR MI 3D

               Arriba del todo:
               oculto.

               Después de 20px:
               visible.
            ================================================= */

            navbar.classList.toggle(

                "show-upload-cta",

                scrollY > 20

            );

        };


        /*
        Estado inicial.
        */

        updateNavbar();


        window.addEventListener(

            "scroll",

            updateNavbar,

            {
                passive: true
            }

        );



        /* =====================================================
           MENÚ MOBILE
        ====================================================== */

        const menuToggle =
            document.querySelector(
                ".menu-toggle"
            );


        const mobileMenu =
            document.querySelector(
                ".mobile-menu"
            );


        const closeMobileMenu = () => {

            if (
                !menuToggle ||
                !mobileMenu
            ) {

                return;

            }


            menuToggle
                .classList
                .remove(
                    "is-open"
                );


            mobileMenu
                .classList
                .remove(
                    "is-open"
                );


            menuToggle.setAttribute(

                "aria-expanded",

                "false"

            );


            menuToggle.setAttribute(

                "aria-label",

                "Abrir menú"

            );


            document.body
                .classList
                .remove(
                    "menu-open"
                );

        };


        if (
            menuToggle &&
            mobileMenu
        ) {

            menuToggle.addEventListener(
                "click",
                () => {

                    const isOpen =
                        mobileMenu
                            .classList
                            .toggle(
                                "is-open"
                            );


                    menuToggle
                        .classList
                        .toggle(

                            "is-open",

                            isOpen

                        );


                    menuToggle.setAttribute(

                        "aria-expanded",

                        String(
                            isOpen
                        )

                    );


                    menuToggle.setAttribute(

                        "aria-label",

                        isOpen
                            ? "Cerrar menú"
                            : "Abrir menú"

                    );


                    document.body
                        .classList
                        .toggle(

                            "menu-open",

                            isOpen

                        );

                }
            );


            mobileMenu
                .querySelectorAll(
                    "a"
                )
                .forEach(
                    link => {

                        link.addEventListener(

                            "click",

                            closeMobileMenu

                        );

                    }
                );


            window.addEventListener(
                "resize",
                () => {

                    if (
                        window.innerWidth >
                        1100
                    ) {

                        closeMobileMenu();

                    }

                }
            );

        }



        /* =====================================================
           NAV ACTIVA SEGÚN SECCIÓN
        ====================================================== */

        const navLinks =
            document.querySelectorAll(
                '.nav-links a[href^="#"]'
            );


        const sections =
            document.querySelectorAll(
                "main section[id]"
            );


        if (

            "IntersectionObserver"
            in window

            &&

            navLinks.length

            &&

            sections.length

        ) {

            const observer =
                new IntersectionObserver(
                    entries => {

                        const visibleSection =
                            entries

                                .filter(
                                    entry =>
                                        entry.isIntersecting
                                )

                                .sort(
                                    (a, b) =>
                                        b.intersectionRatio -
                                        a.intersectionRatio
                                )[0];


                        if (
                            !visibleSection
                        ) {

                            return;

                        }


                        const currentId =
                            visibleSection
                                .target
                                .id;


                        navLinks.forEach(
                            link => {

                                const href =
                                    link.getAttribute(
                                        "href"
                                    );


                                link.classList.toggle(

                                    "is-active",

                                    href ===
                                        `#${currentId}`

                                );

                            }
                        );

                    },

                    {

                        rootMargin:
                            "-30% 0px -55% 0px",

                        threshold:
                            [
                                0,
                                0.15,
                                0.35,
                                0.6
                            ]

                    }
                );


            sections.forEach(
                section => {

                    observer.observe(
                        section
                    );

                }
            );

        }



        /* =====================================================
           FAQ — SOLO UNA ABIERTA
        ====================================================== */

        const faqItems =
            document.querySelectorAll(
                ".faq details"
            );


        faqItems.forEach(
            item => {

                item.addEventListener(
                    "toggle",
                    () => {

                        if (
                            !item.open
                        ) {

                            return;

                        }


                        faqItems.forEach(
                            otherItem => {

                                if (
                                    otherItem !==
                                    item
                                ) {

                                    otherItem.open =
                                        false;

                                }

                            }
                        );

                    }
                );

            }
        );


    }
);