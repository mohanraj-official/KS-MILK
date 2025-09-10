// history.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, orderBy, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ordersBody = document.getElementById("orders-body");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersBody.innerHTML = `
      <tr><td colspan="5">Please <a href="login.html">login</a> to see your orders.</td></tr>
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
      ordersBody.innerHTML = `<tr><td colspan="5">No orders found.</td></tr>`;
      return;
    }

    let html = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.createdAt?.toDate().toLocaleString() || "Unknown date";

      html += `
        <tr>
          <td>${doc.id}</td>
          <td>${date}</td>
          <td>${data.product || "-"}</td>
          <td>${data.quantity || "-"}</td>
          <td><span class="status delivered">Confirmed</span></td>
        </tr>
      `;
    });

    ordersBody.innerHTML = html;

  } catch (err) {
    console.error("Error fetching orders:", err);
    ordersBody.innerHTML = `<tr><td colspan="5">❌ Failed to load orders.</td></tr>`;
  }
});
