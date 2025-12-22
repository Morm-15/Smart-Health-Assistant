import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// إعداد شكل ظهور الإشعارات بشكل آمن
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    // Silent fail في Expo Go
}

// إنشاء قناة إشعارات على Android
export async function createAndroidChannel() {
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('medication_reminders', {
                name: 'تذكيرات الأدوية',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
                enableVibrate: true,
            });
        } catch (error) {
            // Silent fail
        }
    }
}

// طلب أذونات الإشعارات بشكل آمن (للاستخدام عند الحاجة فقط)
export async function requestPermissions() {
    try {
        // إنشاء قناة Android فقط - لا نطلب أذونات لتجنب التحذيرات في Expo Go
        await createAndroidChannel();
    } catch (error) {
        // Silent fail
    }
}

// جدولة إشعار محلي (يعمل مع Expo Go)
export async function scheduleNotification(
    title: string,
    body: string,
    date: Date,
    reminderType: 'notification' | 'alarm' | 'both' = 'notification',
    repeatType: 'once' | 'daily' | 'weekly' = 'once',
    weekdays?: number[]
) {
    try {

        // التأكد من إنشاء القناة أولاً
        await createAndroidChannel();

        const now = new Date();
        const targetTime = new Date(date);

        if (repeatType === 'daily') {
            // تكرار يومي - استخدام CalendarTrigger
            return await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: { type: 'medication_reminder' },
                },
                trigger: {
                    channelId: 'medication_reminders',
                    hour: targetTime.getHours(),
                    minute: targetTime.getMinutes(),
                    repeats: true,
                },
            });

        } else if (repeatType === 'weekly' && weekdays && weekdays.length > 0) {
            // تكرار أسبوعي
            const notificationIds: string[] = [];

            for (const day of weekdays) {
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title,
                        body,
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                        data: { type: 'medication_reminder' },
                    },
                    trigger: {
                        channelId: 'medication_reminders',
                        weekday: day,
                        hour: targetTime.getHours(),
                        minute: targetTime.getMinutes(),
                        repeats: true,
                    },
                });
                notificationIds.push(id);
            }

            return notificationIds;

        } else {
            // إشعار لمرة واحدة
            if (targetTime <= now) {
                // إذا كان الوقت قد مضى، جدوله لليوم التالي
                targetTime.setDate(targetTime.getDate() + 1);
            }

            const secondsUntilTrigger = Math.max(
                Math.floor((targetTime.getTime() - now.getTime()) / 1000),
                1
            );

            return await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: { type: 'medication_reminder' },
                },
                trigger: {
                    channelId: 'medication_reminders',
                    seconds: secondsUntilTrigger,
                },
            });
        }
    } catch (error) {
        // Silent fail - لا تعرض رسائل خطأ
        return null;
    }
}

