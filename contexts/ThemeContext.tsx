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
            // Dark Mode Colors
            background: '#0F172A',
            surface: '#1E293B',
            text: '#F1F5F9',
            textSecondary: '#CBD5E1',
            primary: '#3B82F6',
            border: '#334155',
            card: '#1E293B',
            shadow: '#000000',
            // ألوان الكروت في الوضع الداكن
            cardGradientStart: '#667eea',
            cardGradientEnd: '#764ba2',
            cardIconBg: 'rgba(102, 126, 234, 0.2)',
        }
        : {
            // Light Mode Colors
            background: '#F8FAFC',
            surface: '#FFFFFF',
            text: '#1E293B',
            textSecondary: '#64748B',
            primary: '#3B82F6',
            border: '#E2E8F0',
            card: '#FFFFFF',
            shadow: '#000000',
            // ألوان الكروت في الوضع الفاتح
            cardGradientStart: '#009688',
            cardGradientEnd: '#00796B',
            cardIconBg: 'rgba(0, 150, 136, 0.1)',
        };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
