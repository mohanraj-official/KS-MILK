// admin.js — Final Version with Smart Notifications
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
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// -----------------------------
// 🔹 Logout
// -----------------------------
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async () => {
    await signOut(auth);
    alert("You have logged out.");
    window.location.href = "login.html";
  });
}

// -----------------------------
// 🔹 Admin Authentication
// -----------------------------
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

  loadCustomers();
  loadOrders();
  setupNotifications();
});

// -----------------------------
// 👥 Load Customers
// -----------------------------
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "customers"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

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

// -----------------------------
// 📦 Load Orders
// -----------------------------
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













// -----------------------------
// 🔔 Smart Real-time Notifications (Fixed version)
// -----------------------------
function setupNotifications() {
  const notificationContainer = document.getElementById("notificationContainer");
  const notifBell = document.getElementById("notificationBell");
  const notifCount = document.getElementById("notifCount");
  let unread = 0;
  let initialLoadDone = false;

  const seenOrders = new Set();

  notifBell.addEventListener("click", () => {
    notificationContainer.classList.toggle("active");
  });

  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(ordersQuery, (snapshot) => {
    if (!initialLoadDone) {
      // 🧠 Skip initial load, just mark orders as seen
      snapshot.docs.forEach((doc) => seenOrders.add(doc.id));
      initialLoadDone = true;
      return;
    }

    // 👇 After first load, handle only NEWLY ADDED ones
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" && !seenOrders.has(change.doc.id)) {
        seenOrders.add(change.doc.id);
        const order = change.doc.data();

        unread++;
        notifCount.textContent = unread;
        notifCount.style.display = "flex";

        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.innerHTML = `
          <b>🆕 New Order</b><br>
          ${order.fullName} - ${order.quantity}L ${order.product}
        `;
        notification.style.cursor = "pointer";

        // 👇 Click → show details + reduce count
        notification.addEventListener("click", () => {
          alert(
            `Order Details:\n\n` +
            `Customer: ${order.fullName}\n` +
            `Product: ${order.product}\n` +
            `Quantity: ${order.quantity} L\n` +
            `Address: ${order.address}\n` +
            `Phone: ${order.phone || "N/A"}`
          );

          unread = Math.max(0, unread - 1);
          notifCount.textContent = unread;
          if (unread === 0) notifCount.style.display = "none";

          notification.classList.add("fade-out");
          setTimeout(() => notification.remove(), 400);
        });

        notificationContainer.prepend(notification);

        // Optional: sound
        const audio = new Audio("notification.mp3");
        audio.play();
      }
    });
  });
}













// -----------------------------
// 🧭 Tab Switching Logic
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-content");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Hide all sections
      sections.forEach((sec) => (sec.style.display = "none"));
      // Show selected one
      const target = document.getElementById(`${btn.dataset.tab}-section`);
      if (target) target.style.display = "block";
    });
  });
});
