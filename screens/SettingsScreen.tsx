import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import LanguageSelectModal from '../components/LanguageSelectModal';
import { getLanguageItem } from '../constants/languages';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { isDarkMode, toggleDarkMode, colors } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showLangModal, setShowLangModal] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        loadSettings();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                setUserEmail(currentUser.email || '');
                const docRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(docRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const full = [data.firstName, data.lastName].filter(Boolean).join(' ');
                    setUserName(full || currentUser.displayName || '');
                }
            }
        } catch {
            // Silent fallback
        }
    };

    const loadSettings = async () => {
        try {
            const notifications = await AsyncStorage.getItem('notificationsEnabled');
            if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
        } catch {
            // Silent fallback
        }
    };

    const changeLanguage = () => {
        setShowLangModal(true);
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('settings.no'), style: 'cancel' },
                {
                    text: t('settings.yes'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch {
                            Alert.alert(t('error'), 'حدث خطأ أثناء تسجيل الخروج');
                        }
                    },
                },
            ]
        );
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
        Alert.alert(
            t('success'),
            value ? t('settings.notificationEnabled') : t('settings.notificationDisabled')
        );
    };

    const handleToggleDarkMode = () => {
        toggleDarkMode();
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfile');
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const handlePrivacyPolicy = () => {
        Alert.alert(
            t('settings.privacyPolicyTitle'),
            t('settings.privacyPolicyMessage'),
            [{ text: t('common.close') }]
        );
    };

    const handleTermsOfService = () => {
        Alert.alert(
            t('settings.termsOfServiceTitle'),
            t('settings.termsOfServiceMessage'),
            [{ text: t('common.close') }]
        );
    };

    const handleMedicalDisclaimer = () => {
        const title = i18n.language === 'ar' ? 'إخلاء المسؤولية الطبية' : i18n.language === 'tr' ? 'Tıbbi Sorumluluk Reddi' : 'Medical Disclaimer';
        const msg = i18n.language === 'ar'
            ? 'تطبيق Smart Health Assistant مصمم لتقديم الدعم والمعلومات الصحية السريرية الذكية. هذا التطبيق ليس بديلاً عن التشخيص الطبي المتخصص أو مراجعة الطبيب المرخص أو التدخل في الحالات الطارئة.'
            : i18n.language === 'tr'
            ? 'Smart Health Assistant uygulaması akıllı klinik sağlık desteği sağlamak için tasarlanmıştır. Bu uygulama, uzman doktor teşhisinin veya acil tıbbi müdahalenin yerini alamaz.'
            : 'Smart Health Assistant is designed to provide AI-assisted clinical wellness information. It is not a substitute for professional medical advice, diagnosis, or emergency intervention.';
        Alert.alert(title, msg, [{ text: t('common.close') }]);
    };

    const currentLangItem = getLanguageItem(i18n.language);
    const userInitials = userName
        ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (userEmail ? userEmail[0].toUpperCase() : 'U');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <ScreenHeader title={t('settings.title')} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Profile Summary Card ─── */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{userInitials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                            {userName || (i18n.language === 'ar' ? 'مستخدم التطبيق' : 'Smart Health User')}
                        </Text>
                        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                            {userEmail || 'user@health.app'}
                        </Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.verifiedText}>
                            {i18n.language === 'ar' ? 'موثق' : 'Verified'}
                        </Text>
                    </View>
                </View>

                {/* ─── Section: App Preferences ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {i18n.language === 'ar' ? 'تفضيلات التطبيق' : i18n.language === 'tr' ? 'Uygulama Tercihleri' : 'Preferences'}
                    </Text>

                    {/* Language Item */}
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={changeLanguage}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Ionicons name="language" size={20} color="#6366F1" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.language')}
                            </Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={[styles.currentLang, { color: '#6366F1' }]}>
                                {currentLangItem.flag} {currentLangItem.nativeName}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {/* Notifications Toggle */}
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="notifications" size={20} color="#F59E0B" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.notifications')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: '#6366F1' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    {/* Dark Mode Toggle */}
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color="#8B5CF6" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.darkMode')}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={handleToggleDarkMode}
                            trackColor={{ false: isDarkMode ? '#334155' : '#CBD5E1', true: '#6366F1' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* ─── Section: Account & Security ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.account')}
                    </Text>

                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="person-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.editProfile')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={handleChangePassword}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#0284C7" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.changePassword')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* ─── Section: Legal & Information ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.about')}
                    </Text>

                    {/* Medical Disclaimer */}
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={handleMedicalDisclaimer}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="medical-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {i18n.language === 'ar' ? 'إخلاء المسؤولية الطبية' : i18n.language === 'tr' ? 'Tıbbi Sorumluluk Reddi' : 'Medical Disclaimer'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Privacy Policy */}
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={handlePrivacyPolicy}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.privacyPolicy')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Terms of Service */}
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}
                        onPress={handleTermsOfService}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
                                <Ionicons name="document-text-outline" size={20} color="#64748B" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.termsOfService')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* App Version */}
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="information-circle-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.version')}
                            </Text>
                        </View>
                        <View style={styles.versionPill}>
                            <Text style={styles.versionText}>v1.0.0 (Release)</Text>
                        </View>
                    </View>
                </View>

                {/* ─── Logout Button ─── */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>

                <Text style={[styles.footerCopyright, { color: colors.textSecondary }]}>
                    Smart Health Assistant • All Rights Reserved
                </Text>

                <View style={{ height: 30 }} />
            </ScrollView>

            <LanguageSelectModal
                visible={showLangModal}
                onClose={() => setShowLangModal(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        gap: 14,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366F1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 12,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    verifiedText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '700',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        paddingHorizontal: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingText: {
        fontSize: 14,
        fontWeight: '600',
    },
    currentLang: {
        fontSize: 13,
        fontWeight: '700',
    },
    versionPill: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    versionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 12,
        gap: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    footerCopyright: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 16,
    },
});

export default SettingsScreen;
