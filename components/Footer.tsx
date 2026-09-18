import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationState } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface FooterProps {
    onHomePress?: () => void;
    onSettingsPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onHomePress, onSettingsPress }) => {
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);

    const isActive = (route: string) => currentRoute === route;
    const activeColor = '#4F46E5';
    const inactiveColor = isDarkMode ? '#64748B' : '#94A3B8';

    const getHomeLabel = () => {
        if (i18n.language === 'en') return 'Home';
        if (i18n.language === 'tr') return 'Ana Sayfa';
        return 'الرئيسية';
    };

    const getSettingsLabel = () => {
        if (i18n.language === 'en') return 'Settings';
        if (i18n.language === 'tr') return 'Ayarlar';
        return 'الإعدادات';
    };

    const tabs = [
        {
            icon: 'grid',
            iconOutline: 'grid-outline',
            label: getHomeLabel(),
            route: 'Home',
            onPress: onHomePress,
        },
        {
            icon: 'settings',
            iconOutline: 'settings-outline',
            label: getSettingsLabel(),
            route: 'Settings',
            onPress: onSettingsPress,
        },
    ];

    return (
        <View
            style={[
                styles.footer,
                {
                    backgroundColor: colors.surface,
                    borderTopColor: isDarkMode ? '#1E293B' : '#EDF2F7',
                },
            ]}
        >
            {tabs.map(tab => {
                const active = isActive(tab.route);
                return (
                    <TouchableOpacity
                        key={tab.route}
                        style={styles.tab}
                        onPress={tab.onPress}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.pillContainer,
                                active && {
                                    backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                                },
                            ]}
                        >
                            <Ionicons
                                name={(active ? tab.icon : tab.iconOutline) as any}
                                size={22}
                                color={active ? activeColor : inactiveColor}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    {
                                        color: active ? activeColor : inactiveColor,
                                        fontWeight: active ? '700' : '500',
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 14,
        width: width,
        borderTopWidth: 1,
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 10,
        elevation: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
    },
    pillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    tabLabel: {
        fontSize: 13,
        letterSpacing: -0.2,
    },
});

export default Footer;
