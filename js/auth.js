import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  setDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- REGISTER ----
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullname = document.getElementById("fullname").value;  // 👈 added
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // 1. Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Save extra info in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullname: fullname,
        email: email,
        createdAt: new Date()
      });

      alert("User registered: " + fullname);
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// ---- LOGIN ----
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in as: " + userCredential.user.email);

      // Optional: redirect after login
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// ---- LOGOUT ----
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("User logged out");
    window.location.href = "login.html"; // redirect to login
  });
}
