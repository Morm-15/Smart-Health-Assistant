import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const DAILY_WATER_GOAL = 2000; // ml

interface MoodOption {
    id: string;
    emoji: string;
    labelEn: string;
    labelAr: string;
    labelTr: string;
    tipEn: string;
    tipAr: string;
    tipTr: string;
}

const MOOD_OPTIONS: MoodOption[] = [
    {
        id: 'energetic',
        emoji: '🌟',
        labelEn: 'Great',
        labelAr: 'ممتاز',
        labelTr: 'Harika',
        tipEn: 'Keep this wonderful energy going! Remember to stay hydrated.',
        tipAr: 'طاقة رائعة! حافظ على نشاطك ورطوبة جسمك بشرب الماء بانتظام.',
        tipTr: 'Harika bir enerji! Düzenli su içerek enerjinizi koruyun.',
    },
    {
        id: 'good',
        emoji: '🟢',
        labelEn: 'Good',
        labelAr: 'مستقر',
        labelTr: 'İyi',
        tipEn: 'A steady day! A 10-minute walk can boost your vitality.',
        tipAr: 'يوم صحي متوازن! المشي لمدة 10 دقائق ينشط الدورة الدموية.',
        tipTr: 'Dengeli bir gün! 10 dakikalık yürüyüş zindelik kazandırır.',
    },
    {
        id: 'tired',
        emoji: '🥱',
        labelEn: 'Tired',
        labelAr: 'إرهاق',
        labelTr: 'Yorgun',
        tipEn: 'Take a short 15-minute rest and drink a glass of water.',
        tipAr: 'خذ قسطاً من الراحة لمدة 15 دقيقة واشرب كوباً من الماء الفاتر.',
        tipTr: '15 dakikalık kısa bir mola verin ve bir bardak su için.',
    },
    {
        id: 'pain',
        emoji: '🤕',
        labelEn: 'Headache',
        labelAr: 'صداع/ألم',
        labelTr: 'Ağrılı',
        tipEn: 'Dim bright screens, hydrate well, and rest in a quiet place.',
        tipAr: 'خفف إضاءة الشاشات، اشرب ماءً كافياً، واسترح في مكان هادئ.',
        tipTr: 'Ekran parlaklığını azaltın, bol su için ve sessiz bir yerde dinlenin.',
    },
];

