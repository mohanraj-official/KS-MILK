// admin.js — Final Version with Real-Time Notifications
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ===============================
// 🔹 Logout Functionality
// ===============================
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async () => {
    await signOut(auth);
    alert("You have logged out.");
    window.location.href = "login.html";
  });
}

// ===============================
// 🔹 Admin Authentication
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login as admin.");
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  // ✅ Display admin info
  document.getElementById("admin-name").textContent = userDoc.data().fullName;
  document.getElementById("admin-email").textContent = userDoc.data().email;

  // ✅ Load dashboard data
  loadCustomers();
  loadOrders();
  setupNotifications(); // Start notification listener
});

// ===============================
// 🔹 Load Customers Table
// ===============================
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "customers"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Disable delete button for admin users
    const deleteBtn =
      data.role === "admin"
        ? `<button disabled style="opacity:0.5; cursor:not-allowed;">🗑️ Delete</button>`
        : `<button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>`;

    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.email}</td>
        <td>${data.role}</td>
        <td>${deleteBtn}</td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  // Handle delete
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this customer?")) {
        await deleteDoc(doc(db, "customers", id));
        alert("Customer deleted.");
        loadCustomers();
      }
    });
  });
}

// ===============================
// 🔹 Load Orders Table
// ===============================
async function loadOrders() {
  const table = document.getElementById("orderTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "orders"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.product}</td>
        <td>${data.quantity} L</td>
        <td>${data.address}</td>
        <td>${data.createdAt?.toDate?.().toLocaleString?.() || "N/A"}</td>
        <td><button class="delete-order-btn" data-id="${docSnap.id}">🗑️ Delete</button></td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  // Handle delete
  document.querySelectorAll(".delete-order-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this order?")) {
        await deleteDoc(doc(db, "orders", id));
        alert("Order deleted.");
        loadOrders();
      }
    });
  });
}

// ===============================
// 🔔 Real-Time Notifications
// ===============================
function setupNotifications() {
  const notificationContainer = document.getElementById("notificationContainer");
  const notifBell = document.getElementById("notificationBell");
  const notifCount = document.getElementById("notifCount");
  let unread = 0;

  // 🔄 Toggle visibility of notification panel
  notifBell.addEventListener("click", () => {
    notificationContainer.classList.toggle("active");
    unread = 0;
    notifCount.textContent = "0";
    notifCount.style.display = "none";
  });

  // 🔍 Listen for new orders (latest 10)
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));

  onSnapshot(ordersQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const order = change.doc.data();

        // 🧾 Create notification element
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.textContent = `🛒 New order from ${order.fullName} — ${order.quantity}L of ${order.product}`;

        // Add to container (latest at top)
        notificationContainer.prepend(notification);

        // 🔔 Increment counter
        unread++;
        notifCount.textContent = unread;
        notifCount.style.display = "flex";

        // 🎵 Optional sound (ensure file exists)
        const audio = new Audio("notification.mp3");
        audio.play();

        // 🕒 Auto-remove notification smoothly
        setTimeout(() => {
          notification.classList.add("fade-out");
          setTimeout(() => notification.remove(), 400);
        }, 8000);
      }
    });
  });
}
