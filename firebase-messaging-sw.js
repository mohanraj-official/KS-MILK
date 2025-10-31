// firebase-messaging-sw.js — KS MILK Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging.js');

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDWlIcY8xsjAI72GWkiUEWzZpgQXY5CcfM",
  authDomain: "ks-milk-4551a.firebaseapp.com",
  projectId: "ks-milk-4551a",
  storageBucket: "ks-milk-4551a.firebasestorage.app",
  messagingSenderId: "463842826689",
  appId: "1:463842826689:web:2e04e8cbf137592e183740"
};

// ✅ Initialize Firebase in Service Worker
firebase.initializeApp(firebaseConfig);

// ✅ Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// ✅ Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Received background message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/images/logo.png' // optional icon path
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
