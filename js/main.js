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
import { doc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Popup handling ----------------
function closeOrderPopup() {
  if (!popup) return;
  popup.style.display = "none";
  if (form) form.reset();
}
window.closeOrderPopup = closeOrderPopup;

// // Attach Order Now buttons
// const orderButtons = document.querySelectorAll(".order-btn");
// orderButtons.forEach((btn) => {
//   btn.addEventListener("click", () => {
//     const productCard = btn.closest(".product-card");
//     const productName = productCard.querySelector("h3").textContent;

//     document.getElementById("product").value = productName;
//     if (popup) popup.style.display = "flex";
//   });
// });

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

// ---------------- Place Order Form (latest version only) ----------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
      orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get form values
        const fullName = document.getElementById("fullName").value.trim();
        const address = document.getElementById("address").value.trim();
        const landmark = document.getElementById("landmark").value.trim();
        const quantity = parseFloat(document.getElementById("quantity").value);
        const phone = document.getElementById("phone").value.trim();

        // Basic validation
        if (!fullName || !address || !landmark || !quantity || !phone) {
          alert("⚠️ Please fill all fields!");
          return;
        }

        try {
          // Create a new order document with auto ID
          const orderRef = doc(db, "orders", `${user.uid}_${Date.now()}`);
          await setDoc(orderRef, {
            product: "Milk",
            quantity: quantity,
            user: user.uid,
            fullName: fullName,
            address: address,
            landmark: landmark,
            phone: phone,
            createdAt: serverTimestamp()
          });

          // Show popup or success alert
          const successPopup = document.getElementById("successPopup");
          if (successPopup) successPopup.style.display = "flex";
          else alert("✅ Order placed successfully!");

          orderForm.reset();

        } catch (error) {
          console.error("Error placing order:", error);
          alert("❌ Failed to place order. Please try again!");
        }
      });
    }
  } else {
    // If not logged in, redirect to login
    window.location.href = "login.html";
  }
});

// Close popup function
window.closePopup = function () {
  const successPopup = document.getElementById("successPopup");
  if (successPopup) successPopup.style.display = "none";
};






//for products order navigate to place order page

    // 🥛 Capture product details and navigate to place order page
    document.querySelectorAll(".order-btn").forEach(button => {
        button.addEventListener("click", () => {
            const name = button.getAttribute("data-name");
            const price = button.getAttribute("data-price");

            // Store product details temporarily in browser storage
            localStorage.setItem("selectedProduct", JSON.stringify({ name, price }));

            // Redirect to place order page
            window.location.href = "placeorder.html";
        });
    });
