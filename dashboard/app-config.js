const dashboardFirebaseConfig = {
    apiKey: "AIzaSyBNwQKnuIomQGm41bsGclI9ihY3SiK78eU",
    authDomain: "saybr-masr.firebaseapp.com",
    databaseURL: "https://saybr-masr-default-rtdb.firebaseio.com",
    projectId: "saybr-masr",
    storageBucket: "saybr-masr.firebasestorage.app",
    messagingSenderId: "650974582933",
    appId: "1:650974582933:web:01ad2aaf2e89c9b668639c"
};

const dashboardFirebaseApp = firebase.initializeApp(dashboardFirebaseConfig, 'saybrMasrDashboard');
const dashboardDb = firebase.database(dashboardFirebaseApp);
const dashboardAuth = firebase.auth(dashboardFirebaseApp);
