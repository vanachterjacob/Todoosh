// Firebase configuration template
// Rename this file to firebase-config.js and fill in your Firebase project details
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
    databaseURL: "YOUR_DATABASE_URL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database instance
const database = firebase.database(); 