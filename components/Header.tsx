import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    userName: string;
    onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onSettingsPress }) => {
    const { colors, isDarkMode } = useTheme();
    const { t, i18n } = useTranslation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (i18n.language === 'en') {
            if (hour < 12) return 'Good morning';
            if (hour < 17) return 'Good afternoon';
            return 'Good evening';
        }
        if (i18n.language === 'tr') {
            if (hour < 12) return 'Günaydın';
            if (hour < 17) return 'İyi günler';
            return 'İyi akşamlar';
        }
        if (hour < 12) return 'صباح الخير';
        if (hour < 17) return 'مساء النور';
        return 'مساء الخير';
    };

    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '🩺';

    return (
        <View style={styles.wrapper}>
            {/* Top Bar: Profile Greeting & Settings */}
            <View style={styles.topRow}>
                <View style={styles.userSection}>
                    <View style={[styles.avatarBox, { backgroundColor: '#4F46E5', borderColor: isDarkMode ? '#6366F1' : '#C7D2FE' }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                        <View style={styles.onlineBadge} />
                    </View>

                    <View style={styles.textSection}>
                        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                            {getGreeting()} 👋
                        </Text>
                        <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
                            {userName || t('home.greeting')}
                        </Text>
                    </View>
                </View>

                {/* Modern Settings Action */}
                <TouchableOpacity
                    style={[
                        styles.settingsButton,
                        {
                            backgroundColor: colors.surface,
                            borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                        },
                    ]}
                    onPress={onSettingsPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Daily Medical Pulse / Assistant Status Bar */}
            <View style={[styles.pulseCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#EDF2F7' }]}>
                <View style={styles.pulseItem}>
                    <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.pulseLabel, { color: colors.text }]}>
                        {i18n.language === 'en' ? 'Smart Health AI' : i18n.language === 'tr' ? 'Akıllı Sağlık AI' : 'سمارت هيلث AI'}
                    </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]} />
                <View style={styles.pulseItem}>
                    <Ionicons name="shield-checkmark" size={15} color="#4F46E5" />
                    <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>
                        {i18n.language === 'en' ? 'Verified Clinical' : i18n.language === 'tr' ? 'Onaylı Klinik' : 'توجيه سريري'}
                    </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]} />
                <View style={styles.pulseItem}>
                    <Ionicons name="sparkles" size={15} color="#F59E0B" />
                    <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>
                        {i18n.language === 'en' ? '24/7 Active' : i18n.language === 'tr' ? '7/24 Aktif' : 'نشط 24/7'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginLeft: 2,
        borderWidth: 1.5,
        position: 'relative',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    textSection: {
        flex: 1,
    },
    greetingText: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    userNameText: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    settingsButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    pulseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    pulseItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pulseLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 18,
        marginHorizontal: 4,
    },
});

export default Header;
