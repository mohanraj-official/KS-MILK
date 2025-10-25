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

  // Cancel button → go to home page
  const cancelBtn = document.querySelector(".cancel-btn");
  cancelBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "index.html";
  });

  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get all form values
    const productName = document.getElementById("productName").value.trim();
    const productPrice = document.getElementById("productPrice").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const address = document.getElementById("address").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const quantityInput = document.getElementById("quantity");
    const quantity = parseFloat(quantityInput.value);
    const phone = document.getElementById("phone").value.trim();

    // Check for empty fields
    if (!productName || !productPrice || !fullName || !address || !landmark || !quantity || !phone) {
        alert("⚠️ Please fill all fields before placing the order.");
        return;
    }

    // Check quantity max
    const maxQuantity = parseFloat(quantityInput.max || 50);
    if (quantity > maxQuantity) {
      alert(`⚠️ You cannot order more than ${maxQuantity} Litres of milk.`);
      return;
    }

    // Save order to localStorage and go to confirm page
    const orderData = { productName, productPrice, fullName, address, landmark, quantity, phone };
    localStorage.setItem("pendingOrder", JSON.stringify(orderData));
    window.location.href = "confirm-order.html";
  });
}

// ---------------- Confirm Order (Store in Firestore) ----------------
onAuthStateChanged(auth, (user) => {
  const confirmBtn = document.querySelector(".confirm-btn");
  if (!confirmBtn) return;

  const order = JSON.parse(localStorage.getItem("pendingOrder"));

  if (order) {
    document.querySelector(".order-summary").innerHTML = `
      <p><b>Product:</b> ${order.productName}</p>
      <p><b>Price:</b> ${order.productPrice}</p>
      <p><b>Name:</b> ${order.fullName}</p>
      <p><b>Address:</b> ${order.address}</p>
      <p><b>Landmark:</b> ${order.landmark}</p>
      <p><b>Quantity:</b> ${order.quantity} L</p>
      <p><b>Phone:</b> ${order.phone}</p>
    `;
  }

  confirmBtn.addEventListener("click", async () => {
    if (!user) {
      alert("Please login to confirm your order.");
      window.location.href = "login.html";
      return;
    }

    try {
      const orderRef = doc(db, "orders", `${user.uid}_${Date.now()}`);

      await setDoc(orderRef, {
        user: user.uid,
        product: order.productName,
        price: order.productPrice,
        quantity: order.quantity,
        fullName: order.fullName,
        address: order.address,
        landmark: order.landmark,
        phone: order.phone,
        createdAt: serverTimestamp()
      });

      localStorage.removeItem("pendingOrder");
      document.getElementById("successPopup").style.display = "flex";

    } catch (err) {
      console.error("Error saving order:", err);
      alert("❌ Failed to save order. Please check your data and permissions.");
    }
  });
});

// ---------------- Success Popup Close ----------------
window.closePopup = function () {
  document.getElementById("successPopup").style.display = "none";
  window.location.href = "order-history.html";
};
