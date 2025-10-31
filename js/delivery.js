// delivery.js — Final Refined Version (Admin & Customer)
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

// -----------------------------
// 🔹 DOM Elements
// -----------------------------
const deliveriesList = document.getElementById("deliveriesList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const deliveryModal = document.getElementById("deliveryModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const logoutLink = document.getElementById("logout-link");

let deliveriesCache = []; // stores {id, data}

// -----------------------------
// 🔹 Logout
// -----------------------------
logoutLink?.addEventListener("click", async () => {
  await signOut(auth);
  alert("You have logged out.");
  window.location.href = "login.html";
});

// -----------------------------
// 🧾 Render Deliveries
// -----------------------------
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

// -----------------------------
// 🪟 Modal Handling
// -----------------------------
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
    <p><strong>Processed:</strong> ${
      d.processedAt?.toDate?.().toLocaleString?.() || "-"
    }</p>
  `;
  deliveryModal.classList.remove("hidden");
}

// Close modal only when clicking overlay or close buttons
[modalClose, modalCloseBtn].forEach((btn) =>
  btn?.addEventListener("click", () => deliveryModal.classList.add("hidden"))
);
deliveryModal?.addEventListener("click", (e) => {
  if (e.target === deliveryModal) deliveryModal.classList.add("hidden");
});

// -----------------------------
// 🔎 Search + Filter
// -----------------------------
function applyFilters() {
  const term = (searchInput?.value || "").toLowerCase().trim();
  const filter = (filterSelect?.value || "all").toLowerCase();

  const filtered = deliveriesCache.filter((r) => {
    const status = (r.data.status || "").toLowerCase();
    if (filter !== "all" && status !== filter) return false;
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

// -----------------------------
// 🚀 Main Logic: Role-based Fetch
// -----------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // 🔍 Get user role
    const userRef = doc(db, "customers", user.uid);
    const userSnap = await getDoc(userRef);
    const role = userSnap.exists() ? (userSnap.data().role || "customer") : "customer";

    // 🧭 Update Navbar based on Role
    const navLinks = document.querySelector(".nav-links");
    navLinks.innerHTML = ""; // clear default links

    if (role === "admin") {
      navLinks.innerHTML = `
        <li><a href="admin-dashboard.html">Dashboard</a></li>
        <li><a href="#" id="logout-link">Logout</a></li>
      `;
    } else {
      navLinks.innerHTML = `
        <li><a href="index.html">Home</a></li>
        <li><a href="founders.html">Founders</a></li>
        <li><a href="products.html">Products</a></li>
        <li><a href="dashboard.html">Dashboard</a></li>
        <li><a href="#" id="logout-link">Logout</a></li>
      `;
    }

    // 📦 Firestore Query
    let deliveriesQuery;
    if (role === "admin") {
      deliveriesQuery = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
    } else {
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

    // 🔒 Logout handler
    const logoutLink = document.getElementById("logout-link");
    logoutLink?.addEventListener("click", async () => {
      await auth.signOut();
      window.location.href = "login.html";
    });

  } catch (err) {
    console.error("Error loading user role or deliveries:", err);
    emptyState.textContent = "Error loading data.";
    emptyState.style.display = "block";
  }
});
