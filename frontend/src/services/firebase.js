import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxxFplPvmKgSn4YIym7jhBiVxhSu_nzeQ",
  authDomain: "snackloader.firebaseapp.com",
  projectId: "snackloader",
  storageBucket: "snackloader.firebasestorage.app",
  messagingSenderId: "207394701592",
  appId: "1:207394701592:web:f04908c7acddc0170a1e6d",
  measurementId: "G-Z7FDLRCBWG",
  databaseURL: "https://snackloader-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
