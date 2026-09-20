import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBlCnLroD2qk8F2NYE07UW5OCFCz-hV8iI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pos-demo-837d5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pos-demo-837d5',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pos-demo-837d5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '594812029122',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:594812029122:web:2c1a06d3082dca2f6e935b',
};

// Prevent duplicate initialization in hot-reload dev
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
