import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Medication {
    medName: string;
    reminderTime: Date;
    userId: string;
    createdAt: any;
}

// دالة لإضافة دواء
export const addMedication = async (medName: string, reminderTime: Date) => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const newMed: Medication = {
        medName,
        reminderTime,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'medications'), newMed);
    return docRef.id;
};
