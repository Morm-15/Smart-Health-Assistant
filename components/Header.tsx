import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    userName: string;
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onSettingsPress }) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.avatarCircle, { backgroundColor: isDarkMode ? '#667eea' : '#007acc' }]}>
                    <Ionicons name="person" size={28} color="#fff" />
                </View>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                    {t('home.greeting')} {userName}! 👋
                </Text>
            </View>
            <View style={styles.headerIcons}>
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.15)' : '#f0f9ff' }]}
                    onPress={onSettingsPress}
                >
                    <Ionicons name="settings-outline" size={24} color={isDarkMode ? '#667eea' : '#007acc'} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Header;
