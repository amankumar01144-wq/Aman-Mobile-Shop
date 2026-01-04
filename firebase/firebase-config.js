// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyBzzqTuXiEbHJchitI-7FVJZtkV8azqr2U",
    authDomain: "shopwave-24s1y.firebaseapp.com",
    databaseURL: "https://shopwave-24s1y-default-rtdb.firebaseio.com",
    projectId: "shopwave-24s1y",
    storageBucket: "shopwave-24s1y.firebasestorage.app",
    messagingSenderId: "142784804825",
    appId: "1:142784804825:web:99662c9f544587a2c4cbc8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
