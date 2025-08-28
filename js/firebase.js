<!-- Firebase SDKs -->
<script type="module">
  // Import the functions you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBErrsRyC9hOtZpeW-JUJBlw91QqXgc10K",
    authDomain: "ks-milk.firebaseapp.com",
    projectId: "ks-milk",
    storageBucket: "ks-milk.appspot.com",
    messagingSenderId: "165832463758",
    appId: "1:165832463758:web:c3a542ec6dbde1ea0c0df"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log("Firebase Connected:", app);
</script>
