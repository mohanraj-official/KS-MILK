import { db, auth } from "./firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const orderForm = document.getElementById("orderForm");
const popup = document.getElementById("popup");

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = orderForm.querySelector('input[placeholder="Full Name"]').value.trim();
  const address = orderForm.querySelector("textarea").value.trim();
  const landmark = orderForm.querySelector("select").value;
  const quantity = orderForm.querySelector('input[placeholder="Milk Quantity (Litres)"]').value;
  const phone = orderForm.querySelector('input[placeholder="Phone Number"]').value;

  if (!name || !address || !landmark || !quantity || !phone) {
    alert("Please fill all fields correctly.");
    return;
  }

  try {
    const user = auth.currentUser;

    // Firestore: Add order document
    await addDoc(collection(db, "orders"), {
      fullName: name,
      address: address,
      landmark: landmark,
      quantity: parseFloat(quantity),
      phone: phone,
      userId: user ? user.uid : "guest",
      createdAt: serverTimestamp(),
      status: "Pending"
    });

    // Show success popup
    popup.style.display = "flex";
    orderForm.reset();
  } catch (error) {
    console.error("Error placing order:", error);
    alert("Error placing order. Please try again.");
  }
});

// Popup close
window.closePopup = function () {
  popup.style.display = "none";
  window.location.href = "orders.html";
};
