import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const nameEl = document.getElementById("user-name");
const emailEl = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Show user info when logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // ✅ Fetch Firestore user data from users collection
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let fullName = "No name set";
      if (docSnap.exists()) {
        fullName = docSnap.data().fullName || "No name set";
      }

      // Render details
      if (nameEl) nameEl.textContent = `👤 Name: ${fullName}`;
      if (emailEl) emailEl.textContent = `📧 Email: ${user.email}`;

      // Show account creation time (avoid duplicates)
      let createdPara = document.getElementById("created-at");
      if (!createdPara && emailEl) {
        createdPara = document.createElement("p");
        createdPara.id = "created-at";
        createdPara.textContent = `🕒 Member since: ${new Date(user.metadata.creationTime).toLocaleDateString()}`;
        emailEl.insertAdjacentElement("afterend", createdPara);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      if (nameEl) nameEl.textContent = "Error loading user data";
      if (emailEl) emailEl.textContent = "";
    }
  } else {
    // Not logged in → redirect
    window.location.href = "login.html";
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
