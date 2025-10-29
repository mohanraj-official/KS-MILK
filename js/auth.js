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















import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ---- LOGIN ----
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "customers", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "customer";

      alert("Welcome back, " + (user.displayName || user.email));

      // Redirect based on role
      if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "index.html";
      }
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












// Admin autherization script

import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const logoutLink = document.getElementById("logout-link");

// Handle logout
logoutLink.addEventListener("click", async () => {
  await signOut(auth);
  alert("You have logged out.");
  window.location.href = "login.html";
});

// Check admin access
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login as admin.");
    window.location.href = "login.html";
    return;
  }

  // Check role
  const userDoc = await getDoc(doc(db, "customers", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("admin-name").textContent = userDoc.data().fullName;
  document.getElementById("admin-email").textContent = userDoc.data().email;

  loadCustomers();
  loadOrders();
});

// Load customers list
async function loadCustomers() {
  const table = document.getElementById("customerTable");
  table.innerHTML = "";
  const snapshot = await getDocs(collection(db, "customers"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.email}</td>
        <td>${data.role}</td>
        <td><button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button></td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this customer?")) {
        await deleteDoc(doc(db, "customers", id));
        alert("Customer deleted.");
        loadCustomers();
      }
    });
  });
}

// Load orders list
async function loadOrders() {
  const table = document.getElementById("orderTable");
  table.innerHTML = "";
  const snapshot = await getDocs(collection(db, "orders"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const row = `
      <tr>
        <td>${data.fullName}</td>
        <td>${data.product}</td>
        <td>${data.quantity} L</td>
        <td>${data.address}</td>
        <td>${data.createdAt?.toDate?.().toLocaleString?.() || "N/A"}</td>
        <td><button class="delete-order-btn" data-id="${docSnap.id}">🗑️ Delete</button></td>
      </tr>`;
    table.insertAdjacentHTML("beforeend", row);
  });

  document.querySelectorAll(".delete-order-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Delete this order?")) {
        await deleteDoc(doc(db, "orders", id));
        alert("Order deleted.");
        loadOrders();
      }
    });
  });
}
