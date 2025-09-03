// ---------------- Toggle mobile menu ----------------
function toggleMenu() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
}
window.toggleMenu = toggleMenu; // if used via onclick in HTML

// ---------------- Place-order popup ----------------
const form = document.getElementById("orderForm");
const popup = document.getElementById("orderFormContainer");


if (form && popup) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();              // stop actual submit
    popup.style.display = "flex";    // show popup
    const okBtn = popup.querySelector("button");
    if (okBtn) okBtn.focus();        // accessibility
  });
}

function closeOrderPopup() {
  if (!popup) return;
  popup.style.display = "none";
  if (form) form.reset();
}
window.closeOrderPopup = closeOrderPopup;

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
window.showSuccess = showSuccess;

function closeSuccessPopup() {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "none";
  window.location.href = "index.html"; // redirect home
}
window.closeSuccessPopup = closeSuccessPopup;

// ---------------- Firebase Navbar Auth ----------------
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  const navLinks = document.querySelector(".nav-links");
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");

  if (user) {
    // Hide Login & Register
    if (loginLink)   loginLink.style.display   = "none";
    if (registerLink) registerLink.style.display = "none";

    // Add Dashboard link dynamically (no duplicates)
    let dashboardLink = document.getElementById("dashboard-link");
    if (!dashboardLink && navLinks) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="dashboard.html" id="dashboard-link">Dashboard</a>`;
      navLinks.appendChild(li);
    }

    // Add Logout link dynamically (no duplicates)
    let logoutLink = document.getElementById("logout-link");
    if (!logoutLink && navLinks) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" id="logout-link">Logout</a>`;
      navLinks.appendChild(li);

      const a = li.querySelector("a");
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          alert("You have logged out successfully.");
          // onAuthStateChanged will run again and clean the navbar
          window.location.href = "login.html";
        } catch (err) {
          alert("Logout failed: " + err.message);
        }
      });
    }
  } else {
    // Show Login & Register, remove Dashboard & Logout
    if (loginLink)   loginLink.style.display   = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";

    const dashboardLink = document.getElementById("dashboard-link");
    if (dashboardLink) dashboardLink.remove();

    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) logoutLink.remove();
  }
});



// Attach Order Now buttons to open popup
const orderButtons = document.querySelectorAll(".order-btn");
orderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const productCard = btn.closest(".product-card");
    const productName = productCard.querySelector("h3").textContent;

    // set product name in form
    document.getElementById("product").value = productName;

    // show popup
    if (popup) popup.style.display = "flex";
  });
});
