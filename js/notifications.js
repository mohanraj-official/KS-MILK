// ---------------------------------------------------
// 🥛 KS MILK — notifications.js (Final Refined Version)
// ---------------------------------------------------
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc, setDoc,
  serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---------------------------------------------------
// 🔹 Loader
// ---------------------------------------------------
document.body.style.display = "none";
window.addEventListener("load", () => {
  document.body.insertAdjacentHTML("afterbegin", `
    <div id="loader"><div class="spinner"></div></div>
  `);
});

// ---------------------------------------------------
// 🔹 Auth Check (Admin Only)
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied.");
    return window.location.href = "index.html";
  }

  startNotificationsListener();
  document.getElementById("loader").remove();
  document.body.style.display = "block";
});

// ---------------------------------------------------
// 🔹 Logout
// ---------------------------------------------------
const logoutLink = document.getElementById("logout-link");
if (logoutLink) logoutLink.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// ---------------------------------------------------
// 🔹 Firestore Notifications
// ---------------------------------------------------
const notificationsList = document.getElementById("notificationsList");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("orderModal");
const modalBody = document.getElementById("modalBody");
const deliveredBtn = document.getElementById("deliveredBtn");
const cancelledBtn = document.getElementById("cancelledBtn");
let currentId = null;
let notificationsMap = new Map();

function fmt(dt) {
  try { return (dt.toDate ? dt.toDate() : new Date(dt)).toLocaleString(); }
  catch { return ""; }
}

function startNotificationsListener() {
  const q = query(collection(db, "notifications"), where("status", "==", "new"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    notificationsList.innerHTML = "";
    if (snapshot.empty) return (emptyState.style.display = "block");

    emptyState.style.display = "none";
    snapshot.forEach((docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data();
      notificationsMap.set(id, data);

      const item = document.createElement("div");
      item.className = "notification-item";
      item.dataset.id = id;
      item.innerHTML = `
        <div class="notification-left">
          <div class="notification-title">🛒 ${data.product}</div>
          <div class="notification-meta">${data.fullName} • ${data.quantity} L</div>
        </div>
        <div class="notification-right">
          <div class="notification-time">${fmt(data.createdAt)}</div>
          <div class="notification-badge">NEW</div>
        </div>`;
      item.addEventListener("click", () => openModal(id));
      notificationsList.appendChild(item);
    });
  });
}

// ---------------------------------------------------
// 🔹 Modal Logic
// ---------------------------------------------------
function openModal(id) {
  const data = notificationsMap.get(id);
  if (!data) return;
  currentId = id;
  modalBody.innerHTML = `
    <p><strong>Customer:</strong> ${data.fullName}</p>
    <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
    <p><strong>Product:</strong> ${data.product}</p>
    <p><strong>Quantity:</strong> ${data.quantity} L</p>
    <p><strong>Address:</strong> ${data.address}</p>
    <p><strong>Order Time:</strong> ${fmt(data.createdAt)}</p>
    <p><strong>Order ID:</strong> ${data.orderId || "N/A"}</p>
  `;
  modal.classList.remove("hidden");
}

document.getElementById("modalClose").onclick = () => closeModal();
modal.onclick = (e) => { if (e.target === modal) closeModal(); };

function closeModal() {
  modal.classList.add("hidden");
  currentId = null;
}

// ---------------------------------------------------
// 🔹 Mark as Delivered / Cancelled
// ---------------------------------------------------
deliveredBtn.onclick = () => updateStatus("delivered");
cancelledBtn.onclick = () => updateStatus("cancelled");

async function updateStatus(status) {
  if (!currentId) return;
  const ref = doc(db, "notifications", currentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Notification not found.");

  const data = snap.data();

  await setDoc(doc(collection(db, "deliveries")), {
    orderId: data.orderId || null,
    userId: data.userId || null,
    fullName: data.fullName || null,
    product: data.product || null,
    quantity: data.quantity || null,
    address: data.address || null,
    phone: data.phone || null,
    status,
    processedAt: serverTimestamp()
  });

  await updateDoc(ref, { status, processedAt: serverTimestamp() });
  closeModal();
}
