// Toggle mobile menu (called from HTML onclick)
function toggleMenu() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
}

/* ---------------- Place-order popup + safe DOM checks ---------------- */
const form = document.getElementById("orderForm");
const popup = document.getElementById("popup");

if (form && popup) {
  form.addEventListener("submit", function (e) {
    e.preventDefault(); // stop actual submit
    popup.style.display = "flex"; // show popup
    // move focus into popup for accessibility
    const okBtn = popup.querySelector("button");
    if (okBtn) okBtn.focus();
  });
}

function closePopup() {
  if (!popup) return;
  popup.style.display = "none";
  if (form) form.reset(); // reset after closing
}

/* ---------------- Mobile menu helpers ---------------- */
const nav = document.querySelector(".nav-links");
const ham = document.querySelector(".hamburger");

// Close mobile menu when any nav link is clicked
if (nav) {
  nav.addEventListener("click", (e) => {
    const clicked = e.target;
    if (clicked && clicked.tagName === "A") {
      nav.classList.remove("show");
    }
  });
}

// Close menu when clicking outside it (mobile)
document.addEventListener("click", (e) => {
  if (!nav || !ham) return;
  if (!nav.classList.contains("show")) return;

  // if click is outside nav and outside hamburger, close
  if (!nav.contains(e.target) && !ham.contains(e.target)) {
    nav.classList.remove("show");
  }
});

// Close menu or popup with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (nav && nav.classList.contains("show")) nav.classList.remove("show");
    if (popup && popup.style.display === "flex") closePopup();
  }
});

/* Optional: close popup when its OK button is clicked (safe check) */
if (popup) {
  const okBtn = popup.querySelector("button");
  if (okBtn) okBtn.addEventListener("click", closePopup);
}






// confirm order script
function showSuccess() {
  document.getElementById("successPopup").style.display = "flex";
}
function closePopup() {
  document.getElementById("successPopup").style.display = "none";
  window.location.href = "index.html"; // redirect home
}
