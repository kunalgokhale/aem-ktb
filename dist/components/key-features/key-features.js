(function () {
  function init(root) {
    const splideEl = root.querySelector(".kf-splide");
    if (!splideEl) return;
    if (splideEl.__splideInstance) return;
    if (typeof window.Splide !== "function") return;

    const perPage = parseInt(root.getAttribute("data-per-page") || "3", 10);
    const gap = root.getAttribute("data-gap") || "24px";

    const splide = new window.Splide(splideEl, {
    //   type: "loop",
      perPage,
      perMove: 1,
      gap,
      pagination: false,
      arrows: true,
      drag: true,
      speed: 500,
      breakpoints: {
        992: {
          perPage: Math.min(2, perPage),
          gap: "16px",
          arrows: false,
          drag: "free",
        },
        600: { perPage: 1, gap: "12px", arrows: false, drag: "free" },
      },
    });

    splide.mount();
    splideEl.__splideInstance = splide;
  }

  function bootstrap() {
    document.querySelectorAll(".key-features").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
  document.addEventListener("componentsRendered", bootstrap);
})();
