// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDAL6MM6rCU7W03V90-ypKDsYsXzK3_7M8",
    authDomain: "cryptotycoonmining.firebaseapp.com",
    projectId: "cryptotycoonmining",
    storageBucket: "cryptotycoonmining.firebasestorage.app",
    messagingSenderId: "64861457497",
    appId: "1:64861457497:android:fa4f56c141f788fd9e7548"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
