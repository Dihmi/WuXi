import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your Firebase project config
// Firebase Console → Project Settings → Your apps → Web app → Config
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
