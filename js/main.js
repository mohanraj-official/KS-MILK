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

// // ---------------- Place Order → Confirm Order ----------------
// const orderForm = document.getElementById("orderForm");
// if (orderForm) {

//   // Cancel button → go to home page
//   const cancelBtn = document.querySelector(".cancel-btn");
//   cancelBtn.addEventListener("click", function (e) {
//       e.preventDefault();
//       window.location.href = "index.html";
//   });

//   orderForm.addEventListener("submit", (e) => {
//     e.preventDefault();

//     const quantityInput = document.getElementById("quantity");
//     const quantity = parseFloat(quantityInput.value);
//     const maxQuantity = parseFloat(quantityInput.max || 50);

//     if (quantity > maxQuantity) {
//       alert(`⚠️ You cannot order more than ${maxQuantity} Litres of milk.`);
//       return;
//     }

//     const orderData = {
//       productName: document.getElementById("productName").value,
//       productPrice: document.getElementById("productPrice").value,
//       fullName: document.getElementById("fullName").value,
//       address: document.getElementById("address").value,
//       landmark: document.getElementById("landmark").value,
//       quantity: quantity,
//       phone: document.getElementById("phone").value
//     };

//     localStorage.setItem("pendingOrder", JSON.stringify(orderData));
//     window.location.href = "confirm-order.html";
//   });
// }




// ---------------- Place Order → Confirm Order ----------------
const orderForm = document.getElementById("orderForm");
const orderBtn = document.querySelector(".order-btn");

// Fill product fields from localStorage
const selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
if (selectedProduct) {
  document.getElementById("productName").value = selectedProduct.name;
  document.getElementById("productPrice").value = "₹" + selectedProduct.price;
}

// Check if all required fields are filled & valid
function checkForm() {
  const fullName = document.getElementById("fullName").value.trim();
  const address = document.getElementById("address").value.trim();
  const landmark = document.getElementById("landmark").value;
  const quantity = parseFloat(document.getElementById("quantity").value);
  const phone = document.getElementById("phone").value.trim();

  // Quantity validation
  const quantityValid = !isNaN(quantity) && quantity >= 0.5 && quantity <= 50;

  // Phone validation: exactly 10 digits
  const phoneValid = /^[0-9]{10}$/.test(phone);

  // Enable button only if all fields filled and valid
  orderBtn.disabled = !(fullName && address && landmark && quantityValid && phoneValid);
}

// Listen to input changes
orderForm.addEventListener("input", checkForm);

// Cancel button
document.querySelector(".cancel-btn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});

// Form submit
orderForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const quantity = parseFloat(document.getElementById("quantity").value);
  const phone = document.getElementById("phone").value.trim();

  // Extra validation before submission
  if (quantity < 0.5 || quantity > 50) {
    alert("⚠️ Quantity must be between 0.5 and 50 litres.");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    alert("⚠️ Phone number must be 10 digits.");
    return;
  }

  // All good → save order
  const orderData = {
    productName: document.getElementById("productName").value,
    productPrice: document.getElementById("productPrice").value,
    fullName: document.getElementById("fullName").value,
    address: document.getElementById("address").value,
    landmark: document.getElementById("landmark").value,
    quantity: quantity,
    phone: phone
  };

  localStorage.setItem("pendingOrder", JSON.stringify(orderData));
  window.location.href = "confirm-order.html";
});

// Initialize form check
checkForm();

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
