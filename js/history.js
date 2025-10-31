// ---------------------------------------------------
// 🥛 KS MILK — Order History Script (Final Refined Version)
// ---------------------------------------------------

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const ordersBody = document.getElementById("orders-body");

// ---------------------------------------------------
// 🔹 Helper: Extract numeric value from price string
// ---------------------------------------------------
function extractNumericPrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// ---------------------------------------------------
// 🔹 Fetch and display user's order history
// ---------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersBody.innerHTML = `
      <tr><td colspan="10">Please <a href="login.html">login</a> to see your orders.</a></td></tr>
    `;
    return;
  }

  try {
    console.log("📦 Fetching orders for user:", user.uid);

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

    // Loop through each order
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const orderId = docSnap.id;

      const date = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleString()
        : "—";

      const numericPrice = extractNumericPrice(data.price);
      const total = numericPrice * (data.quantity || 0);

      let statusLabel = "Confirmed";

      // ---------------------------------------------------
      // 🔹 Fetch Delivery Status
      // ---------------------------------------------------
      try {
        const dq = query(
          collection(db, "deliveries"),
          where("orderId", "==", orderId),
          orderBy("processedAt", "desc"),
          limit(1)
        );

        const dqSnap = await getDocs(dq);
        if (!dqSnap.empty) {
          const deliveryDoc = dqSnap.docs[0].data();
          if (deliveryDoc.status === "delivered") statusLabel = "Delivered";
          else if (deliveryDoc.status === "cancelled") statusLabel = "Cancelled";
        }
      } catch (e) {
        console.warn("⚠️ Delivery fetch error for", orderId, e.message);
      }

      html += `
    <tr>
        <td data-label="#">${index++}</td>
        <td data-label="Date">${date}</td>
        <td data-label="Product">${data.product || "—"}</td>
        <td data-label="Price">${data.price || "—"}</td>
        <td data-label="Qty (L)">${data.quantity || "—"}</td>
        <td data-label="Total">₹${total.toFixed(2)}</td>
        <td data-label="Address">${data.address || "—"}</td>
        <td data-label="Landmark">${data.landmark || "—"}</td>
        <td data-label="Phone">${data.phone || "—"}</td>
        <td data-label="Status">
            <span class="badge ${statusLabel.toLowerCase()}">${statusLabel}</span>
        </td>
    </tr>
`;
    }

    ordersBody.innerHTML = html;

  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    ordersBody.innerHTML = `
      <tr><td colspan="10">❌ Failed to load orders. Please try again later.</td></tr>
    `;
  }
});