export const DailyWaterWidget = () => {
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const todayDate = new Date().toISOString().split('T')[0];
    const waterStorageKey = `@smart_health_water_${todayDate}`;
    const moodStorageKey = `@smart_health_mood_${todayDate}`;

    const [waterAmount, setWaterAmount] = useState<number>(0);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);

    useEffect(() => {
        const loadDailyData = async () => {
            try {
                const storedWater = await AsyncStorage.getItem(waterStorageKey);
                if (storedWater !== null) {
                    setWaterAmount(parseInt(storedWater, 10) || 0);
                }
                const storedMood = await AsyncStorage.getItem(moodStorageKey);
                if (storedMood !== null) {
                    setSelectedMood(storedMood);
                }
            } catch (err) {
                console.warn('Error loading daily wellness data:', err);
            }
        };
        loadDailyData();
    }, [todayDate]);

    const addWater = async (amount: number) => {
        const updated = Math.max(0, Math.min(waterAmount + amount, 5000));
        setWaterAmount(updated);
        try {
            await AsyncStorage.setItem(waterStorageKey, updated.toString());
        } catch (err) {
            console.warn('Error saving water amount:', err);
        }
    };

    const handleSelectMood = async (moodId: string) => {
        const nextMood = selectedMood === moodId ? null : moodId;
        setSelectedMood(nextMood);
        try {
            if (nextMood) {
                await AsyncStorage.setItem(moodStorageKey, nextMood);
            } else {
                await AsyncStorage.removeItem(moodStorageKey);
            }
        } catch (err) {
            console.warn('Error saving mood:', err);
        }
    };

    const handleEmergencyCall = () => {
        const emergencyNum = '112';
        const title = i18n.language === 'ar' ? 'الاتصال بالطوارئ' : i18n.language === 'tr' ? 'Acil Servisi Ara' : 'Emergency SOS';
        const msg = i18n.language === 'ar'
            ? `هل تريد الاتصال الفوري برقم الطوارئ والإسعاف (${emergencyNum})؟`
            : i18n.language === 'tr'
            ? `Acil servis numarasını (${emergencyNum}) hemen aramak istiyor musunuz?`
            : `Do you want to immediately call emergency services (${emergencyNum})?`;
        const callText = i18n.language === 'ar' ? 'اتصال فوري' : i18n.language === 'tr' ? 'Hemen Ara' : 'Call Now';
        const cancelText = i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'tr' ? 'İptal' : 'Cancel';

        Alert.alert(title, msg, [
            { text: cancelText, style: 'cancel' },
            {
                text: callText,
                style: 'destructive',
                onPress: () => Linking.openURL(`tel:${emergencyNum}`),
            },
        ]);
    };

    const progressPercentage = Math.min(100, Math.round((waterAmount / DAILY_WATER_GOAL) * 100));
    const activeMoodObj = MOOD_OPTIONS.find((m) => m.id === selectedMood);

    const getActiveTip = () => {
        if (!activeMoodObj) return null;
        if (i18n.language === 'ar') return activeMoodObj.tipAr;
        if (i18n.language === 'tr') return activeMoodObj.tipTr;
        return activeMoodObj.tipEn;
    };

    const getMoodLabel = (m: MoodOption) => {
        if (i18n.language === 'ar') return m.labelAr;
        if (i18n.language === 'tr') return m.labelTr;
        return m.labelEn;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
            {/* Header with SOS */}
            <View style={styles.topRow}>
                <View style={styles.titleWithBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                        {i18n.language === 'ar' ? 'مؤشرات اليوم الصحية' : i18n.language === 'tr' ? 'Günlük Sağlık Durumu' : 'Daily Vitals & Wellness'}
                    </Text>
                </View>

                {/* Emergency SOS Pill */}
                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={handleEmergencyCall}
                    activeOpacity={0.8}
                >
                    <Ionicons name="call" size={13} color="#FFFFFF" style={{ marginEnd: 4 }} />
                    <Text style={styles.sosButtonText}>
                        {i18n.language === 'ar' ? 'طوارئ 112' : i18n.language === 'tr' ? 'Acil 112' : 'SOS 112'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Water Tracker Sub-Card */}
            <View style={[styles.waterCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F0F9FF' }]}>
                <View style={styles.waterHeader}>
                    <View style={styles.waterTitleGroup}>
                        <View style={styles.waterIconContainer}>
                            <Ionicons name="water" size={18} color="#0284C7" />
                        </View>
                        <View>
                            <Text style={[styles.waterTitle, { color: colors.text }]}>
                                {i18n.language === 'ar' ? 'متتبع شرب الماء' : i18n.language === 'tr' ? 'Su Takibi' : 'Water Intake'}
                            </Text>
                            <Text style={styles.waterSub}>
                                {waterAmount} / {DAILY_WATER_GOAL} ml ({progressPercentage}%)
                            </Text>
                        </View>
                    </View>

                    {/* Quick Add Buttons */}
                    <View style={styles.quickAddRow}>
                        {waterAmount > 0 && (
                            <TouchableOpacity
                                style={[styles.waterBtn, styles.undoBtn, { borderColor: isDarkMode ? '#334155' : '#BAE6FD' }]}
                                onPress={() => addWater(-250)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="remove" size={16} color="#64748B" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.waterBtn, styles.addBtn]}
                            onPress={() => addWater(250)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add" size={15} color="#FFFFFF" />
                            <Text style={styles.addBtnText}>+250 ml</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Progress Bar Track */}
                <View style={[styles.progressBarTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E0F2FE' }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${progressPercentage}%`,
                                backgroundColor: progressPercentage >= 100 ? '#10B981' : '#0284C7',
                            },
                        ]}
                    />
                </View>

                {progressPercentage >= 100 && (
                    <Text style={styles.goalAchievedText}>
                        🎉 {i18n.language === 'ar' ? 'أحسنت! حققت هدف الترطيب اليومي!' : i18n.language === 'tr' ? 'Tebrikler! Günlük su hedefinize ulaştınız!' : 'Awesome! You reached your daily hydration goal!'}
                    </Text>
                )}
            </View>

            {/* Mood & Energy Check-in */}
            <View style={styles.moodSection}>
                <Text style={[styles.moodQuestion, { color: colors.textSecondary }]}>
                    {i18n.language === 'ar' ? 'كيف تشعر اليوم؟' : i18n.language === 'tr' ? 'Bugün nasıl hissediyorsunuz?' : 'How are you feeling today?'}
                </Text>

                <View style={styles.moodOptionsRow}>
                    {MOOD_OPTIONS.map((m) => {
                        const isSelected = selectedMood === m.id;
                        return (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    styles.moodPill,
                                    {
                                        backgroundColor: isSelected
                                            ? (isDarkMode ? '#312E81' : '#EEF2FF')
                                            : (isDarkMode ? '#0F172A' : '#F8FAFC'),
                                        borderColor: isSelected ? '#6366F1' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                                    },
                                ]}
                                onPress={() => handleSelectMood(m.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                <Text
                                    style={[
                                        styles.moodLabel,
                                        {
                                            color: isSelected ? '#4F46E5' : colors.textSecondary,
                                            fontWeight: isSelected ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {getMoodLabel(m)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Instant Tip for selected mood */}
                {activeMoodObj && (
                    <View style={[styles.moodTipBox, { backgroundColor: isDarkMode ? '#1E1B4B' : '#F5F3FF', borderColor: isDarkMode ? '#3730A3' : '#DDD6FE' }]}>
                        <Ionicons name="sparkles" size={14} color="#7C3AED" style={{ marginTop: 2, marginEnd: 6 }} />
                        <Text style={[styles.moodTipText, { color: isDarkMode ? '#C4B5FD' : '#5B21B6' }]}>
                            {getActiveTip()}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 22,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    sosButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    sosButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    waterCard: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
    },
    waterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    waterTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    waterIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    waterTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    waterSub: {
        fontSize: 11,
        color: '#0284C7',
        fontWeight: '600',
        marginTop: 1,
    },
    quickAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    waterBtn: {
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addBtn: {
        backgroundColor: '#0284C7',
        paddingHorizontal: 10,
        gap: 2,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    undoBtn: {
        width: 32,
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    progressBarTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalAchievedText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '700',
        marginTop: 6,
        textAlign: 'center',
    },
    moodSection: {
        paddingTop: 2,
    },
    moodQuestion: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    moodOptionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
    },
    moodPill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    moodEmoji: {
        fontSize: 18,
        marginBottom: 2,
    },
    moodLabel: {
        fontSize: 10,
    },
    moodTipBox: {
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    moodTipText: {
        fontSize: 11,
        lineHeight: 16,
        flex: 1,
        fontWeight: '500',
    },
});

export default DailyWaterWidget;
