// components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackButton() {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    // لا تُظهر الزر إذا لم يكن هناك شاشة للرجوع إليها
    if (!navigation.canGoBack()) return null;

    return (
        <TouchableOpacity
            style={[
                styles.backButton,
                {
                    top: insets.top + 10,
                    backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                    borderColor: isDarkMode ? '#334155' : '#C7D2FE',
                }
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#818CF8' : '#6366F1'} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        left: 16,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#6366F1',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
});
