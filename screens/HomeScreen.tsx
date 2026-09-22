import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import DailyWaterWidget from '../components/DailyWaterWidget';

type HomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const docRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(docRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserName(data.firstName || '');
                    }
                }
            } catch {}
        };
        fetchUserName();
    }, [t]);

    const getBadge = (ar: string, en: string, tr: string) => {
        if (i18n.language === 'en') return en;
        if (i18n.language === 'tr') return tr;
        return ar;
    };

    const features = [
        {
            icon: 'chatbubble-ellipses-outline',
            title: t('home.chatWithAI'),
            color: '#4F46E5',
            route: 'ChatAI',
            badgeText: getBadge('طبيب AI', 'AI Doctor', 'AI Doktor'),
            delay: 0,
        },
        {
            icon: 'flask-outline',
            title: t('home.labReportAnalyzer') || 'محلل التحاليل والروشتات الذكي',
            color: '#EC4899',
            route: 'LabReportAnalyzer',
            badgeText: getBadge('جديد ✨', 'New ✨', 'Yeni ✨'),
            delay: 80,
        },
        {
            icon: 'camera-outline',
            title: t('home.skinDiseaseDetection'),
            color: '#8B5CF6',
            route: 'SkinDiseaseCamera',
            badgeText: getBadge('فحص بصري', 'Vision AI', 'Görsel AI'),
            delay: 160,
        },
        {
            icon: 'shield-checkmark-outline',
            title: t('home.drugInteraction') || 'فاحص التعارضات الدوائية والغذائية',
            color: '#0D9488',
            route: 'DrugInteraction',
            badgeText: getBadge('أمان دوائي', 'Drug Guard', 'İlaç Güvenliği'),
            delay: 200,
        },
        {
            icon: 'pulse-outline',
            title: t('home.firstAidGuide') || 'دليل الإسعافات الأولية و CPR',
            color: '#DC2626',
            route: 'FirstAidGuide',
            badgeText: getBadge('إنقاذ حياة 🚨', 'Life Saver 🚨', 'İlk Yardım 🚨'),
            delay: 240,
        },
        {
            icon: 'speedometer-outline',
            title: t('home.medicalDevicesGuide') || 'دليل الأجهزة الطبية والحاسبة',
            color: '#06B6D4',
            route: 'MedicalDevicesGuide',
            badgeText: getBadge('دليل عملي', 'Guide & Calc', 'Rehber & Hesap'),
            delay: 280,
        },
        {
            icon: 'alarm-outline',
            title: t('home.medicationReminder'),
            color: '#F59E0B',
            route: 'AddMedicationScreen',
            badgeText: getBadge('تنبيه ذكي', 'Reminder', 'Hatırlatıcı'),
            delay: 320,
        },
        {
            icon: 'medkit-outline',
            title: t('home.manageMedications'),
            color: '#10B981',
            route: 'ManageMedicationsScreen',
            badgeText: getBadge('جدول الأدوية', 'My Cabinet', 'İlaçlarım'),
            delay: 360,
        },
    ];

    const getSectionTitle = () => {
        if (i18n.language === 'en') return 'Clinical Services';
        if (i18n.language === 'tr') return 'Klinik Hizmetler';
        return 'الخدمات الطبية الذكية';
    };

    const getSectionSubtitle = () => {
        if (i18n.language === 'en') return 'Select an AI-powered assistant';
        if (i18n.language === 'tr') return 'Yapay zeka destekli bir servis seçin';
        return 'اختر الخدمة للبدء فوراً';
    };

    return (
        <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
                translucent={false}
            />

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <Header
                    userName={userName}
                    onSettingsPress={() => navigation.navigate('Settings' as any)}
                />

                {/* Daily Hydration & Vitals Dashboard */}
                <DailyWaterWidget />

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {getSectionTitle()}
                        </Text>
                        <View style={[styles.serviceCountBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#EDF2F7' }]}>
                            <Text style={[styles.serviceCountText, { color: colors.textSecondary }]}>
                                {features.length}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                        {getSectionSubtitle()}
                    </Text>
                </View>

                {/* Feature Cards Grid */}
                <View style={styles.cardsContainer}>
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.route}
                            icon={feature.icon}
                            title={feature.title}
                            color={feature.color}
                            badgeText={feature.badgeText}
                            delay={feature.delay}
                            onPress={() => navigation.navigate(feature.route as any)}
                        />
                    ))}
                </View>

                {/* Bottom Clinical Tip Card */}
                <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#EDF2F7' }]}>
                    <View style={styles.tipIconBox}>
                        <Text style={styles.tipEmoji}>💡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.tipTitle, { color: colors.text }]}>
                            {i18n.language === 'en' ? 'Clinical Notice' : i18n.language === 'tr' ? 'Klinik Bilgilendirme' : 'إرشاد سريري معتمد'}
                        </Text>
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                            {i18n.language === 'en'
                                ? 'AI guidance supports your health decisions but does not replace licensed medical consultations.'
                                : i18n.language === 'tr'
                                ? 'Yapay zeka rehberliği sağlığınızı destekler, ancak uzman doktor muayenesinin yerini almaz.'
                                : 'التوجيهات الصحية الذكية للمساعدة السريرية والتوعية، ولا تغني عن استشارة الطبيب المختص.'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <Footer
                onHomePress={() => navigation.navigate('Home')}
                onSettingsPress={() => navigation.navigate('Settings' as any)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        flexGrow: 1,
    },
    sectionHeader: {
        marginBottom: 14,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    serviceCountBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    serviceCountText: {
        fontSize: 12,
        fontWeight: '700',
    },
    sectionSubtitle: {
        fontSize: 13,
        marginTop: 3,
        fontWeight: '500',
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 18,
        marginTop: 6,
        marginBottom: 10,
        borderWidth: 1,
        gap: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    tipIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipEmoji: {
        fontSize: 18,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
    },
    tipText: {
        fontSize: 12,
        lineHeight: 18,
    },
});

export default HomeScreen;
