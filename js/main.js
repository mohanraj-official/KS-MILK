// ---------------- Toggle mobile menu ----------------
function toggleMenu() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
}

// ---------------- Place-order popup ----------------
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

function closeOrderPopup() {
  if (!popup) return;
  popup.style.display = "none";
  if (form) form.reset(); // reset after closing
}

// ---------------- Mobile menu helpers ----------------
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
    if (popup && popup.style.display === "flex") closeOrderPopup();
  }
});

// Optional: close popup when its OK button is clicked
if (popup) {
  const okBtn = popup.querySelector("button");
  if (okBtn) okBtn.addEventListener("click", closeOrderPopup);
}

// ---------------- Confirm order popup ----------------
function showSuccess() {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "flex";
}

function closeSuccessPopup() {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "none";
  window.location.href = "index.html"; // redirect home
}

// ---------------- Firebase Navbar Auth ----------------
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  const navLinks = document.querySelector(".nav-links");
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");

  if (user) {
    // Hide Login & Register
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    // Add Dashboard link dynamically
    let dashboardLink = document.getElementById("dashboard-link");
    if (!dashboardLink && navLinks) { // prevent duplicate
      const li = document.createElement("li");
      li.innerHTML = `<a href="dashboard.html" id="dashboard-link">Dashboard</a>`;
      navLinks.appendChild(li);
    }
  } else {
    // Show Login & Register, remove Dashboard
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";

    const dashboardLink = document.getElementById("dashboard-link");
    if (dashboardLink) dashboardLink.remove();
  }
});
