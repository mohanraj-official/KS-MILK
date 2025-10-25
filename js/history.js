// history.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Get reference to table body
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

    // Firestore query: only orders of this user, sorted by createdAt descending
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

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Log data for debugging
      console.log(docSnap.id, data);

      // Format date
      const date = data.createdAt?.toDate().toLocaleString() || "Unknown date";

      // Compute numeric price & total
      const numericPrice = extractNumericPrice(data.price);
      const total = numericPrice * (data.quantity || 0);

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
          <td><span class="status delivered">Confirmed</span></td>
        </tr>
      `;
    });

    ordersBody.innerHTML = html;

  } catch (err) {
    console.error("Error fetching orders:", err);
    ordersBody.innerHTML = `<tr><td colspan="10">❌ Failed to load orders. Please try again later.</td></tr>`;
  }
});
