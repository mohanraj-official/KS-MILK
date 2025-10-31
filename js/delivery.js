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

const deliveriesList = document.getElementById("deliveriesList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const deliveryModal = document.getElementById("deliveryModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let deliveriesCache = []; // stores {id, data}

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

// Modal close handlers
[modalClose, modalCloseBtn, deliveryModal].forEach((el) => {
  el?.addEventListener("click", (e) => {
    if (e.target === deliveryModal || e.target === modalClose || e.target === modalCloseBtn) {
      deliveryModal.classList.add("hidden");
    }
  });
});

// Filtering and search
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

// Main logic - detect role and fetch deliveries
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // 🔍 Get the logged-in user’s role
    const userRef = doc(db, "customers", user.uid);
    const userSnap = await getDoc(userRef);
    const role = userSnap.exists() ? (userSnap.data().role || "customer") : "customer";

    // 📦 Build Firestore query
    let deliveriesQuery;
    if (role === "admin") {
      // Admin sees all
      deliveriesQuery = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
    } else {
      // Customer sees only their own deliveries
      deliveriesQuery = query(
        collection(db, "deliveries"),
        where("userId", "==", user.uid),
        orderBy("processedAt", "desc")
      );
    }

    // 🧠 Real-time listener
    onSnapshot(
      deliveriesQuery,
      (snapshot) => {
        deliveriesCache = [];
        snapshot.forEach((doc) => deliveriesCache.push({ id: doc.id, data: doc.data() }));
        applyFilters();
      },
      (err) => {
        console.error("Deliveries listener error:", err);
        emptyState.textContent = "Failed to load deliveries";
        emptyState.style.display = "block";
      }
    );
  } catch (err) {
    console.error("Error loading user role or deliveries:", err);
    emptyState.textContent = "Error loading data.";
    emptyState.style.display = "block";
  }
});
