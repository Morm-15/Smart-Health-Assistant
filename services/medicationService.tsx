import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Medication {
    medName: string;         // اسم الدواء
    stomachStatus: string;   // حالة المعدة (فارغة، ممتلئة، لا يهم)
    reminderType: string;    // نوع التنبيه (إشعار، صوت، كلاهما)
    doseAmount: number;      // كمية الدواء
    reminderTime: Date;      // وقت التذكير
    userId: string;
    createdAt: any;
}

// دالة لإضافة دواء جديد
export const addMedication = async (
    medName: string,
    stomachStatus: string,
    reminderType: string,
    doseAmount: number,
    reminderTime: Date
) => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const newMed: Medication = {
        medName,
        stomachStatus,
        reminderType,
        doseAmount,
        reminderTime,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'medications'), newMed);
    return docRef.id;
};
