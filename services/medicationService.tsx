import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { scheduleNotification } from './notificationService';

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

    // جدولة الإشعار
    const stomachText = stomachStatus === 'empty' ? ' على معدة فارغة' :
                       stomachStatus === 'full' ? ' على معدة ممتلئة' : '';

    await scheduleNotification(
        `⏰ تذكير بالدواء: ${medName}`,
        `حان وقت تناول ${doseAmount} من ${medName}${stomachText}`,
        reminderTime,
        reminderType as 'notification' | 'alarm',
        'daily' // تكرار يومي
    );

    return docRef.id;
};
