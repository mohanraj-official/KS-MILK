// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBErrsRyC9hOtzpEw-JUJBWh01QgXgci0k",
    authDomain: "ks-milk.firebaseapp.com",
    projectId: "ks-milk",
    storageBucket: "ks-milk.firebasestorage.app",
    messagingSenderId: "165832463758",
    appId: "1:165832463758:web:c3a542ece6bdeb1ea0c0df"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



import { db, auth } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("register").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: new Date()
        });

        alert("User registered and saved in Firestore!");
    } catch (error) {
        alert(error.message);
    }
});
