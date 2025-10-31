// firebase-messaging-sw.js — KS MILK Push Notifications

importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDWlIcY8xsjAI72GWkiUEWzZpgQXY5CcfM",
  authDomain: "ks-milk-4551a.firebaseapp.com",
  projectId: "ks-milk-4551a",
  storageBucket: "ks-milk-4551a.firebasestorage.app",
  messagingSenderId: "463842826689",
  appId: "1:463842826689:web:2e04e8cbf137592e183740"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Received background message:', payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || "https://mohanraj-official.github.io/KS-MILK/assets/images/logo.png"
  });
});
