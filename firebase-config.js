// Firebase configuration
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyAOB5DMSGYT9HElOlxl-7U_ZeHscxM7odc",
  authDomain: "store-password-generate-link.firebaseapp.com",
  databaseURL:
    "https://store-password-generate-link-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "store-password-generate-link",
  storageBucket: "store-password-generate-link.firebasestorage.app",
  messagingSenderId: "614612546154",
  appId: "1:614612546154:web:c27168400ae9a08eb4d013",
  measurementId: "G-G6SB0W844Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
