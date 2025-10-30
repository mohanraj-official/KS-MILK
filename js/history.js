import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const ordersBody = document.getElementById("orders-body");

// Helper: extract numeric value from price string like "₹40 / Liter"
function extractNumericPrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/\d+/);
  return match ? parseFloat(match[0]) : 0;
}

// Fetch and display orders for logged-in user
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersBody.innerHTML = `
      <tr><td colspan="10">Please <a href="login.html">login</a> to see your orders.</td></tr>
    `;
    return;
  }

  try {
    console.log("Fetching orders for user:", user.uid);

    const q = query(
      collection(db, "orders"),
      where("user", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      ordersBody.innerHTML = `<tr><td colspan="10">No orders found yet.</td></tr>`;
      return;
    }

    let html = "";
    let index = 1;

    // ✅ Use for...of to handle async delivery checks per order
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const orderId = docSnap.id;

      const date = data.createdAt?.toDate().toLocaleString() || "Unknown date";
      const numericPrice = extractNumericPrice(data.price);
      const total = numericPrice * (data.quantity || 0);

      // Default status
      let statusLabel = "Confirmed";

      // ✅ Fetch delivery record for this order
      try {
        const dq = query(
          collection(db, "deliveries"),
          where("orderId", "==", orderId),
          orderBy("processedAt", "desc"),
          limit(1)
        );
        const dqSnap = await getDocs(dq);
        if (!dqSnap.empty) {
          const ddoc = dqSnap.docs[0].data();
          statusLabel = ddoc.status === "delivered" ? "Delivered" : "Cancelled";
        }
      } catch (e) {
        console.error("Delivery fetch error for", orderId, e);
      }

      html += `
        <tr>
          <td>${index++}</td>
          <td>${date}</td>
          <td>${data.product || "-"}</td>
          <td>${data.price || "-"}</td>
          <td>${data.quantity || "-"}</td>
          <td>₹${total.toFixed(2)}</td>
          <td>${data.address || "-"}</td>
          <td>${data.landmark || "-"}</td>
          <td>${data.phone || "-"}</td>
          <td><span class="status ${statusLabel.toLowerCase()}">${statusLabel}</span></td>
        </tr>
      `;
    }

    ordersBody.innerHTML = html;

  } catch (err) {
    console.error("Error fetching orders:", err);
    ordersBody.innerHTML = `<tr><td colspan="10">❌ Failed to load orders. Please try again later.</td></tr>`;
  }
});
