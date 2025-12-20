import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationState } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface FooterProps {
    onHomePress?: () => void;
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onHomePress, onProfilePress, onSettingsPress }) => {
    const { colors, isDarkMode } = useTheme();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);

    return (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
                style={styles.footerItem}
                onPress={onHomePress}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.iconWrapper,
                    currentRoute === 'Home' && { backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0, 122, 204, 0.1)' }
                ]}>
                    <Ionicons
                        name={currentRoute === 'Home' ? "home" : "home-outline"}
                        size={26}
                        color={currentRoute === 'Home' ? (isDarkMode ? '#667eea' : '#007acc') : colors.textSecondary}
                    />
                </View>
                <Text style={[
                    styles.footerText,
                    { color: currentRoute === 'Home' ? (isDarkMode ? '#667eea' : '#007acc') : colors.textSecondary }
                ]}>
                    الرئيسية
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.footerItem}
                onPress={onSettingsPress}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.iconWrapper,
                    currentRoute === 'Settings' && { backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0, 122, 204, 0.1)' }
                ]}>
                    <Ionicons
                        name={currentRoute === 'Settings' ? "settings" : "settings-outline"}
                        size={26}
                        color={currentRoute === 'Settings' ? (isDarkMode ? '#667eea' : '#007acc') : colors.textSecondary}
                    />
                </View>
                <Text style={[
                    styles.footerText,
                    { color: currentRoute === 'Settings' ? (isDarkMode ? '#667eea' : '#007acc') : colors.textSecondary }
                ]}>
                    الإعدادات
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        paddingBottom: 14,
        width: width,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 8,
        elevation: 8,
    },
    footerItem: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 24,
    },
    iconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    footerText: {
        fontWeight: '600',
    },
});

export default Footer;
