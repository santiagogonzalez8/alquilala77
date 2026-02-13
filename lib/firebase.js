import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Firestore con caché local para evitar "client is offline"
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  // Si ya fue inicializado, usar getFirestore
  const { getFirestore } = require('firebase/firestore');
  db = getFirestore(app);
}

export { db };

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});