import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigationState } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface FooterProps {
    onHomePress?: () => void;
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onHomePress, onSettingsPress }) => {
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);

    const isActive = (route: string) => currentRoute === route;
    const activeColor = isDarkMode ? '#818CF8' : '#6366F1';
    const inactiveColor = isDarkMode ? '#475569' : '#94A3B8';

    const tabs = [
        {
            icon: 'home',
            iconOutline: 'home-outline',
            label: t('home.profile'),
            route: 'Home',
            onPress: onHomePress,
        },
        {
            icon: 'settings',
            iconOutline: 'settings-outline',
            label: t('home.settings'),
            route: 'Settings',
            onPress: onSettingsPress,
        },
    ];

    return (
        <View style={[styles.footer, {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
        }]}>
            {tabs.map(tab => {
                const active = isActive(tab.route);
                return (
                    <TouchableOpacity
                        key={tab.route}
                        style={styles.tab}
                        onPress={tab.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconWrapper,
                            active && {
                                backgroundColor: isDarkMode ? 'rgba(129, 140, 248, 0.15)' : '#EEF2FF',
                            }
                        ]}>
                            <Ionicons
                                name={(active ? tab.icon : tab.iconOutline) as any}
                                size={24}
                                color={active ? activeColor : inactiveColor}
                            />
                            {active && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
                        </View>
                        <Text style={[
                            styles.tabLabel,
                            { color: active ? activeColor : inactiveColor }
                        ]}>
                            {tab.label}
                        </Text>
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
        paddingBottom: 12,
        width: width,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 10,
        elevation: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    iconWrapper: {
        width: 52,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        position: 'relative',
    },
    activeDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default Footer;
