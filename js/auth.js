// auth.js — fixed version
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---- REGISTER ----
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Validation
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Update Firebase Auth profile
      await updateProfile(user, { displayName: fullName });

      // ✅ Store extra info in Firestore (customers collection)
      await setDoc(doc(db, "customers", user.uid), {
        fullName,   
        email,
        role: "customer",
        createdAt: serverTimestamp()
      });

      alert("Registration successful! Please login.");
      window.location.href = "login.html"; // redirect to login
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Email already registered. Please login.");
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert("Error: " + error.message);
      }
    }
  });
}

// ---- LOGIN ----
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert("Welcome back, " + (userCredential.user.displayName || userCredential.user.email));
      window.location.href = "index.html"; // redirect to home page
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        alert("Incorrect password!");
      } else if (error.code === "auth/user-not-found") {
        alert("No account found with this email. Please register.");
      } else {
        alert("Error: " + error.message);
      }
    }
  });
}

// ---- LOGOUT ----
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("You have logged out successfully.");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error logging out. Please try again.");
    }
  });
}
