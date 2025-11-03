// notifications.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* ------------------ Auth Check (Admins Only) ------------------ */
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  startNotificationsListener();
});

/* ------------------ DOM References ------------------ */
const notificationsList = document.getElementById("notificationsList");
const emptyState = document.getElementById("emptyState");
const orderModal = document.getElementById("orderModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const deliveredBtn = document.getElementById("deliveredBtn");
const cancelledBtn = document.getElementById("cancelledBtn");

/* Utility: Format Timestamp */
function fmt(dt) {
  try {
    const d = dt.toDate ? dt.toDate() : new Date(dt);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

/* ------------------ State ------------------ */
let notificationsMap = new Map();
let currentNotificationId = null;

/* ------------------ Live Notifications ------------------ */
function startNotificationsListener() {
  const q = query(
    collection(db, "notifications"),
    where("status", "==", "new"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    (snapshot) => {
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
            <div class="notification-title">🛒 New order — ${data.product}</div>
            <div class="notification-meta">${data.fullName} • ${data.quantity} L</div>
          </div>
          <div class="notification-right">
            <div class="notification-time">${fmt(data.createdAt)}</div>
            <div class="notification-badge">New</div>
          </div>
        `;

        item.addEventListener("click", () => openModalFor(id));
        notificationsList.appendChild(item);
      });
    },
    (err) => console.error("Notifications listener error:", err)
  );
}

/* ------------------ Modal Logic ------------------ */
function openModalFor(id) {
  const data = notificationsMap.get(id);
  if (!data) return;

  currentNotificationId = id;
  modalBody.innerHTML = `
    <p><strong>Customer:</strong> ${data.fullName}</p>
    <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
    <p><strong>Product:</strong> ${data.product}</p>
    <p><strong>Quantity:</strong> ${data.quantity} L</p>
    <p><strong>Address:</strong> ${data.address}</p>
    <p><strong>Order Time:</strong> ${fmt(data.createdAt)}</p>
    <p><strong>Order ID:</strong> ${data.orderId || "N/A"}</p>
    <hr />
    <p style="color:#555; font-size:13px;">Mark order as Delivered or Cancelled below.</p>
  `;
  orderModal.classList.remove("hidden");
}

modalClose.addEventListener("click", () => closeModal());
orderModal.addEventListener("click", (e) => {
  if (e.target === orderModal) closeModal();
});

function closeModal() {
  orderModal.classList.add("hidden");
  currentNotificationId = null;
}

/* ------------------ Update Status ------------------ */
deliveredBtn.addEventListener("click", async () => {
  if (currentNotificationId) await markAs("delivered");
});

cancelledBtn.addEventListener("click", async () => {
  if (currentNotificationId) await markAs("cancelled");
});

async function markAs(status) {
  try {
    const id = currentNotificationId;
    const notifRef = doc(db, "notifications", id);
    const notifSnap = await getDoc(notifRef);

    if (!notifSnap.exists()) {
      alert("Notification not found.");
      closeModal();
      return;
    }

    const data = notifSnap.data();

    await setDoc(doc(collection(db, "deliveries")), {
      orderId: data.orderId || null,
      notificationId: id,
      userId: data.userId || null,
      fullName: data.fullName || null,
      product: data.product || null,
      quantity: data.quantity || null,
      address: data.address || null,
      phone: data.phone || null,
      status,
      processedAt: serverTimestamp()
    });

    await updateDoc(notifRef, {
      status,
      processedAt: serverTimestamp()
    });

    closeModal();
  } catch (err) {
    console.error("Error marking notification:", err);
    alert("Failed to update status. Try again.");
  }
}
