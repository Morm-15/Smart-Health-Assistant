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
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import BackButton from '../components/BackButton';

const SettingsScreen = () => {
    const { t, i18n } = useTranslation();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const notifications = await AsyncStorage.getItem('notificationsEnabled');
            const darkMode = await AsyncStorage.getItem('darkModeEnabled');
            if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
            if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (key: string, value: boolean) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving settings:', error);
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

    const toggleNotifications = (value: boolean) => {
        setNotificationsEnabled(value);
        saveSettings('notificationsEnabled', value);
    };

    const toggleDarkMode = (value: boolean) => {
        setDarkModeEnabled(value);
        saveSettings('darkModeEnabled', value);
    };

    return (
        <View style={styles.container}>
            <BackButton />
            <Text style={styles.title}>{t('settings.title')}</Text>

            <ScrollView style={styles.scrollView}>
                {/* Language Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                    <TouchableOpacity style={styles.settingItem} onPress={changeLanguage}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="language" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.selectLanguage')}</Text>
                        </View>
                        <View style={styles.settingRight}>
                            <Text style={styles.currentLang}>
                                {i18n.language === 'ar' ? 'العربية' : i18n.language === 'tr' ? 'Türkçe' : 'English'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.enableNotifications')}</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#ddd', true: '#007AFF' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="moon" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.darkMode')}</Text>
                        </View>
                        <Switch
                            value={darkModeEnabled}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: '#ddd', true: '#007AFF' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="person" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.editProfile')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="lock-closed" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.changePassword')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="information-circle" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.version')}</Text>
                        </View>
                        <Text style={styles.versionText}>1.0.0</Text>
                    </View>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.privacyPolicy')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="document-text" size={24} color="#007AFF" />
                            <Text style={styles.settingText}>{t('settings.termsOfService')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={24} color="#fff" />
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f9ff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
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
        color: '#666',
        marginBottom: 10,
        marginLeft: 5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
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
        color: '#333',
        marginLeft: 15,
    },
    currentLang: {
        fontSize: 14,
        color: '#007AFF',
        marginRight: 5,
        fontWeight: '600',
    },
    versionText: {
        fontSize: 14,
        color: '#999',
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
});

export default SettingsScreen;

