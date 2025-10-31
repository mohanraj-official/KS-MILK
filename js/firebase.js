// ---------------------------------------------------
// firebase.js — KS-MILK (Final Refined Version)
// ---------------------------------------------------

// Import Firebase SDKs
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
// 🔹 Request Notification Permission + Save Token
// ---------------------------------------------------
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("🔔 Notification permission granted.");

      const token = await getToken(messaging, {
        vapidKey: "BOkG8TYzCuySeqmDGJ_4qTMTPcyTMl8nKmfRVJ6_VEh2eLq0sEb8cRpeY6rvO1Gk6E8vXFbfkwKqZzR6_gc03B0"
      });

      console.log("📱 FCM Token:", token);

      // ✅ Save token in Firestore for the logged-in user
      const user = auth.currentUser;
      if (user && token) {
        await setDoc(doc(db, "userTokens", user.uid), {
          token,
          email: user.email || "unknown",
          updatedAt: new Date()
        });
        console.log("✅ Token saved to Firestore for user:", user.uid);
      }

      return token;
    } else {
      console.warn("❌ Notification permission denied by user.");
    }
  } catch (error) {
    console.error("⚠️ Error getting FCM token:", error);
  }
}

// ---------------------------------------------------
// 🔹 Handle Foreground Notifications
// ---------------------------------------------------
onMessage(messaging, (payload) => {
  console.log("📩 Message received in foreground:", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
  });
});

// ---------------------------------------------------
// 🔹 Exports
// ---------------------------------------------------
export { app, auth, db, messaging };

console.log("🔥 Firebase connected successfully to:", firebaseConfig.projectId);
