// Initializes header once available in DOM
function initHeader() {
    const header = document.querySelector(".header");
    if (!header) return;

    // Put your header-specific JS here
    console.log("Header initialized");
    header.classList.add("is-ready");
    window.onresize = handleSubMenuOffset;
    handleSubMenuOffset();

    // Mobile menu interactions (added)
    const wrapper = header.querySelector(".mobile-menu-wrapper");
    const viewport = wrapper && wrapper.querySelector(".mm-viewport");
    const backBtn = wrapper && wrapper.querySelector(".mm-back");
    const closeBtn = header && header.querySelector(".mm-close");
    const titleEl = wrapper && wrapper.querySelector(".mm-title");
    const submenuLists = (wrapper && wrapper.querySelectorAll('.mm-level-2 .mm-list')) || [];
    const openTriggers = document.querySelectorAll('[data-mm-open="true"]');
    const openButton = document.querySelector('.mm-open');
    const closeButton = document.querySelector('.mm-close');

    function adjustMobileMenuTop() {
        if (!wrapper) return;

        wrapper.style.removeProperty("top");
        wrapper.style.removeProperty("height");
        const headerRect = header.getBoundingClientRect();
        const headerHeight = Math.round(headerRect.height);
        wrapper.style.top = `${headerHeight}px`;
        wrapper.style.height = `calc(100vh - ${headerHeight}px)`;
    }

    function openMenu() {
        if (!wrapper) return;
        adjustMobileMenuTop();
        openButton.style.display = 'none';
        closeButton.style.display = 'block';
        
        wrapper.classList.add("open");
        wrapper.setAttribute("aria-hidden", "false");
    }

    function closeMenu() {
        if (!wrapper) return;
        openButton.style.display = 'block';
        closeButton.style.display = 'none';

        wrapper.classList.remove("open", "show-level-2");
        wrapper.setAttribute("aria-hidden", "true");
    }

    function showSubmenu(key, label) {
        if (!wrapper) return;
        if (titleEl) titleEl.textContent = label || "Menu";
        submenuLists.forEach((list) => {
            const isActive = list.getAttribute("data-submenu") === key;
            list.classList.toggle("active", isActive);
        });
        wrapper.classList.add("show-level-2");
    }

    openTriggers.forEach((el) => el.addEventListener("click", openMenu));

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            wrapper.classList.remove("show-level-2");
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeMenu);
    }

    if (wrapper) {
        wrapper.addEventListener("click", (e) => {
            const itemBtn = e.target.closest(".mm-item");
            if (itemBtn) {
                const key = itemBtn.getAttribute("data-submenu");
                const labelEl = itemBtn.querySelector("span");
                const label = (labelEl && labelEl.textContent && labelEl.textContent.trim()) || "Menu";
                showSubmenu(key, label);
            }
        });
    }

    // Recalculate menu position on resize while menu is open
    window.addEventListener("resize", () => {
        if (wrapper && wrapper.classList.contains("open")) {
            adjustMobileMenuTop();
        }
    });
}

function handleSubMenuOffset() {
    const mainMenuItems = document.querySelectorAll(".main-menu-item");
    mainMenuItems.forEach(item => {
        const subMenuWrapper = item.querySelector(".sub-menu-wrapper .content");
        const mainMenuRect = item.getBoundingClientRect();
        if (subMenuWrapper) {
            subMenuWrapper.style.paddingLeft = `${mainMenuRect.left}px`;

        }
    });

}

function runHeaderInit() {
    if (document.querySelector(".header")) {
        initHeader();
    }
}

// Run on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runHeaderInit, { once: true });
    document.addEventListener("componentsRendered", runHeaderInit, { once: true });
} else {
    runHeaderInit();
}