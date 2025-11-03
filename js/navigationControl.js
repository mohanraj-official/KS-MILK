/* ==================================================
   KS MILK – Navigation Control Utility
   ================================================== */

// 🔹 Completely disable browser back navigation
export function disableBackNavigation() {
  history.pushState(null, null, window.location.href);
  window.onpopstate = () => history.go(1);
}

// 🔹 Force page reload if loaded from cache (back navigation)
export function refreshOnBack() {
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });
}

// 🔹 Optional helper: remove both behaviors
export function allowNormalNavigation() {
  window.onpopstate = null;
}
