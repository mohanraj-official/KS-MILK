// ---------------------------------------------------
// 🥛 KS MILK — notifications.js (Final Refined Version)
// ---------------------------------------------------
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc, setDoc,
  serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let currentId = null;
const notificationsList = document.getElementById("notificationsList");
const modal = document.getElementById("orderModal");
const modalBody = document.getElementById("modalBody");
const deliveredBtn = document.getElementById("deliveredBtn");
const cancelledBtn = document.getElementById("cancelledBtn");

// ---------------------------------------------------
// 🔹 Auth Check
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  const docSnap = await getDoc(doc(db, "customers", user.uid));
  if (!docSnap.exists() || docSnap.data().role !== "admin") {
    alert("Access denied — Admins only.");
    return (window.location.href = "index.html");
  }

  startNotificationsListener();
});

document.getElementById("logout-link")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// ---------------------------------------------------
// 🔹 Live Notifications
// ---------------------------------------------------
function startNotificationsListener() {
  const q = query(collection(db, "notifications"), where("status", "==", "new"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    notificationsList.innerHTML = "";
    if (snapshot.empty) {
      notificationsList.innerHTML = `<p>No new notifications.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const div = document.createElement("div");
      div.className = "notification-item";
      div.innerHTML = `
        <div class="notification-title">🛒 ${data.product}</div>
        <div class="notification-meta">${data.fullName} • ${data.quantity} L</div>
        <div class="notification-time">${data.createdAt?.toDate?.().toLocaleString?.() || ""}</div>
      `;
      div.addEventListener("click", () => openModal(id, data));
      notificationsList.appendChild(div);
    });
  });
}

// ---------------------------------------------------
// 🔹 Modal
// ---------------------------------------------------
function openModal(id, data) {
  currentId = id;
  modalBody.innerHTML = `
    <p><strong>Customer:</strong> ${data.fullName}</p>
    <p><strong>Phone:</strong> ${data.phone}</p>
    <p><strong>Product:</strong> ${data.product}</p>
    <p><strong>Quantity:</strong> ${data.quantity} L</p>
    <p><strong>Address:</strong> ${data.address}</p>
  `;
  modal.classList.remove("hidden");
}

document.getElementById("modalClose")?.addEventListener("click", () => closeModal());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
function closeModal() { modal.classList.add("hidden"); currentId = null; }

// ---------------------------------------------------
// 🔹 Mark Delivered / Cancelled
// ---------------------------------------------------
deliveredBtn.addEventListener("click", () => updateStatus("delivered"));
cancelledBtn.addEventListener("click", () => updateStatus("cancelled"));

async function updateStatus(status) {
  if (!currentId) return;
  const ref = doc(db, "notifications", currentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Notification not found.");

  const data = snap.data();
  await setDoc(doc(collection(db, "deliveries")), {
    orderId: data.orderId,
    userId: data.userId,
    fullName: data.fullName,
    product: data.product,
    quantity: data.quantity,
    address: data.address,
    phone: data.phone,
    status,
    processedAt: serverTimestamp(),
  });

  await updateDoc(ref, { status, processedAt: serverTimestamp() });
  closeModal();
}
