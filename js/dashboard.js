import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Show user info when logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch user data from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      document.getElementById("user-name").textContent = "Name: " + docSnap.data().fullname;
      document.getElementById("user-email").textContent = "Email: " + docSnap.data().email;
    } else {
      document.getElementById("user-name").textContent = "Name not found";
      document.getElementById("user-email").textContent = "Email: " + user.email;
    }
  } else {
    // Not logged in → send to login page
    window.location.href = "login.html";
  }
});

// Logout
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
