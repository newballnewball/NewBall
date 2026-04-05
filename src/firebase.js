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

export const TIERS = [
  { id: "daily",   label: "Daily",   amount: 0.25, drawCron: "daily",   color: "#60a5fa", next: nextDaily()   },
  { id: "weekly",  label: "Weekly",  amount: 1.00, drawCron: "weekly",  color: "#a78bfa", next: nextWeekly()  },
  { id: "monthly", label: "Monthly", amount: 2.00, drawCron: "monthly", color: "#f472b6", next: nextMonthly() },
  { id: "yearly",  label: "Yearly",  amount: 10.00,drawCron: "yearly",  color: "#fb923c", next: nextYearly()  },
];

function nextDaily() {
  const d = new Date(); d.setDate(d.getDate()+1); d.setHours(20,0,0,0); return d.toISOString();
}
function nextWeekly() {
  const d = new Date(); const day = d.getDay(); const diff = (7 - day) % 7 || 7;
  d.setDate(d.getDate()+diff); d.setHours(20,0,0,0); return d.toISOString();
}
function nextMonthly() {
  const d = new Date(); d.setMonth(d.getMonth()+1,1); d.setHours(20,0,0,0); return d.toISOString();
}
function nextYearly() {
  const d = new Date(); d.setFullYear(d.getFullYear()+1,0,1); d.setHours(20,0,0,0); return d.toISOString();
}

export const HONOR_LINES = [
  "NooBall runs on good vibes and good faith. You know what to do.",
  "We don't have a bouncer. Just your conscience.",
  "No Stripe. No fees. Just humans being decent.",
  "One dollar. One tap. Good karma guaranteed.",
  "This is the honor system. Don't be that person.",
];

export const PINKY_LINES = [
  "That's a digital pinky swear. We're holding you to it. 🤙",
  "You just shook hands with the whole pool. Welcome in. 🤝",
  "Consider this your official NooBall oath. No take-backs. ⚾",
  "The pool felt that. You're locked in. Let's go. 🎉",
];
