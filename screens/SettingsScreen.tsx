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
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { isDarkMode, toggleDarkMode, colors } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const notifications = await AsyncStorage.getItem('notificationsEnabled');
            if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
        } catch (error) {
            // Silent fail
        }
    };

    const changeLanguage = () => {
        Alert.alert(
            t('settings.selectLanguage'),
            '',
            [
                {
                    text: t('settings.arabic'),
                    onPress: async () => {
                        await i18n.changeLanguage('ar');
                        await AsyncStorage.setItem('userLanguage', 'ar');
                    },
                },
                {
                    text: t('settings.english'),
                    onPress: async () => {
                        await i18n.changeLanguage('en');
                        await AsyncStorage.setItem('userLanguage', 'en');
                    },
                },
                {
                    text: t('settings.turkish'),
                    onPress: async () => {
                        await i18n.changeLanguage('tr');
                        await AsyncStorage.setItem('userLanguage', 'tr');
                    },
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('settings.no'), style: 'cancel' },
                {
                    text: t('settings.yes'),
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
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
        Alert.alert(
            t('success'),
            !isDarkMode ? t('settings.darkModeEnabled') : t('settings.darkModeDisabled')
        );
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


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <BackButton />
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Language Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.language')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={changeLanguage}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="language" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.selectLanguage')}
                            </Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={[styles.currentLang, { color: colors.primary }]}>
                                {i18n.language === 'ar' ? 'العربية' : i18n.language === 'tr' ? 'Türkçe' : 'English'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.notifications')}
                    </Text>
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.enableNotifications')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.theme')}
                    </Text>
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.darkMode')}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={handleToggleDarkMode}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.account')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleEditProfile}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="person" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.editProfile')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleChangePassword}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="lock-closed" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.changePassword')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('TestNotifications')}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="flask" size={24} color="#F59E0B" />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                🧪 اختبار الإشعارات
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {t('settings.about')}
                    </Text>
                    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="information-circle" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.version')}
                            </Text>
                        </View>
                        <Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handlePrivacyPolicy}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.privacyPolicy')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleTermsOfService}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="document-text" size={24} color={colors.primary} />
                            <Text style={[styles.settingText, { color: colors.text }]}>
                                {t('settings.termsOfService')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={24} color="#fff" />
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>

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
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        marginLeft: 15,
    },
    currentLang: {
        fontSize: 14,
        marginRight: 5,
        fontWeight: '600',
    },
    versionText: {
        fontSize: 14,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    testButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default SettingsScreen;
