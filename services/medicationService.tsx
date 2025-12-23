import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { scheduleNotification, cancelAllNotifications } from './notificationService';
import i18n from '../i18n';

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

    // إعادة جدولة جميع الإشعارات لضمان التزامن
    await rescheduleAllMedicationNotifications();

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

    // إعادة جدولة جميع الإشعارات بعد الحذف
    await rescheduleAllMedicationNotifications();
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

    // إعادة جدولة جميع الإشعارات لضمان التحديث
    await rescheduleAllMedicationNotifications();

    return medicationId;
};

// دالة لإعادة جدولة جميع إشعارات الأدوية
export const rescheduleAllMedicationNotifications = async () => {
    try {
        console.log('🔄 [Notifications] بدء إعادة جدولة الإشعارات...');

        // 1. إلغاء جميع الإشعارات المجدولة
        await cancelAllNotifications();
        console.log('✅ [Notifications] تم إلغاء جميع الإشعارات القديمة');

        // انتظار قصير للتأكد من إتمام الإلغاء
        await new Promise(resolve => setTimeout(resolve, 200));

        // 2. جلب جميع الأدوية
        const medications = await getMedications();
        console.log(`📋 [Notifications] عدد الأدوية: ${medications.length}`);

        // 3. جدولة إشعار لكل دواء
        for (const med of medications) {
            const reminderTime = med.reminderTime?.toDate ? med.reminderTime.toDate() : new Date(med.reminderTime);

            // استخدام الترجمات المناسبة
            const title = i18n.t('medication.notificationTitle', { medName: med.medName });
            let body = '';

            if (med.stomachStatus === 'empty') {
                body = i18n.t('medication.notificationBodyEmpty', {
                    doseAmount: med.doseAmount,
                    medName: med.medName
                });
            } else if (med.stomachStatus === 'full') {
                body = i18n.t('medication.notificationBodyFull', {
                    doseAmount: med.doseAmount,
                    medName: med.medName
                });
            } else {
                body = i18n.t('medication.notificationBody', {
                    doseAmount: med.doseAmount,
                    medName: med.medName
                });
            }

            console.log(`⏰ [Notifications] جدولة إشعار لـ: ${med.medName} في ${reminderTime.toLocaleTimeString()}`);

            // جدولة إشعار واحد متكرر يومياً
            await scheduleNotification(
                title,
                body,
                reminderTime,
                med.reminderType as 'notification' | 'alarm',
                'daily'
            );
        }

        console.log('✅ [Notifications] تم الانتهاء من جدولة جميع الإشعارات');
    } catch (error) {
        console.error('❌ [Notifications] خطأ في إعادة جدولة الإشعارات:', error);
    }
};


