import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { scheduleNotification } from './notificationService';

export interface Medication {
    id?: string;             // معرف الدواء
    medName: string;         // اسم الدواء
    stomachStatus: string;   // حالة المعدة (فارغة، ممتلئة، لا يهم)
    reminderType: string;    // نوع التنبيه (إشعار، صوت، كلاهما)
    doseAmount: number;      // كمية الدواء
    reminderTime: any;      // وقت التذكير
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

    // التحقق من عدم وجود دواء بنفس الاسم
    const exists = await checkMedicationExists(medName);
    if (exists) {
        throw new Error('MEDICATION_EXISTS');
    }

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

// دالة لجلب جميع الأدوية للمستخدم الحالي
export const getMedications = async (): Promise<Medication[]> => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const q = query(
        collection(db, 'medications'),
        where('userId', '==', auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const medications: Medication[] = [];

    querySnapshot.forEach((doc) => {
        medications.push({
            id: doc.id,
            ...doc.data(),
        } as Medication);
    });

    // ترتيب الأدوية حسب وقت التذكير
    medications.sort((a, b) => {
        const timeA = a.reminderTime?.toDate ? a.reminderTime.toDate() : new Date(a.reminderTime);
        const timeB = b.reminderTime?.toDate ? b.reminderTime.toDate() : new Date(b.reminderTime);
        return timeA.getTime() - timeB.getTime();
    });

    return medications;
};

// دالة لحذف دواء
export const deleteMedication = async (medicationId: string) => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const medicationRef = doc(db, 'medications', medicationId);
    await deleteDoc(medicationRef);

    // يمكن إضافة كود لإلغاء الإشعار المجدول هنا إذا لزم الأمر
};

// دالة للتحقق من وجود دواء بنفس الاسم
export const checkMedicationExists = async (medName: string, excludeId?: string): Promise<boolean> => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const q = query(
        collection(db, 'medications'),
        where('userId', '==', auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
        const medication = doc.data() as Medication;
        // تحويل الأسماء إلى حروف صغيرة للمقارنة
        const existingName = medication.medName.toLowerCase().trim();
        const newName = medName.toLowerCase().trim();

        // استثناء الدواء الحالي عند التعديل
        if (excludeId && doc.id === excludeId) continue;

        if (existingName === newName) {
            return true;
        }
    }

    return false;
};

// دالة لتعديل دواء موجود
export const updateMedication = async (
    medicationId: string,
    medName: string,
    stomachStatus: string,
    reminderType: string,
    doseAmount: number,
    reminderTime: Date
) => {
    if (!auth.currentUser) throw new Error('User not logged in');

    const medicationRef = doc(db, 'medications', medicationId);

    const updatedMed = {
        medName,
        stomachStatus,
        reminderType,
        doseAmount,
        reminderTime,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(medicationRef, updatedMed);

    // إعادة جدولة الإشعار
    const stomachText = stomachStatus === 'empty' ? ' على معدة فارغة' :
                       stomachStatus === 'full' ? ' على معدة ممتلئة' : '';

    await scheduleNotification(
        `⏰ تذكير بالدواء: ${medName}`,
        `حان وقت تناول ${doseAmount} من ${medName}${stomachText}`,
        reminderTime,
        reminderType as 'notification' | 'alarm',
        'daily'
    );

    return medicationId;
};


