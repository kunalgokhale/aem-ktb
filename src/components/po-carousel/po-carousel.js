(function () {
    let modal = null;
    let lastActiveElement = null;

    function ensureModal() {
        if (modal) return modal;

        const root = document.createElement("div");
        root.className = "po-video-modal";
        root.setAttribute("aria-hidden", "true");
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");

        const backdrop = document.createElement("div");
        backdrop.className = "po-video-modal__backdrop";

        const panel = document.createElement("div");
        panel.className = "po-video-modal__panel";
        panel.setAttribute("role", "document");

        const closeBtn = document.createElement("button");
        closeBtn.className = "po-video-modal__close";
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Close video");
        // closeBtn.textContent = "×";
        closeBtn.innerHTML = "<span class='close-icon'><img src='../assets/images/close.png' alt='Close video' /></span>";

        const content = document.createElement("div");
        content.className = "po-video-modal__content";

        panel.appendChild(closeBtn);
        panel.appendChild(content);
        root.appendChild(backdrop);
        root.appendChild(panel);
        document.body.appendChild(root);

        function close() {
            root.classList.remove("is-open");
            root.setAttribute("aria-hidden", "true");
            content.innerHTML = "";
            document.removeEventListener("keydown", onKeyDown);
            if (lastActiveElement && typeof lastActiveElement.focus === "function") {
                lastActiveElement.focus();
            }
            lastActiveElement = null;
        }

        function onKeyDown(e) {
            if (e.key === "Escape") close();
        }

        backdrop.addEventListener("click", close);
        closeBtn.addEventListener("click", close);

        modal = { root, content, close, onKeyDown };
        return modal;
    }

    function openVideo(url) {
        if (!url) return;
        const m = ensureModal();
        lastActiveElement = document.activeElement;

        const video = document.createElement("video");
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.src = url;

        m.content.innerHTML = "";
        m.content.appendChild(video);

        m.root.classList.add("is-open");
        m.root.setAttribute("aria-hidden", "false");
        document.addEventListener("keydown", m.onKeyDown);

        const closeBtn = m.root.querySelector(".po-video-modal__close");
        if (closeBtn && typeof closeBtn.focus === "function") closeBtn.focus();
    }

    function init(root) {
        const splideEl = root.querySelector(".po-splide");
        if (!splideEl) return;
        if (splideEl.__splideInstance) return;
        if (typeof window.Splide !== "function") return;

        const perPage = parseInt(root.getAttribute("data-per-page") || "4", 10);
        const gap = root.getAttribute("data-gap") || "18px";

        function getDynamicPadding() {
            const container = root.querySelector(".custom-container");
            if (container) {
                const rect = container.getBoundingClientRect();
                const styles = window.getComputedStyle(container);
                const paddingLeft = parseFloat(styles.paddingLeft || "0") || 0;
                return rect.left + paddingLeft;
            }

            const poCarouselTitle = root.querySelector(".po-carousel__title");
            if (!poCarouselTitle) return 0;
            return poCarouselTitle.getBoundingClientRect()?.left || 0;
        }

        let currentPadding = Math.max(0, Math.round(getDynamicPadding() || 0));
        root.style.setProperty("--po-carousel-padding", `${currentPadding}px`);

        function create(paddingPx) {
            const s = new window.Splide(splideEl, {
                type: "slide",
                rewind: true,
                perPage,
                perMove: 1,
                gap,
                arrows: false,
                pagination: true,
                drag: "free",
                snap: true,
                trimSpace: false,
                padding: { left: `${paddingPx}px`, right: `${paddingPx}px` },
                speed: 500,
                breakpoints: {
                    1200: { perPage: Math.min(3, perPage), gap: "16px" },
                    992: { perPage: Math.min(2, perPage), gap: "14px" },
                    600: { perPage: 1, gap: "12px" },
                },
            });
            s.mount();
            return s;
        }

        let splide = create(currentPadding);
        splideEl.__splideInstance = splide;

        let raf = 0;
        function updatePadding() {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const next = Math.max(0, Math.round(getDynamicPadding() || 0));
                    root.style.setProperty("--po-carousel-padding", `${next}px`);
                    if (next !== currentPadding) {
                        currentPadding = next;
                        splide.options = {
                            padding: { left: `${currentPadding}px`, right: `${currentPadding}px` },
                        };
                        splide.refresh();
                    }
                });
            });
        }

        window.addEventListener("resize", updatePadding);
        if (typeof window.ResizeObserver === "function") {
            const roTarget = root.querySelector(".custom-container") || root;
            const ro = new window.ResizeObserver(updatePadding);
            ro.observe(roTarget);
        }
        updatePadding();

        if (!root.__poCarouselBound) {
            root.__poCarouselBound = true;
            root.addEventListener("click", (e) => {
                if (splideEl.classList.contains("is-dragging")) return;
                const trigger = e.target.closest("[data-po-item=\"video\"]");
                if (!trigger || !root.contains(trigger)) return;
                const url = trigger.getAttribute("data-video-url") || trigger.getAttribute("href");
                if (!url) return;
                e.preventDefault();
                openVideo(url);
            });
        }
    }

    function bootstrap() {
        document.querySelectorAll(".po-carousel").forEach(init);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
    } else {
        bootstrap();
    }
    document.addEventListener("componentsRendered", bootstrap);
})();
