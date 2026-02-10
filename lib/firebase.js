import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCfQxGT9EhJpv4vXZoMTHyy6Gl7Vih-f6w",
  authDomain: "alquilala-77.firebaseapp.com",
  projectId: "alquilala-77",
  storageBucket: "alquilala-77.firebasestorage.app",
  messagingSenderId: "27583580727",
  appId: "1:27583580727:web:3d88d9654302a37a064db2",
  measurementId: "G-LTFTEXY9NM"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});