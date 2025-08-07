// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
    initializeAuth,
    getReactNativePersistence,
    getAuth
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// قم بتغيير هذه القيم ببيانات مشروعك الخاصة من لوحة تحكم Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAPfZ0DYMJU8iNTmgRU90ewBV6QBQkT7i4",
    authDomain: "smart-health-assistant-d2d64.firebaseapp.com",
    projectId: "smart-health-assistant-d2d64",
    storageBucket: "smart-health-assistant-d2d64.firebasestorage.app",
    messagingSenderId: "987758210677",
    appId: "1:987758210677:web:a207b5249c0383c4e0923c",
    measurementId: "G-0Y18WLDKG9"
};
// ✅ تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// ✅ تهيئة المصادقة مع التخزين الدائم
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ تهيئة قاعدة بيانات Firestore
export const db = getFirestore(app);