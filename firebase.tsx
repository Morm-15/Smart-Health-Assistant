// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
    initializeAuth,
    getReactNativePersistence,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBuutbmXIR8hzK5DoOoyXZ-cw83W53ME5Y",
    authDomain: "smart-health-assistant-4422a.firebaseapp.com",
    projectId: "smart-health-assistant-4422a",
    storageBucket: "smart-health-assistant-4422a.firebasestorage.app",
    messagingSenderId: "251625268437",
    appId: "1:251625268437:web:2789b44df1a0ee73666e5c",
    measurementId: "G-L5DVWVEDH2"
};

// ✅ تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// ✅ تهيئة المصادقة مع التخزين الدائم
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ تهيئة قاعدة بيانات Firestore
export const db = getFirestore(app);