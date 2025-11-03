// delivery.js — Stable Version
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
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
const logoutLink = document.getElementById("logout-link");

let deliveriesCache = [];

// Logout
logoutLink?.addEventListener("click", async () => {
  await signOut(auth);
  alert("You have logged out.");
  window.location.href = "login.html";
});

// Render deliveries
function renderList(items) {
  deliveriesList.innerHTML = "";
  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  items.forEach((rec) => {
    const d = rec.data;
    const badgeClass =
      d.status === "delivered"
        ? "badge delivered"
        : d.status === "cancelled"
        ? "badge cancelled"
        : "badge pending";

    const div = document.createElement("div");
    div.className = "delivery-item";
    div.dataset.id = rec.id;
    div.innerHTML = `
      <div class="delivery-left">
        <div class="delivery-title">${d.fullName || "Unknown"} — ${d.product || "N/A"}</div>
        <div class="delivery-meta">Qty: ${d.quantity || 0} L • ${d.address || "N/A"}</div>
      </div>
      <div style="text-align:right">
        <div class="delivery-time">${
          d.processedAt?.toDate?.().toLocaleString?.() || ""
        }</div>
        <div class="${badgeClass}" style="margin-top:8px">${(d.status || "Pending").toUpperCase()}</div>
      </div>`;
    div.addEventListener("click", () => openModal(rec));
    deliveriesList.appendChild(div);
  });
}

// Modal
function openModal(rec) {
  const d = rec.data;
  modalBody.innerHTML = `
    <p><strong>Customer:</strong> ${d.fullName || "-"}</p>
    <p><strong>Phone:</strong> ${d.phone || "-"}</p>
    <p><strong>Product:</strong> ${d.product || "-"}</p>
    <p><strong>Quantity:</strong> ${d.quantity || "-"} L</p>
    <p><strong>Address:</strong> ${d.address || "-"}</p>
    <p><strong>Order ID:</strong> ${d.orderId || "-"}</p>
    <p><strong>Status:</strong> ${d.status || "-"}</p>
    <p><strong>Processed:</strong> ${d.processedAt?.toDate?.().toLocaleString?.() || "-"}</p>`;
  deliveryModal.classList.remove("hidden");
}

[modalClose, modalCloseBtn].forEach((btn) =>
  btn?.addEventListener("click", () => deliveryModal.classList.add("hidden"))
);
deliveryModal?.addEventListener("click", (e) => {
  if (e.target === deliveryModal) deliveryModal.classList.add("hidden");
});

// Search + Filter
function applyFilters() {
  const term = (searchInput?.value || "").toLowerCase();
  const filter = (filterSelect?.value || "all").toLowerCase();
  const filtered = deliveriesCache.filter((r) => {
    const s = (r.data.status || "").toLowerCase();
    if (filter !== "all" && s !== filter) return false;
    if (!term) return true;
    return (
      (r.data.fullName || "").toLowerCase().includes(term) ||
      (r.data.product || "").toLowerCase().includes(term) ||
      (r.data.orderId || "").toLowerCase().includes(term)
    );
  });
  renderList(filtered);
}

searchInput?.addEventListener("input", applyFilters);
filterSelect?.addEventListener("change", applyFilters);

// ---------------------------------------------------
// 🔹 AUTH & DELIVERY DATA HANDLER
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // 🚪 No user logged in → redirect to login
    window.location.href = "login.html";
    return;
  }

  try {
    // 🔍 Fetch user document
    const userRef = doc(db, "customers", user.uid);
    const userSnap = await getDoc(userRef);

    // 🧩 Determine user role (default to 'customer')
    const role = userSnap.exists() ? userSnap.data().role || "customer" : "customer";

    // 🧭 Update Dashboard link dynamically
    const dashboardLink = document.getElementById("dashboardLink");
    if (dashboardLink) {
      dashboardLink.href = role === "admin" ? "admin-dashboard.html" : "dashboard.html";
    }

    // 🔄 Define Firestore query based on role
    const deliveriesQuery =
      role === "admin"
        ? query(collection(db, "deliveries"), orderBy("processedAt", "desc"))
        : query(
            collection(db, "deliveries"),
            where("userId", "==", user.uid),
            orderBy("processedAt", "desc")
          );

    // 🧠 Listen to real-time updates
    onSnapshot(
      deliveriesQuery,
      (snap) => {
        deliveriesCache = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data(),
        }));

        applyFilters();
      },
      (err) => {
        console.error("Deliveries listener error:", err);
        emptyState.textContent = "Permission denied or failed to load deliveries.";
        emptyState.style.display = "block";
      }
    );
  } catch (error) {
    console.error("Error loading deliveries:", error);
    emptyState.textContent = "Error loading delivery data.";
    emptyState.style.display = "block";
  }
});
