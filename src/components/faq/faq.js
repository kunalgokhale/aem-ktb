(function () {
  function setExpanded(item, expanded) {
    const toggle = item.querySelector(".faq-item__toggle");
    const content = item.querySelector(".faq-item__content");
    if (!toggle || !content) return;

    item.classList.toggle("is-open", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    content.setAttribute("aria-hidden", String(!expanded));

    if (expanded) {
      // Measure inner content height
      const inner = content.firstElementChild;
      const target = inner ? inner.scrollHeight : content.scrollHeight;
      content.style.maxHeight = `${target}px`;
    } else {
      content.style.maxHeight = "0px";
    }
  }

  function init(root) {
    const groups = Array.from(root.querySelectorAll(".faq-group"));
    if (groups.length === 0) return;
    if (root.__faqBound) return;
    root.__faqBound = true;

    groups.forEach(group => {
      const items = Array.from(group.querySelectorAll(".faq-item"));

      items.forEach(item => {
        const toggle = item.querySelector(".faq-item__toggle");
        if (!toggle) return;

        const initialExpanded = toggle.getAttribute("aria-expanded") === "true";
        setExpanded(item, initialExpanded);

        toggle.addEventListener("click", () => {
          const isOpen = toggle.getAttribute("aria-expanded") === "true";
          items.forEach(other => setExpanded(other, false));
          setExpanded(item, !isOpen);
        });
      });
    });

    // Recalculate open heights on resize to keep animation accurate
    let raf = 0;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.querySelectorAll(".faq-item.is-open .faq-item__content").forEach(c => {
          const inner = c.firstElementChild;
          const target = inner ? inner.scrollHeight : c.scrollHeight;
          c.style.maxHeight = `${target}px`;
        });
      });
    };
    window.addEventListener("resize", onResize);
  }

  function bootstrap() {
    document.querySelectorAll(".faq").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
  document.addEventListener("componentsRendered", bootstrap);
})();
