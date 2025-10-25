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

    // Store in localStorage
    localStorage.setItem("selectedProduct", JSON.stringify({ name, price }));

    // Go to place order page
    window.location.href = "place-order.html";
  });
});

// ---------------- Place Order → Confirm Order ----------------
const orderForm = document.getElementById("orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const orderData = {
      productName: document.getElementById("productName").value,
      productPrice: document.getElementById("productPrice").value,
      fullName: document.getElementById("fullName").value,
      address: document.getElementById("address").value,
      landmark: document.getElementById("landmark").value,
      quantity: Number(document.getElementById("quantity").value), // convert to number
      phone: document.getElementById("phone").value
    };



    // Select the cancel button
    const cancelBtn = document.querySelector(".cancel-btn");

    cancelBtn.addEventListener("click", function (e) {
        e.preventDefault(); // Prevent form reset immediately
        const confirmed = confirm("Are you sure you want to cancel?");
        if (confirmed) {
            // Redirect to home page
            window.location.href = "index.html";
        }
    });







    // Save to localStorage and go to confirm page
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
    // Fill details in confirm page
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
      // Firestore document id: userUID + timestamp
      const orderRef = doc(db, "orders", `${user.uid}_${Date.now()}`);

      // ✅ Store order exactly matching Firestore rules
      await setDoc(orderRef, {
        user: user.uid,                     // string
        product: order.productName,         // string
        price: order.productPrice,          // string
        quantity: order.quantity,           // number
        fullName: order.fullName,           // string
        address: order.address,             // string
        landmark: order.landmark,           // string
        phone: order.phone,                 // string
        createdAt: serverTimestamp()        // timestamp
      });

      // Clear local storage + show success popup
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


