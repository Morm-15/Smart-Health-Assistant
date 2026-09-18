import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '../components/ScreenHeader';
import {
    scheduleNotification,
    cancelAllNotifications,
    getAllScheduledNotifications,
    requestPermissions,
} from '../services/notificationService';

const TestNotificationsScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [scheduledCount, setScheduledCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const refreshCount = async () => {
        const notifications = await getAllScheduledNotifications();
        setScheduledCount(notifications.length);
    };

    const handleSendNow = async () => {
        setLoading(true);
        try {
            await requestPermissions();
            const testTime = new Date(Date.now() + 5000); // بعد 5 ثواني
            await scheduleNotification(
                '🧪 إشعار تجريبي',
                'هذا إشعار تجريبي سيظهر بعد 5 ثواني',
                testTime,
                'notification',
                'once'
            );
            Alert.alert('✅ تم', 'سيظهر الإشعار خلال 5 ثواني');
            await refreshCount();
        } catch (error) {
            Alert.alert('❌ خطأ', 'فشل إرسال الإشعار');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleDaily = async () => {
        setLoading(true);
        try {
            await requestPermissions();
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            await scheduleNotification(
                '💊 تذكير الدواء اليومي',
                'حان وقت تناول دوائك اليومي',
                now,
                'notification',
                'daily'
            );
            Alert.alert('✅ تم', 'تم جدولة إشعار يومي متكرر');
            await refreshCount();
        } catch (error) {
            Alert.alert('❌ خطأ', 'فشل جدولة الإشعار');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAll = async () => {
        Alert.alert(
            '🗑️ إلغاء الإشعارات',
            'هل تريد إلغاء جميع الإشعارات المجدولة؟',
            [
                { text: 'لا', style: 'cancel' },
                {
                    text: 'نعم',
                    style: 'destructive',
                    onPress: async () => {
                        await cancelAllNotifications();
                        await refreshCount();
                        Alert.alert('✅ تم', 'تم إلغاء جميع الإشعارات');
                    },
                },
            ]
        );
    };

    const handleCheckScheduled = async () => {
        const notifications = await getAllScheduledNotifications();
        setScheduledCount(notifications.length);
        Alert.alert(
            '📋 الإشعارات المجدولة',
            `عدد الإشعارات المجدولة: ${notifications.length}\n\n${notifications
                .slice(0, 5)
                .map((n, i) => `${i + 1}. ${n.content.title}`)
                .join('\n')}${notifications.length > 5 ? '\n...' : ''}`
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'bottom']}
        >
            <ScreenHeader title="🧪 اختبار الإشعارات" />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* بطاقة العداد */}
                <View
                    style={[
                        styles.countCard,
                        { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                    ]}
                >
                    <Ionicons name="notifications" size={32} color={colors.primary} />
                    <Text style={[styles.countText, { color: colors.primary }]}>
                        {scheduledCount}
                    </Text>
                    <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                        إشعارات مجدولة
                    </Text>
                </View>

                {/* أزرار الاختبار */}
                <View style={styles.buttonsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        أدوات الاختبار
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#3B82F6' }]}
                        onPress={handleSendNow}
                        disabled={loading}
                    >
                        <Ionicons name="send" size={22} color="#fff" />
                        <Text style={styles.buttonText}>إرسال إشعار فوري (5 ثواني)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#10B981' }]}
                        onPress={handleScheduleDaily}
                        disabled={loading}
                    >
                        <Ionicons name="repeat" size={22} color="#fff" />
                        <Text style={styles.buttonText}>جدولة إشعار يومي متكرر</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#F59E0B' }]}
                        onPress={handleCheckScheduled}
                        disabled={loading}
                    >
                        <Ionicons name="list" size={22} color="#fff" />
                        <Text style={styles.buttonText}>عرض الإشعارات المجدولة</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#EF4444' }]}
                        onPress={handleCancelAll}
                        disabled={loading}
                    >
                        <Ionicons name="trash" size={22} color="#fff" />
                        <Text style={styles.buttonText}>إلغاء جميع الإشعارات</Text>
                    </TouchableOpacity>
                </View>

                {/* ملاحظات */}
                <View
                    style={[
                        styles.noteCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                >
                    <Text style={[styles.noteTitle, { color: colors.text }]}>
                        📝 ملاحظات مهمة
                    </Text>
                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                        • الإشعارات تعمل فقط على الأجهزة الحقيقية وليس المحاكي{'\n'}
                        • في Expo Go قد لا تعمل الإشعارات في الخلفية{'\n'}
                        • للحصول على أفضل النتائج، استخدم APK مبني
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    countCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 24,
    },
    countText: {
        fontSize: 48,
        fontWeight: 'bold',
        marginTop: 8,
    },
    countLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    buttonsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    noteCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 24,
    },
});

export default TestNotificationsScreen;
