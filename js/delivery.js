// delivery.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const deliveriesList = document.getElementById("deliveriesList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const deliveryModal = document.getElementById("deliveryModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let deliveriesCache = []; // array of {id, data}

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
    const badgeClass = data.status === "delivered" ? "badge delivered" : "badge cancelled";
    el.innerHTML = `
      <div class="delivery-left">
        <div class="delivery-title">${data.fullName} — ${data.product}</div>
        <div class="delivery-meta">Qty: ${data.quantity} L • ${data.address}</div>
      </div>
      <div style="text-align:right">
        <div class="delivery-time">${(data.processedAt && data.processedAt.toDate) ? data.processedAt.toDate().toLocaleString() : ""}</div>
        <div class="${badgeClass}" style="margin-top:8px">${data.status.toUpperCase()}</div>
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
    <p><strong>Quantity:</strong> ${d.quantity || "-" } L</p>
    <p><strong>Address:</strong> ${d.address || "-"}</p>
    <p><strong>Order ID:</strong> ${d.orderId || "-"}</p>
    <p><strong>Notification ID:</strong> ${d.notificationId || "-"}</p>
    <p><strong>Status:</strong> ${d.status}</p>
    <p><strong>Processed:</strong> ${(d.processedAt && d.processedAt.toDate) ? d.processedAt.toDate().toLocaleString() : "-"}</p>
  `;
  deliveryModal.classList.remove("hidden");
}

modalClose?.addEventListener("click", () => deliveryModal.classList.add("hidden"));
modalCloseBtn?.addEventListener("click", () => deliveryModal.classList.add("hidden"));
deliveryModal?.addEventListener("click", (e) => { if (e.target === deliveryModal) deliveryModal.classList.add("hidden"); });

// filter + search
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

// auth + listen
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // check role quickly from customers doc (admin sees all)
  const userDocRef = collection(db, "customers"); // placeholder to avoid extra import
  // simple approach: show admin all, customers only their records
  // fetch customers doc
  try {
    const custRef = collection(db, "customers"); // not used directly
  } catch (err) {}

  // Determine role by reading customers/user doc
  const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js");
  const userDoc = await getDoc(doc(db, "customers", user.uid));
  const role = userDoc.exists() ? (userDoc.data().role || "customer") : "customer";

  // Build query
  let q;
  if (role === "admin") {
    q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  } else {
    q = query(collection(db, "deliveries"), where("userId", "==", user.uid), orderBy("processedAt", "desc"));
  }

  onSnapshot(q, (snap) => {
    deliveriesCache = [];
    snap.forEach((s) => deliveriesCache.push({ id: s.id, data: s.data() }));
    applyFilters();
  }, (err) => {
    console.error("Deliveries listener error:", err);
    emptyState.textContent = "Failed to load deliveries";
    emptyState.style.display = "block";
  });
});
