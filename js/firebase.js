// firebase.js — KS-MILK (Final + FCM Ready for GitHub Pages)

// Import required Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging.js";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWlIcY8xsjAI72GWkiUEWzZpgQXY5CcfM",
  authDomain: "ks-milk-4551a.firebaseapp.com",
  projectId: "ks-milk-4551a",
  storageBucket: "ks-milk-4551a.firebasestorage.app",
  messagingSenderId: "463842826689",
  appId: "1:463842826689:web:2e04e8cbf137592e183740"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// ✅ Request permission for notifications (browser prompt)
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("🔔 Notification permission granted.");
      const token = await getToken(messaging, {
        vapidKey: "YOUR_PUBLIC_VAPID_KEY_HERE"
      });
      console.log("📱 FCM Token:", token);
      return token;
    } else {
      console.log("❌ Notification permission denied.");
    }
  } catch (error) {
    console.error("⚠️ Error getting FCM token:", error);
  }
}

// ✅ Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("📩 Message received in foreground:", payload);
  new Notification(payload.notification.title, {
    body: payload.notification.body,
  });
});

export { app, auth, db, messaging };

console.log("🔥 Firebase connected successfully to:", firebaseConfig.projectId);
