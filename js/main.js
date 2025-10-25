// main.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Toggle Menu ----------------
window.toggleMenu = function () {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
};

// ---------------- Navbar Auth Links ----------------
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const nav = document.querySelector(".nav-links");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    if (!document.getElementById("dashboard-link") && nav) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="dashboard.html" id="dashboard-link">Dashboard</a>`;
      nav.appendChild(li);
    }

    if (!document.getElementById("logout-link") && nav) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" id="logout-link">Logout</a>`;
      nav.appendChild(li);

      li.querySelector("a").addEventListener("click", async (e) => {
        e.preventDefault();
        await signOut(auth);
        alert("Logged out successfully.");
        window.location.href = "login.html";
      });
    }
  } else {
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";
    document.getElementById("dashboard-link")?.remove();
    document.getElementById("logout-link")?.remove();
  }
});

// ---------------- Product → Place Order ----------------
document.querySelectorAll(".order-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.getAttribute("data-name");
    const price = button.getAttribute("data-price");

    localStorage.setItem("selectedProduct", JSON.stringify({ name, price }));
    window.location.href = "place-order.html";
  });
});


// ---------------- Place Order → Confirm Order ----------------
const orderForm = document.getElementById("orderForm");
if (orderForm) {

  const submitBtn = orderForm.querySelector(".order-btn"); // Place Order button
  const cancelBtn = document.querySelector(".cancel-btn");

  // Cancel button → go home
  cancelBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "index.html";
  });

  // Function to check all fields
  const checkFields = () => {
      const productName = document.getElementById("productName").value.trim();
      const productPrice = document.getElementById("productPrice").value.trim();
      const fullName = document.getElementById("fullName").value.trim();
      const address = document.getElementById("address").value.trim();
      const landmark = document.getElementById("landmark").value.trim();
      const quantity = document.getElementById("quantity").value.trim();
      const phone = document.getElementById("phone").value.trim();

      if (productName && productPrice && fullName && address && landmark && quantity && phone) {
          submitBtn.disabled = false; // enable
      } else {
          submitBtn.disabled = true; // disable
      }
  };

  // Add input event listeners to all fields
  orderForm.querySelectorAll("input, textarea, select").forEach(field => {
      field.addEventListener("input", checkFields);
  });

  // Initial check
  checkFields();

  // Submit event
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const productName = document.getElementById("productName").value.trim();
    const productPrice = document.getElementById("productPrice").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const address = document.getElementById("address").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const quantityInput = document.getElementById("quantity");
    const quantity = parseFloat(quantityInput.value);
    const phone = document.getElementById("phone").value.trim();

    const maxQuantity = parseFloat(quantityInput.max || 50);
    if (quantity > maxQuantity) {
      alert(`⚠️ You cannot order more than ${maxQuantity} Litres of milk.`);
      return;
    }

    const orderData = { productName, productPrice, fullName, address, landmark, quantity, phone };
    localStorage.setItem("pendingOrder", JSON.stringify(orderData));
    window.location.href = "confirm-order.html";
  });
}
