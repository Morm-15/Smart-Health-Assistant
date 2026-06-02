import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    colors: {
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
        card: string;
        shadow: string;
        // ألوان إضافية للكروت
        cardGradientStart: string;
        cardGradientEnd: string;
        cardIconBg: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('darkModeEnabled');
            if (savedTheme !== null) {
                setIsDarkMode(JSON.parse(savedTheme));
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newValue = !isDarkMode;
            setIsDarkMode(newValue);
            await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = isDarkMode
        ? {
            // Dark Mode Colors - Deep blue/slate
            background: '#0B0F1A',
            surface: '#151C2C',
            text: '#F1F5F9',
            textSecondary: '#94A3B8',
            primary: '#818CF8',
            border: '#1E293B',
            card: '#151C2C',
            shadow: '#000000',
            cardGradientStart: '#4F46E5',
            cardGradientEnd: '#7C3AED',
            cardIconBg: 'rgba(99, 102, 241, 0.2)',
        }
        : {
            // Light Mode Colors - Clean white/indigo
            background: '#F0F4FF',
            surface: '#FFFFFF',
            text: '#1E293B',
            textSecondary: '#64748B',
            primary: '#6366F1',
            border: '#E2E8F0',
            card: '#FFFFFF',
            shadow: '#6366F1',
            cardGradientStart: '#6366F1',
            cardGradientEnd: '#8B5CF6',
            cardIconBg: 'rgba(99, 102, 241, 0.1)',
        };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
