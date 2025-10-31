// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

firebase.initializeApp({
  messagingSenderId: "463842826689"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log("📦 Received background message ", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
