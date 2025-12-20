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
            console.log('✅ تم إنشاء قناة الإشعارات بنجاح');
        } catch (error) {
            console.log('⚠️ خطأ في إنشاء قناة الإشعارات:', error);
        }
    }
}

// طلب الإذن من المستخدم للإشعارات المحلية فقط
export async function registerForPushNotificationsAsync() {
    try {
        console.log('📱 جاري طلب أذونات الإشعارات المحلية...');

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

        console.log('✅ تم تفعيل الإشعارات المحلية بنجاح');
        return true;
    } catch (error) {
        console.log('⚠️ خطأ في طلب أذونات الإشعارات:', error);
        return false;
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

        console.log(`📅 جدولة إشعار: ${title}`);
        console.log(`⏰ الوقت المستهدف: ${targetTime.toLocaleString('ar-SA')}`);
        console.log(`🔁 نوع التكرار: ${repeatType}`);

        if (repeatType === 'daily') {
            // تكرار يومي - استخدام CalendarTrigger
            const notificationId = await Notifications.scheduleNotificationAsync({
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

            console.log(`✅ تم جدولة الإشعار اليومي: ${notificationId}`);
            return notificationId;

        } else if (repeatType === 'weekly' && weekdays && weekdays.length > 0) {
            // تكرار أسبوعي
            const notificationIds: string[] = [];

            for (const day of weekdays) {
                const notificationId = await Notifications.scheduleNotificationAsync({
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
                notificationIds.push(notificationId);
            }

            console.log(`✅ تم جدولة ${weekdays.length} إشعار أسبوعي`);
            return notificationIds;

        } else {
            // إشعار لمرة واحدة
            if (targetTime <= now) {
                // إذا كان الوقت قد مضى، جدوله لليوم التالي
                targetTime.setDate(targetTime.getDate() + 1);
                console.log(`⏭️ الوقت مضى، تم التأجيل لـ: ${targetTime.toLocaleString('ar-SA')}`);
            }

            const secondsUntilTrigger = Math.max(
                Math.floor((targetTime.getTime() - now.getTime()) / 1000),
                1
            );

            const notificationId = await Notifications.scheduleNotificationAsync({
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

            console.log(`✅ تم جدولة الإشعار لمرة واحدة: ${notificationId}`);
            console.log(`⏱️ سيظهر بعد ${secondsUntilTrigger} ثانية`);
            return notificationId;
        }
    } catch (error) {
        console.error('❌ خطأ في جدولة الإشعار:', error);
        Alert.alert(
            'خطأ في الإشعارات',
            'حدث خطأ أثناء جدولة التذكير. يرجى المحاولة مرة أخرى.'
        );
        throw error;
    }
}

// إلغاء إشعار معين
export async function cancelNotification(notificationId: string | string[]) {
    try {
        if (Array.isArray(notificationId)) {
            for (const id of notificationId) {
                await Notifications.cancelScheduledNotificationAsync(id);
            }
        } else {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
    } catch (error) {
        // Silent fail
    }
}

// إلغاء جميع الإشعارات المجدولة
export async function cancelAllScheduledNotifications() {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        // Silent fail
    }
}

// الحصول على جميع الإشعارات المجدولة
export async function getAllScheduledNotifications() {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        return [];
    }
}

// إرسال إشعار فوري للاختبار
export async function sendTestNotification() {
    try {
        await createAndroidChannel();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔔 إشعار تجريبي',
                body: 'الإشعارات تعمل بشكل صحيح!',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
                data: { type: 'test' },
            },
            trigger: {
                channelId: 'medication_reminders',
                seconds: 2,
            },
        });

        console.log('✅ تم إرسال إشعار تجريبي');
    } catch (error) {
        console.error('❌ خطأ في إرسال الإشعار التجريبي:', error);
    }
}
