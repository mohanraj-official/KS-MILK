// main.js — unified fixed version
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---------- Toggle Menu ----------
window.toggleMenu = function () {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("show");
};

// ---------- Navbar Auth Links ----------
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const nav = document.querySelector(".nav-links");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    // Add dashboard link if not already present
    if (!document.getElementById("dashboard-link") && nav) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="dashboard.html" id="dashboard-link">Dashboard</a>`;
      nav.appendChild(li);
    }

    // Add logout link if not already present
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

// ---------- Product → Place Order ----------
document.querySelectorAll(".order-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.getAttribute("data-name");
    const price = button.getAttribute("data-price");
    localStorage.setItem("selectedProduct", JSON.stringify({ name, price }));
    window.location.href = "place-order.html";
  });
});

// ---------- Place Order ----------
document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.getElementById("orderForm");
  if (!orderForm) return;

  // 1️⃣ Load product from localStorage
  const selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
  if (selectedProduct) {
    document.getElementById("productName").value = selectedProduct.name;
    document.getElementById("productPrice").value = selectedProduct.price;
  } else {
    // No product found → redirect back
    alert("Please select a product first.");
    window.location.href = "products.html";
    return;
  }

  // 2️⃣ Cancel button
  const cancelBtn = document.querySelector(".cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }

  // 3️⃣ Validation helper
  function validateOrder() {
    const fullName = document.getElementById("fullName").value.trim();
    const address = document.getElementById("address").value.trim();
    const landmark = document.getElementById("landmark").value;
    const quantity = parseFloat(document.getElementById("quantity").value);
    const phone = document.getElementById("phone").value.trim();

    if (!fullName || !address || !landmark || !quantity || !phone) {
      alert("⚠️ Please fill all the fields.");
      return false;
    }

    if (quantity <= 0 || quantity > 50) {
      alert("⚠️ Quantity must be between 0.5 and 50 litres.");
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("⚠️ Please enter a valid 10-digit phone number.");
      return false;
    }
    return true;
  }

  // 4️⃣ Submit handler
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateOrder()) return;

    const orderData = {
      productName: document.getElementById("productName").value,
      productPrice: document.getElementById("productPrice").value,
      fullName: document.getElementById("fullName").value,
      address: document.getElementById("address").value,
      landmark: document.getElementById("landmark").value,
      quantity: parseFloat(document.getElementById("quantity").value),
      phone: document.getElementById("phone").value
    };

    localStorage.setItem("pendingOrder", JSON.stringify(orderData));
    window.location.href = "confirm-order.html";
  });
});








// ---------- Confirm Button ----------
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
        createdAt: serverTimestamp(),
      });

      // Clear local storage and show popup
      localStorage.removeItem("pendingOrder");
      localStorage.removeItem("selectedProduct");
      document.getElementById("successPopup").style.display = "flex";
    } catch (err) {
      console.error("Error saving order:", err);
      alert("❌ Failed to save order. Please try again.");
    }
  });










// // ---------- Confirm Order ----------
// onAuthStateChanged(auth, (user) => {
//   const confirmBtn = document.querySelector(".confirm-btn");
//   const cancelBtn = document.querySelector(".cancel-btn");

//   if (!confirmBtn) return; // Safety check

//   // Fetch pending order details
//   const order = JSON.parse(localStorage.getItem("pendingOrder"));
//   if (order) {
//     document.querySelector(".order-summary").innerHTML = `
//       <p><b>Product:</b> ${order.productName}</p>
//       <p><b>Price:</b> ₹${order.productPrice}</p>
//       <p><b>Name:</b> ${order.fullName}</p>
//       <p><b>Address:</b> ${order.address}</p>
//       <p><b>Landmark:</b> ${order.landmark}</p>
//       <p><b>Quantity:</b> ${order.quantity} L</p>
//       <p><b>Phone:</b> ${order.phone}</p>
//     `;
//   } else {
//     alert("No order details found. Please place an order first.");
//     window.location.href = "products.html";
//     return;
//   }








  


// // ---------- Confirm Button ----------
// confirmBtn.addEventListener("click", async () => {
//   if (!user) {
//     alert("Please login to confirm your order.");
//     window.location.href = "login.html";
//     return;
//   }

//   try {
//     const orderRef = doc(db, "orders", `${user.uid}_${Date.now()}`);
//     await setDoc(orderRef, {
//       user: user.uid,
//       product: order.productName,
//       price: order.productPrice,
//       quantity: order.quantity,
//       fullName: order.fullName,
//       address: order.address,
//       landmark: order.landmark,
//       phone: order.phone,
//       createdAt: serverTimestamp(),
//     });

//     // Clear local storage
//     localStorage.removeItem("pendingOrder");
//     localStorage.removeItem("selectedProduct");

//     // ---------- WhatsApp message ----------
//     const message = `🎉 Your KS Milk order has been confirmed!\n\n🛒 Order Details:\nProduct: ${order.productName}\nQuantity: ${order.quantity} L\nPrice: ₹${order.productPrice}\n\n📍 Delivery Address:\n${order.fullName}\n${order.address}, ${order.landmark}\n\n📞 Contact: ${order.phone}\n\nThank you for choosing KS Milk! Your order will be delivered soon. 🥛`;
//     const phoneNumber = "+91" + order.phone; // include country code
//     window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");

//     // Show success popup
//     document.getElementById("successPopup").style.display = "flex";

//   } catch (err) {
//     console.error("Error saving order:", err);
//     alert("❌ Failed to save order. Please try again.");
//   }
// });















  // ---------- Cancel Button ----------
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      const confirmCancel = confirm("Are you sure you want to cancel this order?");
      if (confirmCancel) {
        // Clear any stored order data (optional)
        localStorage.removeItem("pendingOrder");
        localStorage.removeItem("selectedProduct");
        window.location.href = "index.html";
      }
    });
  }
});

// ---------- Success Popup ----------
window.closePopup = function () {
  const popup = document.getElementById("successPopup");
  popup.style.animation = "fadeOut 0.4s ease forwards";
  setTimeout(() => {
    popup.style.display = "none";
    window.location.href = "order-history.html"; // Redirect after close
  }, 400);
};

