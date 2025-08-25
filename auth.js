import { auth } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Register
document.getElementById("register").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("Registered: " + userCredential.user.email);
    })
    .catch(error => {
      alert(error.message);
    });
});

// Login
document.getElementById("login").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("Logged in: " + userCredential.user.email);
    })
    .catch(error => {
      alert(error.message);
    });
});

// Logout
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out!");
  }).catch(error => {
    alert(error.message);
  });
});
