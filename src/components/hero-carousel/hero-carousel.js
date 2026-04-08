(function () {
  function init(root) {
    const track = root.querySelector(".hc-track");
    const slides = Array.from(root.querySelectorAll(".hc-slide"));
    const prev = root.querySelector(".hc-prev");
    const next = root.querySelector(".hc-next");
    const dotsEl = root.querySelector(".hc-dots");

    if (!track || slides.length === 0) return;

    let index = 0;
    const autoplay = root.getAttribute("data-autoplay") !== "false";
    const interval = parseInt(root.getAttribute("data-interval") || "6000", 10);
    let timer = null;

    function buildDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.className = "hc-dot";
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        b.addEventListener("click", () => goTo(i));
        dotsEl.appendChild(b);
      });
    }

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
      if (dotsEl) {
        Array.from(dotsEl.children).forEach((d, i) => {
          d.classList.toggle("is-active", i === index);
          d.setAttribute("aria-selected", String(i === index));
        });
      }
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
      resetTimer();
    }

    function startTimer() {
      if (!autoplay || slides.length <= 1) return;
      stopTimer();
      timer = setInterval(() => goTo(index + 1), interval);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function resetTimer() {
      if (timer) {
        startTimer();
      }
    }

    prev && prev.addEventListener("click", () => goTo(index - 1));
    next && next.addEventListener("click", () => goTo(index + 1));

    root.addEventListener("mouseenter", stopTimer);
    root.addEventListener("mouseleave", startTimer);
    root.addEventListener("focusin", stopTimer);
    root.addEventListener("focusout", startTimer);

    buildDots();
    update();
    startTimer();
  }

  function bootstrap() {
    document.querySelectorAll(".hero-carousel").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
  document.addEventListener("componentsRendered", bootstrap);
})();