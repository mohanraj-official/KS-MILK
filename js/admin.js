// admin.js — KS MILK (Clean + Working Version)
// ---------------------------------------------------
// Handles admin login, customers, orders, deliveries, logout, and notifications.

import { auth, db, messaging, requestNotificationPermission } from "./firebase.js";
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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging.js";

// ---------------------------------------------------
// 🔹 AUTH CHECK (Runs on page load)
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // ✅ Check admin role (Change "customers" → "admins" if needed)
    const userDoc = await getDoc(doc(db, "customers", user.uid));

    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("Access denied. Admins only.");
      window.location.href = "index.html";
      return;
    }

    // ✅ Display admin info
    const data = userDoc.data();
    document.getElementById("admin-name").textContent = data.fullName || "Admin";
    document.getElementById("admin-email").textContent = data.email || "—";

    // ✅ Request notification permission
    const token = await requestNotificationPermission();
    if (token) {
      await setDoc(doc(db, "adminTokens", user.uid), { token }, { merge: true });
      console.log("✅ FCM token saved.");
    }

    // ✅ Load core data
    loadCustomers();
    loadOrders();
    setupNotifications();
    setupDeliveriesSummary();

  } catch (err) {
    console.error("Error verifying admin:", err);
    alert("Error verifying admin access.");
  }
});

// ---------------------------------------------------
// 🔹 LOGOUT
// ---------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("Logged out successfully.");
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
});

// ---------------------------------------------------
// 👥 LOAD CUSTOMERS
// ---------------------------------------------------
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  if (!table) return;
  table.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "customers"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const deleteBtn =
        data.role === "admin"
          ? `<button disabled style="opacity:0.5;cursor:not-allowed;">🗑️ Delete</button>`
          : `<button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>`;

      const row = `
        <tr>
          <td>${data.fullName || "—"}</td>
          <td>${data.email || "—"}</td>
          <td>${data.role || "user"}</td>
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
  } catch (err) {
    console.error("Error loading customers:", err);
  }
}

// ---------------------------------------------------
// 📦 LOAD ORDERS
// ---------------------------------------------------
async function loadOrders() {
  const table = document.getElementById("orderTable");
  if (!table) return;
  table.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "orders"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const row = `
        <tr>
          <td>${data.fullName || "—"}</td>
          <td>${data.product || "—"}</td>
          <td>${data.quantity || 0} L</td>
          <td>${data.address || "—"}</td>
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
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// ---------------------------------------------------
// 🔔 LIVE NOTIFICATIONS
// ---------------------------------------------------
function setupNotifications() {
  const bell = document.getElementById("notificationBell");
  const count = document.getElementById("notifCount");
  if (!bell || !count) return;

  let unread = 0;
  let seen = new Set();
  let initialized = false;

  bell.addEventListener("click", () => {
    count.style.display = "none";
    unread = 0;
  });

  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    if (!initialized) {
      snap.docs.forEach((doc) => seen.add(doc.id));
      initialized = true;
      return;
    }

    snap.docChanges().forEach((change) => {
      if (change.type === "added" && !seen.has(change.doc.id)) {
        seen.add(change.doc.id);
        unread++;
        count.textContent = unread;
        count.style.display = "flex";

        try {
          new Audio("notification.mp3").play();
        } catch (e) {
          console.warn("Notification sound error:", e);
        }
      }
    });
  });
}

// ---------------------------------------------------
// 🚚 DELIVERIES SUMMARY
// ---------------------------------------------------
function setupDeliveriesSummary() {
  const section = document.getElementById("deliveriesSummary");
  if (!section) return;

  const q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  onSnapshot(q, (snap) => {
    section.innerHTML = "";

    if (snap.empty) {
      section.innerHTML = `<p>No deliveries yet.</p>`;
      return;
    }

    snap.docs.slice(0, 8).forEach((docSnap) => {
      const d = docSnap.data();
      const html = `
        <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eee">
          <div>${d.fullName || "—"} • ${d.product || ""} (${d.quantity || 0} L)</div>
          <div style="text-align:right">
            <div style="font-size:12px;color:#666">
              ${d.processedAt?.toDate?.().toLocaleString?.() || ""}
            </div>
            <div style="font-weight:600;color:${d.status === "delivered" ? "#166534" : "#9b1c1c"}">
              ${d.status?.toUpperCase?.() || "PENDING"}
            </div>
          </div>
        </div>`;
      section.insertAdjacentHTML("beforeend", html);
    });
  });
}

// ---------------------------------------------------
// 🧭 TAB SWITCHING
// ---------------------------------------------------
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
