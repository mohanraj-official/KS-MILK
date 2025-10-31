// firebase.js — KS-MILK (Final + FCM Ready for GitHub Pages)

// ---------------------------------------------------
// 🔹 Import Firebase SDKs (CDN)
// ---------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
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
  appId: "1:463842826689:web:2e04e8cbf137592e183740",
};

// ---------------------------------------------------
// 🔹 Initialize Firebase + Services
// ---------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// ---------------------------------------------------
// 🔹 Request Notification Permission + Get Token
// ---------------------------------------------------
export async function requestNotificationPermission() {
  try {
    // 🔸 Register service worker — IMPORTANT for GitHub Pages
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    console.log("✅ Service Worker registered:", registration);

    // 🔸 Ask for browser permission
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("🔔 Notification permission granted.");

      // 🔸 Get FCM Token
      const token = await getToken(messaging, {
        vapidKey: "BOkG8TYzCuySeqmDGJ_4qTMTPcyTMl8nKmfRVJ6_VEh2eLq0sEb8cRpeY6rvO1Gk6E8vXFbfkwKqZzR6_gc03B0",
        serviceWorkerRegistration: registration,
      });

      console.log("📱 FCM Token:", token);
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
  const { title, body } = payload.notification || {};
  if (title && body) {
    new Notification(title, { body });
  }
});

// ---------------------------------------------------
// 🔹 Export Firebase Instances
// ---------------------------------------------------
export { app, auth, db, storage, messaging };

console.log("🔥 Firebase connected successfully to:", firebaseConfig.projectId);
