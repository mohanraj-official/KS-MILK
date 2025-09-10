// ---------------- Toggle mobile menu ----------------
function toggleMenu() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
}
window.toggleMenu = toggleMenu; // if used via onclick in HTML








// Attach Order Now buttons to open popup
const orderButtons = document.querySelectorAll(".order-btn");
orderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const productCard = btn.closest(".product-card");
    const productName = productCard.querySelector("h3").textContent;

    // Set product name in form
    document.getElementById("product").value = productName;

    // Show popup
    if (popup) popup.style.display = "flex";
  });
});







// ---------------- Place-order form submit ----------------
import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

if (form && popup) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // stop reload

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









// Firestore DB connection
import { auth, db } from "./firebase.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



