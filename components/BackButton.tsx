// components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

export default function BackButton() {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.backButton,
                {
                    backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(0, 122, 204, 0.2)',
                }
            ]}
            onPress={() => navigation.goBack()}
        >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#667eea' : '#007acc'} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 45,
        left: 16,
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
});
