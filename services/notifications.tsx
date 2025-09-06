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

// جدولة إشعار
export async function scheduleNotification(
    title: string,
    body: string,
    date: Date,
    reminderType: 'notification' | 'alarm'
) {
    // إنشاء القناة أول مرة قبل جدولة الإشعار (Android)
    await createAndroidChannel();

    // حساب الوقت بالثواني من الآن حتى التاريخ المحدد
    const seconds = Math.max((date.getTime() - Date.now()) / 1000, 1);

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: reminderType === 'alarm' ? 'default' : undefined,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
            channelId: 'medication_reminders', // ربط القناة على Android
        },
    });
}
