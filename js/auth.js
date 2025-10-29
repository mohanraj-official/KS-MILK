// auth.js — refined and safe version
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { setDoc, getDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// -------------------- REGISTER --------------------
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Validate passwords
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Update profile
      await updateProfile(user, { displayName: fullName });

      // 3️⃣ Save user info in Firestore
      await setDoc(doc(db, "customers", user.uid), {
        fullName,
        email,
        role: "customer", // default role
        createdAt: serverTimestamp()
      });

      alert("Registration successful! Please login.");
      window.location.href = "login.html";

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

// -------------------- LOGIN --------------------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      // 1️⃣ Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "customers", user.uid));
      const role = userDoc.exists() ? userDoc.data().role || "customer" : "customer";

      alert("Welcome back, " + (user.displayName || user.email));

      // 3️⃣ Redirect based on role
      if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "index.html";
      }

    } catch (error) {
      // Handle errors
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

// -------------------- LOGOUT --------------------
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
