// delivery.js — Final Role-Based Delivery View
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
  getDoc,
  doc
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
// 🔹 Load Deliveries based on Role
// -----------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login to view deliveries.");
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "customers", user.uid));

  if (!userDoc.exists()) {
    alert("User not found in database.");
    signOut(auth);
    return;
  }

  const role = userDoc.data().role || "customer";

  // Admin: show all deliveries
  if (role === "admin") {
    loadDeliveriesForAdmin();
  } else {
    loadDeliveriesForCustomer(user.uid);
  }
});

// -----------------------------
// 🚚 For Admin → Load All Deliveries
// -----------------------------
function loadDeliveriesForAdmin() {
  const deliveriesList = document.getElementById("deliveriesList");
  const emptyState = document.getElementById("emptyState");

  const q = query(collection(db, "deliveries"), orderBy("processedAt", "desc"));
  onSnapshot(q, (snapshot) => {
    deliveriesList.innerHTML = "";
    if (snapshot.empty) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      addDeliveryRow(d);
    });
  });
}

// -----------------------------
// 🚚 For Customer → Load Their Own Deliveries
// -----------------------------
function loadDeliveriesForCustomer(uid) {
  const deliveriesList = document.getElementById("deliveriesList");
  const emptyState = document.getElementById("emptyState");

  const q = query(
    collection(db, "deliveries"),
    where("userId", "==", uid),
    orderBy("processedAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    deliveriesList.innerHTML = "";
    if (snapshot.empty) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      addDeliveryRow(d);
    });
  });
}

// -----------------------------
// 🧾 Add Delivery Row to Page
// -----------------------------
function addDeliveryRow(d) {
  const deliveriesList = document.getElementById("deliveriesList");
  const date =
    d.processedAt?.toDate?.().toLocaleString?.() || "Not processed yet";

  const row = document.createElement("div");
  row.className = "delivery-item";
  row.innerHTML = `
    <div class="delivery-card">
      <div>
        <strong>${d.fullName || "Unknown"}</strong> — ${d.product || ""}
      </div>
      <div>
        <span>${d.quantity || ""} L</span> |
        <span>${d.status?.toUpperCase() || "PENDING"}</span>
      </div>
      <div class="delivery-date">${date}</div>
    </div>
  `;

  deliveriesList.appendChild(row);
}
