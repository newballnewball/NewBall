import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHk4EwbbrfZ9KFo0s01RUFlRrTGShbKuE",
  authDomain: "new-ball-dad7d.firebaseapp.com",
  projectId: "new-ball-dad7d",
  storageBucket: "new-ball-dad7d.firebasestorage.app",
  messagingSenderId: "688644763399",
  appId: "1:688644763399:web:93e04010a517ac6058dfa2",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const ADMIN_EMAIL = "emaildavedavis@gmail.com";
