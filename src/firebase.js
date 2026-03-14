import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your Firebase project config
// Firebase Console → Project Settings → Your apps → Web app → Config
const firebaseConfig = {
  apiKey: "AIzaSyAKEcS54qjLPaSpvlMk83qjF1Puk0pTqNM",
  authDomain: "wuxi-app.firebaseapp.com",
  projectId: "wuxi-app",
  storageBucket: "wuxi-app.firebasestorage.app",
  messagingSenderId: "298004822410",
  appId: "1:298004822410:web:30e2400f1b5c81e4fff073",
  measurementId: "G-FMYB7VYR1E"
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
