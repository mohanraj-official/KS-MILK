// ---------------- Toggle mobile menu ----------------
function toggleMenu() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
}
window.toggleMenu = toggleMenu; // if used via onclick in HTML

// ---------------- DOM elements ----------------
const form = document.getElementById("orderForm");
const popup = document.getElementById("orderFormContainer");
const nav = document.querySelector(".nav-links");
const ham = document.querySelector(".hamburger");

// ---------------- Firebase Imports ----------------
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Place-order form submit ----------------
if (form && popup) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const product = document.getElementById("product").value;
    const quantity = document.getElementById("quantity").value;

    try {
      await addDoc(collection(db, "orders"), {
        product,
        quantity,
        user: auth.currentUser ? auth.currentUser.uid : "guest",
        createdAt: serverTimestamp()
      });

      alert("✅ Order placed successfully!");
      closeOrderPopup();

    } catch (err) {
      console.error("❌ Error saving order:", err);
      alert("Failed to place order: " + err.message);
    }
  });
}

// ---------------- Popup handling ----------------
function closeOrderPopup() {
  if (!popup) return;
  popup.style.display = "none";
  if (form) form.reset();
}
window.closeOrderPopup = closeOrderPopup;

// Attach Order Now buttons
const orderButtons = document.querySelectorAll(".order-btn");
orderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const productCard = btn.closest(".product-card");
    const productName = productCard.querySelector("h3").textContent;

    document.getElementById("product").value = productName;
    if (popup) popup.style.display = "flex";
  });
});

// ---------------- Mobile menu helpers ----------------
if (nav) {
  nav.addEventListener("click", (e) => {
    if (e.target && e.target.tagName === "A") {
      nav.classList.remove("show");
    }
  });
}

document.addEventListener("click", (e) => {
  if (!nav || !ham) return;
  if (!nav.classList.contains("show")) return;
  if (!nav.contains(e.target) && !ham.contains(e.target)) {
    nav.classList.remove("show");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (nav && nav.classList.contains("show")) nav.classList.remove("show");
    if (popup && popup.style.display === "flex") closeOrderPopup();
  }
});

// ---------------- Confirm order popup ----------------
function showSuccess() {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "flex";
}
window.showSuccess = showSuccess;

function closeSuccessPopup() {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "none";
  window.location.href = "index.html";
}
window.closeSuccessPopup = closeSuccessPopup;

// ---------------- Firebase Navbar Auth ----------------
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    let dashboardLink = document.getElementById("dashboard-link");
    if (!dashboardLink && nav) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="dashboard.html" id="dashboard-link">Dashboard</a>`;
      nav.appendChild(li);
    }

    let logoutLink = document.getElementById("logout-link");
    if (!logoutLink && nav) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" id="logout-link">Logout</a>`;
      nav.appendChild(li);

      li.querySelector("a").addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          alert("You have logged out successfully.");
          window.location.href = "login.html";
        } catch (err) {
          alert("Logout failed: " + err.message);
        }
      });
    }

  } else {
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";

    const dashboardLink = document.getElementById("dashboard-link");
    if (dashboardLink) dashboardLink.remove();

    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) logoutLink.remove();
  }
});
