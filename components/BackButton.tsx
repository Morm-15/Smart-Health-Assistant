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

    return (
        <TouchableOpacity
            style={[
                styles.backButton,
                {
                    top: insets.top + 10,
                    backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                }
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
});
