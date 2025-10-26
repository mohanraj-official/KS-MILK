import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Elements
const nameEl = document.getElementById("user-name");
const emailEl = document.getElementById("user-email");
const roleEl = document.getElementById("user-role"); // optional if you want to show role
const logoutBtn = document.getElementById("logout-btn");

// Show user info when logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // ✅ Fetch Firestore user data from customers collection
      const docRef = doc(db, "customers", user.uid);
      const docSnap = await getDoc(docRef);

      let fullName = user.displayName || "No name set";
      let role = "customer";

      if (docSnap.exists()) {
        const data = docSnap.data();
        fullName = data.fullName || fullName;
        role = data.role || role;
      }

      // Render details
      if (nameEl) nameEl.textContent = `👤 Name: ${fullName}`;
      if (emailEl) emailEl.textContent = `📧 Email: ${user.email}`;
      if (roleEl) roleEl.textContent = `⭐ Role: ${role}`;

      // Show account creation time (avoid duplicates)
      let createdPara = document.getElementById("created-at");
      if (!createdPara && emailEl) {
        createdPara = document.createElement("p");
        createdPara.id = "created-at";
        createdPara.textContent = `🕒 Member since: ${new Date(user.metadata.creationTime).toLocaleDateString()}`;
        emailEl.insertAdjacentElement("afterend", createdPara);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      if (nameEl) nameEl.textContent = "Error loading user data";
      if (emailEl) emailEl.textContent = "";
    }
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});

// ---- LOGOUT ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("You have logged out successfully.");
    window.location.href = "index.html";
  });
}
