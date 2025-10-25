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

const ordersBody = document.getElementById("orders-body");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersBody.innerHTML = `
      <tr><td colspan="10">Please <a href="login.html">login</a> to see your orders.</td></tr>
    `;
    return;
  }

  try {
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

    let index = 1;
    let html = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate().toLocaleString() || "Unknown date";

      // Extract numeric value from "₹40 / Liter" or "₹500"
      let numericPrice = 0;
      if (data.price) {
        const match = data.price.match(/\d+/); // get first number
        if (match) numericPrice = parseFloat(match[0]);
      }

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
