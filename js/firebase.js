import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBErrsRyC9hOtzpEw-JUJBWh01QgXgci0k",
  authDomain: "ks-milk.firebaseapp.com",
  projectId: "ks-milk",
  storageBucket: "ks-milk.appspot.com",
  messagingSenderId: "165832463758",
  appId: "1:165832463758:web:c3a542ec6bdbe1ea0c0df"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase connected ✅");
