// admin.js — with real-time notifications
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---------- Logout ----------
const logoutLink = document.getElementById("logout-link");
if (logoutLink) {
  logoutLink.addEventListener("click", async () => {
    await signOut(auth);
    alert("You have logged out.");
    window.location.href = "login.html";
  });
}

// ---------- Admin Authentication ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login as admin.");
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  // Display admin info
  document.getElementById("admin-name").textContent = userDoc.data().fullName;
  document.getElementById("admin-email").textContent = userDoc.data().email;

  // Load tables
  loadCustomers();
  loadOrders();
  setupNotifications(); // Setup real-time notifications
});

// ---------- Load Customers ----------
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "customers"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Disable delete button for admin users
    const deleteBtn = data.role === "admin"
      ? `<button disabled style="opacity:0.5; cursor:not-allowed;">🗑️ Delete</button>`
      : `<button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>`;

    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.email}</td>
        <td>${data.role}</td>
        <td>${deleteBtn}</td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this customer?")) {
        await deleteDoc(doc(db, "customers", id));
        alert("Customer deleted.");
        loadCustomers();
      }
    });
  });
}

// ---------- Load Orders ----------
async function loadOrders() {
  const table = document.getElementById("orderTable");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "orders"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.product}</td>
        <td>${data.quantity} L</td>
        <td>${data.address}</td>
        <td>${data.createdAt?.toDate?.().toLocaleString?.() || "N/A"}</td>
        <td><button class="delete-order-btn" data-id="${docSnap.id}">🗑️ Delete</button></td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  document.querySelectorAll(".delete-order-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this order?")) {
        await deleteDoc(doc(db, "orders", id));
        alert("Order deleted.");
        loadOrders();
      }
    });
  });
}



// ---------- Real-time Notifications ----------
function setupNotifications() {
  const notificationContainer = document.getElementById("notificationContainer");

  // Listen to latest orders in real-time
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));

  onSnapshot(ordersQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const order = change.doc.data();

        // Create notification element
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.textContent = `New order from ${order.fullName}: ${order.quantity}L of ${order.product}`;
        notificationContainer.appendChild(notification);

        // Optional: auto-remove after 5 seconds with fade effect
        setTimeout(() => {
          notification.classList.add("fade-out");
          setTimeout(() => notification.remove(), 300); // match transition duration
        }, 5000);

        // Optional: play sound
        const audio = new Audio("notification-sound.mp3"); // make sure file exists
        audio.play();
      }
    });
  });
}
