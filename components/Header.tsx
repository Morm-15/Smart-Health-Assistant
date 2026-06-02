import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';

interface HeaderProps {
    userName: string;
    onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onSettingsPress }) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅 صباح الخير';
        if (hour < 17) return '☀️ مساء النور';
        return '🌙 مساء الخير';
    };

    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '👤';

    return (
        <View style={styles.wrapper}>
            {/* Greeting row */}
            <View style={styles.greetingRow}>
                <View style={styles.leftSection}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#4F46E5' : '#6366F1' }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={styles.textSection}>
                        <Text style={[styles.greetingText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                            {getGreeting()}
                        </Text>
                        <Text style={[styles.userName, { color: isDarkMode ? '#F1F5F9' : '#1E293B' }]} numberOfLines={1}>
                            {userName || t('home.greeting')} 👋
                        </Text>
                    </View>
                </View>

                {/* Settings button */}
                <TouchableOpacity
                    style={[
                        styles.settingsBtn,
                        { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }
                    ]}
                    onPress={onSettingsPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={22} color={isDarkMode ? '#818CF8' : '#6366F1'} />
                </TouchableOpacity>
            </View>

            {/* Stats bar */}
            <View style={[styles.statsBar, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFF' }]}>
                <View style={styles.statItem}>
                    <Ionicons name="heart-outline" size={18} color="#EF4444" />
                    <Text style={[styles.statLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                        مساعدك الصحي
                    </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
                <View style={styles.statItem}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                    <Text style={[styles.statLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                        آمن وموثوق
                    </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />
                <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={18} color="#6366F1" />
                    <Text style={[styles.statLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                        متاح 24/7
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
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    textSection: {
        flex: 1,
    },
    greetingText: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
    },
    settingsBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 4,
    },
});

export default Header;
