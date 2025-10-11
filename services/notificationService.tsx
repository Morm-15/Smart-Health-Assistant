import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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

// إنشاء قناة إشعارات على Android (مرة واحدة فقط)
export async function createAndroidChannel() {
    if (Device.osName === 'Android') {
        await Notifications.setNotificationChannelAsync('medication_reminders', {
            name: 'Medication Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default', // أو اسم ملف صوتي موجود في assets
        });
    }
}

// طلب الإذن من المستخدم للإشعارات
export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        alert('Push notifications only work on physical devices.');
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Permission for notifications not granted!');
        return;
    }
}

// جدولة إشعار (مرة واحدة / يومياً / أسبوعياً)
export async function scheduleNotification(
    title: string,
    body: string,
    date: Date,
    reminderType: 'notification' | 'alarm',
    repeatType?: 'once' | 'daily' | 'weekly',
    weekdays?: number[] // للأسبوعي: 1=الأحد, 2=الاثنين ... 7=السبت
) {
    await createAndroidChannel();

    let trigger: Notifications.NotificationTriggerInput;

    if (repeatType === 'daily') {
        trigger = {
            hour: date.getHours(),
            minute: date.getMinutes(),
            repeats: true,
            channelId: 'medication_reminders',
        };
    } else if (repeatType === 'weekly' && weekdays) {
        // إنشاء إشعارات لكل يوم من أيام الأسبوع المحددة
        for (const day of weekdays) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: reminderType === 'alarm' ? 'default' : undefined,
                },
                trigger: {
                    weekday: day,
                    hour: date.getHours(),
                    minute: date.getMinutes(),
                    repeats: true,
                    channelId: 'medication_reminders',
                },
            });
        }
        return;
    } else {
        // إشعار لمرة واحدة فقط
        const seconds = Math.max((date.getTime() - Date.now()) / 1000, 1);
        trigger = {
            seconds,
            repeats: false,
            channelId: 'medication_reminders',
        };
    }

    // جدولة الإشعار
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: reminderType === 'alarm' ? 'default' : undefined,
        },
        trigger,
    });
}
