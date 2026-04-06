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

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const ADMIN_EMAIL = "emaildavedavis@gmail.com";

// Next Sunday midnight
function nextSundayMidnight() {
  const d = new Date();
  const daysUntil = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// One pool. One dollar. One winner.
export function getTier() {
  return { id:"weekly", label:"Weekly", amount:1.00, color:"#a78bfa", next:nextSundayMidnight() };
}

// Backward compat for history display
export function getTiers() {
  return [getTier()];
}

export const HONOR_LINES = [
  "NooBall runs on good vibes and good faith. You know what to do.",
  "We don't have a bouncer. Just your conscience.",
  "No Stripe. No fees. Just humans being decent.",
  "One dollar. One tap. Good karma guaranteed.",
  "This is the honor system. Don't be that person.",
];

export const PINKY_LINES = [
  "That's a digital pinky swear. We're holding you to it.",
  "You just shook hands with the whole pool. Welcome in.",
  "Consider this your official NooBall oath. No take-backs.",
  "The pool felt that. You're locked in. Let's go.",
];

export const SAMPLE_WISHES = [
  { name:"Marcus T.", wish:"Finally buy that guitar I've been eyeing for 3 years" },
  { name:"Sofia M.",  wish:"A really nice candle and a slow Sunday morning" },
  { name:"Reuben F.", wish:"New running shoes — mine are held together by hope" },
  { name:"Tyler H.",  wish:"Date night — dinner and a movie, no budget stress" },
  { name:"Layla R.",  wish:"Taco Tuesday for the whole office — my treat" },
  { name:"Priya K.",  wish:"Start my balcony herb garden" },
  { name:"Devon S.",  wish:"A stack of books I've had on my list forever" },
  { name:"Nadia B.",  wish:"A fancy pour-over coffee setup" },
];
