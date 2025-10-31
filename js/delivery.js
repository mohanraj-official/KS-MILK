// delivery.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// DOM elements
const deliveriesList = document.getElementById("deliveriesList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const deliveryModal = document.getElementById("deliveryModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let deliveriesCache = []; // stores {id, data}

// ==========================
// RENDER LIST
// ==========================
function renderList(items) {
  deliveriesList.innerHTML = "";
  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  items.forEach((rec) => {
    const data = rec.data;
    const el = document.createElement("div");
    el.className = "delivery-item";
    el.dataset.id = rec.id;

    const badgeClass =
      data.status === "delivered"
        ? "badge delivered"
        : data.status === "cancelled"
        ? "badge cancelled"
        : "badge pending";

    el.innerHTML = `
      <div class="delivery-left">
        <div class="delivery-title">${data.fullName || "Unknown"} — ${data.product || "N/A"}</div>
        <div class="delivery-meta">Qty: ${data.quantity || 0} L • ${data.address || "N/A"}</div>
      </div>
      <div style="text-align:right">
        <div class="delivery-time">
          ${(data.processedAt && data.processedAt.toDate)
            ? data.processedAt.toDate().toLocaleString()
            : ""}
        </div>
        <div class="${badgeClass}" style="margin-top:8px">${data.status?.toUpperCase() || "PENDING"}</div>
      </div>
    `;
    el.addEventListener("click", () => openModal(rec));
    deliveriesList.appendChild(el);
  });
}

// ==========================
// MODAL HANDLERS
// ==========================
function openModal(rec) {
  const d = rec.data;
  modalBody.innerHTML = `
    <p><strong>Customer:</strong> ${d.fullName || "-"}</p>
    <p><strong>Phone:</strong> ${d.phone || "-"}</p>
    <p><strong>Product:</strong> ${d.product || "-"}</p>
    <p><strong>Quantity:</strong> ${d.quantity || "-"} L</p>
    <p><strong>Address:</strong> ${d.address || "-"}</p>
    <p><strong>Order ID:</strong> ${d.orderId || "-"}</p>
    <p><strong>Notification ID:</strong> ${d.notificationId || "-"}</p>
    <p><strong>Status:</strong> ${d.status || "-"}</p>
    <p><strong>Processed:</strong> ${(d.processedAt && d.processedAt.toDate)
      ? d.processedAt.toDate().toLocaleString()
      : "-"}</p>
  `;
  deliveryModal.classList.remove("hidden");
}

[modalClose, modalCloseBtn, deliveryModal].forEach((el) => {
  el?.addEventListener("click", (e) => {
    if (e.target === deliveryModal || e.target === modalClose || e.target === modalCloseBtn) {
      deliveryModal.classList.add("hidden");
    }
  });
});

// ==========================
// SEARCH + FILTER
// ==========================
function applyFilters() {
  const term = (searchInput?.value || "").toLowerCase().trim();
  const filter = filterSelect?.value || "all";

  const filtered = deliveriesCache.filter((r) => {
    if (filter !== "all" && r.data.status !== filter) return false;
    if (!term) return true;
    return (
      (r.data.fullName || "").toLowerCase().includes(term) ||
      (r.data.product || "").toLowerCase().includes(term) ||
      (r.data.orderId || "").toLowerCase().includes(term) ||
      (r.data.notificationId || "").toLowerCase().includes(term)
    );
  });

  renderList(filtered);
}

searchInput?.addEventListener("input", applyFilters);
filterSelect?.addEventListener("change", applyFilters);

// ==========================
// MAIN AUTH + FIRESTORE LOGIC
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // 🧠 Try both collections for user role (admin or customer)
    const customerRef = doc(db, "customers", user.uid);
    const adminRef = doc(db, "users", user.uid);

    let userSnap = await getDoc(customerRef);
    let role = "customer";

    if (!userSnap.exists()) {
      userSnap = await getDoc(adminRef);
      if (userSnap.exists()) role = userSnap.data().role || "admin";
    } else {
      role = userSnap.data().role || "customer";
    }

    console.log("Logged-in role:", role);

    // 🔍 Build Firestore query
    let deliveriesQuery;
    if (role === "admin") {
      // ✅ Admin sees all deliveries
      deliveriesQuery = query(
        collection(db, "deliveries"),
        orderBy("processedAt", "desc")
      );
    } else {
      // ✅ Customer sees only their own deliveries
      deliveriesQuery = query(
        collection(db, "deliveries"),
        where("userId", "==", user.uid),
        orderBy("processedAt", "desc")
      );
    }

    // 🔄 Real-time listener
    onSnapshot(
      deliveriesQuery,
      (snapshot) => {
        deliveriesCache = [];
        snapshot.forEach((doc) => deliveriesCache.push({ id: doc.id, data: doc.data() }));
        applyFilters();
      },
      (err) => {
        console.error("Deliveries listener error:", err);
        emptyState.textContent = "Failed to load deliveries.";
        emptyState.style.display = "block";
      }
    );
  } catch (err) {
    console.error("Error loading user role or deliveries:", err);
    emptyState.textContent = "Error loading data.";
    emptyState.style.display = "block";
  }
});
