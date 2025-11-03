// ---------------------------------------------------
// 🥛 KS MILK — admin.js (Final Refined Version)
// ---------------------------------------------------

import { auth, db, requestNotificationPermission } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection, getDocs, deleteDoc, doc, getDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---------------------------------------------------
// 🔹 Loader Setup
// ---------------------------------------------------
document.body.style.display = "none";
window.addEventListener("load", () => {
  document.body.insertAdjacentHTML("afterbegin", `<div id="loader"><div class="spinner"></div></div>`);
});

// ---------------------------------------------------
// 🔹 Auth Check
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  try {
    const userDoc = await getDoc(doc(db, "customers", user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert("Access denied — Admins only.");
      return (window.location.href = "index.html");
    }

    document.getElementById("admin-name").textContent = userDoc.data().fullName || "Admin";
    document.getElementById("admin-email").textContent = userDoc.data().email || "—";

    await requestNotificationPermission("admin", user.uid);
    loadCustomers();
    loadOrders();
    setupNotifications();
    setupDeliveriesSummary();

    document.getElementById("loader").remove();
    document.body.style.display = "block";

  } catch (err) {
    console.error("❌ Admin auth error:", err);
    alert("Error verifying admin access.");
    window.location.href = "login.html";
  }
});

// ---------------------------------------------------
// 🔹 Logout
// ---------------------------------------------------
document.getElementById("logout-link")?.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out successfully.");
  window.location.href = "login.html";
});

// ---------------------------------------------------
// 👥 Load Customers
// ---------------------------------------------------
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  if (!table) return;
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "customers"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const isAdmin = data.role === "admin";
    table.insertAdjacentHTML(
      "beforeend",
      `<tr>
        <td>${data.fullName || "—"}</td>
        <td>${data.email || "—"}</td>
        <td>${data.role || "user"}</td>
        <td>
          ${isAdmin ? `<button disabled>🗑️ Delete</button>` :
          `<button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>`}
        </td>
      </tr>`
    );
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this customer?")) {
        await deleteDoc(doc(db, "customers", btn.dataset.id));
        alert("Customer deleted.");
        loadCustomers();
      }
    });
  });
}

// ---------------------------------------------------
// 📦 Load Orders
// ---------------------------------------------------
async function loadOrders() {
  const table = document.getElementById("orderTable");
  if (!table) return;
  table.innerHTML = "";

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
      if (confirm("Delete this order?")) {
        await deleteDoc(doc(db, "orders", btn.dataset.id));
        alert("Order deleted.");
        loadOrders();
      }
    });
  });
}

// ---------------------------------------------------
// 🔔 Live Notifications
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
        try { new Audio("notification.mp3").play(); } catch {}
      }
    });
  });
}

// ---------------------------------------------------
// 🚚 Deliveries Summary
// ---------------------------------------------------
function setupDeliveriesSummary() {
  const section = document.getElementById("deliveriesSummary");
  if (!section) return;

  const q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  onSnapshot(q, (snap) => {
    section.innerHTML = snap.empty
      ? `<p>No deliveries yet.</p>`
      : snap.docs.slice(0, 8).map((docSnap) => {
          const d = docSnap.data();
          return `
            <div class="delivery-item">
              <div>${d.fullName || "—"} • ${d.product || ""} (${d.quantity || 0} L)</div>
              <div>
                <div>${d.processedAt?.toDate?.().toLocaleString?.() || ""}</div>
                <div style="color:${d.status === "delivered" ? "green" : "red"}">
                  ${d.status?.toUpperCase?.() || "PENDING"}
                </div>
              </div>
            </div>`;
        }).join("");
  });
}
