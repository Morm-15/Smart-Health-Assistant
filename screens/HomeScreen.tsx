import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, StatusBar, Text, Animated } from 'react-native';
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

type HomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { t } = useTranslation();
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
            } catch {
                // Silent
            }
        };
        fetchUserName();
    }, [t]);

    const features = [
        {
            icon: 'chatbubble-ellipses-outline',
            title: t('home.chatWithAI'),
            color: '#6366F1',
            route: 'ChatAI',
            delay: 0,
        },
        {
            icon: 'alarm-outline',
            title: t('home.medicationReminder'),
            color: '#F59E0B',
            route: 'AddMedicationScreen',
            delay: 100,
        },
        {
            icon: 'medkit-outline',
            title: t('home.manageMedications'),
            color: '#10B981',
            route: 'ManageMedicationsScreen',
            delay: 200,
        },
        {
            icon: 'camera-outline',
            title: t('home.skinDiseaseDetection'),
            color: '#8B5CF6',
            route: 'SkinDiseaseCamera',
            delay: 300,
        },
    ];

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

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F1F5F9' : '#1E293B' }]}>
                        الخدمات المتاحة
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
                        اختر ما تحتاجه
                    </Text>
                </View>

                {/* Feature Cards Grid */}
                <View style={styles.cardsContainer}>
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.route}
                            icon={feature.icon}
                            title={feature.title}
                            color={feature.color}
                            delay={feature.delay}
                            onPress={() => navigation.navigate(feature.route as any)}
                        />
                    ))}
                </View>

                {/* Bottom tip card */}
                <View style={[styles.tipCard, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                    <Text style={styles.tipEmoji}>💡</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.tipTitle, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>
                            نصيحة اليوم
                        </Text>
                        <Text style={[styles.tipText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                            الاستشارة الطبية لا تغني عن الطبيب. هذا التطبيق للمساعدة والتوعية فقط.
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
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 20,
        flexGrow: 1,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginTop: 2,
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
        borderRadius: 16,
        marginTop: 8,
        gap: 12,
    },
    tipEmoji: {
        fontSize: 24,
        marginTop: 2,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 13,
        lineHeight: 20,
    },
});

export default HomeScreen;
