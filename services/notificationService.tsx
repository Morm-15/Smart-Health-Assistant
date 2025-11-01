import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// إعداد شكل ظهور الإشعارات
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

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
            console.log('Error creating notification channel:', error);
        }
    }
}

// طلب الإذن من المستخدم للإشعارات
export async function registerForPushNotificationsAsync() {
    try {
        // في Expo Go، نحتاج فقط للأذونات الأساسية
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert(
                'تنبيه',
                'لم يتم منح إذن الإشعارات. لن تتمكن من استلام تذكيرات الأدوية.',
                [{ text: 'حسناً' }]
            );
            return false;
        }

        // إنشاء قناة الإشعارات لأندرويد
        await createAndroidChannel();

        console.log('✅ تم تفعيل الإشعارات بنجاح');
        return true;
    } catch (error) {
        console.log('Error requesting permissions:', error);
        return false;
    }
}

// جدولة إشعار (يعمل مع Expo Go)
export async function scheduleNotification(
    title: string,
    body: string,
    date: Date,
    reminderType: 'notification' | 'alarm' | 'both',
    repeatType: 'once' | 'daily' | 'weekly' = 'once',
    weekdays?: number[]
) {
    try {
        await createAndroidChannel();

        const now = new Date();

        if (repeatType === 'daily') {
            // تكرار يومي
            const targetTime = new Date(date);
            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    data: { type: 'medication_reminder' },
                },
                trigger: {
                    hour: date.getHours(),
                    minute: date.getMinutes(),
                    repeats: true,
                } as any,
            });

            console.log(`✅ تم جدولة الإشعار اليومي: ${notificationId}`);
            return notificationId;
        } else if (repeatType === 'weekly' && weekdays) {
            // تكرار أسبوعي
            const notificationIds: string[] = [];
            for (const day of weekdays) {
                const notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title,
                        body,
                        sound: true,
                    },
                    trigger: {
                        weekday: day,
                        hour: date.getHours(),
                        minute: date.getMinutes(),
                        repeats: true,
                    } as any,
                });
                notificationIds.push(notificationId);
            }
            console.log(`✅ تم جدولة ${weekdays.length} إشعار أسبوعي`);
            return notificationIds;
        } else {
            // إشعار لمرة واحدة
            const targetTime = new Date(date);

            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            const seconds = Math.max((targetTime.getTime() - now.getTime()) / 1000, 5);

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    data: { type: 'medication_reminder' },
                },
                trigger: {
                    seconds,
                } as any,
            });

            console.log(`✅ تم جدولة الإشعار: ${notificationId}`);
            return notificationId;
        }
    } catch (error) {
        console.error('❌ خطأ في جدولة الإشعار:', error);
        Alert.alert(
            'تنبيه',
            'للإشعارات الكاملة، يرجى استخدام Development Build بدلاً من Expo Go. الإشعارات المحلية فقط متاحة في Expo Go.'
        );
        throw error;
    }
}

// إلغاء جميع الإشعارات المجدولة
export async function cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ تم إلغاء جميع الإشعارات المجدولة');
}

// الحصول على جميع الإشعارات المجدولة
export async function getAllScheduledNotifications() {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 عدد الإشعارات المجدولة: ${notifications.length}`);
    return notifications;
}
