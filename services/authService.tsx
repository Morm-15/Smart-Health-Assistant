// services/authService.ts
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // تأكد من صحة المسار

export const signUpUser = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // إرسال رابط التحقق
    await sendEmailVerification(userCredential.user);

    // حفظ بيانات المستخدم في Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        createdAt: serverTimestamp(),
        verified: false,
    });

    return userCredential;
};
