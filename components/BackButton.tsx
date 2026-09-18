import React from 'react';
import { TouchableOpacity, StyleSheet, I18nManager, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BackButtonProps {
    onPress?: () => void;
    style?: ViewStyle | ViewStyle[];
    floating?: boolean;
    color?: string;
}

export default function BackButton({ onPress, style, floating = false, color }: BackButtonProps) {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();
    const { i18n } = useTranslation();
    const insets = useSafeAreaInsets();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    // اتجاه السهم العصري حسب اتجاه اللغة (RTL/LTR)
    const isRtl = I18nManager.isRTL || i18n.language === 'ar';
    const iconName = isRtl ? 'chevron-forward' : 'chevron-back';
    const iconColor = color || (isDarkMode ? '#F1F5F9' : '#0F172A');

    return (
        <TouchableOpacity
            style={[
                styles.baseButton,
                floating && [styles.floating, { top: insets.top + 8, left: isRtl ? undefined : 16, right: isRtl ? 16 : undefined }],
                {
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
                style,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons name={iconName as any} size={22} color={iconColor} style={isRtl ? { marginLeft: 1 } : { marginRight: 1 }} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    baseButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    floating: {
        position: 'absolute',
        zIndex: 999,
    },
});
