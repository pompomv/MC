// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCrLyijkj6_PLlV2DXb7CJ2l_l-hFHA4QE",
  authDomain: "bsf-magoot-monitor.firebaseapp.com",
  databaseURL: "https://bsf-magoot-monitor-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "bsf-magoot-monitor",
  storageBucket: "bsf-magoot-monitor.firebasestorage.app",
  messagingSenderId: "1086992910704",
  appId: "1:1086992910704:web:99c7c4c4caadb2ae5ae7b5",
  measurementId: "G-VKKH4ZXR7B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getDatabase(app);