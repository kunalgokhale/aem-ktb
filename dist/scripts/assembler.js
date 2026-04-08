// function loadComponent(id, path)
async function loadComponent(id, path) {
    const mount = document.querySelector(`#${id}`);
    if (!mount) return;

    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) {
        console.error(`Failed to load component "${id}" from ${path}: ${res.status} ${res.statusText}`);
        throw new Error(`Failed to load ${id}`);
    }
    const html = await res.text();
    mount.innerHTML = html;
}

// Helper: base URL for components relative to this script (works in src and dist)
function getComponentsBaseUrl() {
    const currentScript = document.currentScript;
    const scriptUrl = currentScript
        ? new URL(currentScript.src, window.location.href)
        : new URL(window.location.href);
    return new URL("../components/", scriptUrl);
}

// Boot all components and dispatch a single event after they’re ready
function bootComponents() {
    const componentsBaseUrl = getComponentsBaseUrl();
    const components = [
        { id: "header", file: "header/header.html" },
        // Add more components here as needed
    ];

    Promise.all(
        components.map(c =>
            loadComponent(c.id, new URL(c.file, componentsBaseUrl).toString())
        )
    )
        .then(() => {
            document.dispatchEvent(new Event("componentsRendered"));
        })
        .catch(err => {
            console.error("Error loading components:", err);
            // Optionally dispatch anyway if you want downstream to continue on partial failure
            document.dispatchEvent(new Event("componentsRendered"));
        });
}

// Run boot once DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootComponents, { once: true });
} else {
    bootComponents();
}
