// services/authService.ts
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const signUpUser = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        return userCredential;
    } catch (error) {
        console.error('Sign up failed:', error);
        throw error;
    }
};

export const saveUserToFirestore = async (
    uid: string,
    email: string,
    firstName: string,
    lastName: string
) => {
    try {
        await setDoc(doc(db, 'users', uid), {
            email,
            firstName,
            lastName,
            createdAt: serverTimestamp(),
            verified: true,
        });
    } catch (error) {
        throw error;
    }
};

