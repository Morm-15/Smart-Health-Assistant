# دليل الإشعارات - Smart Health Assistant

## ⚠️ ملاحظة مهمة حول Expo Go

منذ إصدار Expo SDK 53، تم إزالة دعم **Push Notifications (الإشعارات البعيدة)** من Expo Go. 

### ما يعمل:
✅ **Local Notifications (الإشعارات المحلية)** - تعمل بشكل كامل في Expo Go
- جدولة إشعارات محلية
- تكرار يومي/أسبوعي
- إشعارات فورية
- إدارة الإشعارات المجدولة

### ما لا يعمل:
❌ **Push Notifications (الإشعارات البعيدة)** - تحتاج Development Build
- الإشعارات من الخادم
- FCM/APNs tokens
- الإشعارات عن بُعد

## 🚀 كيفية استخدام الإشعارات

### 1. طلب الأذونات
```typescript
import { registerForPushNotificationsAsync } from './services/notificationService';

// في useEffect أو عند بدء التطبيق
await registerForPushNotificationsAsync();
```

### 2. جدولة إشعار بسيط
```typescript
import { scheduleNotification } from './services/notificationService';

const reminderTime = new Date();
reminderTime.setHours(14, 30, 0); // 2:30 PM

await scheduleNotification(
    'تذكير بالدواء',
    'حان وقت تناول الدواء',
    reminderTime,
    'notification',
    'once' // مرة واحدة
);
```

### 3. جدولة إشعار يومي
```typescript
await scheduleNotification(
    'تذكير يومي',
    'حان وقت تناول الدواء',
    reminderTime,
    'notification',
    'daily' // تكرار يومي
);
```

### 4. جدولة إشعار أسبوعي
```typescript
await scheduleNotification(
    'تذكير أسبوعي',
    'حان وقت تناول الدواء',
    reminderTime,
    'notification',
    'weekly',
    [1, 3, 5] // الأحد، الثلاثاء، الخميس (1=Sunday, 7=Saturday)
);
```

### 5. اختبار الإشعارات
```typescript
import { sendTestNotification } from './services/notificationService';

await sendTestNotification();
// سيظهر إشعار تجريبي بعد ثانيتين
```

## 📱 اختبار التطبيق

### في Expo Go:
```bash
npm start
# ثم اضغط 'a' لأندرويد أو 'i' لـ iOS
```

### إذا كنت بحاجة للإشعارات البعيدة:
يجب إنشاء Development Build:
```bash
npx expo install expo-dev-client
npx expo run:android
# أو
npx expo run:ios
```

## 🔧 استكشاف الأخطاء

### الإشعارات لا تظهر؟
1. تحقق من الأذونات في إعدادات الهاتف
2. تأكد من أن الوقت المجدول لم يمضي
3. راجع console logs لرؤية رسائل التشخيص
4. جرب إشعار تجريبي: `sendTestNotification()`

### الإشعارات تظهر بدون صوت؟
- تحقق من إعدادات الصوت في الهاتف
- تأكد من أن الهاتف ليس في وضع الصامت
- راجع `createAndroidChannel()` في Android

## 📝 الدوال المتاحة

| الدالة | الوصف |
|--------|--------|
| `registerForPushNotificationsAsync()` | طلب أذونات الإشعارات |
| `scheduleNotification()` | جدولة إشعار جديد |
| `cancelNotification()` | إلغاء إشعار معين |
| `cancelAllScheduledNotifications()` | إلغاء جميع الإشعارات |
| `getAllScheduledNotifications()` | الحصول على قائمة الإشعارات المجدولة |
| `sendTestNotification()` | إرسال إشعار تجريبي |

## 🎯 أفضل الممارسات

1. **طلب الأذونات مبكراً**: اطلب الأذونات عند بدء التطبيق
2. **اختبار التوقيت**: تأكد من أن الأوقات المجدولة صحيحة
3. **معالجة الأخطاء**: استخدم try/catch عند جدولة الإشعارات
4. **إلغاء الإشعارات القديمة**: احذف الإشعارات التي لم تعد مطلوبة
5. **استخدام Console Logs**: راجع الـ logs لمتابعة حالة الإشعارات

## 📚 مصادر إضافية

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)

