// notifications.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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

/* ---------- Auth check (admins only) ---------- */
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  // start listening after auth
  startNotificationsListener();
});

/* ---------- DOM refs ---------- */
const notificationsList = document.getElementById("notificationsList");
const emptyState = document.getElementById("emptyState");
const orderModal = document.getElementById("orderModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const deliveredBtn = document.getElementById("deliveredBtn");
const cancelledBtn = document.getElementById("cancelledBtn");

/* Helper to format date */
function fmt(dt) {
  try {
    const d = dt.toDate ? dt.toDate() : new Date(dt);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

/* ---------- State ---------- */
let notificationsMap = new Map(); // id -> data (for quick access)
let currentNotificationId = null;

/* ---------- Listen to new notifications (status == 'new') ---------- */
function startNotificationsListener() {
  // Query notifications collection for status == 'new'
  const q = query(
    collection(db, "notifications"),
    where("status", "==", "new"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    // render list from snapshot docs — newest first (orderBy desc)
    notificationsList.innerHTML = "";

    if (snapshot.empty) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    snapshot.forEach((docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data();
      notificationsMap.set(id, data); // store for modal lookup

      // build notification row
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

      // open modal on click
      item.addEventListener("click", () => openModalFor(id));
      notificationsList.appendChild(item);
    });
  }, (err) => {
    console.error("Notifications listener error:", err);
  });
}

/* ---------- Modal open / render ---------- */
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
    <p style="color:#555; font-size:13px;">Use <em>Delivered</em> or <em>Cancelled</em> to update status.</p>
  `;

  orderModal.classList.remove("hidden");
}

/* close modal */
modalClose.addEventListener("click", () => {
  orderModal.classList.add("hidden");
  currentNotificationId = null;
});

/* delivered handler */
deliveredBtn.addEventListener("click", async () => {
  if (!currentNotificationId) return;
  await markAs("delivered");
});

/* cancelled handler */
cancelledBtn.addEventListener("click", async () => {
  if (!currentNotificationId) return;
  await markAs("cancelled");
});

/* ---------- markAs(status) : updates DB and stores delivery record ---------- */
async function markAs(status) {
  try {
    const id = currentNotificationId;
    const notifRef = doc(db, "notifications", id);
    const notifSnap = await getDoc(notifRef);
    if (!notifSnap.exists()) {
      alert("Notification not found.");
      orderModal.classList.add("hidden");
      return;
    }
    const data = notifSnap.data();

    // 1) Create a deliveries record (store final state)
    const deliveryRef = doc(collection(db, "deliveries")); // auto-id
    await setDoc(deliveryRef, {
      orderId: data.orderId || null,
      notificationId: id,
      userId: data.userId || null,
      fullName: data.fullName || null,
      product: data.product || null,
      quantity: data.quantity || null,
      address: data.address || null,
      phone: data.phone || null,
      status: status,
      processedAt: serverTimestamp()
    });

    // 2) Update notification status so it disappears from list
    await updateDoc(notifRef, { status: status, processedAt: serverTimestamp() });

    // Close modal and UI will update automatically via snapshot
    orderModal.classList.add("hidden");
    currentNotificationId = null;
  } catch (err) {
    console.error("Error marking notification:", err);
    alert("Failed to update status. Try again.");
  }
}

/* close modal when clicking outside content */
orderModal.addEventListener("click", (e) => {
  if (e.target === orderModal) {
    orderModal.classList.add("hidden");
    currentNotificationId = null;
  }
});
