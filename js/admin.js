// ---------------------------------------------------
// 🥛 KS MILK — Admin Dashboard Script (Final Version)
// ---------------------------------------------------
// Handles: admin authentication, customer management, orders, deliveries,
// logout, and real-time notifications.

// ---------------------------------------------------
// 🔹 IMPORTS
// ---------------------------------------------------
import { auth, db, messaging } from "./firebase.js";
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
import { getToken } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging.js";

// ---------------------------------------------------
// 🔹 AUTH CHECK (Runs on page load)
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
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
    const data = userDoc.data();
    document.getElementById("admin-name").textContent = data.fullName || "Admin";
    document.getElementById("admin-email").textContent = data.email || "—";

    // ✅ Enable notifications
    await requestNotificationPermission(user.uid);

    // ✅ Load dashboard data
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
// 🔹 REQUEST NOTIFICATION PERMISSION + FCM TOKEN
// ---------------------------------------------------
async function requestNotificationPermission(userId) {
  try {
    // Register service worker for background messages
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    console.log("✅ Service Worker registered:", registration);

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("🔔 Notification permission granted.");

      const token = await getToken(messaging, {
        vapidKey: "BOkG8TYzCuySeqmDGJ_4qTMTPcyTMl8nKmfRVJ6_VEh2eLq0sEb8cRpeY6rvO1Gk6E8vXFbfkwKqZzR6_gc03B0",
        serviceWorkerRegistration: registration,
      });

      console.log("📱 FCM Token:", token);

      // Optionally: Save FCM token to Firestore (for targeted notifications)
      if (token && userId) {
        await setDoc(doc(db, "adminTokens", userId), { token }, { merge: true });
      }

      return token;
    } else {
      console.warn("❌ Notification permission denied.");
    }
  } catch (error) {
    console.error("⚠️ Error getting FCM token:", error);
  }
}

// ---------------------------------------------------
// 🔹 LOGOUT HANDLER
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
      const isAdmin = data.role === "admin";
      const deleteBtn = isAdmin
        ? `<button disabled style="opacity:0.5;cursor:not-allowed;">🗑️ Delete</button>`
        : `<button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>`;

      table.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${data.fullName || "—"}</td>
          <td>${data.email || "—"}</td>
          <td>${data.role || "user"}</td>
          <td>${deleteBtn}</td>
        </tr>`
      );
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
      table.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${data.fullName || "—"}</td>
          <td>${data.product || "—"}</td>
          <td>${data.quantity || 0} L</td>
          <td>${data.address || "—"}</td>
          <td>${data.createdAt?.toDate?.().toLocaleString?.() || "N/A"}</td>
          <td><button class="delete-order-btn" data-id="${docSnap.id}">🗑️ Delete</button></td>
        </tr>`
      );
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
// 🔔 LIVE NOTIFICATIONS (NEW ORDERS)
// ---------------------------------------------------
function setupNotifications() {
  const bell = document.getElementById("notificationBell");
  const count = document.getElementById("notifCount");
  if (!bell || !count) return;

  let unread = 0;
  const seen = new Set();
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
    section.innerHTML = snap.empty
      ? `<p>No deliveries yet.</p>`
      : snap.docs
          .slice(0, 8)
          .map((docSnap) => {
            const d = docSnap.data();
            return `
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
          })
          .join("");
  });
}

// ---------------------------------------------------
// 🧭 TAB SWITCHING (Dashboard Navigation)
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
