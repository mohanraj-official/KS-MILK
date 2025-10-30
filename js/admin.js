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












function setupNotifications() {
  const notifBell = document.getElementById("notificationBell");
  const notifCount = document.getElementById("notifCount");
  let unread = 0;
  let initialLoadDone = false;
  const seenOrders = new Set();

  // 🔔 Click redirects to notification page
  notifBell.addEventListener("click", () => {
    window.location.href = "notifications.html"; // your notifications page
  });

  // Listen to orders in real-time
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(ordersQuery, (snapshot) => {
    if (!initialLoadDone) {
      // Skip initial load, mark all existing orders as seen
      snapshot.docs.forEach((doc) => seenOrders.add(doc.id));
      initialLoadDone = true;
      return;
    }

    // Handle newly added orders
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" && !seenOrders.has(change.doc.id)) {
        seenOrders.add(change.doc.id);
        unread++;
        notifCount.textContent = unread;
        notifCount.style.display = "flex";

        // Optional: play sound
        const audio = new Audio("notification.mp3");
        audio.play();
      }
    });
  });
}









// Call this after admin auth check and after loadOrders() or setupNotifications()
function setupDeliveriesSummary() {
  const deliveriesSection = document.getElementById("deliveriesSummary"); // create a container in admin HTML
  if (!deliveriesSection) return;

  const q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  onSnapshot(q, (snap) => {
    deliveriesSection.innerHTML = ""; // clear
    if (snap.empty) {
      deliveriesSection.innerHTML = `<p>No deliveries yet.</p>`;
      return;
    }
    // show latest 8
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
            <div style="font-size:12px;color:#666">${(d.processedAt && d.processedAt.toDate) ? d.processedAt.toDate().toLocaleString() : ""}</div>
            <div style="font-weight:600;color:${d.status === 'delivered' ? '#166534' : '#9b1c1c'}">${d.status.toUpperCase()}</div>
          </div>
        </div>
      `;
      deliveriesSection.appendChild(row);
    });
  }, (err) => {
    console.error("Deliveries summary error:", err);
  });
}

// call setupDeliveriesSummary() after admin auth checks
// example: after setupNotifications(); add setupDeliveriesSummary();














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
