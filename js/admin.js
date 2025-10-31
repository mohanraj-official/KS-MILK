// admin.js — KS MILK (Final Refined Version)
// -------------------------------------------
// Handles admin authentication, logout, customers, orders,
// live notifications, delivery summary, and tab navigation.

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
// 🔹 LOGOUT
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("You have logged out.");
        // Redirect happens automatically by onAuthStateChanged below
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Error logging out. Try again.");
      }
    });
  }
});

// -----------------------------
// 🔹 ADMIN AUTHENTICATION
// -----------------------------
onAuthStateChanged(auth, async (user) => {
  // If user logged out or not logged in
  if (!user) {
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "customers", user.uid));

    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("Access denied. Admins only.");
      window.location.href = "index.html";
      return;
    }

    // ✅ Display admin info
    const adminData = userDoc.data();
    document.getElementById("admin-name").textContent = adminData.fullName;
    document.getElementById("admin-email").textContent = adminData.email;

    // Load core data
    loadCustomers();
    loadOrders();
    setupNotifications();
    setupDeliveriesSummary();

  } catch (err) {
    console.error("Admin check failed:", err);
    alert("Error verifying admin access.");
  }
});

// -----------------------------
// 👥 LOAD CUSTOMERS
// -----------------------------
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  if (!table) return;
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
// 📦 LOAD ORDERS
// -----------------------------
async function loadOrders() {
  const table = document.getElementById("orderTable");
  if (!table) return;
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
        <td>
          <button class="delete-order-btn" data-id="${docSnap.id}">🗑️ Delete</button>
        </td>
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
// 🔔 REAL-TIME NOTIFICATIONS
// -----------------------------
function setupNotifications() {
  const notifBell = document.getElementById("notificationBell");
  const notifCount = document.getElementById("notifCount");
  if (!notifBell || !notifCount) return;

  let unread = 0;
  let initialLoadDone = false;
  const seenOrders = new Set();

  notifBell.addEventListener("click", () => {
    window.location.href = "notifications.html";
  });

  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(ordersQuery, (snapshot) => {
    if (!initialLoadDone) {
      snapshot.docs.forEach((doc) => seenOrders.add(doc.id));
      initialLoadDone = true;
      return;
    }

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" && !seenOrders.has(change.doc.id)) {
        seenOrders.add(change.doc.id);
        unread++;
        notifCount.textContent = unread;
        notifCount.style.display = "flex";

        // 🔊 Optional notification sound
        try {
          const audio = new Audio("notification.mp3");
          audio.play();
        } catch (e) {
          console.warn("Notification sound failed:", e);
        }
      }
    });
  });
}

// -----------------------------
// 🚚 DELIVERIES SUMMARY
// -----------------------------
function setupDeliveriesSummary() {
  const deliveriesSection = document.getElementById("deliveriesSummary");
  if (!deliveriesSection) return;

  const q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  onSnapshot(q, (snap) => {
    deliveriesSection.innerHTML = "";

    if (snap.empty) {
      deliveriesSection.innerHTML = `<p>No deliveries yet.</p>`;
      return;
    }

    let count = 0;
    snap.forEach((docSnap) => {
      if (count++ > 7) return;
      const d = docSnap.data();

      const row = document.createElement("div");
      row.className = "delivery-row";
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0">
          <div>${d.fullName} • ${d.product} (${d.quantity} L)</div>
          <div style="text-align:right">
            <div style="font-size:12px;color:#666">
              ${(d.processedAt && d.processedAt.toDate)
                ? d.processedAt.toDate().toLocaleString()
                : ""}
            </div>
            <div style="font-weight:600;color:${d.status === "delivered" ? "#166534" : "#9b1c1c"}">
              ${d.status.toUpperCase()}
            </div>
          </div>
        </div>
      `;
      deliveriesSection.appendChild(row);
    });
  }, (err) => {
    console.error("Deliveries summary error:", err);
  });
}

// -----------------------------
// 🧭 TAB SWITCHING
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-content");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      sections.forEach((sec) => (sec.style.display = "none"));
      const target = document.getElementById(`${btn.dataset.tab}-section`);
      if (target) target.style.display = "block";
    });
  });
});
