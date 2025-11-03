// ---------------------------------------------------
// 🥛 KS MILK — firebase.js (Final Refined Version)
// ---------------------------------------------------

// 🔹 Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging.js";

// ---------------------------------------------------
// 🔹 Firebase Configuration
// ---------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDWlIcY8xsjAI72GWkiUEWzZpgQXY5CcfM",
  authDomain: "ks-milk-4551a.firebaseapp.com",
  projectId: "ks-milk-4551a",
  storageBucket: "ks-milk-4551a.appspot.com",
  messagingSenderId: "463842826689",
  appId: "1:463842826689:web:2e04e8cbf137592e183740"
};

// ---------------------------------------------------
// 🔹 Initialize Firebase
// ---------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// ---------------------------------------------------
// 🔹 Request Notification Permission (Admin / User)
// ---------------------------------------------------
export async function requestNotificationPermission(role = "customer", userId = null) {
  try {
    // Register service worker at root level
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("✅ Service Worker registered:", registration);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied.");
      return null;
    }

    // Get token
    const token = await getToken(messaging, {
      vapidKey: "BOkG8TYzCuySeqmDGJ_4qTMTPcyTMl8nKmfRVJ6_VEh2eLq0sEb8cRpeY6rvO1Gk6E8vXFbfkwKqZzR6_gc03B0",
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("⚠️ FCM token not generated.");
      return null;
    }

    console.log("📱 FCM Token:", token);

    // Save token based on role
    const user = auth.currentUser;
    const uid = userId || user?.uid;
    if (!uid) return token;

    const collectionName = role === "admin" ? "adminTokens" : "userTokens";
    await setDoc(doc(db, collectionName, uid), {
      token,
      email: user?.email || "unknown",
      updatedAt: new Date()
    }, { merge: true });

    console.log(`✅ Token saved in '${collectionName}' for ${uid}`);
    return token;

  } catch (error) {
    console.error("⚠️ Error requesting notification permission:", error);
  }
}

// ---------------------------------------------------
// 🔹 Foreground Message Handler
// ---------------------------------------------------
onMessage(messaging, (payload) => {
  console.log("📩 Foreground message:", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
  });
});

// ---------------------------------------------------
// 🔹 Exports
// ---------------------------------------------------
export { app, auth, db, messaging };
console.log("🔥 Firebase connected successfully to:", firebaseConfig.projectId);
